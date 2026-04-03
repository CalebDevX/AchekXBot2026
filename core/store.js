/**
 * core/store.js
 * Clean implementation replacing obfuscated version.
 * Provides Sequelize models and helper functions for message storage,
 * anti-delete cache, spam tracking, and user/chat statistics.
 */

const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config");

// ─── MODELS ───────────────────────────────────────────────────────────────────

const Chat = sequelize.define(
  "Chat",
  {
    jid: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, defaultValue: "" },
    isGroup: { type: DataTypes.BOOLEAN, defaultValue: false },
    messageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastMessageAt: { type: DataTypes.DATE },
  },
  { tableName: "chats", timestamps: true }
);

const User = sequelize.define(
  "User",
  {
    jid: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, defaultValue: "" },
    messageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastSeen: { type: DataTypes.DATE },
  },
  { tableName: "users", timestamps: true }
);

const AntiDeleteCache = sequelize.define(
  "AntiDeleteCache",
  {
    messageId: { type: DataTypes.STRING, allowNull: false },
    jid: { type: DataTypes.STRING, allowNull: false },
    sender: { type: DataTypes.STRING, defaultValue: "" },
    content: { type: DataTypes.TEXT("long") },
    type: { type: DataTypes.STRING, defaultValue: "text" },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "anti_delete_cache", timestamps: false }
);

const UserStats = sequelize.define(
  "UserStats",
  {
    jid: { type: DataTypes.STRING, allowNull: false },
    userJid: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, defaultValue: "" },
    count: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastSeen: { type: DataTypes.DATE },
  },
  { tableName: "user_stats", timestamps: false }
);

// SpamTracker is an in-memory map; exposed so plugins can inspect it directly
const SpamTracker = new Map();

// Sync all models at startup (non-destructive)
(async () => {
  try {
    await Chat.sync({ alter: false });
    await User.sync({ alter: false });
    await AntiDeleteCache.sync({ alter: false });
    await UserStats.sync({ alter: false });
  } catch (e) {
    try {
      await Chat.sync({ force: false });
      await User.sync({ force: false });
      await AntiDeleteCache.sync({ force: false });
      await UserStats.sync({ force: false });
    } catch (e2) {
      console.warn("[Store] DB sync warning:", e2.message);
    }
  }
})();

// ─── WRITE QUEUE (batches DB writes to reduce I/O) ────────────────────────────

let writeQueue = [];
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flushQueue, 3000);
}

async function flushQueue() {
  if (writeQueue.length === 0) {
    flushTimer = null;
    return;
  }
  const batch = writeQueue.splice(0);
  flushTimer = null;
  for (const fn of batch) {
    try {
      await fn();
    } catch (_) {}
  }
}

function stopFlushTimer() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

async function flushQueueOnShutdown() {
  stopFlushTimer();
  await flushQueue();
}

// ─── MESSAGE STORAGE ──────────────────────────────────────────────────────────

/**
 * Called on every incoming message.
 * Stores it in anti-delete cache and increments user/chat stats.
 */
async function storeMessage(sock, msg) {
  try {
    if (!msg || !msg.key || !msg.message) return;

    const jid = msg.key.remoteJid;
    if (!jid) return;

    const sender = msg.key.participant || msg.key.remoteJid;
    const msgId = msg.key.id;
    const isGroup = jid.endsWith("@g.us");
    const name = msg.pushName || "";
    const now = new Date();

    const m = msg.message;
    let type = "text";

    if (m.imageMessage) type = "image";
    else if (m.videoMessage || m.ptvMessage) type = "video";
    else if (m.audioMessage) type = "audio";
    else if (m.stickerMessage) type = "sticker";
    else if (m.documentMessage) type = "document";

    // Queue anti-delete cache write
    writeQueue.push(async () => {
      await AntiDeleteCache.upsert({
        messageId: msgId,
        jid,
        sender,
        content: JSON.stringify(m),
        type,
        timestamp: now,
      });
      // Keep only last 24h of messages
      await AntiDeleteCache.destroy({
        where: { timestamp: { [Op.lt]: new Date(Date.now() - 86400000) } },
      });
    });

    // Queue user/chat stats write
    writeQueue.push(async () => {
      await User.upsert({ jid: sender, name, lastSeen: now });
      await User.increment("messageCount", { where: { jid: sender } });
      await Chat.upsert({ jid, isGroup, lastMessageAt: now });
      await Chat.increment("messageCount", { where: { jid } });

      if (sender && jid) {
        const [stat] = await UserStats.findOrCreate({
          where: { jid, userJid: sender },
          defaults: { name, count: 0, lastSeen: now },
        });
        await stat.increment("count");
        await stat.update({ name, lastSeen: now });
      }
    });

    scheduleFlush();
  } catch (_) {}
}

/**
 * Directly persist a user's message count for a specific chat.
 * Used by group plugins to track activity.
 */
async function storeToDB(userJid, chatJid, name) {
  try {
    await User.upsert({ jid: userJid, name, lastSeen: new Date() });
    await User.increment("messageCount", { where: { jid: userJid } });

    const [stat] = await UserStats.findOrCreate({
      where: { jid: chatJid, userJid },
      defaults: { name, count: 0, lastSeen: new Date() },
    });
    await stat.increment("count");
    await stat.update({ name, lastSeen: new Date() });
  } catch (_) {}
}

/**
 * Fetch per-chat user message stats (sorted by count descending).
 * Used by message-stats plugin for leaderboards.
 */
async function fetchFromStore(jid) {
  try {
    const stats = await UserStats.findAll({
      where: { jid },
      order: [["count", "DESC"]],
    });
    return stats.map((s) => ({
      userJid: s.userJid,
      name: s.name,
      count: s.count,
      lastSeen: s.lastSeen,
    }));
  } catch (_) {
    return [];
  }
}

/**
 * General cleanup: removes anti-delete cache older than 7 days.
 */
async function cleanup() {
  try {
    const cutoff = new Date(Date.now() - 7 * 86400000);
    await AntiDeleteCache.destroy({
      where: { timestamp: { [Op.lt]: cutoff } },
    });
  } catch (_) {}
}

// ─── SPAM TRACKER (in-memory, per sender:jid) ─────────────────────────────────

const spamMap = new Map();

function trackSpamMessage(sender, jid) {
  const key = `${sender}:${jid}`;
  const now = Date.now();
  if (!spamMap.has(key)) spamMap.set(key, []);
  const times = spamMap.get(key);
  times.push(now);
  spamMap.set(key, times.filter((t) => now - t < 60000));
}

function getRecentMessageCount(sender, jid) {
  const key = `${sender}:${jid}`;
  const now = Date.now();
  return (spamMap.get(key) || []).filter((t) => now - t < 60000).length;
}

function cleanupSpamTracker() {
  const now = Date.now();
  for (const [key, times] of spamMap.entries()) {
    const filtered = times.filter((t) => now - t < 60000);
    if (filtered.length === 0) spamMap.delete(key);
    else spamMap.set(key, filtered);
  }
}

// ─── STATS & CACHE RETRIEVAL ──────────────────────────────────────────────────

async function cleanupAntiDeleteCache() {
  try {
    await AntiDeleteCache.destroy({
      where: { timestamp: { [Op.lt]: new Date(Date.now() - 86400000) } },
    });
  } catch (_) {}
}

async function getChatStats(jid) {
  try {
    return await Chat.findOne({ where: { jid } });
  } catch (_) {
    return null;
  }
}

async function getTopUsers(jid, limit = 10) {
  try {
    return await UserStats.findAll({
      where: { jid },
      order: [["count", "DESC"]],
      limit,
    });
  } catch (_) {
    return [];
  }
}

async function getTotalUserCount() {
  try {
    return await User.count();
  } catch (_) {
    return 0;
  }
}

async function getGlobalTopUsers(limit = 10) {
  try {
    return await User.findAll({
      order: [["messageCount", "DESC"]],
      limit,
    });
  } catch (_) {
    return [];
  }
}

/**
 * No-op: column already exists in our model definition.
 * Kept for API compatibility with plugins.
 */
async function ensureFullContentColumnExists() {
  return true;
}

async function getFullMessage(messageId, jid) {
  try {
    const where = { messageId };
    if (jid) where.jid = jid;
    return await AntiDeleteCache.findOne({ where });
  } catch (_) {
    return null;
  }
}

async function fetchRecentChats(limit = 20) {
  try {
    return await Chat.findAll({
      order: [["lastMessageAt", "DESC"]],
      limit,
    });
  } catch (_) {
    return [];
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = {
  // Models
  Chat,
  User,
  AntiDeleteCache,
  UserStats,
  SpamTracker,

  // Storage
  storeMessage,
  storeToDB,
  fetchFromStore,
  cleanup,

  // Spam
  trackSpamMessage,
  getRecentMessageCount,
  cleanupSpamTracker,

  // Cache
  cleanupAntiDeleteCache,
  getFullMessage,

  // Stats
  getChatStats,
  getTopUsers,
  getTotalUserCount,
  getGlobalTopUsers,
  fetchRecentChats,
  ensureFullContentColumnExists,

  // Queue management (used by manager.js on shutdown)
  flushQueueOnShutdown,
  stopFlushTimer,
};
