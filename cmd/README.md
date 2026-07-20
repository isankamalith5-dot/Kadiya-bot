# cmd/ — Plugin Commands (auto-loaded)

අලුත් command එකක් add කරන්න ඕන නම්, මේ folder එකේ (category එකට ගැලපෙන
sub-folder එකේ) `.js` file එකක් දාන්නම ඇති. `sakura.js` එක edit කරන්නවත්,
`.menu` එක edit කරන්නවත් අවශ්‍ය නෑ — bot එක restart වුනාම ඒක auto detect
වෙලා, `.menu` එකේ අදාල category එකට auto add වෙනවා.

## Folders = Menu Categories

| Folder          | .menu Category         |
|------------------|-------------------------|
| `cmd/main/`      | 1 ┊ 📋 MAIN MENU        |
| `cmd/download/`  | 2 ┊ 📥 DOWNLOAD MENU    |
| `cmd/owner/`     | 3 ┊ 👑 OWNER MENU       |
| `cmd/other/`     | 4 ┊ 🌙 OTHER MENU       |

## Command file එකක shape එක

```js
module.exports = {
  name: 'hello',              // .hello ලෙස type කරන්න ඕන නම
  aliases: ['hi'],            // (optional) .hi ලෙසත් වැඩ කරයි
  category: 'main',           // 'main' | 'download' | 'owner' | 'other'
  description: 'Say hello',   // .menu එකේ පේන විස්තරය
  ownerOnly: false,           // true කළොත් owner ට විතරයි වැඩ කරන්නේ

  execute: async (ctx) => {
    const { reply, q, sender, socket, msg } = ctx;
    await reply(`Hello! You said: ${q}`);
  }
};
```

## `ctx` (execute function එකට එන object එක)

- `socket` — මේ session එකේ Baileys socket එක
- `msg` — ආපු raw message එක
- `sender` — reply කරන්න ඕන jid එක (@lid resolve වෙලා)
- `number` — මේ session එකේ number එක
- `command` — user type කරපු command word එක (lowercase)
- `args` — command එකෙන් පස්සේ තියෙන words array එකක් විදිහට
- `q` — args ටික string එකක් විදිහට join කරලා
- `prefix` — bot එකේ command prefix එක (උදා: `.`)
- `reply(text)` — quote-reply එකක් සරලව එවන්න
- `sessionConfig` — මේ session එකේ settings (Mongo එකෙන්)
- `isGroup` — group chat එකක්ද කියලා
- `senderNumber` — actual message එව්ව කෙනාගේ number එක

## New command එකක් add කරන විදිහ

1. `cmd/other/example.js` copy කරලා, ඕන category folder එකට දාන්න.
2. `name`, `description`, `execute` වෙනස් කරන්න.
3. Bot එක restart කරන්න (`pm2 restart ...` හෝ process එක ආපහු run කරන්න).
4. Done — command එක වැඩ කරනවා, `.menu` එකේත් auto පේනවා.

> Note: existing hardcoded `.menu` text එක (song, movie, tiktok වගේ built-in
> commands) වෙනස් වෙන්නේ නෑ. අලුත් plugin commands ටික ඒ category එකේ
> අන්තිමට auto append වෙනවා විතරයි.

