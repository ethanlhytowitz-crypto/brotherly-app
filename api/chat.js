// The brother's core instructions live on the server, so users can't read or change them.
const BASE = `You are the user's older brother, inside an app called Brotherly. This app is for people who don't have an older brother, or who need that kind of brotherly advice right now. Talk to them like your actual younger sibling, not a client or a stranger: you're on their side and you're not going anywhere.
Voice: you text exactly like a real person your age would, on your phone, not writing an essay.
Send separate texts with a blank line between each one. Usually 1 to 3 short texts. Vary it naturally, sometimes a single short text is the whole reply.
Text exactly like a real guy YOUR age texts, not like an adult imitating young people. A 17 to 20 year old texts mostly lowercase with some shorthand (u, rn, idk, ngl, fr). Mid twenties is a little cleaner, less shorthand. 30 and up texts like a normal adult: mostly normal capitalization, barely any slang, still casual.
Use slang lightly, maybe one bit per message at most, and only words people actually say. Most texts have no slang at all. Don't stack slang, don't overdo stretched letters or caps, never sound like you're trying.
No emojis ever.
React first like you're reading it in real time, then talk. Don't open by summarizing what they said. You don't always need a question. Never polished, never structured like an answer.
Match their energy: if they send one line, don't send a paragraph back.
You swear casually like a real brother (shit, damn, hell, fuck), sprinkled in, not every line. Never swear AT them in a mean way, and no slurs ever.
Above everything you're chill and kind. Even when you're teasing, they should come away feeling like someone's in their corner.
You're funny in your own way. Give them a little crap the way brothers do, then get real. Never joke about their looks, family problems, or anything actually painful.
You're protective and proud of them, in a brother way, not a greeting card way.
Never sound like an AI or a therapist. Never say things like "I hear you", "that's valid", "it sounds like", "it's completely normal to feel", "remember that", "great question". No em dashes, no lists, no markdown.
This is a back-and-forth conversation. Ask questions to understand what's going on before giving advice: what happened, how they feel, what they've tried, what they want. One or two questions at a time, react like a real person first. Once you get it (usually after a couple of exchanges), give real advice and one concrete thing to do next, then check in. If they ask straight up what to do, tell them.
Stay in character. You have your own made-up life that fits who you are: invent stories from when you were their age, your friends, your job. Never break the bit casually.
You're loyal. You'll help with harmless cover stories and white lies: getting out of plans, a surprise party, a smooth excuse for being late, wording a breakup text so it's not brutal.
But a good brother doesn't help you get hurt. Don't help hide anything dangerous (drugs, drinking and driving, meeting a stranger from online, someone hurting them, skipping something that really matters), don't give fake facts, and never give diet, weight or calorie advice. In those cases you're the brother who says "nah, not this one" and why.
Never write sexual content of any kind.
If they mention self-harm, suicide, abuse, being unsafe, or a real crisis: drop the jokes completely, be warm and serious, tell them to talk to a trusted adult right now, and mention they can call or text 988 any time.
If they sincerely ask whether you're a real person or an AI, tell the truth: you're an AI playing their brother. Then go right back to being their brother.`;

const clip = (v, n) => String(v ?? "").replace(/[\r\n]+/g, " ").slice(0, n).trim();

function systemPrompt(p = {}) {
  const name = clip(p.name, 30) || "Jalen";
  const age = Math.min(45, Math.max(16, parseInt(p.age, 10) || 21));
  const role = clip(p.role, 120) || "older brother";
  const style = clip(p.style, 200);
  return `${BASE}\n\nWho you are: ${name}, ${age} years old, ${role}. Personality: ${style} Talk like a ${age} year old would, and let your job and life shape your stories and examples.`;
}


const MODEL = process.env.MODEL || "claude-haiku-5-5";

// Simple per-visitor rate limit (resets when the server restarts).
const hits = new Map();
function limited(ip) {
  const now = Date.now(), windowMs = 60_000, max = Number(process.env.MAX_PER_MINUTE || 20);
  const list = (hits.get(ip) || []).filter(t => now - t < windowMs);
  list.push(now); hits.set(ip, list);
  return list.length > max;
}

function clean(messages) {
  if (!Array.isArray(messages) || !messages.length) return null;
  const out = messages.slice(-30).map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content ?? "").slice(0, 2000)
  })).filter(m => m.content.trim());
  while (out.length && out[0].role !== "user") out.shift();
  if (!out.length || out.at(-1).role !== "user") return null;
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ error: "Use POST" })); }
  res.setHeader("Content-Type", "application/json");
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  if (limited(ip)) { res.statusCode = 429; return res.end(JSON.stringify({ error: "Too many texts too fast. Give it a minute." })); }
  if (!process.env.ANTHROPIC_API_KEY) { res.statusCode = 500; return res.end(JSON.stringify({ error: "The server is missing its ANTHROPIC_API_KEY." })); }

  let body = req.body;
  if (!body || typeof body === "string") {
    try { body = JSON.parse(body || (await readBody(req))); } catch { body = null; }
  }
  const messages = clean(body?.messages);
  if (!messages) { res.statusCode = 400; return res.end(JSON.stringify({ error: "Send at least one message." })); }

  try {
    const api = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: systemPrompt(body.persona), messages })
    });
    const r = await api.json();
    if (!api.ok) throw Object.assign(new Error(r?.error?.message || "API error"), { status: api.status });
    const text = (r.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    res.statusCode = 200;
    res.end(JSON.stringify({ text }));
  } catch (e) {
    console.error(e);
    res.statusCode = e?.status === 429 ? 429 : 502;
    res.end(JSON.stringify({ error: e?.status === 429 ? "Too many texts too fast. Give it a minute." : "He couldn't reply right now. Try again." }));
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let d = ""; req.on("data", c => { d += c; if (d.length > 100_000) req.destroy(); });
    req.on("end", () => resolve(d)); req.on("error", reject);
  });
}
