/*
  Auto-extracted & Upgraded for Kadiya-X-MD
  Exposes: song  (aliases: ytmp3, music, video, ytv, yta)
*/

let moment;
try { moment = require('moment-timezone'); } catch (e) {}

// ශ්‍රී ලංකාවේ වෙලාව ලබා ගැනීම
function getSriLankaTimestamp() {
  if (moment) return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss');
  return new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo' }).replace(',', '');
}

// Channel Context එක සකස් කිරීම (Visual bugs මඟහරවා ගැනීමට random id එකක් සමඟ)
function buildChannelContext(NEWSLETTER_CONTEXT, botName) {
  const newsletterJid = NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo?.newsletterJid || "120363302704235334@newsletter"; // අවශ්‍ය නම් ඔබේ Channel JID එක දාන්න
  return {
    forwardingScore: 1000,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid,
      newsletterName: botName,
      serverMessageId: Math.floor(100000 + Math.random() * 900000)
    }
  };
}

// අලංකාර Caption එකක් සකස් කිරීම
function buildCuteCaption(title, body, botName) {
  return `🌸✨ *${botName}* ✨🌸\n` +
    `━━━━◇ ${title} ◇━━━━\n\n` +
    `${body}\n\n` +
    `┊ ┊ ┊ ┊ ┊ 🌷\n` +
    `┊ ┊ ✧ ˚♡ ⋆｡\n` +
    `┊ ☾ ⋆ 🦋\n` +
    `✿ 𝑫𝒓𝒆𝒂𝒎 • 𝑪𝒓𝒆𝒂𝒕𝒆 • 𝑰𝒏𝒔𝒑𝒊𝒓𝒆 ✿\n` +
    `━━━━━━━━━━━━━━━`;
}

module.exports = {
  name: 'song',
  aliases: ["ytmp3", "music", "video", "ytv", "yta"],
  execute: async (ctx) => {
    const { socket, msg, sender, args, command, quoted, text, type, reply, axios } = ctx;
    
    // බොට්ගේ නම (ඔබට කැමති නමක් දිය හැක)
    const botName = "𝙆𝙖𝙙𝙞𝙮𝙖-𝙓-𝙈𝘿"; 

    try {
        const query = args.join(' ');
        if (!query) return reply("🎵 *කරුණාකර සින්දුවක නමක් හෝ YouTube ලින්ක් එකක් ලබා දෙන්න!*\n💡 උදා: `.song master sir` හෝ `.song <youtube link>`");

        try { await socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } }); } catch (_) {}

        // WhiteShadow YT APIs & Token
        const API_TOKEN = "aWK0z4"; 
        const YT_SEARCH_API = "https://whiteshadow-x-api.onrender.com/api/search/yt";
        
        let youtubeUrl = null;
        let songTitle = "Unknown Audio";
        let songThumb = "https://images.unsplash.com/photo-1614680376593-902f74fa0d41"; 
        let duration = "Unknown";
        let views = "Unknown";

        // 1. Check if input is a YouTube Link
        const regex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i;
        const match = query.match(regex);

        if (match) {
            youtubeUrl = match[0].trim();
            reply("🔗 _YouTube link detected. Fetching data from server..._");
            
            const searchRes = await axios.get(`${YT_SEARCH_API}?q=${encodeURIComponent(youtubeUrl)}&apitoken=${API_TOKEN}`);
            if (searchRes.data && searchRes.data.success && searchRes.data.result.length > 0) {
                songTitle = searchRes.data.result[0].title || songTitle;
                songThumb = searchRes.data.result[0].thumbnail || songThumb;
                duration = searchRes.data.result[0].duration || duration;
                views = searchRes.data.result[0].views || views;
            }
        } else {
            // It's a name search
            reply(`🔍 _Searching YouTube for: "${query}"..._`);
            const searchRes = await axios.get(`${YT_SEARCH_API}?q=${encodeURIComponent(query)}&apitoken=${API_TOKEN}`);

            if (searchRes.data && searchRes.data.success && searchRes.data.result.length > 0) {
                youtubeUrl = searchRes.data.result[0].url;
                songTitle = searchRes.data.result[0].title || songTitle;
                songThumb = searchRes.data.result[0].image || searchRes.data.result[0].thumbnail || songThumb;
                duration = searchRes.data.result[0].timestamp || searchRes.data.result[0].duration || duration;
                views = searchRes.data.result[0].views || views;
            }
        }

        if (!youtubeUrl) {
            try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
            return reply("❌ *Error:* සින්දුව හෝ වීඩියෝව සොයා ගැනීමට නොහැකි විය!");
        }

        // වත්මන් වෙලාව සහ Channel Context එක සකසා ගැනීම
        const timeString = getSriLankaTimestamp();
        const channelContext = buildChannelContext(msg.message?.extendedTextMessage?.contextInfo, botName);

        // ශරීර කොටස (Body) නිර්මාණය කිරීම
        const bodyContent = `📌 *Title:* ${songTitle}\n` +
                            `🕒 *Duration:* ${duration}\n` +
                            `👁️ *Views:* ${views}\n` +
                            `📅 *Time:* ${timeString}\n` +
                            `🔗 *URL:* ${youtubeUrl}\n\n` +
                            `*📥 බාගත කර ගැනීමට පහත අදාළ විධානය Copy කර Send කරන්න:* \n\n` +
                            `🎵 *Audio (MP3):* \n\`.download_audio ${youtubeUrl}\`\n\n` +
                            `🎥 *Video (MP4):* \n\`.download_video ${youtubeUrl}\`\n\n` +
                            `📂 *Document File:* \n\`.download_doc ${youtubeUrl}\``;

        // සම්පූර්ණ Caption එක Cute Style එකට සකස් කිරීම
        const finalCaption = buildCuteCaption('𝖸𝖮𝖴𝖳𝖴𝖡𝖤 𝖣𝖮𝖭𝖶𝖫𝖮𝖳𝖤𝖱', bodyContent, botName);

        // පණිවිඩය නිකුත් කිරීම (Image + Context Info සමඟ)
        await socket.sendMessage(sender, { 
            image: { url: songThumb }, 
            caption: finalCaption,
            contextInfo: channelContext
        }, { quoted: msg });

        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (e) {
        console.log("SONG CMD ERROR:", e);
        try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
        reply(`❌ *${botName} Internal Error:* ` + e.message);
    }
  }
};

