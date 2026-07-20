/*
  Direct Audio Download Song Command for Kadiya-X-MD
  Fixed version:
   - Downloads audio as a Buffer instead of passing a raw remote URL to socket.sendMessage
     (fixes "reacts show but audio never arrives" — WhatsApp's own fetcher often can't
     resolve the CDN redirect / expiring token that free download APIs return).
   - Adds a fallback download API if the primary one fails or returns an unexpected shape.
   - Adds content-type / size sanity checks so broken responses fail fast with a clear error
     instead of silently producing a 0-byte "audio".
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
    `✿ 𝑫𝒓𝒆𝒂𝒎 • 𝑪𝒓𝒆𝒂𝒕𝒆 • 𝑰𝒏𝒔𝒑𝒊𝒓𝒆 ✿\n` +
    `━━━━━━━━━━━━━━━`;
}

// --- Try several known download-API response shapes so a format change doesn't break everything ---
function extractAudioUrl(data) {
  if (!data) return null;
  return (
    data?.data?.dl ||
    data?.data?.url ||
    data?.result?.dl ||
    data?.result?.url ||
    data?.dl ||
    data?.url ||
    null
  );
}

// --- Download the actual audio bytes ourselves instead of handing WhatsApp a remote URL ---
async function fetchAudioBuffer(axios, audioUrl) {
  const res = await axios.get(audioUrl, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    }
  });

  const contentType = res.headers['content-type'] || '';
  const buffer = Buffer.from(res.data);

  // Sanity check: some APIs return an HTML/JSON error page with a 200 status
  if (contentType.includes('text/html') || contentType.includes('application/json')) {
    throw new Error(`Unexpected content-type from download host: ${contentType}`);
  }
  if (!buffer || buffer.length < 2000) {
    throw new Error(`Downloaded file too small (${buffer?.length || 0} bytes) — likely an error page, not audio`);
  }

  return buffer;
}

// --- Try primary API, then fallback API, returning a direct download URL ---
async function resolveDownloadUrl(axios, youtubeUrl) {
  // Primary: siputzx
  try {
    const primaryUrl = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const dlRes = await axios.get(primaryUrl, { timeout: 30000 });
    const found = extractAudioUrl(dlRes.data);
    if (found) return found;
    console.log('Primary API returned unexpected shape:', JSON.stringify(dlRes.data)?.slice(0, 300));
  } catch (err) {
    console.log('Primary download API failed:', err.message);
  }

  // Fallback: another public ytmp3 API (swap in whichever you have a working key/base for)
  try {
    const fallbackUrl = `https://api.siputzx.my.id/api/d/youtube/mp3?url=${encodeURIComponent(youtubeUrl)}`;
    const dlRes2 = await axios.get(fallbackUrl, { timeout: 30000 });
    const found2 = extractAudioUrl(dlRes2.data);
    if (found2) return found2;
    console.log('Fallback API returned unexpected shape:', JSON.stringify(dlRes2.data)?.slice(0, 300));
  } catch (err) {
    console.log('Fallback download API failed:', err.message);
  }

  return null;
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

      socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } }).catch(() => {});

      // 1. SEARCH
      const API_TOKEN = "aWK0z4";
      const YT_SEARCH_API = "https://whiteshadow-x-api.onrender.com/api/search/yt";

      let youtubeUrl = null;
      let songTitle = "Unknown Audio";
      let songThumb = "https://images.unsplash.com/photo-1614680376593-902f74fa0d41";

      const regex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i;
      const match = query.match(regex);
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
      }

      if (!youtubeUrl) {
        socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }).catch(() => {});
        return reply("❌ *Error:* සින්දුව සොයා ගැනීමට නොහැකි විය.");
      }

      const channelContext = buildChannelContext(msg.message?.extendedTextMessage?.contextInfo, botName);

      // 2. SEND DETAILS CARD
      const bodyContent = `📌 *Title:* ${songTitle}\n` +
        `🔗 *URL:* ${youtubeUrl}\n\n` +
        `*⬇️ සින්දුව භාගත වෙමින් පවතී. කරුණාකර රැඳී සිටින්න...*`;

      const finalCaption = buildCuteCaption('𝖸𝖮𝖴𝖳𝖴𝖡𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣𝖤𝖱', bodyContent, botName);

      await socket.sendMessage(sender, {
        image: { url: songThumb },
        caption: finalCaption,
        contextInfo: channelContext
      }, { quoted: msg });

      socket.sendMessage(sender, { react: { text: '⬇️', key: msg.key } }).catch(() => {});

      // 3. DOWNLOAD + SEND AUDIO (as Buffer, not remote URL)
      try {
        const audioDownloadUrl = await resolveDownloadUrl(axios, youtubeUrl);
        if (!audioDownloadUrl) {
          throw new Error('No working download API returned a valid audio URL.');
        }

        const audioBuffer = await fetchAudioBuffer(axios, audioDownloadUrl);

        await socket.sendMessage(sender, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${songTitle}.mp3`,
          contextInfo: channelContext
        }, { quoted: msg });

        socket.sendMessage(sender, { react: { text: '🎧', key: msg.key } }).catch(() => {});
      } catch (dlError) {
        console.log("AUDIO DOWNLOAD ERROR:", dlError.message);
        reply("❌ *සමාවෙන්න, සින්දුව Download කිරීමේදී දෝෂයක් ඇති විය. (API Error)*\n" + dlError.message);
        socket.sendMessage(sender, { react: { text: '⚠️', key: msg.key } }).catch(() => {});
      }

    } catch (e) {
      console.log("SONG CMD ERROR:", e);
      socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }).catch(() => {});

      if (e.code === 'ECONNABORTED') {
        reply("❌ *Error:* API එකෙන් ප්‍රතිචාරයක් දැක්වීමට බොහෝ වේලාවක් ගත විය.");
      } else {
        reply(`❌ *${botName} Error:* ` + e.message);
      }
    }
  }
};
