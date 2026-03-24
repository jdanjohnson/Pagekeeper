# ClawSync

A beginner-friendly UI for managing AI agent knowledge files via GitHub. No database, no complex setup — just a beautiful editor backed by GitHub repos.

## Install

```bash
pip install clawsync
```

## Quick Start

```bash
clawsync
```

On first run, ClawSync will walk you through creating a GitHub OAuth App (takes 30 seconds). After that, it opens in your browser at `http://localhost:8000`.

## What it does

- **Visual Markdown Editor** — Edit your agent's SOUL.md, MEMORY.md, USER.md, AGENTS.md files in a clean UI
- **GitHub-backed** — Every edit is a git commit. Full version history, no database needed
- **Template Library** — 6 ready-to-use assistant templates (Default, Support, Personal, Dev, Sales, Content Creator)
- **Visual Timeline** — See every change as a pretty timeline with expandable diffs
- **Sync Checker** — Verify your VPS/Mac is pulling the latest files
- **Advanced Mode** — Branch picker, diff view, and PR-style merge UI for power users
- **Setup Wizard** — Guided onboarding for connecting VPS or Mac sync

## Options

```
clawsync                          # Start on localhost:8000
clawsync --port 3000              # Custom port
clawsync --no-open                # Don't auto-open browser
clawsync --github-client-id X --github-client-secret Y  # Pass creds inline
```

## GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Homepage URL: `http://localhost:8000`
4. Callback URL: `http://localhost:8000/auth/github/callback`
5. Click "Register application"
6. Copy the Client ID and Client Secret

ClawSync will prompt you for these on first run and optionally save them to `~/.clawsync.env`.

## How Sync Works

```
You (browser)  →  ClawSync  →  GitHub API  →  GitHub Repo
                                                    ↓
                                              git pull (cron)
                                                    ↓
                                              VPS/Mac files
                                                    ↓
                                              OpenClaw reads
```

Edit in ClawSync → committed to GitHub → your VPS/Mac pulls automatically → your AI agent reads the latest files.

## License

MIT
