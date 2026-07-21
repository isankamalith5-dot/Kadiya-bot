/*
  High-Speed & Ultra-Stable Audio Download Command for Kadiya-X-MD
  Fixes:
   - Added Multiple API Fallbacks (If one API is dead, it auto-switches to another)
   - Fixed silent hangs (Reacting but not sending audio)
   - Improved Axios Error handling and Buffer Validation
*/

let moment;
try { moment = require('moment-timezone'); } catch (e) {}
const defaultAxios = require('axios'); // Added to ensure axios is always available

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
    `✿ 𝑫𝒓𝒆𝒂𝒎 • 𝑪𝒓𝒆𝒂𝒕𝒆 • 𝑰𝒏𝒔𝒑𝒊𝒓𝒆 ✿\n` +
    `━━━━━━━━━━━━━━━`;
}

// --- Search YouTube with Multiple API Fallbacks ---
async function searchYoutube(axios, query) {
    const isUrl = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i.test(query);
    const qUrl = encodeURIComponent(query);

    // API 1: Dark Yasiya (Very Stable)
    if (!isUrl) {
        try {
            const res = await axios.get(`https://www.dark-yasiya-api.site/search/yts?text=${qUrl}`, { timeout: 10000 });
            if (res.data?.result?.data?.[0]) {
                let d = res.data.result.data[0];
                return { url: d.url, title: d.title, thumb: d.thumbnail, duration: d.timestamp, views: d.views };
            }
        } catch (e) { console.log("Search API 1 Failed"); }
    }

    // API 2: Whiteshadow (Original Fallback)
    try {
        const API_TOKEN = "aWK0z4";
        const res = await axios.get(`https://whiteshadow-x-api.onrender.com/api/search/yt?q=${qUrl}&apitoken=${API_TOKEN}`, { timeout: 10000 });
        if (res.data?.result?.[0]) {
            let d = res.data.result[0];
            return { url: (d.url || query), title: d.title, thumb: (d.image || d.thumbnail), duration: (d.timestamp || d.duration), views: d.views };
        }
    } catch (e) { console.log("Search API 2 Failed"); }

    return null; // Both failed
}

// --- Multiple Download APIs to ensure it never fails ---
async function resolveDownloadUrl(axios, youtubeUrl) {
    const encodedUrl = encodeURIComponent(youtubeUrl);
    
    const apis = [
        `https://www.dark-yasiya-api.site/download/ytmp3?url=${encodedUrl}`,
        `https://api.siputzx.my.id/api/d/ytmp3?url=${encodedUrl}`,
        `https://api.dreaded.site/api/ytdl/audio?url=${encodedUrl}`
    ];

    for (let i = 0; i < apis.length; i++) {
        try {
            const res = await axios.get(apis[i], { timeout: 15000 });
            const data = res.data;
            // Try all known URL paths in JSON responses
            const url = data?.result?.dl_link || data?.data?.dl || data?.result?.audioUrl || data?.dl || data?.url;
            
            if (url && url.startsWith("http")) return url;
        } catch (err) {
            console.log(`Download API ${i + 1} Failed:`, err.message);
        }
    }
    return null;
}

// --- Download Buffer securely ---
async function fetchAudioBuffer(axios, audioUrl) {
  const res = await axios.get(audioUrl, {
    responseType: 'arraybuffer',
    timeout: 60000, // 1 minute max download time
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    }
  });

  const contentType = res.headers['content-type'] || '';
  const buffer = Buffer.from(res.data);

  if (contentType.includes('text/html') || contentType.includes('application/json')) {
    throw new Error(`Download API returned an Error Page instead of Audio.`);
  }
  if (!buffer || buffer.length < 50000) { // 50KB minimum for an audio file
    throw new Error(`Downloaded file is corrupted or too small (${buffer?.length || 0} bytes).`);
  }

  return buffer;
}

module.exports = {
  name: 'mp3',
  aliases: ["ytmp3", "music", "video", "ytv", "yta"],
  execute: async (ctx) => {
    // Some Baileys bases don't pass axios properly, so we use defaultAxios as a fallback
    const { socket, msg, sender, args, reply } = ctx;
    const axios = ctx.axios || defaultAxios; 
    const botName = "𝙆𝙖𝙙𝙞𝙮𝙖-𝙓-𝙈𝘿";

    try {
      const query = args.join(' ');
      if (!query) return reply("🎵 *කරුණාකර සින්දුවක නමක් හෝ YouTube ලින්ක් එකක් ලබා දෙන්න!*");

      socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } }).catch(() => {});

      // 1. ROBUST SEARCH
      const songData = await searchYoutube(axios, query);

      if (!songData || !songData.url) {
        socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }).catch(() => {});
        return reply("❌ *Error:* සින්දුව සොයා ගැනීමට නොහැකි විය. Server එක කාර්යබහුලයි, නැවත උත්සාහ කරන්න.");
      }

      const { url: youtubeUrl, title: songTitle, thumb: songThumb } = songData;
      const channelContext = buildChannelContext(msg.message?.extendedTextMessage?.contextInfo, botName);

      // 2. SEND DETAILS CARD
      const bodyContent = `📌 *Title:* ${songTitle || "Unknown"}\n` +
        `🔗 *URL:* ${youtubeUrl}\n\n` +
        `*⬇️ සින්දුව භාගත වෙමින් පවතී. කරුණාකර රැඳී සිටින්න...*`;

      const finalCaption = buildCuteCaption('𝖸𝖮𝖴𝖳𝖴𝖡𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣𝖤𝖱', bodyContent, botName);

      // We send the image without blocking the main thread too long
      await socket.sendMessage(sender, {
        image: { url: songThumb || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41" },
        caption: finalCaption,
        contextInfo: channelContext
      }, { quoted: msg }).catch(()=>{});

      socket.sendMessage(sender, { react: { text: '⬇️', key: msg.key } }).catch(() => {});

      // 3. SECURE AUDIO DOWNLOAD
      try {
        const audioDownloadUrl = await resolveDownloadUrl(axios, youtubeUrl);
        if (!audioDownloadUrl) {
          throw new Error('All Download APIs failed. The server might be down.');
        }

        const audioBuffer = await fetchAudioBuffer(axios, audioDownloadUrl);

        await socket.sendMessage(sender, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${songTitle || 'Kadiya-X-Music'}.mp3`,
          contextInfo: channelContext
        }, { quoted: msg });

        socket.sendMessage(sender, { react: { text: '🎧', key: msg.key } }).catch(() => {});
      } catch (dlError) {
        console.log("AUDIO DOWNLOAD ERROR:", dlError.message);
        reply("❌ *සමාවෙන්න, සින්දුව Download කිරීමේදී දෝෂයක් ඇති විය.* \n(හේතුව: " + dlError.message + ")\n\n_කරුණාකර වෙනත් සින්දුවක් උත්සාහ කරන්න._");
        socket.sendMessage(sender, { react: { text: '⚠️', key: msg.key } }).catch(() => {});
      }

    } catch (e) {
      console.log("SONG CMD FATAL ERROR:", e);
      socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }).catch(() => {});

      if (e.code === 'ECONNABORTED' || e.message.includes('timeout')) {
        reply("❌ *Error:* API එකෙන් ප්‍රතිචාරයක් දැක්වීමට බොහෝ වේලාවක් ගත විය. කරුණාකර නැවත උත්සාහ කරන්න.");
      } else {
        reply(`❌ *${botName} Error:* ` + e.message);
      }
    }
  }
};

