# Brotherly

The older brother you never had. Or the one you need right now.

Brotherly is a web app you can put on your own website and install on any phone's home screen. It has two parts:

- `public/` is the app people see (the chat, the 500 brothers, the plans screen).
- `api/chat.js` is a small server function that talks to the AI. Your secret API key lives here, so nobody using the app can ever see it.

## What you need

1. **An Anthropic API key.** Create an account at https://platform.claude.com, add a payment method, and create an API key. Check the account terms first; if you're under 18, a parent or guardian will likely need to own the account. Keep the key secret, like a password.
2. **A free GitHub account** (https://github.com) to store the code.
3. **A free Vercel account** (https://vercel.com) to put it online. Sign up with your GitHub account.

## Put it online (about 10 minutes)

1. On GitHub, click **New repository**, name it `brotherly`, and create it.
2. Click **uploading an existing file** and drag in everything from this folder (keep the `api`, `lib` and `public` folders as folders). Click **Commit changes**.
3. On Vercel, click **Add New → Project** and pick the `brotherly` repository.
4. Before you click Deploy, open **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` = your key
5. Click **Deploy**. In a minute you get a link like `brotherly.vercel.app`. That's your app.

Every time you change a file on GitHub, Vercel updates the live app by itself.

## Install it on your phone

- **iPhone:** open your link in Safari, tap the Share button, then **Add to Home Screen**.
- **Android:** open your link in Chrome, tap the menu, then **Install app**.

It opens full screen with its own icon, like any other app.

## Run it on your own computer

You need Node.js 20 or newer (https://nodejs.org).

```
cp .env.example .env      # then paste your key into .env
npm start
```

Open http://localhost:3000.

## Settings

| Setting | What it does | Default |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Your secret key (required) | none |
| `MODEL` | Which Claude model writes the replies | `claude-haiku-5-5` |
| `MAX_PER_MINUTE` | Texts one person can send per minute | `20` |

Haiku is the cheapest and fastest model, which fits short texts. To try a smarter, more expensive brother, set `MODEL` to `claude-sonnet-5-5`. Check current prices at https://platform.claude.com/docs/en/about-claude/pricing and set a monthly spending limit in your Anthropic console so a surprise bill can't happen.

## Before you share it publicly

- **Spending limit:** set one in the Anthropic console. Every text costs a little money.
- **Payments:** the Free, Plus and Pro screen is a preview. Real payments need a service like Stripe, plus accounts so the app knows who paid.
- **Ages and the law:** California's companion chatbot law (SB 243) applies. The app already shows an AI label, reminds people to take a break every 3 hours, and points to 988 in a crisis, but have a lawyer review it before opening it to the public, and launch 18+ first.
- **Saved data:** chats and settings stay in each person's own browser. Nothing is stored on the server.
