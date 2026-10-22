import { loadGames } from '../src/data.mjs';
const games = await loadGames();
console.log(`Validated ${games.length} games, references, metrics, settings and content blocks.`);
