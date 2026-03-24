# Pagekeeper Backend

FastAPI server that proxies GitHub API calls and handles OAuth authentication. This is the API layer for the Pagekeeper web app.

## Quick Start

```bash
# Install dependencies
poetry install

# Configure environment
cp .env.example .env
# Edit .env with your GitHub OAuth credentials

# Run development server
poetry run fastapi dev app/main.py --port 8000
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Yes (for OAuth login) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | Yes (for OAuth login) |
| `FRONTEND_URL` | Frontend URL for OAuth redirect (leave empty if serving frontend from same origin) | No |

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Homepage URL to your frontend URL (e.g. `http://localhost:5173`)
4. Set Callback URL to `{backend_url}/auth/github/callback` (e.g. `http://localhost:8000/auth/github/callback`)
5. Copy Client ID and Client Secret to `.env`

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/mode` | Check available auth modes (OAuth, PAT) |
| `GET` | `/auth/github` | Start GitHub OAuth flow |
| `GET` | `/auth/github/callback` | OAuth callback handler |
| `POST` | `/auth/pat` | Login with Personal Access Token |
| `GET` | `/auth/me` | Get current user info |

### Repos / Agents
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/repos` | List Pagekeeper agent repos |
| `GET` | `/api/repos/all` | List all user repos |
| `POST` | `/api/repos` | Create a new agent repo with template |
| `POST` | `/api/repos/import` | Import existing repo into Pagekeeper |
| `DELETE` | `/api/repos/{owner}/{repo}` | Delete a repo |

### Files
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/repos/{owner}/{repo}/files` | List files in repo |
| `GET` | `/api/repos/{owner}/{repo}/markdown-files` | List all markdown files recursively |
| `GET` | `/api/repos/{owner}/{repo}/files/{path}` | Get file content |
| `PUT` | `/api/repos/{owner}/{repo}/files/{path}` | Update file |
| `POST` | `/api/repos/{owner}/{repo}/files/{path}` | Create file |

### Timeline & History
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/repos/{owner}/{repo}/timeline` | Get commit timeline |
| `GET` | `/api/repos/{owner}/{repo}/commits/{sha}` | Get commit detail |

### Sync Checker
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/repos/{owner}/{repo}/sync-test` | Create sync test file |
| `GET` | `/api/repos/{owner}/{repo}/sync-status` | Check sync status |
| `DELETE` | `/api/repos/{owner}/{repo}/sync-test` | Delete sync test file |

### Branches (Advanced Mode)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/repos/{owner}/{repo}/branches` | List branches |
| `POST` | `/api/repos/{owner}/{repo}/branches` | Create branch |
| `GET` | `/api/repos/{owner}/{repo}/compare/{base}...{head}` | Compare branches |
| `POST` | `/api/repos/{owner}/{repo}/merge` | Merge branches |
| `DELETE` | `/api/repos/{owner}/{repo}/branches/{branch}` | Delete branch |

## Serving Frontend

The backend can serve the frontend as static files. Build the frontend and copy the `dist/` output to `pagekeeper-backend/static/`:

```bash
cd ../pagekeeper-frontend && npm run build
cp -r dist/ ../pagekeeper-backend/static/
```

Then access the full app at `http://localhost:8000`.

## Tech Stack

- **Python 3.12+**
- **FastAPI** with async/await
- **httpx** for GitHub API calls
- **Poetry** for dependency management
- No database — GitHub is the backend
