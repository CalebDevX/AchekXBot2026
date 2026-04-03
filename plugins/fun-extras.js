const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const isPrivate = config.MODE === "private";

const DARES = [
  "Send a screenshot of your last 5 messages! 📱",
  "Let someone write your status for the next hour! ✍️",
  "Call a random contact and sing them a song! 🎵",
  "Change your profile picture to something funny for 30 minutes! 😂",
  "Send a voice note saying 3 things you love about yourself! 💙",
  "Do 20 pushups and confirm when done! 💪",
  "Text your crush saying 'hey' and screenshot the reply! ❤️",
  "Post a funny selfie as your status! 🤳",
  "Speak in an accent for the next 10 minutes! 🗣️",
  "Tell the group your most embarrassing moment! 🙈",
  "Share your last 5 Google searches! 🔍",
  "Dance and send a video! 💃",
  "Do your best impression of someone in the group! 🎭",
  "Post a story saying 'I just lost a bet' for 1 hour! 📣",
  "Record yourself telling a joke! 😄",
  "Send a good morning voice note to 5 contacts! 🌅",
  "Type everything with your eyes closed for the next 5 messages! 👀",
  "Reveal the last person you searched on Instagram! 👤",
  "Call someone and say 'I need to tell you something important' then stay silent! 😂",
  "Send a heart emoji to every person in your contact list! ❤️",
];

const TRUTHS_LIST = [
  "What is your biggest fear? 😱",
  "What's the most embarrassing thing that's happened to you? 😳",
  "Have you ever lied to your best friend? 🤥",
  "Who was your first crush? 💘",
  "What is a secret you've never told anyone? 🤫",
  "What's the most childish thing you still do? 🧸",
  "Have you ever cheated on a test? 📝",
  "What's the worst thing you've ever done and gotten away with? 😈",
  "What's one thing you wish you could change about yourself? 🌟",
  "Have you ever blamed someone else for something you did? 🫣",
  "What's your biggest insecurity? 💭",
  "Have you ever talked badly about a friend behind their back? 🗣️",
  "What's the most money you've ever spent on something silly? 💸",
  "Have you ever had a crush on a teacher? 😅",
  "What's the most embarrassing song on your playlist? 🎵",
  "Have you ever forgotten an important date like a birthday? 😬",
  "What is your most used emoji and why? 📱",
  "What's the weirdest dream you've ever had? 💤",
  "Have you ever read someone else's messages without them knowing? 👀",
  "What's something you pretend to like but actually hate? 🎭",
];

const JOKES = [
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything! 😄" },
  { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field! 🌾" },
  { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up! 🥚" },
  { setup: "What do you call a fake noodle?", punchline: "An impasta! 🍝" },
  { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired! 🚲" },
  { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese! 🧀" },
  { setup: "Why can't Elsa have a balloon?", punchline: "Because she'll let it go! 🎈" },
  { setup: "What do you call a sleeping dinosaur?", punchline: "A dino-snore! 🦕" },
  { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems! 📚" },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh! 🐟" },
];

const COMPLIMENTS = [
  "You're absolutely amazing! ✨",
  "Your smile could light up an entire room! 😊",
  "You make the world a better place just by being in it! 🌍",
  "You're even better than a unicorn! 🦄",
  "You have an incredible heart! 💙",
  "You're a genius! Your creativity is off the charts! 🧠",
  "You're someone's reason to smile today! 😄",
  "You have the best laugh in the room! 😂",
  "You're stronger than you know! 💪",
  "You're more helpful than you realize! 🤝",
  "Your kindness is contagious! 🌸",
  "You have such a great sense of humor! 😆",
  "You're really something special! ⭐",
  "Your perspective on things is genuinely refreshing! 🌈",
  "You make everything look effortless! 🌟",
];

const INSULTS = [
  "You're proof that even Wi-Fi has dead zones 📶",
  "If brains were petrol, you wouldn't have enough to power an ant's motorcycle 🏍️",
  "You're like a cloud ☁️ — when you disappear, it's a beautiful day!",
  "You're not stupid, you just have bad luck thinking! 🧠",
  "I'd agree with you, but then we'd both be wrong 🤷",
  "You're like a software update — whenever I see you I think 'not now' 💻",
  "Some people bring happiness wherever they go. You bring it whenever you go! 👋",
  "I'd call you a tool, but even tools are useful 🔧",
  "You have your entire life to be an idiot... why waste today? ⏰",
  "I was going to give you a nasty look, but I see you already have one 😏",
];

Module(
  {
    pattern: "dare",
    desc: "Get a random dare challenge",
    use: "fun",
  },
  async (message, match) => {
    const dare = DARES[Math.floor(Math.random() * DARES.length)];
    await message.sendReply(`🎲 *DARE:*\n\n${dare}`);
  }
);

Module(
  {
    pattern: "truth",
    desc: "Get a random truth question",
    use: "fun",
  },
  async (message, match) => {
    const truth = TRUTHS_LIST[Math.floor(Math.random() * TRUTHS_LIST.length)];
    await message.sendReply(`🎯 *TRUTH:*\n\n${truth}`);
  }
);

Module(
  {
    pattern: "tod",
    desc: "Truth or Dare — pick one!",
    use: "fun",
  },
  async (message, match) => {
    const arg = (match[1] || "").trim().toLowerCase();
    if (arg === "truth" || arg === "t") {
      const truth = TRUTHS_LIST[Math.floor(Math.random() * TRUTHS_LIST.length)];
      await message.sendReply(`🎯 *TRUTH:*\n\n${truth}`);
    } else if (arg === "dare" || arg === "d") {
      const dare = DARES[Math.floor(Math.random() * DARES.length)];
      await message.sendReply(`🎲 *DARE:*\n\n${dare}`);
    } else {
      await message.sendReply(
        `*Truth or Dare?*\n\nUsage:\n• \`.tod truth\` — get a truth question\n• \`.tod dare\` — get a dare challenge`
      );
    }
  }
);

Module(
  {
    pattern: "joke",
    desc: "Get a random joke",
    use: "fun",
  },
  async (message, match) => {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    await message.sendReply(`😂 *JOKE:*\n\n${joke.setup}\n\n🥁 ${joke.punchline}`);
  }
);

Module(
  {
    pattern: "compliment ?(.*)",
    desc: "Give someone a compliment",
    use: "fun",
  },
  async (message, match) => {
    const compliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
    const mentioned = message.mention;
    if (mentioned && mentioned.length > 0) {
      const tag = `@${mentioned[0].split("@")[0]}`;
      await message.client.sendMessage(
        message.jid,
        { text: `💌 ${tag}\n\n${compliment}`, mentions: mentioned },
        { quoted: message.data }
      );
    } else {
      await message.sendReply(`💌 ${compliment}`);
    }
  }
);

Module(
  {
    pattern: "insult ?(.*)",
    desc: "Send a playful (funny) insult",
    use: "fun",
    fromMe: isPrivate,
  },
  async (message, match) => {
    const line = INSULTS[Math.floor(Math.random() * INSULTS.length)];
    const mentioned = message.mention;
    if (mentioned && mentioned.length > 0) {
      const tag = `@${mentioned[0].split("@")[0]}`;
      await message.client.sendMessage(
        message.jid,
        { text: `😈 ${tag} — ${line}`, mentions: mentioned },
        { quoted: message.data }
      );
    } else {
      await message.sendReply(`😈 ${line}`);
    }
  }
);

Module(
  {
    pattern: "flirt ?(.*)",
    desc: "Get a random flirty pickup line",
    use: "fun",
  },
  async (message, match) => {
    const lines = [
      "Are you a magician? Because whenever I look at you, everyone else disappears. 😍",
      "Do you have a map? I just got lost in your eyes. 🗺️",
      "Is your name Google? Because you have everything I've been searching for. 🔍",
      "Are you a parking ticket? Because you've got 'fine' written all over you. 😏",
      "Do you believe in love at first text? 💬",
      "If you were a vegetable, you'd be a cute-cumber! 🥒😄",
      "Are you a bank loan? Because you've got my interest! 💰",
      "Do you like Star Wars? Because Yoda one for me! ⭐",
      "Are you a camera? Every time I look at you, I smile! 📸",
      "Is it hot in here, or is it just you? 🔥",
    ];
    const line = lines[Math.floor(Math.random() * lines.length)];
    const mentioned = message.mention;
    if (mentioned && mentioned.length > 0) {
      const tag = `@${mentioned[0].split("@")[0]}`;
      await message.client.sendMessage(
        message.jid,
        { text: `💘 ${tag}\n\n${line}`, mentions: mentioned },
        { quoted: message.data }
      );
    } else {
      await message.sendReply(`💘 ${line}`);
    }
  }
);

Module(
  {
    pattern: "ship ?(.*)",
    desc: "Ship two people together! 💕",
    use: "fun",
  },
  async (message, match) => {
    try {
      const mentioned = message.mention;
      let personA = null;
      let personB = null;

      const ctx = message.data?.message?.extendedTextMessage?.contextInfo || {};

      if (mentioned && mentioned.length >= 2) {
        personA = mentioned[0];
        personB = mentioned[1];
      } else if (mentioned && mentioned.length === 1) {
        personA = mentioned[0];
        personB = message.sender;
      } else if (ctx.participant) {
        personA = ctx.participant;
        personB = message.sender;
      } else if (message.isGroup) {
        const meta = await message.client.groupMetadata(message.jid);
        const participants = meta.participants
          .map((p) => p.id)
          .filter((id) => id !== message.client.user?.id);
        if (participants.length >= 2) {
          const shuffled = participants.sort(() => Math.random() - 0.5);
          personA = shuffled[0];
          personB = shuffled[1];
        } else {
          return message.sendReply("❌ Not enough members to ship!");
        }
      } else {
        return message.sendReply(
          "Usage: `.ship @user1 @user2` or use in a group!"
        );
      }

      const tagA = `@${personA.split("@")[0]}`;
      const tagB = `@${personB.split("@")[0]}`;

      const seed = (personA + personB)
        .split("")
        .reduce((s, c) => s + c.charCodeAt(0), 0);
      const love = Math.abs((seed * 7 + Math.floor(Math.random() * 15)) % 101);

      const bar = "❤️".repeat(Math.round(love / 10)) + "🖤".repeat(10 - Math.round(love / 10));

      const comment =
        love >= 85
          ? "Perfect match! 💍"
          : love >= 65
          ? "Very compatible! 💕"
          : love >= 45
          ? "Good potential! 💛"
          : love >= 25
          ? "Needs some work! 💙"
          : "Terrible match... 💔";

      const text =
        `💞 *SHIP RESULT*\n\n` +
        `${tagA} + ${tagB}\n\n` +
        `${bar}\n\n` +
        `❤️ *${love}% Love Match*\n` +
        `📝 ${comment}`;

      await message.client.sendMessage(
        message.jid,
        { text, mentions: [personA, personB] },
        { quoted: message.data }
      );
    } catch (e) {
      await message.sendReply(`❌ Error: ${e.message}`);
    }
  }
);

Module(
  {
    pattern: "gayrate ?(.*)",
    desc: "Check someone's gay percentage (just for fun!)",
    use: "fun",
  },
  async (message, match) => {
    const mentioned = message.mention;
    const ctx = message.data?.message?.extendedTextMessage?.contextInfo || {};
    let targetId = null;

    if (mentioned && mentioned.length > 0) targetId = mentioned[0];
    else if (ctx.participant) targetId = ctx.participant;
    else targetId = message.sender;

    const tag = `@${(targetId || message.sender).split("@")[0]}`;

    const base = (targetId || message.sender)
      .split("")
      .reduce((s, c) => s + c.charCodeAt(0), 0);
    const percent =
      ((base % 101) + Math.floor(Math.random() * 7)) % 101;

    const bar =
      "🌈".repeat(Math.round(percent / 10)) +
      "⬛".repeat(10 - Math.round(percent / 10));

    const comment =
      percent >= 90
        ? "100% certified icon! 👑"
        : percent >= 70
        ? "Very fabulous! ✨"
        : percent >= 50
        ? "Somewhat colourful! 🎨"
        : percent >= 25
        ? "Just a hint 😏"
        : "Straight as a ruler 📏";

    const text =
      `🌈 *Gay Rate Check*\n\n` +
      `${tag}\n\n` +
      `${bar}\n\n` +
      `✨ *${percent}%*\n` +
      `📝 ${comment}`;

    await message.client.sendMessage(
      message.jid,
      { text, mentions: [targetId] },
      { quoted: message.data }
    );
  }
);

const activeBombGames = new Map();

Module(
  {
    pattern: "bomb",
    desc: "Play the Bomb game! Find the safe boxes.",
    use: "fun",
  },
  async (message, match) => {
    const sender = message.sender;

    if (activeBombGames.has(sender)) {
      return message.sendReply(
        "⚠️ You already have an active game! Send a number 1-9 to play, or type *stop* to quit."
      );
    }

    const positions = Array.from({ length: 9 }, (_, i) => i + 1);
    const bombPos = Math.floor(Math.random() * 9);
    const board = positions.map((pos, i) => ({
      position: pos,
      emot: i === bombPos ? "💥" : "✅",
      opened: false,
      number: `[${pos}]`,
    }));

    const gameData = {
      board,
      sender,
      chatJid: message.jid,
    };

    activeBombGames.set(sender, gameData);

    const timeout = setTimeout(() => {
      if (activeBombGames.has(sender)) {
        activeBombGames.delete(sender);
        message.client
          .sendMessage(message.jid, {
            text: `⏰ @${sender.split("@")[0]} your bomb game timed out!`,
            mentions: [sender],
          })
          .catch(() => {});
      }
    }, 3 * 60 * 1000);

    gameData.timeout = timeout;

    let grid = "┌─────────────────┐\n";
    for (let r = 0; r < 3; r++) {
      grid += "│  ";
      for (let c = 0; c < 3; c++) {
        grid += board[r * 3 + c].number + " ";
      }
      grid += "│\n";
    }
    grid += "└─────────────────┘";

    const text =
      `💣 *BOMB GAME*\n\n` +
      `Pick a box from 1-9. One box has a bomb!\n` +
      `Open all safe boxes to WIN!\n\n` +
      `${grid}\n\n` +
      `Send a number *1–9* to open a box.\n` +
      `Type *stop* to quit.`;

    await message.sendReply(text);
  }
);

Module(
  {
    on: "text",
    fromMe: false,
    excludeFromCommands: true,
  },
  async (message, match) => {
    const sender = message.sender;
    if (!activeBombGames.has(sender)) return;

    const text = (message.text || "").trim().toLowerCase();
    const game = activeBombGames.get(sender);

    if (text === "stop" || text === "quit" || text === "suren") {
      clearTimeout(game.timeout);
      activeBombGames.delete(sender);
      const bomb = game.board.find((b) => b.emot === "💥");
      return message.sendReply(
        `🏳️ You gave up! The bomb was in box *${bomb.position}*! 💥`
      );
    }

    const num = parseInt(text);
    if (isNaN(num) || num < 1 || num > 9) return;

    const box = game.board.find((b) => b.position === num);
    if (!box || box.opened) return;

    box.opened = true;

    if (box.emot === "💥") {
      clearTimeout(game.timeout);
      activeBombGames.delete(sender);
      let result = "┌─────────────────┐\n";
      for (let r = 0; r < 3; r++) {
        result += "│  ";
        for (let c = 0; c < 3; c++) {
          result += game.board[r * 3 + c].emot + " ";
        }
        result += "│\n";
      }
      result += "└─────────────────┘";
      return message.sendReply(
        `💥 *BOOM!* You hit the bomb!\n\n${result}\n\nBetter luck next time!`
      );
    }

    const safeBoxes = game.board.filter((b) => b.emot === "✅");
    const openedSafe = safeBoxes.filter((b) => b.opened);

    if (openedSafe.length === safeBoxes.length) {
      clearTimeout(game.timeout);
      activeBombGames.delete(sender);
      return message.sendReply(
        `🎉 *YOU WIN!* You found all the safe boxes!\n\nCongrats! 🏆`
      );
    }

    let grid = "┌─────────────────┐\n";
    for (let r = 0; r < 3; r++) {
      grid += "│  ";
      for (let c = 0; c < 3; c++) {
        const b = game.board[r * 3 + c];
        grid += (b.opened ? b.emot : b.number) + " ";
      }
      grid += "│\n";
    }
    grid += "└─────────────────┘";

    await message.sendReply(
      `✅ Box ${num} is safe!\n\n${grid}\n\nKeep going! Send 1-9 to continue.`
    );
  }
);

Module(
  {
    pattern: "meme",
    desc: "Get a random meme from Reddit",
    use: "fun",
  },
  async (message, match) => {
    try {
      await message.react("⏳");
      const res = await axios.get("https://meme-api.com/gimme", {
        timeout: 10000,
      });
      const meme = res.data;
      if (!meme || !meme.url) throw new Error("No meme found");

      await message.sendMessage(
        { url: meme.url },
        "image",
        { caption: `😂 *${meme.title}*\n\n📌 r/${meme.subreddit}` }
      );
      await message.react("😂");
    } catch (e) {
      await message.react("❌");
      await message.sendReply(`❌ Couldn't fetch meme: ${e.message}`);
    }
  }
);
