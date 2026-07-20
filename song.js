/*
  Optimized & High-Speed Song Command for Kadiya-X-MD
*/

let moment;
try { moment = require('moment-timezone'); } catch (e) {}

function getSriLankaTimestamp() {
  if (moment) return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss');
  return new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo' }).replace(',', '');
}

function buildChannelContext(NEWSLETTER_CONTEXT, botName) {
  const newsletterJid = NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo?.newsletterJid || "120363302704235334@newsletter";
  return {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid,
      newsletterName: botName,
      serverMessageId: Math.floor(100000 + Math.random() * 900000)
    }
  };
}

function buildCuteCaption(title, body, botName) {
  return `🌸✨ *${botName}* ✨🌸\n` +
    `━━━━◇ ${title} ◇━━━━\n\n` +
    `${body}\n\n` +
    `┊ ┊ ┊ ┊ ┊ 🌷\n` +
    `┊ ┊ ✧ ˚♡ ⋆｡\n` +
    `┊ ☾ ⋆ 🦋\n` +
    `✿ 𝑫𝒓𝒆𝒂𝒎 • 𝑪𝒓𝒆𝒂𝒕 cradle • 𝑰𝒏𝒔𝒑𝒊𝒓𝒆 ✿\n` +
    `━━━━━━━━━━━━━━━`;
}

module.exports = {
  name: 'song',
  aliases: ["ytmp3", "music", "video", "ytv", "yta"],
  execute: async (ctx) => {
    const { socket, msg, sender, args, reply, axios } = ctx;
    const botName = "𝙆𝙖𝙙𝙞𝙮𝙖-𝙓-𝙈𝘿"; 

    try {
        const query = args.join(' ');
        if (!query) return reply("🎵 *කරුණාකර සින්දුවක නමක් හෝ YouTube ලින්ක් එකක් ලබා දෙන්න!*");

        // React එක background එකේ වෙන්න දීලා ඊළඟ පියවරට ඉක්මනින් යනවා (Speed Up)
        socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } }).catch Margined => {};

        const API_TOKEN = "aWK0z4"; 
        const YT_SEARCH_API = "https://whiteshadow-x-api.onrender.com/api/search/yt";
        
        let youtubeUrl = null;
        let songTitle = "Unknown Audio";
        let songThumb = "https://images.unsplash.com/photo-1614680376593-902f74fa0d41"; 
        let duration = "Unknown";
        let views = "Unknown";

        const regex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i;
        const match = query.match(regex);
        
        // API Request එක තත්පර 15 කින් Timeout වෙන්න සකසා ඇත (Bot එක හිරවීම වැළැක්වීමට)
        const axiosConfig = { timeout: 15000 }; 
        let searchRes;

        if (match) {
            youtubeUrl = match[0].trim();
            searchRes = await axios.get(`${YT_SEARCH_API}?q=${encodeURIComponent(youtubeUrl)}&apitoken=${API_TOKEN}`, axiosConfig);
        } else {
            searchRes = await axios.get(`${YT_SEARCH_API}?q=${encodeURIComponent(query)}&apitoken=${API_TOKEN}`, axiosConfig);
        }

        if (searchRes.data && searchRes.data.success && searchRes.data.result?.length > 0) {
            const res = searchRes.data.result[0];
            youtubeUrl = res.url || youtubeUrl;
            songTitle = res.title || songTitle;
            songThumb = res.image || res.thumbnail || songThumb;
            duration = res.timestamp || res.duration || duration;
            views = res.views || views;
        }

        if (!youtubeUrl) {
            socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }).catch(_=>{});
            return reply("❌ *Error:* සින්දුව සොයා ගැනීමට නොහැකි විය. API Server එක Offline විය හැක!");
        }

        const timeString = getSriLankaTimestamp();
        const channelContext = buildChannelContext(msg.message?.extendedTextMessage?.contextInfo, botName);

        const bodyContent = `📌 *Title:* ${songTitle}\n` +
                            `🕒 *Duration:* ${duration}\n` +
                            `👁️ *Views:* ${views}\n` +
                            `📅 *Time:* ${timeString}\n` +
                            `🔗 *URL:* ${youtubeUrl}\n\n` +
                            `*📥 බාගත කර ගැනීමට විධානය Copy කර Send කරන්න:* \n\n` +
                            `🎵 *Audio:* \`.download_audio ${youtubeUrl}\`\n` +
                            `🎥 *Video:* \`.download_video ${youtubeUrl}\``;

        const finalCaption = buildCuteCaption('𝖸𝖮𝖴𝖳𝖴𝖡𝖤 𝖣𝖮𝖭𝖶𝖫𝖮𝖳𝖤𝖱', bodyContent, botName);

        // පණිවිඩය යැවීම
        await socket.sendMessage(sender, { 
            image: { url: songThumb }, 
            caption: finalCaption,
            contextInfo: channelContext
        }, { quoted: msg });

        socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }).catch(_=>{});

    } catch (e) {
        console.log("SONG CMD ERROR:", e);
        socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }).catch(_=>{});
        
        if (e.code === 'ECONNABORTED') {
            reply("❌ *Error:* API එකෙන් ප්‍රතිචාරයක් දැක්වීමට බොහෝ වේලාවක් ගත විය. නැවත උත්සාහ කරන්න.");
        } else {
            reply(`❌ *${botName} Error:* ` + e.message);
        }
    }
  }
};

