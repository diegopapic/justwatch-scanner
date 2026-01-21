# JustWatch Scanner

CLI tool for searching movies and series availability on streaming platforms in Argentina using the JustWatch GraphQL API.

## Tech Stack

- **Language**: TypeScript (ES2022, NodeNext modules)
- **Runtime**: Node.js with tsx for development
- **Build**: TypeScript compiler (tsc)
- **Dependencies**: inquirer (CLI prompts), chalk (terminal styling)

## Project Structure

```
src/
├── index.ts    # Entry point - runs the CLI
├── cli.ts      # Interactive CLI menus and display formatting
├── api.ts      # JustWatch GraphQL API client
└── types.ts    # TypeScript interfaces and constants
```

## Commands

```bash
npm start       # Run the CLI (tsx src/index.ts)
npm run dev     # Run with watch mode
npm run build   # Compile to dist/
```

## Architecture

- **API Layer** (`api.ts`): GraphQL client communicating with `https://apis.justwatch.com/graphql`. Hardcoded provider and genre lists for Argentina due to API instability.
- **CLI Layer** (`cli.ts`): Interactive menus using inquirer. Supports searching new titles, filtering by provider/genre/year, and exporting results to JSON/CSV.
- **Types** (`types.ts`): Interfaces for Provider, Genre, Title, Offer, SearchFilters, etc.

## Key Functions

- `searchByTitle()` - Search titles by name
- `searchTitles()` - Search with filters (provider, genre, year, monetization type)
- `getNewTitles()` - Get recently added titles with pagination
- `getTitleOffers()` - Get all streaming offers for a specific title

## Code Conventions

- Spanish language for user-facing strings
- ES modules (`.js` extensions in imports)
- Async/await for API calls
- Type imports use `import type`

## Configuration

- Target region: Argentina (AR)
- Language: Spanish (es)
- Monetization types: FLATRATE (subscription), RENT, BUY, FREE, ADS
