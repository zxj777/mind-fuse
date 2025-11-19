# Contributing to Mind Fuse

Thank you for taking the time to contribute to **Mind Fuse**. This document describes how to work with this repository, how to structure your changes, and how to keep the history clean and easy to understand.

> TL;DR: Use feature branches, keep commits small and meaningful, follow the commit message convention, and make sure the project builds and tests pass before opening a pull request.

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Getting Started](#getting-started)
3. [Branching Strategy](#branching-strategy)
4. [Commit Guidelines](#commit-guidelines)
5. [Code Style & Quality](#code-style--quality)
6. [Front-End (Web App)](#front-end-web-app)
7. [Monorepo & Packages](#monorepo--packages)
8. [Pull Request Process](#pull-request-process)
9. [Development Principles](#development-principles)
10. [Security & Secrets](#security--secrets)

## Repository Overview

This is a monorepo managed with **pnpm workspaces**. High-level structure (simplified):

- `apps/web`: Next.js front-end application
- `packages/*`: Shared libraries (TypeScript), UI kit, state management, collaboration, etc.
- `crates/*`: Rust crates
- `go.work` and Go modules: Go-based services or utilities

Node and TypeScript projects share common configuration via root-level `tsconfig.json` and `eslint.config.mjs`.

## Getting Started

### Prerequisites

- **Node.js** (active LTS or later)
- **pnpm** as the package manager

### Install Dependencies

Run the following from the repository root:

```bash
pnpm install
```

### Useful Commands

From the repository root (commands may evolve, check `package.json` for the latest scripts):

- Install dependencies:

  ```bash
  pnpm install
  ```

- Lint (root or workspace specific, when available):

  ```bash
  pnpm lint
  ```

- Test (when test scripts are defined):

  ```bash
  pnpm test
  ```

- Build all workspaces (when scripts are defined):

  ```bash
  pnpm build
  ```

- Run the web app (from root, if script is wired) or from `apps/web`:

  ```bash
  pnpm --filter web dev
  ```

## Branching Strategy

- **Default branch**: `main` is always kept in a releasable and stable state.
- **Feature branches**: Create a branch for each change or feature.

Suggested naming scheme:

- Features: `feat/<short-description>` (e.g. `feat/canvas-zoom-controls`)
- Fixes: `fix/<short-description>` (e.g. `fix/editor-crash-on-undo`)
- Chores: `chore/<short-description>` (e.g. `chore/update-deps-2025-11`)

Work only on feature branches and open pull requests into `main` when your work is ready.

Avoid force-pushing to shared branches. If you need to clean up commit history, do so on your own feature branch.

## Commit Guidelines

We follow a **small, atomic commit** philosophy: each commit should do exactly one thing and keep the repository in a buildable, testable state.

### General Rules

- Keep each commit focused on a single logical change.
- Do not mix unrelated changes (for example, avoid combining large refactors, formatting changes, and new features in a single commit).
- Ensure the code **builds and passes tests** before pushing.

### Commit Message Format

We use a conventional-style commit message:

```text
<type>(<scope>): <subject>

<body>

<footer>
```

Where:

- `type` (required) can be:
  - `feat`: New feature
  - `fix`: Bug fix
  - `refactor`: Code refactor (no feature or bug fix)
  - `chore`: Maintenance, tooling, config, build scripts
  - `docs`: Documentation only changes
  - `test`: Add or update tests only
  - `build`: Build system changes (bundler, CI, etc.)
- `scope` (optional) indicates the area of the codebase, e.g.:
  - `web`, `editor-core`, `canvas-engine`, `state-manager`, `shared-types`, `ui-kit`
- `subject` (required) is a short description of the change in **imperative mood** (e.g. “add”, “fix”, “update”). Prefer to limit it to around 50 characters.

#### Examples

- `feat(web): add command palette for canvas tools`
- `fix(state-manager): handle empty undo stack`
- `refactor(editor-core): extract selection controller`
- `chore: bump pnpm workspace dependencies`
- `test(canvas-engine): add zoom interaction tests`
- `docs: document commit guidelines`

### Commit Body and Footer

- Use the body to explain **why** the change is needed and provide high-level details of **how** it works when it is not obvious.
- Wrap body lines at a reasonable length to improve readability in terminals.
- Use the footer to link issues or note breaking changes:

  ```text
  Fixes: #1234
  Refs: #5678

  BREAKING CHANGE: remove legacy canvas v1 API
  ```

### Formatting and Large Changes

- Run formatters and linters before committing when available.
- If you need to reformat a large portion of code (for example, due to a new lint rule or Prettier configuration), do it in a **separate commit** that contains no functional changes.

## Code Style & Quality

### Language and Naming

- **Language**: Code and documentation should be written in **English**.
- **Naming conventions**:
  - **PascalCase** for classes.
  - **camelCase** for variables, functions, and methods.
  - **kebab-case** for file and directory names.
  - **UPPERCASE** for environment variables.

### General Rules

- Always declare the type of each variable and function (parameters and return value) in TypeScript code.
- Avoid using `any`. Prefer explicit, narrow types and create shared types when needed.
- Prefer composite types and domain-specific types over unstructured primitives.
- Use **immutable** data structures and `readonly` where appropriate.
- Avoid magic numbers: define named constants instead.

### Functions & Logic

- Keep functions **short and single-purpose** where possible (aim for fewer than 20 lines).
- Avoid deeply nested blocks by:
  - Using early returns.
  - Extracting logic into small utility functions.
  - Using higher-order functions (`map`, `filter`, `reduce`) where appropriate.
- Prefer arrow functions for simple logic and named functions for more complex behavior.
- Use default parameter values instead of manual `null` / `undefined` checks for configuration objects.
- For functions that need many parameters, use a **Receive Object, Return Object (RO-RO)** pattern to enhance clarity and extensibility.

### Documentation

- Use **JSDoc** to document public classes, methods, and functions.
- Document parameters, return types, side effects, and important invariants.
- Keep comments focused on *why* rather than *what* when the code is already self-explanatory.

## Front-End (Web App)

The web app under `apps/web` is built with **Next.js** and **TypeScript**.

- Prefer function components and React hooks.
- Keep components small and focused; extract reusable pieces into shared UI components (for example, in `ui-kit` when appropriate).
- Use modern UI/UX best practices for layout, spacing, accessibility, and interactions.
- Keep styling consistent with the existing setup (CSS Modules, CSS-in-JS, or UI kit conventions, depending on the module).
- When adding or updating components:
  - Ensure they are accessible (ARIA attributes, keyboard navigation where needed).
  - Keep visual changes consistent with existing design tokens and patterns.

## Monorepo & Packages

This repository uses **pnpm workspaces** and shared TypeScript configurations.

- When creating a new package under `packages/`:
  - Use **kebab-case** for the package directory name.
  - Configure `package.json` and `tsconfig.json` consistent with existing packages.
  - Export a single main entry from the package (one main export per file, and a clear main entry point).
- Keep shared logic in shared packages when it is clearly reusable (e.g. `shared-types`, `shared-utils`, `ui-kit`).
- Avoid circular dependencies between packages.

## Pull Request Process

1. **Sync with main**
   - Before starting work, sync your local `main` with the remote.
   - Rebase your feature branch on top of the latest `main` as needed.
2. **Small, focused PRs**
   - Prefer smaller, focused pull requests. They are easier to review and safer to merge.
3. **Checklist before opening a PR**
   - Code compiles and builds successfully.
   - Linting passes (`pnpm lint` where applicable).
   - Relevant tests are added or updated, and all tests pass (`pnpm test` where applicable).
   - No unnecessary files are committed (no build outputs, no logs, no temporary files).
4. **Description**
   - Provide a clear summary of what the PR does.
   - Link related issues (for example, `Fixes #1234`).
   - Mention any breaking changes or migrations required.
5. **Code Review**
   - Be responsive to review comments and ready to iterate.
   - Keep follow-up changes in the same branch if they are part of the same logical change.
   - If review exposes a large refactor need, consider a dedicated follow-up PR.

## Development Principles

- Prefer clarity over cleverness.
- Prefer composition and small modules over large, monolithic files.
- Keep responsibilities well separated (UI, state management, data fetching, business logic).
- When in doubt, add tests to lock in behavior and protect against regressions.
- Avoid introducing new dependencies without a clear benefit and team alignment.

## Security & Secrets

- **Never** commit secrets:
  - API keys
  - Access tokens
  - Passwords or credentials
  - Production configuration with sensitive data
- Use environment variables and secret management tools instead.
- If you accidentally commit a secret:
  - Rotate or revoke it immediately.
  - Remove it from the commit history and force-push **only** after coordinating with the team.

Thank you for contributing to Mind Fuse! Your improvements help make the project more robust, maintainable, and enjoyable for everyone.


