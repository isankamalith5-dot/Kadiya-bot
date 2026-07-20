// cmdLoader.js
//
// Plugin-style command loader for Kadiya MD.
//
// Drop a new command file into cmd/<category>/yourcommand.js and it is
// picked up automatically the next time the bot restarts (or immediately if
// you call reloadCommands() while the process is running) — no need to
// touch sakura.js's giant switch-case, and no need to edit the .menu text
// by hand. New commands are appended under the matching .menu category
// automatically (see getCategoryLines()).
//
// Categories map 1:1 to the four .menu sections in sakura.js:
//   cmd/main/      -> "1 ┊ 📋 MAIN MENU"
//   cmd/download/  -> "2 ┊ 📥 DOWNLOAD MENU"
//   cmd/owner/     -> "3 ┊ 👑 OWNER MENU"
//   cmd/other/     -> "4 ┊ 🌙 OTHER MENU"
//
// Each command file must export:
//   {
//     name: 'lowercase-command-name',   // required, what people type after the prefix
//     aliases: ['alt1', 'alt2'],        // optional, extra names that trigger the same command
//     category: 'main'|'download'|'owner'|'other', // optional — defaults to the folder it's in
//     description: 'Shown in the auto-generated menu lines',
//     ownerOnly: false,                 // optional — if true, only the session/bot owner can run it
//     execute: async (ctx) => { ... }   // required — the command logic
//   }
//
// See cmd/other/example.js for a full working template.

const fs = require('fs');
const path = require('path');

const CMD_DIR = path.join(__dirname, 'cmd');
const CATEGORIES = ['main', 'download', 'owner', 'other'];

// alias/name (lowercase) -> command definition
const commandRegistry = new Map();
// category -> [command definitions] (in load order)
const categorizedCommands = { main: [], download: [], owner: [], other: [] };

function loadCommands() {
  commandRegistry.clear();
  CATEGORIES.forEach(c => { categorizedCommands[c] = []; });

  if (!fs.existsSync(CMD_DIR)) {
    console.warn('[cmdLoader] cmd/ folder not found — skipping plugin command load.');
    return { loaded: 0, skipped: 0 };
  }

  let loaded = 0;
  let skipped = 0;

  const folders = fs.readdirSync(CMD_DIR).filter(f => {
    try { return fs.statSync(path.join(CMD_DIR, f)).isDirectory(); } catch (e) { return false; }
  });

  for (const folder of folders) {
    const folderPath = path.join(CMD_DIR, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      try {
        delete require.cache[require.resolve(fullPath)];
        const def = require(fullPath);

        if (!def || typeof def !== 'object' || !def.name || typeof def.execute !== 'function') {
          console.warn(`[cmdLoader] Skipping invalid command file (needs name + execute): cmd/${folder}/${file}`);
          skipped++;
          continue;
        }

        const category = CATEGORIES.includes(def.category) ? def.category : (CATEGORIES.includes(folder) ? folder : 'other');
        const names = [def.name, ...(Array.isArray(def.aliases) ? def.aliases : [])]
          .filter(Boolean)
          .map(n => String(n).toLowerCase().trim());

        for (const n of names) {
          if (commandRegistry.has(n)) {
            console.warn(`[cmdLoader] "${n}" from cmd/${folder}/${file} overrides an existing command with the same name/alias.`);
          }
          commandRegistry.set(n, def);
        }

        categorizedCommands[category].push(def);
        loaded++;
      } catch (e) {
        console.error(`[cmdLoader] Failed to load cmd/${folder}/${file}:`, e.message);
        skipped++;
      }
    }
  }

  console.log(`[cmdLoader] Loaded ${loaded} plugin command file(s), skipped ${skipped}.`);
  return { loaded, skipped };
}

function reloadCommands() {
  return loadCommands();
}

function getCommand(name) {
  if (!name) return null;
  return commandRegistry.get(String(name).toLowerCase().trim()) || null;
}

// Returns the ready-to-append menu lines for a category, in the exact same
// "❍ *prefix+name* ┊ description" style already used by the hardcoded
// .menu text in sakura.js, so plugin commands blend in seamlessly.
function getCategoryLines(category, prefix) {
  const list = categorizedCommands[category] || [];
  return list.map(c => `❍ *${prefix}${c.name}* ┊ ${c.description || 'No description'}`);
}

module.exports = {
  loadCommands,
  reloadCommands,
  getCommand,
  getCategoryLines,
  commandRegistry,
  categorizedCommands,
  CATEGORIES
};
