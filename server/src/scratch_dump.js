const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/pablocolors.db');
const db = new Database(DB_PATH);

const rows = db.prepare('SELECT name, settings FROM recipes').all();
for (const row of rows) {
  console.log(`\nRecipe: ${row.name}`);
  console.log('UI Settings:', row.settings);
}
db.close();
