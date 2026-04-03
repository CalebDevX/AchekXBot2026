# 🚀 AchekXBot — Deploy Guide (No Coding Required)

## Step 1 — Get Your Session Key

1. Go to **https://session.achek.com.ng**
2. Scan the QR code with your WhatsApp
3. Copy the key you receive (it looks like `ACHEK~ABC123XYZ`)
4. Keep it safe — you'll need it in the next step

---

## Step 2 — Choose a Hosting Platform

Pick one of the platforms below. All have free plans.

---

### ▶ Option A — Deploy on Render (Recommended, Free)

1. **Fork or clone** this project to your GitHub account
2. Go to **https://render.com** → Sign Up (free)
3. Click **New → Web Service**
4. Connect your GitHub and select this repo
5. Render auto-detects the settings from `render.yaml`
6. Click **Environment** tab, then add these variables:

| Variable | Value |
|---|---|
| `SESSION` | Your key from session.achek.com.ng (e.g. `ACHEK~ABC123`) |
| `SUDO` | Your WhatsApp number without + (e.g. `2348012345678`) |
| `BOT_NAME` | Your bot's name |
| `MODE` | `private` (only you) or `public` (everyone) |

7. Click **Deploy** — your bot will be live in ~2 minutes!

---

### ▶ Option B — Deploy on Railway (Super Easy, Free Tier)

1. **Fork or clone** this project to your GitHub account
2. Go to **https://railway.app** → Sign Up (free)
3. Click **New Project → Deploy from GitHub repo**
4. Select this repo → Railway auto-detects everything
5. Go to **Variables** tab and add:

| Variable | Value |
|---|---|
| `SESSION` | `ACHEK~YourKeyHere` |
| `SUDO` | Your WhatsApp number (e.g. `2348012345678`) |
| `BOT_NAME` | Your bot's name |
| `MODE` | `private` or `public` |

6. Railway deploys automatically — done!

---

### ▶ Option C — Deploy on Heroku

1. Fork this repo to your GitHub
2. Go to **https://heroku.com** → Create account
3. Click **New → Create new app**
4. Go to **Deploy** tab → Connect GitHub → Select repo → Enable auto-deploy
5. Go to **Settings → Config Vars** → Add the same variables as above
6. Go to **Deploy** tab → Click **Deploy Branch**

---

### ▶ Option D — VPS / Your Own Server

```bash
# Clone the repo
git clone https://github.com/YourUsername/AchekXBot.git
cd AchekXBot

# Copy and fill in your environment variables
cp .env.example .env
nano .env   # Edit with your values

# Install and run
npm install --legacy-peer-deps
node index.js
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `SESSION` | ✅ Yes | Session key from session.achek.com.ng |
| `SUDO` | ✅ Yes | Your WhatsApp number (without +) |
| `BOT_NAME` | No | Bot's display name (default: AchekBot) |
| `MODE` | No | `private` or `public` (default: private) |
| `DATABASE_URL` | No | `./bot.db` for SQLite (default, works everywhere) |
| `GEMINI_API_KEY` | No | For AI chatbot — free at aistudio.google.com |
| `REJECT_CALL` | No | `true` to auto-reject calls |
| `CMD_REACTION` | No | `true` to ⚡ react on commands |

---

## ❓ Common Questions

**Q: My bot disconnected, how do I reconnect?**
→ Get a new session key from session.achek.com.ng and update the SESSION variable on your platform.

**Q: Can I run multiple WhatsApp numbers?**
→ Yes! Set `SESSION=ACHEK~KEY1,ACHEK~KEY2` (comma-separated).

**Q: Is the free tier good enough?**
→ Yes, Render and Railway free tiers handle a WhatsApp bot perfectly.

**Q: What database should I use?**
→ Leave `DATABASE_URL=./bot.db` for SQLite — it works perfectly on all platforms for most use cases.

---

*Built with ❤️ by AchekBot — session.achek.com.ng*
