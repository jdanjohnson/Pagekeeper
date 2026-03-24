import { useNavigate } from "react-router-dom";
import { getLoginUrl, getAuthMode, loginWithPAT, setToken, isAuthenticated } from "../lib/api";
import { useEffect, useState } from "react";
import { GitBranch, FileText, Clock, Shield, Zap, Users, Key, ExternalLink, AlertCircle } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<{ oauth: boolean; pat: boolean }>({ oauth: true, pat: true });
  const [showPAT, setShowPAT] = useState(false);
  const [patValue, setPatValue] = useState("");
  const [patLoading, setPatLoading] = useState(false);
  const [patError, setPatError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
    getAuthMode().then(setAuthMode).catch(() => {});
  }, [navigate]);

  const handleLogin = async () => {
    if (authMode.oauth) {
      const url = await getLoginUrl();
      window.location.href = url;
    } else {
      setShowPAT(true);
    }
  };

  const handlePATLogin = async () => {
    if (!patValue.trim()) return;
    setPatLoading(true);
    setPatError("");
    try {
      const result = await loginWithPAT(patValue.trim());
      setToken(result.token);
      navigate("/dashboard");
    } catch (e: any) {
      setPatError(e?.message || "Invalid token");
    }
    setPatLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">ClawSync</span>
        </div>
        <div className="flex items-center gap-3">
          {authMode.oauth && (
            <button
              onClick={handleLogin}
              className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Sign in with GitHub
            </button>
          )}
          <button
            onClick={() => setShowPAT(true)}
            className="text-gray-400 hover:text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 border border-gray-700 hover:border-gray-500"
          >
            <Key className="w-4 h-4" />
            Use Token
          </button>
        </div>
      </nav>

      {/* PAT Login Modal */}
      {showPAT && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Sign in with Token</h2>
                <p className="text-sm text-gray-400">Paste a GitHub Personal Access Token</p>
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-700 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-400 mb-3">
                Create a token with <span className="text-emerald-400 font-mono text-xs">repo</span> and <span className="text-emerald-400 font-mono text-xs">delete_repo</span> scopes:
              </p>
              <a
                href="https://github.com/settings/tokens/new?description=ClawSync&scopes=repo,delete_repo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Create token on GitHub
              </a>
            </div>

            <input
              type="password"
              value={patValue}
              onChange={(e) => { setPatValue(e.target.value); setPatError(""); }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono text-sm mb-3"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handlePATLogin(); }}
            />

            {patError && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                <AlertCircle className="w-4 h-4" />
                {patError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handlePATLogin}
                disabled={!patValue.trim() || patLoading}
                className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {patLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {patLoading ? "Connecting..." : "Connect"}
              </button>
              <button
                onClick={() => { setShowPAT(false); setPatValue(""); setPatError(""); }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-8 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Built for OpenClaw &amp; AI Agents
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Your agent's brain,
          <br />
          <span className="text-emerald-400">always up to date.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          A visual file sync hub that keeps your OpenClaw agents running on your
          latest knowledge files. Edit SOUL.md, MEMORY.md, and more — with
          version history and zero terminal required.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {authMode.oauth ? (
            <button
              onClick={handleLogin}
              className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Connect with GitHub
            </button>
          ) : (
            <button
              onClick={() => setShowPAT(true)}
              className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Key className="w-6 h-6" />
              Connect with Token
            </button>
          )}
          {authMode.oauth && (
            <button
              onClick={() => setShowPAT(true)}
              className="text-gray-400 hover:text-white px-6 py-4 rounded-xl font-medium text-lg transition-colors flex items-center gap-2"
            >
              <Key className="w-5 h-5" />
              or use a token
            </button>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          GitHub is the backend. Your agent's knowledge files live in a private
          repo. ClawSync gives you a beautiful UI to manage them.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">GitHub-Backed</h3>
            <p className="text-gray-400">
              Every agent gets a private GitHub repo. Version history, backups,
              and collaboration — all built in. No database needed.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Visual Editor</h3>
            <p className="text-gray-400">
              Edit SOUL.md, MEMORY.md, USER.md, and AGENTS.md with a rich
              Markdown editor. No terminal, no Git commands.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Visual Timeline</h3>
            <p className="text-gray-400">
              See every change — by you or your agent — in a beautiful timeline.
              One-click restore to any previous version.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture diagram */}
      <section className="max-w-4xl mx-auto px-8 py-16">
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-8 text-center">Architecture</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="bg-gray-700/50 rounded-xl p-6 w-full md:w-48">
              <div className="text-3xl mb-2">🖥</div>
              <div className="font-semibold">ClawSync UI</div>
              <div className="text-sm text-gray-400">Edit files visually</div>
            </div>
            <div className="text-emerald-400 text-2xl hidden md:block">
              ←→
            </div>
            <div className="text-emerald-400 text-2xl md:hidden">↕</div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 w-full md:w-48">
              <div className="text-3xl mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div className="font-semibold">GitHub Repo</div>
              <div className="text-sm text-gray-400">Source of truth</div>
            </div>
            <div className="text-emerald-400 text-2xl hidden md:block">
              ←→
            </div>
            <div className="text-emerald-400 text-2xl md:hidden">↕</div>
            <div className="bg-gray-700/50 rounded-xl p-6 w-full md:w-48">
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold">VPS Agent</div>
              <div className="text-sm text-gray-400">git pull → reads files</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <Shield className="w-6 h-6 text-emerald-400 mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Private by Default</h3>
              <p className="text-gray-400 text-sm">
                Agent repos are created as private GitHub repos. Your knowledge stays yours.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <Users className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Multi-Agent Dashboard</h3>
              <p className="text-gray-400 text-sm">
                Manage multiple agents from one place. Shared knowledge files across agents.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <FileText className="w-6 h-6 text-purple-400 mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Template Library</h3>
              <p className="text-gray-400 text-sm">
                Start with pre-built templates for support bots, personal assistants, dev agents, and more.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <Zap className="w-6 h-6 text-yellow-400 mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">VPS Sync</h3>
              <p className="text-gray-400 text-sm">
                One command to install on your VPS. Your agent always reads the latest files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 text-gray-500 text-sm border-t border-gray-800">
        ClawSync — GitHub for your agent's brain.
      </footer>
    </div>
  );
}
