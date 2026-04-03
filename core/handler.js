/**
 * core/handler.js
 * Clean implementation replacing obfuscated version.
 * Loads all plugins, routes incoming WhatsApp messages to registered
 * Module() commands, and handles group-participant events.
 */

const path = require("path");
const fs = require("fs");

const { Message, GroupUpdate } = require("./constructors");
const { commands } = require("../main");
const config = require("../config");
const {
  storeMessage,
  trackSpamMessage,
  getRecentMessageCount,
} = require("./store");

// ─── PLUGIN LOADER ─────────────────────────────────────────────────────────────

const pluginsDir = path.join(__dirname, "..", "plugins");

try {
  const files = fs
    .readdirSync(pluginsDir)
    .filter((f) => f.endsWith(".js"))
    .sort();

  for (const file of files) {
    try {
      require(path.join(pluginsDir, file));
    } catch (e) {
      console.warn(`[Handler] Plugin load error (${file}): ${e.message}`);
    }
  }

  console.log(`[Handler] Loaded ${files.length} plugin files.`);
} catch (e) {
  console.error("[Handler] Failed to read plugins directory:", e.message);
}

// ─── MESSAGE TYPE DETECTION ────────────────────────────────────────────────────

/**
 * Returns a simplified type string for the incoming Baileys message.
 * Matches against the `on` field used in Module() registrations.
 */
function getMessageType(msg) {
  const m = msg.message;
  if (!m) return null;

  if (m.conversation || m.extendedTextMessage) return "text";
  if (m.imageMessage) return "image";
  if (m.videoMessage || m.ptvMessage) return "video";
  if (m.audioMessage) return "audio";
  if (m.stickerMessage) return "sticker";
  if (m.documentMessage) return "document";
  if (m.locationMessage) return "location";
  if (m.contactMessage || m.contactsArrayMessage) return "contact";
  if (m.reactionMessage) return "reaction";
  if (m.pollCreationMessage || m.pollUpdateMessage) return "poll";
  if (m.viewOnceMessage || m.viewOnceMessageV2) return "viewOnce";
  if (m.buttonsResponseMessage || m.interactiveResponseMessage) return "button";
  if (m.templateButtonReplyMessage) return "button";
  if (m.liveLocationMessage) return "location";

  return "unknown";
}

/**
 * Extracts text from any message type (including captions).
 */
function getMessageText(msg) {
  const m = msg.message;
  if (!m) return "";

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.templateButtonReplyMessage?.selectedId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ""
  );
}

/**
 * Returns true when a command's `on` field matches the current message type.
 * "message" matches every type except reactions and polls.
 */
function matchesEventType(on, msgType) {
  if (!on) return false;
  if (on === "message") return !["reaction", "poll", "unknown"].includes(msgType);
  if (on === "text") return msgType === "text";
  if (on === "image" || on === "photo") return msgType === "image";
  if (on === "video") return msgType === "video";
  if (on === "audio") return msgType === "audio";
  if (on === "sticker") return msgType === "sticker";
  if (on === "button") return msgType === "button";
  return false;
}

// ─── NORMALISE MESSAGE KEY (Baileys 7 LID compatibility) ──────────────────────

/**
 * The Message constructor reads `key.remoteJidAlt` (for non-group senders)
 * and `key.participantAlt` (for group senders).
 * These extra fields were added by the original obfuscated handler.
 * We add safe fallbacks here so the constructor always finds a valid value.
 */
function normaliseKey(msg) {
  if (!msg.key) return;
  if (!msg.key.remoteJidAlt) {
    msg.key.remoteJidAlt = msg.key.remoteJid;
  }
  if (msg.key.participant && !msg.key.participantAlt) {
    msg.key.participantAlt = msg.key.participant;
  }
}

// ─── MAIN MESSAGE HANDLER ─────────────────────────────────────────────────────

/**
 * Called by bot.js on every incoming messages.upsert event.
 * Routes the message to every matching registered command.
 */
async function handler(sock, msg) {
  try {
    if (!msg || !msg.message) return;

    const jid = msg.key.remoteJid;
    if (!jid) return;

    // Skip WhatsApp status broadcasts unless configured to handle them
    if (jid === "status@broadcast") {
      if (config.AUTO_READ_STATUS) {
        await sock.readMessages([msg.key]).catch(() => {});
      }
      return;
    }

    const isGroup = jid.endsWith("@g.us");
    const fromMe = !!msg.key.fromMe;

    // Honour blocked chats
    if (config.BLOCK_CHAT) {
      const blocked = String(config.BLOCK_CHAT).split(",").map((s) => s.trim());
      if (blocked.some((b) => jid.includes(b))) return;
    }

    // Auto-read every message if enabled
    if (config.READ_MESSAGES) {
      await sock.readMessages([msg.key]).catch(() => {});
    }

    // Add LID fallback fields that the Message constructor expects
    normaliseKey(msg);

    // Store for anti-delete (best-effort, non-blocking)
    storeMessage(sock, msg).catch(() => {});

    // Anti-spam for DMs
    if (config.PM_ANTISPAM && !isGroup && !fromMe) {
      const sender = jid;
      trackSpamMessage(sender, jid);
      const limit = parseInt(String(config.ANTISPAM_COUNT || "10"), 10);
      if (getRecentMessageCount(sender, jid) > limit) return;
    }

    const msgType = getMessageType(msg);
    if (!msgType) return;

    const text = getMessageText(msg);

    // Build the Message wrapper used by every plugin
    const message = new Message(sock, msg);

    // ── Walk every registered command ──
    for (const cmd of commands) {
      try {
        // Skip disabled commands
        if (config.DISABLED_COMMANDS && cmd.pattern) {
          const cmdName = cmd.pattern.toString().match(/[a-zA-Z_]\w*/)?.[0];
          if (
            cmdName &&
            config.DISABLED_COMMANDS.some((d) => d === cmdName)
          )
            continue;
        }

        // Ownership guard: if fromMe is true, only owner/sudo may trigger it
        if (cmd.fromMe && !message.fromOwner) continue;

        // ── Case 1: event-only (no pattern) ──
        // e.g. Module({ on: "text" }, fn) – runs on every matching message type
        if (cmd.on && !cmd.pattern) {
          if (matchesEventType(cmd.on, msgType)) {
            await cmd.function(message, [text, text]);
          }
          continue;
        }

        // ── Case 2: event + pattern ──
        // e.g. Module({ on: "image", pattern: "sticker" }, fn)
        if (cmd.on && cmd.pattern) {
          if (!matchesEventType(cmd.on, msgType)) continue;
          const match = text.match(cmd.pattern);
          if (match) {
            await maybeReadAndReact(sock, msg, jid);
            await cmd.function(message, match);
          }
          continue;
        }

        // ── Case 3: pattern-only ──
        // e.g. Module({ pattern: "menu" }, fn) – matches text against prefix+command
        if (cmd.pattern) {
          if (msgType === "reaction") continue;
          const match = text.match(cmd.pattern);
          if (match) {
            await maybeReadAndReact(sock, msg, jid);
            await cmd.function(message, match);
          }
        }
      } catch (cmdErr) {
        // Never let one bad command crash the handler
        if (config.DEBUG_MODE) {
          console.error("[Handler] Command error:", cmdErr.message);
        }
      }
    }
  } catch (e) {
    console.error("[Handler] Fatal error:", e.message);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function maybeReadAndReact(sock, msg, jid) {
  if (config.READ_COMMAND) {
    await sock.readMessages([msg.key]).catch(() => {});
  }
  if (config.CMD_REACTION) {
    await sock
      .sendMessage(jid, { react: { text: "⚡", key: msg.key } })
      .catch(() => {});
  }
}

// ─── GROUP PARTICIPANT UPDATE HANDLER ─────────────────────────────────────────

/**
 * Called by bot.js when Baileys emits group-participants.update.
 * Passes the event to every Module({ on: "group-update" }) command.
 *
 * @param {object} sock – Baileys socket
 * @param {object} event – { id, participants, action, author }
 */
async function groupUpdate(sock, event) {
  try {
    // Run every registered group-update handler
    for (const cmd of commands) {
      if (cmd.on !== "group-update") continue;
      try {
        const grp = new GroupUpdate(sock, event);
        await cmd.function(grp, [event.action]);
      } catch (e) {
        if (config.DEBUG_MODE) {
          console.error("[GroupUpdate] Handler error:", e.message);
        }
      }
    }
  } catch (e) {
    console.error("[GroupUpdate] Fatal error:", e.message);
  }
}

// ─── STARTUP EVENT ────────────────────────────────────────────────────────────

/**
 * Called by bot.js once the socket connection opens.
 * Sends an online notification to the bot owner (unless disabled).
 * Also triggers any Module({ on: "start" }) commands.
 */
async function startEvent(sock) {
  try {
    // Notify owner if start message is enabled
    if (!config.DISABLE_START_MESSAGE) {
      const userId = sock.user?.id;
      if (userId) {
        const ownerJid = userId.includes(":") ? userId.split(":")[0] + "@s.whatsapp.net" : userId;
        const botName = config.BOT_NAME || "AchekBot";
        const version = config.VERSION || "3.0.0";
        await sock
          .sendMessage(ownerJid, {
            text: `*${botName} v${version} is now Online* ✅\nBot is ready and listening for commands.`,
          })
          .catch(() => {});
      }
    }

    // Run any Module({ on: "start" }) plugins
    for (const cmd of commands) {
      if (cmd.on !== "start") continue;
      try {
        await cmd.function(sock, []);
      } catch (_) {}
    }
  } catch (e) {
    console.error("[StartEvent] Error:", e.message);
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = { handler, groupUpdate, startEvent };
