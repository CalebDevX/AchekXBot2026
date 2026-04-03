const { useMultiFileAuthState } = require("baileys");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const SESSIONS_DIR = path.join(__dirname, "..", "sessions");
const ACHEK_API = "https://session.achek.com.ng/session";

async function fetchSessionFromAchek(sessionKey) {
  try {
    const url = `${ACHEK_API}/${encodeURIComponent(sessionKey)}`;
    console.log(`[Auth] Fetching session from Achek: ${sessionKey}`);
    const res = await axios.get(url, { timeout: 20000 });
    if (res.data && res.data.success && res.data.session) {
      return res.data.session;
    }
    return null;
  } catch (e) {
    console.log(`[Auth] Achek fetch failed for ${sessionKey}: ${e.message}`);
    return null;
  }
}

class CustomAuthState {
  static async get(sessionId) {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }

    const sessionPath = path.join(SESSIONS_DIR, sessionId.replace(/[/\\:*?"<>|]/g, "_"));
    const credsPath = path.join(sessionPath, "creds.json");

    if (!fs.existsSync(credsPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });

      const base64Session = await fetchSessionFromAchek(sessionId);
      if (base64Session) {
        try {
          const credsJson = Buffer.from(base64Session, "base64").toString("utf8");
          JSON.parse(credsJson);
          fs.writeFileSync(credsPath, credsJson, "utf8");
          console.log(`[Auth] ✅ Session ${sessionId} loaded from Achek`);
        } catch (e) {
          console.log(`[Auth] ❌ Failed to decode Achek session: ${e.message}`);
          fs.rmdirSync(sessionPath, { recursive: true });
        }
      } else {
        console.log(`[Auth] ⚠️ No session found for ${sessionId} — will show QR/pairing`);
      }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    return { state, saveCreds, sessionPath };
  }

  static async deleteGarbageSessions(activeSessionIds) {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    try {
      const sanitized = activeSessionIds.map((id) =>
        id.replace(/[/\\:*?"<>|]/g, "_")
      );
      const dirs = fs.readdirSync(SESSIONS_DIR);
      for (const dir of dirs) {
        if (!sanitized.includes(dir)) {
          const fullPath = path.join(SESSIONS_DIR, dir);
          try {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`[Auth] Removed stale session: ${dir}`);
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  static async saveAllSessions() {
  }

  static stopPeriodicSave() {
  }
}

module.exports = { CustomAuthState };
