"""Standalone runner for Pagekeeper server inside Electron app."""
import sys
import os

# Add the server directory to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

# Override the static dir to point to our bundled static files
os.environ.setdefault("PAGEKEEPER_STATIC_DIR", os.path.join(os.path.dirname(__file__), "static"))

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 18923

    # Try to load saved credentials
    env_path = os.path.expanduser("~/.pagekeeper.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    if key.strip() not in os.environ:
                        os.environ[key.strip()] = value.strip()

    import uvicorn
    uvicorn.run("server_app:app", host="127.0.0.1", port=port, log_level="info")
