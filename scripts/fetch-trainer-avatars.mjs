import fs from "node:fs";
import path from "node:path";

const SOURCE_URL = "https://play.pokemonshowdown.com/sprites/trainers/";
const OUTPUT_PATH = path.join(process.cwd(), "public", "trainer-avatars.json");

const toTitleCase = (value) =>
  value
    .split(/[-_.]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

async function main() {
  try {
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch trainer sprites: ${response.status}`);
    }
    const html = await response.text();
    const regex = /href="([^"]+\.png)"/gi;
    const seen = new Set();
    const avatars = [];

    let match;
    while ((match = regex.exec(html)) !== null) {
      const file = match[1];
      if (!file.endsWith(".png")) continue;
      const id = file.replace(/\.png$/i, "");
      if (seen.has(id)) continue;
      seen.add(id);
      avatars.push({
        id,
        name: toTitleCase(id) || id,
        sprite: file,
      });
    }

    avatars.sort((a, b) => a.name.localeCompare(b.name));

    await fs.promises.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.promises.writeFile(
      OUTPUT_PATH,
      JSON.stringify({ avatars }, null, 2)
    );
    console.log(`Saved ${avatars.length} trainer avatars to public/trainer-avatars.json`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
