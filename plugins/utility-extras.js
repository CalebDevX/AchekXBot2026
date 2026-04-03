const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");
const QRCode = require("qrcode");

const isPrivate = config.MODE === "private";

Module(
  {
    pattern: "calc ?(.*)",
    desc: "Calculate a math expression",
    use: "utility",
  },
  async (message, match) => {
    const expr = (match[1] || "").trim();
    if (!expr) {
      return message.sendReply(
        "🧮 *Calculator*\n\nUsage: `.calc <expression>`\n\nExample: `.calc 5 * (3 + 2)`"
      );
    }
    if (!/^[0-9+\-*/^%().e \t]+$/i.test(expr)) {
      return message.sendReply(
        "❌ Invalid expression! Only use numbers and operators: `+ - * / ( ) % .`"
      );
    }
    try {
      const safeExpr = expr.replace(/\^/g, "**");
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${safeExpr})`)();
      if (!isFinite(result)) throw new Error("Result is not finite");
      await message.sendReply(
        `🧮 *Calculator*\n\n📝 *Input:* \`${expr}\`\n✅ *Result:* \`${result}\``
      );
    } catch (e) {
      await message.sendReply("❌ Invalid expression or math error!");
    }
  }
);

Module(
  {
    pattern: "weather ?(.*)",
    desc: "Get weather for a city",
    use: "utility",
  },
  async (message, match) => {
    const city = (match[1] || "").trim();
    if (!city) {
      return message.sendReply(
        "☁️ *Weather*\n\nUsage: `.weather <city>`\n\nExample: `.weather Lagos`"
      );
    }
    try {
      await message.react("🌍");
      const apiKey = "4902c0f2550f58298ad4146a92b65e10";
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
        { timeout: 10000 }
      );
      const w = res.data;
      const icon = getWeatherIcon(w.weather[0]?.main || "");
      const text =
        `${icon} *Weather in ${w.name}, ${w.sys.country}*\n\n` +
        `🌡️ *Temp:* ${Math.round(w.main.temp)}°C (feels ${Math.round(w.main.feels_like)}°C)\n` +
        `🌤️ *Condition:* ${w.weather[0]?.description}\n` +
        `💧 *Humidity:* ${w.main.humidity}%\n` +
        `💨 *Wind:* ${Math.round(w.wind.speed * 3.6)} km/h\n` +
        `👁️ *Visibility:* ${(w.visibility / 1000).toFixed(1)} km\n` +
        `🔽 *Low:* ${Math.round(w.main.temp_min)}°C  🔼 *High:* ${Math.round(w.main.temp_max)}°C`;
      await message.react("✅");
      await message.sendReply(text);
    } catch (e) {
      await message.react("❌");
      if (e.response?.status === 404) {
        return message.sendReply(`❌ City "*${city}*" not found. Check spelling and try again.`);
      }
      await message.sendReply(`❌ Weather fetch failed: ${e.message}`);
    }
  }
);

function getWeatherIcon(condition) {
  const map = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️",
    Tornado: "🌪️",
  };
  return map[condition] || "🌡️";
}

Module(
  {
    pattern: "qr ?(.*)",
    desc: "Generate a QR code from text or link",
    use: "utility",
  },
  async (message, match) => {
    const text = (match[1] || "").trim();
    if (!text) {
      return message.sendReply(
        "📷 *QR Generator*\n\nUsage: `.qr <text or link>`\n\nExample: `.qr https://google.com`"
      );
    }
    try {
      await message.react("⏳");
      const qrBuffer = await QRCode.toBuffer(text, {
        type: "png",
        width: 600,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      await message.sendMessage(
        qrBuffer,
        "image",
        { caption: `📷 *QR Code*\n\n📝 Text: ${text}` }
      );
      await message.react("✅");
    } catch (e) {
      await message.react("❌");
      await message.sendReply(`❌ Failed to generate QR: ${e.message}`);
    }
  }
);

Module(
  {
    pattern: "ping",
    desc: "Check bot response speed",
    use: "utility",
  },
  async (message, match) => {
    const start = Date.now();
    const sent = await message.sendReply("🏓 Pinging...");
    const ping = Date.now() - start;
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeStr = `${h}h ${m}m ${s}s`;
    await message.client.sendMessage(message.jid, {
      text:
        `🏓 *Pong!*\n\n` +
        `⚡ *Speed:* ${ping}ms\n` +
        `⏱️ *Uptime:* ${uptimeStr}\n` +
        `🤖 *Bot:* ${config.BOT_NAME}`,
      edit: sent.key,
    });
  }
);

Module(
  {
    pattern: "uptime",
    desc: "Show bot uptime",
    use: "utility",
  },
  async (message, match) => {
    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const parts = [];
    if (d) parts.push(`${d} day${d !== 1 ? "s" : ""}`);
    if (h) parts.push(`${h} hr${h !== 1 ? "s" : ""}`);
    if (m) parts.push(`${m} min${m !== 1 ? "s" : ""}`);
    if (s || !parts.length) parts.push(`${s} sec${s !== 1 ? "s" : ""}`);

    await message.sendReply(
      `⏱️ *Bot Uptime*\n\n` +
        `🤖 *Name:* ${config.BOT_NAME}\n` +
        `🕒 *Running for:* ${parts.join(", ")}\n` +
        `🗄️ *Version:* v${config.VERSION}`
    );
  }
);
