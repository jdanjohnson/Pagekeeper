"""ClawSync CLI - Run ClawSync locally on your machine."""

import argparse
import os
import sys
import webbrowser
import time
import threading


def main():
    parser = argparse.ArgumentParser(
        description="ClawSync - Manage your AI agent knowledge files with a beautiful UI backed by GitHub",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  clawsync                     Start ClawSync on http://localhost:8000
  clawsync --port 3000         Start on a custom port
  clawsync --no-open           Start without opening browser
  clawsync --github-client-id XXX --github-client-secret YYY
                               Provide GitHub OAuth credentials inline

Setup:
  1. Create a GitHub OAuth App at https://github.com/settings/developers
     - Homepage URL: http://localhost:8000
     - Callback URL: http://localhost:8000/auth/github/callback
  2. Run: clawsync --github-client-id <ID> --github-client-secret <SECRET>
  3. Or set environment variables: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
        """,
    )
    parser.add_argument("--port", type=int, default=8000, help="Port to run on (default: 8000)")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to (default: 127.0.0.1)")
    parser.add_argument("--no-open", action="store_true", help="Don't open browser automatically")
    parser.add_argument("--github-client-id", help="GitHub OAuth App Client ID")
    parser.add_argument("--github-client-secret", help="GitHub OAuth App Client Secret")
    parser.add_argument("--version", action="version", version=f"clawsync {_get_version()}")

    args = parser.parse_args()

    # Set env vars from CLI args if provided
    if args.github_client_id:
        os.environ["GITHUB_CLIENT_ID"] = args.github_client_id
    if args.github_client_secret:
        os.environ["GITHUB_CLIENT_SECRET"] = args.github_client_secret

    # Set the app URL for OAuth callback
    os.environ["APP_URL"] = f"http://{args.host}:{args.port}"

    # Check for GitHub OAuth credentials
    client_id = os.environ.get("GITHUB_CLIENT_ID")
    client_secret = os.environ.get("GITHUB_CLIENT_SECRET")

    if not client_id or not client_secret:
        print("\n" + "=" * 60)
        print("  ClawSync - First-Time Setup")
        print("=" * 60)
        print()
        print("  You need a GitHub OAuth App to log in.")
        print()
        print("  1. Go to: https://github.com/settings/developers")
        print("  2. Click 'New OAuth App'")
        print(f"  3. Homepage URL: http://{args.host}:{args.port}")
        print(f"  4. Callback URL: http://{args.host}:{args.port}/auth/github/callback")
        print("  5. Click 'Register application'")
        print()

        if sys.stdin.isatty():
            client_id = input("  Enter Client ID: ").strip()
            client_secret = input("  Enter Client Secret: ").strip()

            if not client_id or not client_secret:
                print("\n  Error: Both Client ID and Client Secret are required.")
                print("  Run with --help for more options.\n")
                sys.exit(1)

            os.environ["GITHUB_CLIENT_ID"] = client_id
            os.environ["GITHUB_CLIENT_SECRET"] = client_secret

            # Offer to save
            save = input("\n  Save credentials for next time? (y/n): ").strip().lower()
            if save == "y":
                env_path = os.path.expanduser("~/.clawsync.env")
                with open(env_path, "w") as f:
                    f.write(f"GITHUB_CLIENT_ID={client_id}\n")
                    f.write(f"GITHUB_CLIENT_SECRET={client_secret}\n")
                os.chmod(env_path, 0o600)
                print(f"  Saved to {env_path}")
        else:
            print("  Run with: clawsync --github-client-id <ID> --github-client-secret <SECRET>")
            print("  Or set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.\n")
            sys.exit(1)

    # Load saved credentials if they exist
    _load_saved_env()

    url = f"http://{args.host}:{args.port}"
    print(f"\n  Starting ClawSync on {url}")
    print(f"  Press Ctrl+C to stop\n")

    # Open browser after a short delay
    if not args.no_open:
        def open_browser():
            time.sleep(1.5)
            webbrowser.open(url)
        threading.Thread(target=open_browser, daemon=True).start()

    # Import and run the server
    import uvicorn
    from clawsync.server import app

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


def _get_version():
    try:
        from clawsync import __version__
        return __version__
    except Exception:
        return "0.1.0"


def _load_saved_env():
    """Load saved credentials from ~/.clawsync.env if they exist."""
    env_path = os.path.expanduser("~/.clawsync.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    if key.strip() not in os.environ:
                        os.environ[key.strip()] = value.strip()


if __name__ == "__main__":
    main()
