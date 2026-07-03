<p align="center">
  <img src="assets/banner.png" alt="SFSTLR banner" />
</p>

<p align="center">
  <a href="https://github.com/StoryTime-Productions/sfstlr/actions/workflows/ci.yml"><img src="https://github.com/StoryTime-Productions/sfstlr/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <img src="https://img.shields.io/badge/Next.js-black" alt="Next.js" />
</p>

Enter one or more Slimefun items and amounts. SFSTLR walks the full recipe tree, flattens it into a topologically sorted step list, and tells you exactly what raw materials to gather and in what order to craft them - no wiki-diving required.

- Minecraft-style 3×3 crafting grids with SF and vanilla textures
- 3D isometric block rendering for block-type ingredients
- Collapsible step cards - follow along one step at a time
- URL sharing - encode your item list in the URL and send it to a friend
- Search autocomplete across all 12,000+ Slimefun items

## Live App

[sfstlr.vercel.app](https://sfstlr.vercel.app)

## Tech Stack

- Next.js 14 (App Router), React 18, TypeScript
- Tailwind CSS
- Vitest (unit tests + coverage)
- Node.js recipe resolver (`src/`, run standalone as a CLI)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

Clone and run the web app:

```
git clone https://github.com/StoryTime-Productions/sfstlr.git
cd sfstlr/web
npm install
npm run dev
```

Open `http://localhost:3000`.

Run the CLI directly (resolves to stdout):

```
cd sfstlr
npm install
node sfstlr.js <ITEM_ID> [amount]
```

The CLI caches `items.json` from [SFCalc-Online](https://github.com/Seggan/SFCalc-Online) in `~/.sfstlr/`. Pass `--refresh` to force a re-download.

Extract textures (requires a Minecraft + Slimefun resource pack):

```
cd sfstlr/web
npm run extract-textures
```

### Scripts

Root (`sfstlr/`):

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm start`            | Run the CLI resolver (`node sfstlr.js`) |
| `npm run lint`         | ESLint over `src` and `sfstlr.js`       |
| `npm run format`       | Prettier write                          |
| `npm run format:check` | Prettier check                          |

Web app (`sfstlr/web`):

| Command                    | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `npm run dev`              | Start the Next.js dev server                     |
| `npm run build`            | Production build                                 |
| `npm start`                | Serve the production build                       |
| `npm run lint`             | Next.js lint                                     |
| `npm run typecheck`        | `tsc --noEmit`                                   |
| `npm test`                 | Run Vitest suite                                 |
| `npm run test:coverage`    | Run Vitest suite with coverage                   |
| `npm run extract-textures` | Extract SF/vanilla textures from a resource pack |

## Local Commit Enforcement

Pre-commit hooks run automatically via Husky.

Checks on commit attempt:

- Format (Prettier)
- Type check (TypeScript)
- Commit message convention (Conventional Commits)

Enable once per clone:

```
npm install
```

Conventional commit examples:

- `feat(web): add collapsible step cards`
- `fix(resolver): correct topological sort direction`
- `chore: update dependencies`

## CI/CD

PRs to main require all checks in `.github/workflows/ci.yml` to pass:

- Lint (ESLint, root + web)
- Type Check (tsc, web)
- Format (Prettier, root)
- Conventional Commits (commitlint)
- Test & Coverage (Vitest, web)

Pushes to main trigger the same suite plus a Vercel production deployment.

## Contributing

See [.github/pull_request_template.md](.github/pull_request_template.md) and the issue templates in [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE). Commits must follow Angular-style conventional commit format, enforced both in CI and locally via Husky: `pre-commit` runs `lint-staged` (ESLint + Prettier on staged JS/TS, Prettier on JSON/MD/CSS) plus a TypeScript typecheck in `web/`, and `commit-msg` runs commitlint. Run `npm install` once to set up the hooks (via the `prepare` script).

## License

MIT - see [LICENSE](LICENSE).
