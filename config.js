const BOT_NAME_FANCY = '✦ 𝐊𝐀𝐃𝐈𝐘𝐀 𝐌𝐃 ✦';

const config = {
  AUTO_VIEW_STATUS: 'false',
  AUTO_LIKE_STATUS: 'true',
  AUTO_RECORDING: 'false',
  AUTO_VV_UNLOCK: 'false',
  AUTO_VV_UNLOCK_MODE: 'inbox', // 'inbox' = bot's own DM, 'direct' = back to the sender
  AUTO_ANTIDELETE: 'false',
  AUTO_ANTIDELETE_MODE: 'inbox', // 'inbox' = bot's own DM, 'chat' = back to the chat it was deleted from
  AUTO_LIKE_EMOJI: [
    '🔥','👍','❤️','💜','💙','💚','🧡','🤍','🖤',
    '💖','💗','💓','💞','💕','💝','💘','💟',
    '✨','🌟','💫','⚡','☀️','🌈','🌙','🌸','🌷','🌼','🌺','🌻',
    '🍓','🍒','🍎','🍉','🍇','🍰','🧁','🍭','🍬','🍫','🍩','🍪',
    '🐣','🐥','🐤','🐰','🐼','🐨','🦊','🧸','🐶','🐱','🐭',
    '🎀','🎁','🎈','🎉','🎊','💎','👑','🏆','🎶','🎵'
  ],
  PREFIX: '.',
  MAX_RETRIES: 3,

  GROUP_INVITE_LINK: '',
  CHANNEL_LINK: '',
  NEWSLETTER_JID: '120363399723529947@newsletter',

  OWNER_NUMBER: process.env.OWNER_NUMBER || '94763353368',
  OWNER_NAME: 'Isanka',

  OWNER_CONTACTS: [
    { name: 'Isanka 🖤 Owner', number: '94763353368' }
  ],

  BOT_NAME: 'KADIYA MD',
  BOT_VERSION: 'V1',
  BOT_FOOTER: 'ᴘᴏᴡᴇʀᴅ ʙʏ ᴋᴀᴅɪʏᴀ ᴍᴅ',

  RCD_IMAGE_PATH: 'https://files.catbox.moe/k8zvw2.jpg',
  IMAGE_PATH: 'https://files.catbox.moe/k8zvw2.jpg',
  BUTTON_IMAGES: {
    ALIVE: 'https://files.catbox.moe/k8zvw2.jpg'
  },

  OTP_EXPIRY: 300000,

  MODE: process.env.BOT_MODE || 'public'
};

const NEWSLETTER_CONTEXT = {
  forwardingScore: 1,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363399723529947@newsletter',
    newsletterName: '♡⸝⸝> ̫ <⸝⸝♡ 𝐊𝐚𝐝𝐢𝐲𝐚 𝐌ᴅ',
    serverMessageId: 999
  }
};

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://maliquotes6_db_user:FlDox4Qcie9JUzZ9@cluster0.bbsrc3v.mongodb.net/?appName=Cluster0';
const MONGO_DB = process.env.MONGO_DB || 'SAKURADB';

module.exports = {
  BOT_NAME_FANCY,
  config,
  NEWSLETTER_CONTEXT,
  MONGO_URI,
  MONGO_DB
};
