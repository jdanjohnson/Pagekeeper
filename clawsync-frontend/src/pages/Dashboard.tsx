import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAgentRepos, getMe, createAgentRepo, deleteAgentRepo, clearToken, getAllRepos, importRepo } from "../lib/api";
import {
  Plus,
  Zap,
  Lock,
  Globe,
  Clock,
  LogOut,
  FileText,
  Bot,
  Briefcase,
  Code,
  User,
  ExternalLink,
  Key,
  GitBranch,
  RefreshCw,
  Check,
  Copy,
  ArrowRight,
  Wifi,
  BookOpen,
  Trash2,
  Upload,
  AlertTriangle,
  MessageSquare,
  PenTool,
  FolderOpen,
  Search,
  FileText as FileIcon,
  Loader2,
} from "lucide-react";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  updated_at: string;
  html_url: string;
  default_branch: string;
}

interface GHUser {
  login: string;
  avatar_url: string;
  name: string;
}

const TEMPLATE_OPTIONS = [
  {
    id: "default",
    name: "Default Agent",
    desc: "Versatile assistant with smart defaults",
    icon: Bot,
    color: "emerald",
  },
  {
    id: "support",
    name: "Support Bot",
    desc: "Full CS playbook with escalation flows",
    icon: Briefcase,
    color: "blue",
  },
  {
    id: "personal",
    name: "Personal Assistant",
    desc: "Chief of staff — tasks, calendar, life admin",
    icon: User,
    color: "purple",
  },
  {
    id: "dev",
    name: "Dev Agent",
    desc: "Senior engineer with code review & git workflow",
    icon: Code,
    color: "yellow",
  },
  {
    id: "sales",
    name: "Sales & Outreach",
    desc: "Pipeline tracker, email templates, follow-ups",
    icon: MessageSquare,
    color: "orange",
  },
  {
    id: "content",
    name: "Content Creator",
    desc: "Write, schedule & repurpose across platforms",
    icon: PenTool,
    color: "pink",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [user, setUser] = useState<GHUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTemplate, setNewTemplate] = useState("default");
  const [newPrivate, setNewPrivate] = useState(true);
  const [creating, setCreating] = useState(false);
  const [setupStep, setSetupStep] = useState(0); // 0 = create form, 1+ = setup steps
  const [createdRepo, setCreatedRepo] = useState<Repo | null>(null);
  const [copied, setCopied] = useState("");
  const [platform, setPlatform] = useState<"vps" | "mac" | "">(""  );
  const [deleteTarget, setDeleteTarget] = useState<Repo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [allRepos, setAllRepos] = useState<any[]>([]);
  const [importSearch, setImportSearch] = useState("");
  const [importing, setImporting] = useState("");
  const [importResult, setImportResult] = useState<{ repo: Repo; markdown_files: { path: string; size: number }[] } | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  useEffect(() => {
    Promise.all([
      getMe().then(setUser),
      getAgentRepos().then((d) => setRepos(d.repos)),
    ])
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const result = await createAgentRepo(newName.trim(), newTemplate, newPrivate);
      const data = await getAgentRepos();
      setRepos(data.repos);
      // Use result from create API, fallback to searching the list
      const repoData: Repo = result.repo || result || data.repos.find((r: Repo) => r.name === newName.trim());
      if (repoData) {
        setCreatedRepo(repoData);
      } else {
        // Construct a minimal repo object as fallback
        setCreatedRepo({
          id: 0,
          name: newName.trim(),
          full_name: `${user?.login || "user"}/${newName.trim()}`,
          private: newPrivate,
          description: null,
          updated_at: new Date().toISOString(),
          html_url: `https://github.com/${user?.login || "user"}/${newName.trim()}`,
          default_branch: "main",
        });
      }
      setSetupStep(1);
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  };

  const closeSetupFlow = () => {
    setShowCreate(false);
    setSetupStep(0);
    setCreatedRepo(null);
    setNewName("");
    setPlatform("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const [owner, repo] = deleteTarget.full_name.split("/");
      await deleteAgentRepo(owner, repo);
      setRepos((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("403")) {
        alert("Permission denied. You may need to re-login to grant delete permissions.");
      } else {
        alert("Failed to delete repo. Try again.");
      }
    }
    setDeleting(false);
  };

  const handleOpenImport = async () => {
    setShowImport(true);
    setLoadingRepos(true);
    try {
      const data = await getAllRepos();
      setAllRepos(data.repos || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingRepos(false);
  };

  const handleImport = async (fullName: string) => {
    setImporting(fullName);
    try {
      const result = await importRepo(fullName);
      setImportResult(result);
      // Refresh agent repos list
      const data = await getAgentRepos();
      setRepos(data.repos);
    } catch (e) {
      console.error(e);
    }
    setImporting("");
  };

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">ClawSync</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-gray-300">{user.login}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Agents</h1>
            <p className="text-gray-400 mt-1">
              Each agent is a GitHub repo with knowledge files your AI reads.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenImport}
              className="text-gray-400 hover:text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 border border-gray-700 hover:border-gray-500"
            >
              <FolderOpen className="w-4 h-4" />
              Open Existing Repo
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Agent
            </button>
          </div>
        </div>

        {/* Create modal + Setup flow */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

              {/* Step indicator */}
              {setupStep > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        setupStep > s ? "bg-emerald-500 text-white" :
                        setupStep === s ? "bg-emerald-500 text-white" :
                        "bg-gray-700 text-gray-400"
                      }`}>
                        {setupStep > s ? <Check className="w-3.5 h-3.5" /> : s}
                      </div>
                      {s < 4 && <div className={`w-8 h-0.5 ${setupStep > s ? "bg-emerald-500" : "bg-gray-700"}`} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 0: Create form */}
              {setupStep === 0 && (
                <>
                  <h2 className="text-2xl font-bold mb-6">Create New Agent</h2>

                  <label className="block text-sm text-gray-400 mb-2">Agent Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. my-support-bot"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-6 focus:outline-none focus:border-emerald-500"
                  />

                  <label className="block text-sm text-gray-400 mb-3">Template</label>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {TEMPLATE_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setNewTemplate(t.id)}
                        className={`text-left p-4 rounded-xl border transition-colors ${
                          newTemplate === t.id
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                        }`}
                      >
                        <t.icon className="w-5 h-5 text-emerald-400 mb-2" />
                        <div className="font-medium text-sm">{t.name}</div>
                        <div className="text-xs text-gray-400">{t.desc}</div>
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 mb-6 cursor-pointer">
                    <div
                      onClick={() => setNewPrivate(!newPrivate)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        newPrivate ? "bg-emerald-500" : "bg-gray-600"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                          newPrivate ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-gray-300 flex items-center gap-1.5">
                      {newPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      {newPrivate ? "Private repo" : "Public repo"}
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button onClick={() => setShowCreate(false)} className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors">Cancel</button>
                    <button
                      onClick={handleCreate}
                      disabled={creating || !newName.trim()}
                      className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create Agent"}
                    </button>
                  </div>
                </>
              )}

              {/* Step 1: Agent Created + Platform Picker */}
              {setupStep === 1 && createdRepo && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Agent Created!</h2>
                    <p className="text-gray-400">
                      <strong className="text-white">{createdRepo.name}</strong> is live on GitHub with your knowledge files.
                    </p>
                  </div>

                  <a
                    href={createdRepo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-emerald-500/50 transition-colors mb-6 group"
                  >
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-5 h-5 text-gray-400 group-hover:text-emerald-400" />
                      <div>
                        <div className="font-medium">{createdRepo.full_name}</div>
                        <div className="text-xs text-gray-500">View your agent's repo on GitHub</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-emerald-400" />
                  </a>

                  <p className="text-sm text-gray-400 mb-3">Where does your OpenClaw agent run?</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setPlatform("vps")}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        platform === "vps" ? "border-emerald-500 bg-emerald-500/10" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                    >
                      <div className="text-lg mb-1">&#x1F5A5;&#xFE0F;</div>
                      <div className="font-medium text-sm">VPS / Server</div>
                      <div className="text-xs text-gray-400">DigitalOcean, AWS, Hetzner, etc.</div>
                    </button>
                    <button
                      onClick={() => setPlatform("mac")}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        platform === "mac" ? "border-emerald-500 bg-emerald-500/10" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                    >
                      <div className="text-lg mb-1">&#x1F4BB;</div>
                      <div className="font-medium text-sm">Mac (Local)</div>
                      <div className="text-xs text-gray-400">Running OpenClaw on your Mac</div>
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { closeSetupFlow(); navigate(`/agent/${createdRepo.full_name}`); }}
                      className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                    >
                      Skip — set up later
                    </button>
                    <button
                      onClick={() => setSetupStep(2)}
                      disabled={!platform}
                      className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Already have files? Import option */}
                  <div className="mt-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <strong>Already have OpenClaw files?</strong>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      If you already have SOUL.md, MEMORY.md, etc. on your machine, push them to this repo:
                    </p>
                    <div className="bg-gray-950 rounded-lg p-3 font-mono text-[11px]">
                      <div className="flex items-start justify-between">
                        <pre className="text-emerald-400 whitespace-pre-wrap">{`cd /path/to/your/openclaw/files
git init
git remote add origin git@github.com:${createdRepo.full_name}.git
git add -A
git commit -m "import existing files"
git push -u origin main --force`}</pre>
                        <button onClick={() => copyText(`cd /path/to/your/openclaw/files\ngit init\ngit remote add origin git@github.com:${createdRepo.full_name}.git\ngit add -A\ngit commit -m "import existing files"\ngit push -u origin main --force`, 'import')} className="text-gray-600 hover:text-white ml-2 shrink-0">
                          {copied === "import" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">This replaces the template files with your existing ones. You can also drag & drop files in the GitHub web UI at <a href={createdRepo.html_url + "/upload/main"} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">github.com/{createdRepo.full_name}/upload</a>.</p>
                  </div>
                </>
              )}

              {/* Step 2: Add SSH Key (both platforms) */}
              {setupStep === 2 && createdRepo && (
                <>
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    {platform === "mac" ? "Add Your Mac's SSH Key to GitHub" : "Add Your VPS SSH Key to GitHub"}
                  </h2>
                  <p className="text-gray-400 text-sm mb-5">
                    This lets your {platform === "mac" ? "Mac" : "VPS"} pull from your private repo without a password.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-2">
                            {platform === "mac"
                              ? "Check if you already have an SSH key (most Macs do)"
                              : "Generate an SSH key on your VPS (if you don't have one)"}
                          </div>
                          <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs flex items-center justify-between">
                            <span className="text-emerald-400">
                              {platform === "mac"
                                ? "cat ~/.ssh/id_ed25519.pub || ssh-keygen -t ed25519 -C \"clawsync\""
                                : "ssh-keygen -t ed25519 -C \"clawsync\" && cat ~/.ssh/id_ed25519.pub"}
                            </span>
                            <button onClick={() => copyText(
                              platform === "mac"
                                ? 'cat ~/.ssh/id_ed25519.pub || ssh-keygen -t ed25519 -C "clawsync"'
                                : 'ssh-keygen -t ed25519 -C "clawsync" && cat ~/.ssh/id_ed25519.pub',
                              'sshgen'
                            )} className="text-gray-600 hover:text-white ml-2 shrink-0">
                              {copied === "sshgen" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {platform === "mac" && (
                            <div className="text-xs text-gray-500 mt-2">Open Terminal (Cmd+Space → "Terminal") and paste this command.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-2">Copy the public key output, then add it on GitHub:</div>
                          <a
                            href="https://github.com/settings/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
                          >
                            <Key className="w-4 h-4" />
                            Open GitHub SSH Keys Settings
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <div className="text-xs text-gray-500 mt-2">Click "New SSH key" → paste your key → Save</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setSetupStep(1)} className="bg-gray-800 text-gray-300 px-5 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors">Back</button>
                    <button onClick={() => setSetupStep(3)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                      I've added my key <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Clone & Sync (platform-specific) */}
              {setupStep === 3 && createdRepo && (
                <>
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400" />
                    Clone & Enable Auto-Sync
                  </h2>
                  <p className="text-gray-400 text-sm mb-5">
                    {platform === "mac"
                      ? "Run these commands in Terminal to set up two-way sync on your Mac."
                      : "Run these two commands on your VPS to connect your agent."}
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-2">Clone the repo into your OpenClaw workspace</div>
                          <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs flex items-center justify-between">
                            <span className="text-emerald-400 truncate">git clone git@github.com:{createdRepo.full_name}.git ~/.openclaw/workspace</span>
                            <button onClick={() => copyText(`git clone git@github.com:${createdRepo.full_name}.git ~/.openclaw/workspace`, 'clone')} className="text-gray-600 hover:text-white ml-2 shrink-0">
                              {copied === "clone" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {platform === "mac" ? (
                      <>
                        {/* Mac: two-way sync script */}
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                            <div className="flex-1">
                              <div className="text-sm font-medium mb-2">Create a two-way sync script</div>
                              <div className="text-xs text-gray-500 mb-2">This pulls remote changes AND pushes your local edits back to GitHub:</div>
                              <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs">
                                <div className="flex items-start justify-between">
                                  <pre className="text-emerald-400 whitespace-pre-wrap text-[11px]">{`cat > ~/.openclaw/sync.sh << 'EOF'
#!/bin/bash
cd ~/.openclaw/workspace || exit 1
git pull -q
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "auto-sync from Mac $(date +%H:%M)"
  git push -q
fi
EOF
chmod +x ~/.openclaw/sync.sh`}</pre>
                                  <button onClick={() => copyText(`cat > ~/.openclaw/sync.sh << 'EOF'\n#!/bin/bash\ncd ~/.openclaw/workspace || exit 1\ngit pull -q\nif [ -n "$(git status --porcelain)" ]; then\n  git add -A\n  git commit -m "auto-sync from Mac $(date +%H:%M)"\n  git push -q\nfi\nEOF\nchmod +x ~/.openclaw/sync.sh`, 'script')} className="text-gray-600 hover:text-white ml-2 shrink-0">
                                    {copied === "script" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                            <div className="flex-1">
                              <div className="text-sm font-medium mb-2">Run it every minute with launchd (Mac's cron)</div>
                              <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs">
                                <div className="flex items-start justify-between">
                                  <pre className="text-emerald-400 whitespace-pre-wrap text-[11px]">{`# Quick option: use cron (works on Mac too)
(crontab -l 2>/dev/null; echo '* * * * * ~/.openclaw/sync.sh') | crontab -`}</pre>
                                  <button onClick={() => copyText("(crontab -l 2>/dev/null; echo '* * * * * ~/.openclaw/sync.sh') | crontab -", 'maccron')} className="text-gray-600 hover:text-white ml-2 shrink-0">
                                    {copied === "maccron" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">Two-way: local edits push to GitHub, ClawSync edits pull to your Mac. Both stay in sync.</div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* VPS: one-way pull */
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium mb-2">Set up auto-sync (pulls every minute)</div>
                            <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs flex items-center justify-between">
                              <span className="text-emerald-400 truncate">{"(crontab -l 2>/dev/null; echo '* * * * * cd ~/.openclaw/workspace && git pull -q') | crontab -"}</span>
                              <button onClick={() => copyText("(crontab -l 2>/dev/null; echo '* * * * * cd ~/.openclaw/workspace && git pull -q') | crontab -", 'cron')} className="text-gray-600 hover:text-white ml-2 shrink-0">
                                {copied === "cron" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">OpenClaw reads from ~/.openclaw/workspace/ — updated files are picked up automatically.</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setSetupStep(2)} className="bg-gray-800 text-gray-300 px-5 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors">Back</button>
                    <button onClick={() => setSetupStep(4)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                      Done — verify it works <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* Step 4: Verify & Go */}
              {setupStep === 4 && createdRepo && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Wifi className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">You're all set!</h2>
                    <p className="text-gray-400 text-sm">
                      Your agent is connected. Edit files in ClawSync and they'll sync to your {platform === "mac" ? "Mac" : "VPS"}.
                    </p>
                  </div>

                  <div className="bg-gray-950 rounded-xl p-5 mb-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">How it works now</div>
                    <div className="flex items-center justify-center gap-3 text-center flex-wrap">
                      <div className="bg-gray-800 rounded-lg px-3 py-2.5">
                        <div className="text-xs font-medium text-white">Edit in ClawSync</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <div className="bg-gray-800 rounded-lg px-3 py-2.5">
                        <div className="text-xs font-medium text-white">Saved to GitHub</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <div className="bg-gray-800 rounded-lg px-3 py-2.5">
                        <div className="text-xs font-medium text-white">{platform === "mac" ? "Mac syncs both ways" : "VPS auto-pulls"}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <div className="bg-gray-800 rounded-lg px-3 py-2.5">
                        <div className="text-xs font-medium text-white">OpenClaw reads it</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                      <Wifi className="w-4 h-4 text-emerald-400" />
                      <strong>Want to verify sync is working?</strong>
                    </div>
                    <p className="text-xs text-gray-500">Open your agent and click "Sync Check" to send a test file and confirm it arrives on your {platform === "mac" ? "Mac" : "VPS"}.</p>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={createdRepo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 text-gray-300 px-5 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <GitBranch className="w-4 h-4" />
                      View on GitHub
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => { closeSetupFlow(); navigate(`/agent/${createdRepo.full_name}`); }}
                      className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Open Agent Editor <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* Repos grid */}
        {repos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No agents yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first agent to get started. Each agent is a private
              GitHub repo with SOUL.md, MEMORY.md, and other knowledge files.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="text-left bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/50 hover:bg-gray-900 transition-all group relative"
              >
                <button
                  onClick={() => navigate(`/agent/${repo.full_name}`)}
                  className="text-left w-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Bot className="w-5 h-5 text-emerald-400" />
                    </div>
                    {repo.private ? (
                      <Lock className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Globe className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-emerald-400 transition-colors">
                    {repo.name}
                  </h3>
                  {repo.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {timeAgo(repo.updated_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {repo.default_branch}
                    </span>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(repo); }}
                  className="absolute top-4 right-4 p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete agent"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Import Existing Repo Modal */}
        {showImport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
              {importResult ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Repo Imported!</h3>
                      <p className="text-sm text-gray-400">{importResult.repo.full_name}</p>
                    </div>
                  </div>

                  {importResult.markdown_files.length > 0 ? (
                    <div className="mb-4">
                      <p className="text-sm text-gray-300 mb-3">
                        Found <strong className="text-emerald-400">{importResult.markdown_files.length}</strong> markdown/text file{importResult.markdown_files.length !== 1 ? "s" : ""}:
                      </p>
                      <div className="bg-gray-950 border border-gray-700 rounded-xl max-h-48 overflow-y-auto">
                        {importResult.markdown_files.map((f) => (
                          <div key={f.path} className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 last:border-0 text-sm">
                            <FileIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-gray-300 truncate font-mono text-xs">{f.path}</span>
                            <span className="text-gray-600 text-xs ml-auto shrink-0">{f.size > 1024 ? `${(f.size / 1024).toFixed(1)}KB` : `${f.size}B`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-950 border border-gray-700 rounded-xl p-4 mb-4 text-center">
                      <p className="text-sm text-gray-400">No markdown files found yet. You can create them in the editor.</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowImport(false); setImportResult(null); setImportSearch(""); }}
                      className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => { setShowImport(false); setImportResult(null); setImportSearch(""); navigate(`/agent/${importResult.repo.full_name}`); }}
                      className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Open in Editor <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Open Existing Repo</h3>
                      <p className="text-sm text-gray-400">Pick a repo — ClawSync will find all markdown files</p>
                    </div>
                  </div>

                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={importSearch}
                      onChange={(e) => setImportSearch(e.target.value)}
                      placeholder="Search your repos..."
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0 border border-gray-700 rounded-xl bg-gray-950">
                    {loadingRepos ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                      </div>
                    ) : (
                      allRepos
                        .filter((r) => {
                          const q = importSearch.toLowerCase();
                          return !q || r.name.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q);
                        })
                        .map((r) => {
                          const alreadyImported = repos.some((ar) => ar.full_name === r.full_name);
                          return (
                            <button
                              key={r.id}
                              disabled={!!importing || alreadyImported}
                              onClick={() => handleImport(r.full_name)}
                              className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-900 transition-colors text-left disabled:opacity-50"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{r.name}</div>
                                <div className="text-xs text-gray-500 truncate">{r.full_name}</div>
                              </div>
                              {alreadyImported ? (
                                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg shrink-0">Already added</span>
                              ) : importing === r.full_name ? (
                                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                              ) : (
                                <span className="text-xs text-gray-500 group-hover:text-emerald-400 shrink-0">{r.private ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}</span>
                              )}
                            </button>
                          );
                        })
                    )}
                    {!loadingRepos && allRepos.filter((r) => {
                      const q = importSearch.toLowerCase();
                      return !q || r.name.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="py-8 text-center text-sm text-gray-500">
                        {importSearch ? "No repos match your search" : "No repos found"}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { setShowImport(false); setImportSearch(""); setAllRepos([]); }}
                    className="mt-3 w-full bg-gray-800 text-gray-300 py-2.5 rounded-xl font-medium hover:bg-gray-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Delete Agent</h3>
                  <p className="text-sm text-gray-400">This cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong>?
              </p>
              <p className="text-gray-500 text-xs mb-6">
                This will permanently delete the GitHub repository <strong>{deleteTarget.full_name}</strong> and all its files, commits, and history.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick-start guide (collapsed by default if user has agents) */}
        <div className="mt-12 bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-2">How ClawSync Works</h2>
          <p className="text-gray-400 mb-6">
            Set up once — then every edit you make here automatically reaches your OpenClaw agent.
          </p>

          <div className="bg-gray-950 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 text-center flex-wrap">
              <div className="bg-gray-800 rounded-lg px-4 py-3 min-w-28">
                <div className="text-xs font-medium text-white">Create agent above</div>
                <div className="text-xs text-gray-500">GitHub repo + files</div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="bg-gray-800 rounded-lg px-4 py-3 min-w-28">
                <div className="text-xs font-medium text-white">Edit in ClawSync</div>
                <div className="text-xs text-gray-500">Visual markdown editor</div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="bg-gray-800 rounded-lg px-4 py-3 min-w-28">
                <div className="text-xs font-medium text-white">VPS auto-pulls</div>
                <div className="text-xs text-gray-500">Every 60 seconds</div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="bg-gray-800 rounded-lg px-4 py-3 min-w-28">
                <div className="text-xs font-medium text-white">OpenClaw reads it</div>
                <div className="text-xs text-gray-500">Always up to date</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://github.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-emerald-500/30 transition-colors group"
            >
              <Key className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">Add SSH Key to GitHub</div>
                <div className="text-xs text-gray-500">Required for VPS to pull from private repos</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-emerald-400" />
            </a>
            <a
              href="https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-emerald-500/30 transition-colors group"
            >
              <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">SSH Key Guide</div>
                <div className="text-xs text-gray-500">GitHub's official guide to generating SSH keys</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-emerald-400" />
            </a>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Click <strong className="text-emerald-400">"New Agent"</strong> above to get started — the setup wizard will walk you through every step with clickable links.
          </p>
        </div>
      </div>
    </div>
  );
}
