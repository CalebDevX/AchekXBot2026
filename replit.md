# AchekXBot-MD - WhatsApp Bot

## Overview
A multi-functional WhatsApp bot built with Node.js and the Baileys library. Supports plugin-based architecture, multiple sessions, SQLite/PostgreSQL database, and a variety of features including media processing, group management, and AI capabilities.

## Tech Stack
- **Runtime**: Node.js 20+
- **WhatsApp Library**: Baileys (whiskeysockets) v7.0.0-rc.8
- **Database**: SQLite (default, `./bot.db`) or PostgreSQL (via `DATABASE_URL` env var)
- **ORM**: Sequelize
- **Package Manager**: npm

## Project Structure
- `index.js` - Main entry point, starts the bot and health check server
- `config.js` - Central configuration with environment variable support
- `main.js` - Core module handler, registers commands
- `core/` - Internal engine (bot, manager, database, handler, auth, store)
- `plugins/` - Modular feature set (media, group, AI, converters, etc.)
- `plugins/sql/` - Database models for plugin data
- `plugins/utils/` - Shared utilities
- `Bot 2/` - Knight Bot Mini (separate, simplified bot)

## Configuration
The app reads from `config.env` (overrides system env vars) and environment variables:

- `SESSION` - WhatsApp session string(s), comma-separated (required for bot to work)
- `DATABASE_URL` - Database connection (defaults to `./bot.db` SQLite)
- `PORT` - HTTP server port (defaults to 3000, set to 5000 for Replit)
- `USE_SERVER` - Set to `"true"` to enable health check HTTP server

## Local Setup Notes
- `config.env` is used to override environment variables (includes `DATABASE_URL=./bot.db` to use SQLite instead of the Replit PostgreSQL)
- The `dotenv` config uses `override: true` so `config.env` takes precedence over system env vars
- Health check server runs on port 5000

## Running
```bash
npm install --legacy-peer-deps
node index.js
```

## Workflow
- **Start application**: `PORT=5000 node index.js` (webview on port 5000)

## Deployment
- Target: VM (always-running process)
- Run: `node index.js`
