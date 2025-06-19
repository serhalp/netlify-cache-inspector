# Copilot & AI Agent Instructions

This file provides project-specific guidance for GitHub Copilot, AI coding agents, and future contributors.

## Package Management

- **Use `pnpm`, not `npm` or `yarn`** for installing dependencies and running scripts.
    - The presence of `pnpm-lock.yaml` in the project root means all install, build, and run commands should use `pnpm`.
    - Example:  
      ```bash
      pnpm install
      pnpm run dev
      pnpm run build
      ```
- Do **not** generate or update `package-lock.json` or `yarn.lock` files.

## Build & Development

- Development scripts and production builds should be invoked via `pnpm` (see `package.json` scripts).
- Check the `README.md` for the latest dev and deployment instructions.

## Automated Detection

- If you are an AI agent or automation tool, prefer `pnpm` when `pnpm-lock.yaml` is present, even if you also see `package.json`.
- Warn if someone uses `npm install` or `yarn install`.

## Extending This Guide

- Add additional project conventions, special requirements, or "gotchas" for Copilot/AI and contributors here as needed.
- Examples: required Node.js version, CI/CD caveats, code formatting rules, etc.

---

_Last updated: 2025-06-19_