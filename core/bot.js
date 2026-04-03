const {
  default: makeWASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} = require("baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

const { CustomAuthState } = require("./auth");
const { handler, groupUpdate, startEvent } = require("./handler");
const { logger, MAX_RECONNECT_ATTEMPTS } = require("../config");

class WhatsAppBot {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.sock = null;
    this.reconnectAttempts = 0;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      const { state, saveCreds } = await CustomAuthState.get(this.sessionId);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "silent" })
          ),
        },
        logger: pino({ level: "silent" }),
        browser: ["AchekBot", "Chrome", "20.0.04"],
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
        getMessage: async () => ({ conversation: "" }),
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log(`\n[Bot:${this.sessionId}] Scan QR code to login:`);
          qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
          this.reconnectAttempts = 0;
          console.log(`[Bot:${this.sessionId}] ✅ Connected to WhatsApp!`);
          logger.info({ session: this.sessionId }, "WhatsApp connected");
          try {
            await startEvent(this.sock);
          } catch (e) {
            logger.warn({ err: e }, "startEvent error");
          }
        }

        if (connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;

          if (loggedOut) {
            console.log(
              `[Bot:${this.sessionId}] ⚠️ Logged out. Get a new session key from session.achek.com.ng`
            );
            logger.warn({ session: this.sessionId }, "Session logged out");
            return;
          }

          if (
            !this.isShuttingDown &&
            this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS
          ) {
            this.reconnectAttempts++;
            const delay = Math.min(5000 * this.reconnectAttempts, 30000);
            console.log(
              `[Bot:${this.sessionId}] Reconnecting in ${delay / 1000}s... (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
            );
            setTimeout(() => this.initialize(), delay);
          } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log(
              `[Bot:${this.sessionId}] Max reconnect attempts reached.`
            );
          }
        }
      });

      this.sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;
        for (const msg of messages) {
          if (!msg.message) continue;
          try {
            await handler(this.sock, msg);
          } catch (e) {
            logger.error(
              { err: e, session: this.sessionId },
              "Message handler error"
            );
          }
        }
      });

      this.sock.ev.on("group-participants.update", async (event) => {
        try {
          await groupUpdate(this.sock, event);
        } catch (e) {
          logger.error({ err: e }, "Group update handler error");
        }
      });

      this.sock.ev.on("call", async (calls) => {
        const config = require("../config");
        if (!config.REJECT_CALLS) return;
        for (const call of calls) {
          if (call.status === "offer") {
            try {
              await this.sock.rejectCall(call.id, call.from);
              if (config.CALL_REJECT_MESSAGE) {
                await this.sock.sendMessage(call.from, {
                  text: config.CALL_REJECT_MESSAGE,
                });
              }
            } catch (e) {}
          }
        }
      });
    } catch (error) {
      logger.error(
        { err: error, session: this.sessionId },
        "Bot initialization failed"
      );
      throw error;
    }
  }

  async disconnect(save = true) {
    this.isShuttingDown = true;
    if (this.sock) {
      try {
        this.sock.ws?.close();
      } catch (e) {}
    }
  }
}

module.exports = { WhatsAppBot };
