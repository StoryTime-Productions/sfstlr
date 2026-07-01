<p align="center">
  <strong>SFSTLR</strong> — Slimefun raw material list + step-by-step recipe resolver
</p>

<p align="center">
    <a href="https://github.com/StoryTime-Productions/sfstlr/graphs/contributors">
        <img src="https://badgen.net/github/contributors/StoryTime-Productions/sfstlr?color=6f42c1" alt="Contributors">
    </a>
    <a href="https://github.com/StoryTime-Productions/sfstlr/network/members">
        <img src="https://badgen.net/github/forks/StoryTime-Productions/sfstlr?color=2ea44f" alt="Forks">
    </a>
    <a href="https://github.com/StoryTime-Productions/sfstlr/stargazers">
        <img src="https://badgen.net/github/stars/StoryTime-Productions/sfstlr?color=f59e0b" alt="Stars">
    </a>
    <a href="https://github.com/StoryTime-Productions/sfstlr/issues">
        <img src="https://badgen.net/github/open-issues/StoryTime-Productions/sfstlr?color=d73a49" alt="Issues">
    </a>
    <a href="https://github.com/StoryTime-Productions/sfstlr/blob/main/LICENSE">
        <img src="https://badgen.net/github/license/StoryTime-Productions/sfstlr?color=0ea5e9" alt="License">
    </a>
    <a href="https://github.com/StoryTime-Productions/sfstlr/actions/workflows/ci.yml">
        <img src="https://github.com/StoryTime-Productions/sfstlr/actions/workflows/ci.yml/badge.svg" alt="CI">
    </a>
    <a href="https://sfstlr.vercel.app">
        <img src="https://img.shields.io/badge/vercel-deployed-black?logo=vercel" alt="Vercel">
    </a>
</p>

## What It Does

Enter one or more Slimefun items and amounts. SFSTLR walks the full recipe tree, flattens it into a topologically sorted step list, and tells you exactly what raw materials to gather and in what order to craft them — no wiki-diving required.

- Minecraft-style 3×3 crafting grids with SF and vanilla textures
- 3D isometric block rendering for block-type ingredients
- Collapsible step cards — follow along one step at a time
- URL sharing — encode your item list in the URL and send it to a friend
- Search autocomplete across all 12,000+ Slimefun items

## Live App

[sfstlr.vercel.app](https://sfstlr.vercel.app)

## Quick Start (Developers)

Prerequisites:

- Node.js 18+
- npm

Clone and run the web app:

    git clone https://github.com/StoryTime-Productions/sfstlr.git
    cd sfstlr/web
    npm install
    npm run dev

Open `http://localhost:3000`.

Run the CLI directly (resolves to stdout):

    cd sfstlr
    npm install
    node sfstlr.js <ITEM_ID> [amount]

The CLI caches `items.json` from [SFCalc-Online](https://github.com/Seggan/SFCalc-Online) in `~/.sfstlr/`. Pass `--refresh` to force a re-download.

Extract textures (requires a Minecraft + Slimefun resource pack):

    cd sfstlr/web
    npm run extract-textures

## Local Commit Enforcement

Pre-commit hooks run automatically via Husky.

Checks on commit attempt:

- Format (Prettier)
- Type check (TypeScript)
- Commit message convention (Conventional Commits)

Enable once per clone:

    npm install

Conventional commit examples:

- `feat(web): add collapsible step cards`
- `fix(resolver): correct topological sort direction`
- `chore: update dependencies`

## CI/CD

PRs to main require all checks to pass:

- Lint (ESLint)
- Type Check (tsc)
- Format (Prettier)
- Conventional Commits (commitlint)
- Test & Coverage (Vitest)

Pushes to main trigger the same suite plus a Vercel production deployment.
