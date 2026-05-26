import { db } from './db';
import { translateUIToPresetProps } from '../../client/src/camera/preset-translate';

const rows = db.prepare('SELECT name, settings FROM recipes').all() as Array<{ name: string, settings: string }>;

for (const row of rows) {
  const settings = JSON.parse(row.settings);
  try {
    const props = translateUIToPresetProps(settings);
    console.log(`\nRecipe: ${row.name}`);
    console.log('UI Settings:', JSON.stringify(settings));
    console.log('Translated props:');
    for (const [propId, value] of props) {
      console.log(`  0x${propId.toString(16).toUpperCase()}: 0x${value.toString(16).toUpperCase()} (${value})`);
    }
  } catch (err) {
    console.error(`Failed to translate recipe ${row.name}:`, err);
  }
}
