# Pagekeeper Frontend

React + TypeScript web app with a warm glass UI for managing AI agent knowledge files via GitHub.

## Quick Start

```bash
npm install
cp .env.example .env   # Set VITE_API_URL (leave empty if served from same origin as backend)
npm run dev             # Opens at http://localhost:5173
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | Homepage with hero, features, editor mockup |
| **Dashboard** | `/dashboard` | Agent list, create/import/delete, setup wizard |
| **Agent Editor** | `/agents/:owner/:repo` | File editor, sync checker, advanced mode |
| **Timeline** | `/agents/:owner/:repo/timeline` | Visual commit history with expandable diffs |

## Design

- **Fonts**: Fraunces (serif headings), Instrument Sans (sans body)
- **Colors**: Cream `#faf7f2`, Orange `#e8622a`, Dark ink `#1a1714`
- **Effects**: Glass panels with `backdrop-filter: blur`, hover lifts

## Build

```bash
npm run build   # Output in dist/
```

## Tech Stack

React 18, TypeScript, Vite, Tailwind CSS, React Router, React Markdown, @uiw/react-md-editor
