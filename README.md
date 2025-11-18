## Pokémon Trainer Card Generator

This app lets you design a personalized Pokémon Trainer Card to share online or print. Mix and match trainer avatars, choose your team, and pick colors or background patterns to style your badge-worthy profile.

### Key features
- Search the Pokédex to add up to six Pokémon with type badges and official artwork.
- Browse a curated trainer avatar library (plus remote sprites) to match your vibe.
- Customize card colors, apply underprint patterns, and add favorite Pokémon, type, and game details for the back.
- Export a high-resolution JPEG of the card front/back or a triple-sheet layout for printing.

### Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) to build your card. The page auto-refreshes as you tweak the UI.

### How it works
- Pokémon data and sprites are fetched live from the PokéAPI, while cached name lists speed up autocomplete suggestions.
- Trainer avatars come from local sprites plus a remote list in `public/trainer-avatars.json`.
- Card exports rely on `html-to-image` to generate the downloadable JPEGs at 2× resolution.

### Project structure
- `src/app/page.tsx`: Main UI and card logic.
- `src/app/globals.css`: Global styles and Tailwind setup.
- `public/`: Static assets, cached Pokémon list, and trainer avatar sprites.

### Deployment
Deploy like any other Next.js app (e.g., Vercel). The project was bootstrapped with `create-next-app` and uses the App Router.
