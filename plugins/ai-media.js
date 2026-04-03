/**
 * plugins/ai-media.js
 * AI image generation and text generation commands.
 * Uses Pollinations.ai (completely free, no API key required).
 */

const { Module } = require("../main");
const axios = require("axios");
const { isPrivateMode } = require("./utils");

const POLLINATIONS_IMG = "https://image.pollinations.ai/prompt";
const POLLINATIONS_TXT = "https://text.pollinations.ai";

// ─── IMAGE GENERATION ─────────────────────────────────────────────────────────

Module(
  {
    pattern: "imagine ?(.*)",
    fromMe: isPrivateMode,
    desc: "Generate an AI image from a text prompt",
    usage: ".imagine a sunset over Lagos skyline",
    use: "ai",
  },
  async (message, match) => {
    const prompt = match[1]?.trim();
    if (!prompt) {
      return await message.sendReply(
        "*Usage:* .imagine <your prompt>\n\n*Example:* .imagine a cyberpunk city at night"
      );
    }

    await message.sendReply("_🎨 Generating your image, please wait..._");

    try {
      const seed = Math.floor(Math.random() * 999999);
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${POLLINATIONS_IMG}/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": "AchekBot/3.0" },
      });

      const imageBuffer = Buffer.from(response.data);

      await message.sendMessage(imageBuffer, "image", {
        caption: `🎨 *AI Image Generated*\n\n📝 *Prompt:* ${prompt}`,
      });
    } catch (e) {
      await message.sendReply(
        "_❌ Failed to generate image. Please try again with a different prompt._"
      );
    }
  }
);

// Alias: .dalle
Module(
  {
    pattern: "dalle ?(.*)",
    fromMe: isPrivateMode,
    desc: "Generate an AI image (alias for .imagine)",
    usage: ".dalle a futuristic car",
    use: "ai",
  },
  async (message, match) => {
    const prompt = match[1]?.trim();
    if (!prompt) {
      return await message.sendReply(
        "*Usage:* .dalle <your prompt>\n\n*Example:* .dalle a warrior with glowing armor"
      );
    }

    await message.sendReply("_🎨 Generating your image, please wait..._");

    try {
      const seed = Math.floor(Math.random() * 999999);
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${POLLINATIONS_IMG}/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": "AchekBot/3.0" },
      });

      await message.sendMessage(Buffer.from(response.data), "image", {
        caption: `🎨 *AI Image Generated*\n\n📝 *Prompt:* ${prompt}`,
      });
    } catch (e) {
      await message.sendReply(
        "_❌ Failed to generate image. Please try again._"
      );
    }
  }
);

// Alias: .txt2img
Module(
  {
    pattern: "txt2img ?(.*)",
    fromMe: isPrivateMode,
    desc: "Convert your text description into an image",
    usage: ".txt2img beautiful mountains at dawn",
    use: "ai",
  },
  async (message, match) => {
    const prompt = match[1]?.trim();
    if (!prompt) {
      return await message.sendReply(
        "*Usage:* .txt2img <your description>\n\n*Example:* .txt2img a smiling robot eating jollof rice"
      );
    }

    await message.sendReply("_🖼️ Converting your text to image..._");

    try {
      const seed = Math.floor(Math.random() * 999999);
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${POLLINATIONS_IMG}/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": "AchekBot/3.0" },
      });

      await message.sendMessage(Buffer.from(response.data), "image", {
        caption: `🖼️ *Text to Image*\n\n📝 *Prompt:* ${prompt}`,
      });
    } catch (e) {
      await message.sendReply("_❌ Image generation failed. Please try again._");
    }
  }
);

// ─── TEXT / AI GENERATION ─────────────────────────────────────────────────────

Module(
  {
    pattern: "ask ?(.*)",
    fromMe: isPrivateMode,
    desc: "Ask the AI a question and get a text response",
    usage: ".ask What is the capital of Nigeria?",
    use: "ai",
  },
  async (message, match) => {
    const question = match[1]?.trim();
    if (!question) {
      return await message.sendReply(
        "*Usage:* .ask <your question>\n\n*Example:* .ask Explain quantum computing simply"
      );
    }

    await message.sendReply("_🤖 Thinking..._");

    try {
      const encodedQ = encodeURIComponent(question);
      const url = `${POLLINATIONS_TXT}/${encodedQ}?model=openai&seed=${Math.floor(Math.random() * 99999)}`;

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "AchekBot/3.0",
          Accept: "text/plain",
        },
      });

      const answer = String(response.data).trim();
      if (!answer) throw new Error("Empty response");

      await message.sendReply(
        `🤖 *AI Response*\n\n❓ *Q:* ${question}\n\n💬 *A:* ${answer}`
      );
    } catch (e) {
      await message.sendReply(
        "_❌ Could not get a response. Please try again._"
      );
    }
  }
);

Module(
  {
    pattern: "write ?(.*)",
    fromMe: isPrivateMode,
    desc: "AI writes content for you (essays, captions, poems, etc.)",
    usage: ".write a short poem about rain",
    use: "ai",
  },
  async (message, match) => {
    const request = match[1]?.trim();
    if (!request) {
      return await message.sendReply(
        "*Usage:* .write <what you want written>\n\n" +
          "*Examples:*\n" +
          "• .write a birthday message for my friend\n" +
          "• .write an essay about climate change\n" +
          "• .write a WhatsApp status about hustle"
      );
    }

    await message.sendReply("_✍️ Writing for you..._");

    try {
      const prompt = `Write the following in a clear and engaging way: ${request}`;
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${POLLINATIONS_TXT}/${encodedPrompt}?model=openai`;

      const response = await axios.get(url, {
        timeout: 30000,
        headers: { "User-Agent": "AchekBot/3.0", Accept: "text/plain" },
      });

      const content = String(response.data).trim();
      if (!content) throw new Error("Empty response");

      await message.sendReply(`✍️ *AI Written Content*\n\n📝 *Request:* ${request}\n\n${content}`);
    } catch (e) {
      await message.sendReply("_❌ Writing failed. Please try again._");
    }
  }
);

Module(
  {
    pattern: "translate ?(.*)",
    fromMe: isPrivateMode,
    desc: "Translate text to any language using AI",
    usage: ".translate to French: I love this bot",
    use: "ai",
  },
  async (message, match) => {
    const input = match[1]?.trim();
    if (!input) {
      return await message.sendReply(
        "*Usage:* .translate to <language>: <text>\n\n" +
          "*Examples:*\n" +
          "• .translate to French: Good morning\n" +
          "• .translate to Yoruba: I am happy\n" +
          "• .translate to Spanish: How are you?"
      );
    }

    await message.sendReply("_🌍 Translating..._");

    try {
      const prompt = `Translate the following text accurately. Reply with only the translation, nothing else: ${input}`;
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${POLLINATIONS_TXT}/${encodedPrompt}?model=openai`;

      const response = await axios.get(url, {
        timeout: 20000,
        headers: { "User-Agent": "AchekBot/3.0", Accept: "text/plain" },
      });

      const translated = String(response.data).trim();
      if (!translated) throw new Error("Empty");

      await message.sendReply(
        `🌍 *Translation*\n\n📥 *Input:* ${input}\n\n📤 *Result:* ${translated}`
      );
    } catch (e) {
      await message.sendReply("_❌ Translation failed. Please try again._");
    }
  }
);

Module(
  {
    pattern: "roast ?(.*)",
    fromMe: isPrivateMode,
    desc: "Get the AI to roast someone (fun)",
    usage: ".roast @user or .roast [name]",
    use: "ai",
  },
  async (message, match) => {
    const target =
      match[1]?.trim() ||
      (message.mention?.[0]
        ? "@" + message.mention[0].split("@")[0]
        : "this person");

    await message.sendReply("_🔥 Cooking up a roast..._");

    try {
      const prompt = `Give me a funny, harmless, playful roast for someone named ${target}. Keep it light and fun, not offensive.`;
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${POLLINATIONS_TXT}/${encodedPrompt}?model=openai&seed=${Math.floor(Math.random() * 99999)}`;

      const response = await axios.get(url, {
        timeout: 20000,
        headers: { "User-Agent": "AchekBot/3.0", Accept: "text/plain" },
      });

      const roast = String(response.data).trim();
      await message.sendReply(
        `🔥 *Roast for ${target}*\n\n${roast}`,
        "text",
        { mentions: message.mention || [] }
      );
    } catch (e) {
      await message.sendReply("_❌ Roast failed. Please try again._");
    }
  }
);
