# Pagekeeper CLI

A pip-installable package that runs the full Pagekeeper app locally in your browser. No server deployment needed.

## Install

```bash
pip install pagekeeper
```

## Quick Start

```bash
pagekeeper
```

On first run, Pagekeeper walks you through creating a GitHub OAuth App (takes 30 seconds). After that, it opens `http://localhost:8000` in your browser with the full app.

## Features

- Visual Markdown editor for SOUL.md, MEMORY.md, USER.md, AGENTS.md
- 6 ready-to-use assistant templates
- Visual commit timeline with expandable diffs
- Sync checker to verify your VPS/Mac is pulling changes
- Advanced mode: branches, diffs, PR-style merges
- Setup wizard for VPS, Mac, and local folder sync

## Options

```
pagekeeper                          # Start on localhost:8000
pagekeeper --port 3000              # Custom port
pagekeeper --no-open                # Don't auto-open browser
pagekeeper --github-client-id X --github-client-secret Y  # Pass creds inline
```

## GitHub OAuth Setup

1. Go to https://github.com/settings/developers → "New OAuth App"
2. Homepage URL: `http://localhost:8000`
3. Callback URL: `http://localhost:8000/auth/github/callback`
4. Copy Client ID and Client Secret

Pagekeeper prompts for these on first run and saves them to `~/.pagekeeper.env`.

## Build from Source

```bash
cd pagekeeper-cli
pip install -e .
pagekeeper
```

## License

MIT
