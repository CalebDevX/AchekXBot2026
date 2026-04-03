# AchekXBot-MD — WhatsApp Bot

## Overview
A multi-functional WhatsApp bot built with Node.js and Baileys. Features a plugin-based architecture, session management via the Achek session website, and an extensive command set including fun games, utilities, media downloaders, group management, and AI features.

## Tech Stack
- **Runtime**: Node.js 20+
- **WhatsApp Library**: Baileys (whiskeysockets) 7.0.0-rc.8
- **Database**: SQLite (`./bot.db`) by default, PostgreSQL if `DATABASE_URL` is set
- **ORM**: Sequelize
- **Package Manager**: npm (use `--legacy-peer-deps` flag)

## Project Structure
```
index.js         — Main entry point
config.js        — Central config with env variable support
main.js          — Module() registration system for commands
config.env       — Local overrides (DATABASE_URL, PORT, etc.)
core/
  auth.js        — Clean session management + Achek website fetching
  bot.js         — Clean Baileys socket implementation
  manager.js     — Manages multiple bot sessions
  database.js    — Sequelize models (WhatsappSession, BotVariable)
  handler.js     — Message routing to plugins (obfuscated)
  store.js       — Message store and statistics (obfuscated)
  helpers.js     — Utility functions (ffmpeg, temp files, etc.)
  constructors/  — Message, ReplyMessage, Image, Video classes
  schedulers.js  — Cron-based scheduled tasks
plugins/
  commands.js    — Menu, info, alive, settings commands
  fun-extras.js  — Fun commands: dare, truth, ship, gayrate, joke, etc.
  utility-extras.js — Utility: calc, weather, qr, ping, uptime
  media.js       — Media editing (trim, convert, etc.)
  social.js      — Social downloaders (Instagram, TikTok, Pinterest)
  group.js       — Group management
  youtube.js     — YouTube download
  chatbot.js     — AI chatbot integration
  (+ many more)
```

## Session Setup (Achek Website)
The bot uses session keys from **session.achek.com.ng**:

1. Visit https://session.achek.com.ng
2. Get your key (format: `ACHEK~XXXXXX`)
3. Set the `SESSION` environment variable to your key

**How it works:**
- On first start, the bot fetches credentials from the Achek API
- Credentials are cached locally in `./sessions/ACHEK~XXXXXX/`
- Multiple sessions: `SESSION=ACHEK~KEY1,ACHEK~KEY2`

## Key Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION` | (empty) | Achek session key(s), comma-separated |
| `DATABASE_URL` | `./bot.db` | Database URL (SQLite or PostgreSQL) |
| `PORT` | 5000 | HTTP health check port |
| `BOT_NAME` | Caleb AchekBot | Bot display name |
| `MODE` | private | `private` or `public` |
| `HANDLERS` | `.,` | Command prefixes |
| `SUDO` | (empty) | Sudo user phone numbers |

## Commands Added from Bot 2
### Fun (`.fun` category)
- `.dare` — Random dare challenge
- `.truth` — Random truth question
- `.tod truth/dare` — Truth or Dare picker
- `.joke` — Random joke
- `.compliment [@user]` — Compliment someone
- `.insult [@user]` — Playful insult
- `.flirt [@user]` — Pickup line
- `.ship [@user1 @user2]` — Ship two people
- `.gayrate [@user]` — Fun percentage check
- `.bomb` — Bomb game (find safe boxes)
- `.meme` — Random meme from Reddit

### Utility (`.utility` category)
- `.calc <expression>` — Math calculator
- `.weather <city>` — Weather info
- `.qr <text>` — QR code generator
- `.ping` — Bot response speed
- `.uptime` — Bot uptime display

## Running
```bash
npm install --legacy-peer-deps
node index.js
```

## Workflow
- **Start application**: `PORT=5000 node index.js` on port 5000

## Deployment
- Target: VM (always-running)
- Run: `node index.js`

## Local Config Notes
- `config.env` overrides system env vars (uses `override: true` in dotenv)
- Default `DATABASE_URL=./bot.db` uses SQLite to avoid PostgreSQL conflicts
- Sessions stored in `./sessions/{KEY}/` directory (file-based Baileys auth)
