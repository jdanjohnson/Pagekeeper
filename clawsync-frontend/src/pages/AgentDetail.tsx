import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { listFiles, listMarkdownFiles, getFile, updateFile, createFile, getSyncStatus, createSyncTest, deleteSyncTest, listBranches, createBranch, compareBranches, mergeBranch, deleteBranch } from "../lib/api";
import MDEditor from "@uiw/react-md-editor";
import {
  ArrowLeft,
  FileText,
  FolderOpen,
  Save,
  Clock,
  Plus,
  Zap,
  Check,
  X,
  Bot,
  Brain,
  User,
  Settings,
  Heart,
  Wrench,
  Shield,
  BookOpen,
  RefreshCw,
  Terminal,
  CheckCircle,
  AlertCircle,
  Copy,
  Trash2,
  Wifi,
  GitBranch,
  GitMerge,
  GitPullRequest,
  ChevronDown,
  FileDiff,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface FileItem {
  name: string;
  path: string;
  type: string;
  size: number;
  sha: string;
}

interface FileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
}

const FILE_ICONS: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  "SOUL.md": { icon: Heart, color: "text-pink-400", label: "Agent Personality" },
  "MEMORY.md": { icon: Brain, color: "text-purple-400", label: "Knowledge Base" },
  "USER.md": { icon: User, color: "text-blue-400", label: "User Preferences" },
  "AGENTS.md": { icon: Settings, color: "text-yellow-400", label: "Operational Instructions" },
  "IDENTITY.md": { icon: Shield, color: "text-emerald-400", label: "Agent Identity" },
  "TOOLS.md": { icon: Wrench, color: "text-orange-400", label: "Tool Configuration" },
  "HEARTBEAT.md": { icon: Heart, color: "text-red-400", label: "Periodic Behavior" },
  "BOOTSTRAP.md": { icon: Zap, color: "text-cyan-400", label: "Startup Ritual" },
};

const CREATABLE_FILES = [
  { name: "SOUL.md", content: "# Soul\n\nDefine your agent's personality, tone, and boundaries here.\n\n## Personality\n\n## Boundaries\n" },
  { name: "MEMORY.md", content: "# Memory\n\nYour agent stores learned knowledge here.\n\n## Key Facts\n\n## Learned Patterns\n" },
  { name: "USER.md", content: "# User\n\nInformation about you for the agent.\n\n## Preferences\n\n## Context\n" },
  { name: "AGENTS.md", content: "# Agents\n\nOperational instructions.\n\n## Priorities\n\n## Workflow\n" },
  { name: "IDENTITY.md", content: "# Identity\n\n## Name\n\n## Role\n\n## Goals\n" },
  { name: "TOOLS.md", content: "# Tools\n\nEnvironment notes for tools.\n\n## Setup\n\n## Conventions\n" },
  { name: "HEARTBEAT.md", content: "# Heartbeat\n\nPeriodic behavior config.\n\n## Check Cadence\n\n## Ritual\n" },
];

export default function AgentDetail() {
  const { "*": fullName } = useParams();
  const navigate = useNavigate();
  const [owner, repo] = (fullName || "").split("/");

  const [files, setFiles] = useState<FileItem[]>([]);
  const [allMdFiles, setAllMdFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncTestResult, setSyncTestResult] = useState<any>(null);
  const [syncTestRunning, setSyncTestRunning] = useState(false);
  const [copied, setCopied] = useState("");

  // Advanced mode state
  const [advancedMode, setAdvancedMode] = useState(false);
  const [branches, setBranches] = useState<{name: string; sha: string; protected: boolean}[]>([]);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<string | null>(null);
  const [commitMsg, setCommitMsg] = useState("");

  useEffect(() => {
    if (!owner || !repo) return;
    loadFiles();
  }, [owner, repo]);

  const loadFiles = async (_branch?: string) => {
    setLoading(true);
    try {
      // Fetch both root files and all markdown files recursively
      const [rootData, mdData] = await Promise.all([
        listFiles(owner, repo, ""),
        listMarkdownFiles(owner, repo),
      ]);
      setFiles(rootData.files);
      setAllMdFiles(mdData.files || []);

      // Combine: root-level files + nested markdown files not already in root
      const rootPaths = new Set((rootData.files || []).map((f: FileItem) => f.path));
      const nestedMd = (mdData.files || []).filter((f: FileItem) => !rootPaths.has(f.path));
      const combined = [...(rootData.files || []).filter((f: FileItem) => f.type === "file"), ...nestedMd];

      // Auto-select first .md file
      const mdFile = combined.find((f: FileItem) => f.name.endsWith(".md"));
      if (mdFile) {
        await loadFile(mdFile.path);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadBranches = async () => {
    try {
      const data = await listBranches(owner, repo);
      setBranches(data.branches);
      // Find default branch
      const main = data.branches.find((b: any) => b.name === "main" || b.name === "master");
      if (main) setDefaultBranch(main.name);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAdvanced = async () => {
    const next = !advancedMode;
    setAdvancedMode(next);
    if (next) {
      await loadBranches();
    } else {
      setCurrentBranch(defaultBranch);
      setShowDiff(false);
      setDiffData(null);
    }
  };

  const handleSwitchBranch = async (branch: string) => {
    setCurrentBranch(branch);
    setShowBranchMenu(false);
    setShowDiff(false);
    setDiffData(null);
    await loadFiles(branch);
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setCreatingBranch(true);
    try {
      await createBranch(owner, repo, newBranchName.trim(), currentBranch);
      await loadBranches();
      setCurrentBranch(newBranchName.trim());
      setShowNewBranch(false);
      setNewBranchName("");
      await loadFiles(newBranchName.trim());
    } catch (e: any) {
      alert(e?.message || "Failed to create branch");
    }
    setCreatingBranch(false);
  };

  const handleLoadDiff = async () => {
    if (currentBranch === defaultBranch) return;
    setDiffLoading(true);
    setShowDiff(true);
    try {
      const data = await compareBranches(owner, repo, defaultBranch, currentBranch);
      setDiffData(data);
    } catch (e) {
      console.error(e);
      setDiffData(null);
    }
    setDiffLoading(false);
  };

  const handleMerge = async () => {
    setMerging(true);
    setMergeResult(null);
    try {
      const result = await mergeBranch(owner, repo, currentBranch, defaultBranch, commitMsg);
      setMergeResult(result.merged ? "Merged successfully!" : result.message);
      // Optionally delete branch after merge
      try { await deleteBranch(owner, repo, currentBranch); } catch (_) {}
      await loadBranches();
      setCurrentBranch(defaultBranch);
      await loadFiles(defaultBranch);
      setShowDiff(false);
      setDiffData(null);
      setCommitMsg("");
      setTimeout(() => setMergeResult(null), 3000);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("409")) {
        setMergeResult("Merge conflict — resolve manually on GitHub");
      } else {
        setMergeResult("Merge failed: " + msg);
      }
    }
    setMerging(false);
  };

  const loadFile = async (path: string) => {
    try {
      const data = await getFile(owner, repo, path);
      setSelectedFile(data);
      setEditContent(data.content);
      setSaved(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const msg = advancedMode && currentBranch !== defaultBranch
        ? `Update ${selectedFile.path} on ${currentBranch} via ClawSync`
        : undefined;
      const result = await updateFile(
        owner,
        repo,
        selectedFile.path,
        editContent,
        selectedFile.sha,
        msg
      );
      // Update sha from response
      const newSha = result?.content?.sha || selectedFile.sha;
      setSelectedFile({ ...selectedFile, sha: newSha, content: editContent });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to save. The file may have been modified externally.");
    }
    setSaving(false);
  };

  const handleCreateFile = async (name: string, content: string) => {
    setCreatingFile(true);
    try {
      await createFile(owner, repo, name, content);
      await loadFiles();
      await loadFile(name);
      setShowNewFile(false);
    } catch (e) {
      console.error(e);
    }
    setCreatingFile(false);
  };

  const existingFileNames = files.map((f) => f.name);
  const availableFiles = CREATABLE_FILES.filter(
    (f) => !existingFileNames.includes(f.name)
  );

  const hasUnsavedChanges =
    selectedFile && editContent !== selectedFile.content;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-sm">{repo}</div>
              <div className="text-xs text-gray-500">{owner}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setShowSync(!showSync);
              if (!showSync && !syncStatus) {
                setSyncLoading(true);
                try {
                  const status = await getSyncStatus(owner, repo);
                  setSyncStatus(status);
                } catch (e) { console.error(e); }
                setSyncLoading(false);
              }
            }}
            className={`transition-colors flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${
              showSync ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-gray-400 hover:text-white bg-gray-800"
            }`}
          >
            <Wifi className="w-4 h-4" />
            Sync Check
          </button>
          <button
            onClick={() => navigate(`/timeline/${owner}/${repo}`)}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm bg-gray-800 px-3 py-1.5 rounded-lg"
          >
            <Clock className="w-4 h-4" />
            Timeline
          </button>
          <button
            onClick={handleToggleAdvanced}
            className={`transition-colors flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${
              advancedMode ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-400 hover:text-white bg-gray-800"
            }`}
          >
            {advancedMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            Advanced
          </button>
          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
          )}
          {saved && !hasUnsavedChanges && (
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
        </div>
      </nav>

      {/* Advanced Mode: Branch Bar */}
      {advancedMode && (
        <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-2.5 shrink-0 flex items-center gap-3">
          {/* Branch picker */}
          <div className="relative">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-2 text-sm bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg hover:border-purple-500/50 transition-colors"
            >
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span className="font-medium">{currentBranch}</span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
            {showBranchMenu && (
              <div className="absolute top-full mt-1 left-0 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 min-w-[220px] py-1 max-h-64 overflow-y-auto">
                {branches.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => handleSwitchBranch(b.name)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors ${
                      b.name === currentBranch ? "text-purple-400 bg-purple-500/10" : "text-gray-300"
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    {b.name}
                    {b.name === defaultBranch && (
                      <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded ml-auto">default</span>
                    )}
                    {b.protected && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded ml-auto">protected</span>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-700 mt-1 pt-1">
                  <button
                    onClick={() => { setShowBranchMenu(false); setShowNewBranch(true); }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-emerald-400 hover:bg-gray-800 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Create new branch
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current branch info */}
          {currentBranch !== defaultBranch && (
            <>
              <span className="text-xs text-gray-500">branched from {defaultBranch}</span>
              <button
                onClick={handleLoadDiff}
                disabled={diffLoading}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors ml-auto"
              >
                {diffLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileDiff className="w-4 h-4" />
                )}
                View Changes
              </button>
              <button
                onClick={() => setShowDiff(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                <GitMerge className="w-4 h-4" />
                Merge to {defaultBranch}
              </button>
            </>
          )}
          {currentBranch === defaultBranch && (
            <span className="text-xs text-gray-500 ml-auto">You are on the default branch. Create a new branch to make changes safely.</span>
          )}
        </div>
      )}

      {/* Diff / Merge Panel */}
      {advancedMode && showDiff && currentBranch !== defaultBranch && (
        <div className="border-b border-gray-800 bg-gray-900/80 px-6 py-5 shrink-0 overflow-y-auto max-h-[50vh]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-purple-400" />
                Merge <span className="text-purple-400 font-mono text-sm bg-purple-500/10 px-2 py-0.5 rounded">{currentBranch}</span>
                <ArrowLeft className="w-4 h-4 text-gray-500 rotate-180" />
                <span className="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-2 py-0.5 rounded">{defaultBranch}</span>
              </h3>
              <button onClick={() => { setShowDiff(false); setMergeResult(null); }} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {diffLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading diff...
              </div>
            ) : diffData ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{diffData.total_commits} commit{diffData.total_commits !== 1 ? "s" : ""} ahead</span>
                  <span className="text-emerald-400">+{diffData.files.reduce((s: number, f: any) => s + f.additions, 0)}</span>
                  <span className="text-red-400">-{diffData.files.reduce((s: number, f: any) => s + f.deletions, 0)}</span>
                  <span className="text-gray-500">{diffData.files.length} file{diffData.files.length !== 1 ? "s" : ""} changed</span>
                </div>

                {/* Commits */}
                {diffData.commits.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Commits</h4>
                    {diffData.commits.map((c: any) => (
                      <div key={c.sha} className="flex items-center gap-3 text-sm bg-gray-950 rounded-lg px-3 py-2">
                        <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{c.sha}</span>
                        <span className="text-gray-300 truncate">{c.message}</span>
                        <span className="text-xs text-gray-600 ml-auto whitespace-nowrap">{new Date(c.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* File diffs */}
                {diffData.files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Files Changed</h4>
                    {diffData.files.map((f: any) => (
                      <div key={f.filename} className="bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
                        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-200">{f.filename}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            f.status === "added" ? "bg-emerald-500/20 text-emerald-400" :
                            f.status === "removed" ? "bg-red-500/20 text-red-400" :
                            f.status === "renamed" ? "bg-blue-500/20 text-blue-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>{f.status}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            <span className="text-emerald-400">+{f.additions}</span>{" "}
                            <span className="text-red-400">-{f.deletions}</span>
                          </span>
                        </div>
                        {f.patch && (
                          <pre className="p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                            {f.patch.split("\n").map((line: string, i: number) => (
                              <div
                                key={i}
                                className={`px-2 ${
                                  line.startsWith("+") ? "bg-emerald-500/10 text-emerald-300" :
                                  line.startsWith("-") ? "bg-red-500/10 text-red-300" :
                                  line.startsWith("@@") ? "text-purple-400" :
                                  "text-gray-400"
                                }`}
                              >
                                {line}
                              </div>
                            ))}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Merge controls */}
                <div className="bg-gray-950 border border-gray-700 rounded-xl p-4 mt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-emerald-400" />
                    Merge into {defaultBranch}
                  </h4>
                  <input
                    type="text"
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    placeholder={`Merge ${currentBranch} into ${defaultBranch} via ClawSync`}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 mb-3"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleMerge}
                      disabled={merging}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {merging ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <GitMerge className="w-4 h-4" />
                      )}
                      {merging ? "Merging..." : "Confirm Merge"}
                    </button>
                    <button
                      onClick={() => { setShowDiff(false); setMergeResult(null); }}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    {mergeResult && (
                      <span className={`text-sm ml-2 ${
                        mergeResult.includes("success") ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {mergeResult}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Click "View Changes" to load the diff between branches.</div>
            )}
          </div>
        </div>
      )}

      {/* Sync Check Panel */}
      {showSync && (
        <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-5 shrink-0 overflow-y-auto max-h-96">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-400" />
                VPS Sync Checker
              </h3>
              <button onClick={() => setShowSync(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {syncLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading sync status...
              </div>
            ) : syncStatus ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Setup Instructions */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">VPS Setup</h4>
                  <div className="space-y-2">
                    <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs">
                      <div className="text-gray-500 mb-1"># 1. Clone on your VPS</div>
                      <div className="text-emerald-400 flex items-center justify-between group">
                        <span className="truncate">git clone {syncStatus.clone_url_ssh} ~/.openclaw/workspace</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(`git clone ${syncStatus.clone_url_ssh} ~/.openclaw/workspace`); setCopied("clone"); setTimeout(() => setCopied(""), 2000); }}
                          className="text-gray-600 hover:text-white ml-2 shrink-0"
                        >
                          {copied === "clone" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs">
                      <div className="text-gray-500 mb-1"># 2. Auto-sync every minute</div>
                      <div className="text-emerald-400 flex items-center justify-between group">
                        <span className="truncate">{`(crontab -l 2>/dev/null; echo '* * * * * cd ~/.openclaw/workspace && git pull -q') | crontab -`}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(`(crontab -l 2>/dev/null; echo '* * * * * cd ~/.openclaw/workspace && git pull -q') | crontab -`); setCopied("cron"); setTimeout(() => setCopied(""), 2000); }}
                          className="text-gray-600 hover:text-white ml-2 shrink-0"
                        >
                          {copied === "cron" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {syncStatus.latest_commit && (
                    <div className="mt-4 text-xs text-gray-500">
                      <span className="text-gray-400">Latest commit:</span>{" "}
                      <span className="text-emerald-400 font-mono">{syncStatus.latest_commit.sha}</span>{" "}
                      — {syncStatus.latest_commit.message}
                    </div>
                  )}
                </div>

                {/* Right: Sync Test */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Run Sync Test</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    This creates a test file in your GitHub repo. If it appears on your VPS, sync is working.
                  </p>

                  <button
                    onClick={async () => {
                      setSyncTestRunning(true);
                      try {
                        const result = await createSyncTest(owner, repo);
                        setSyncTestResult(result);
                        const status = await getSyncStatus(owner, repo);
                        setSyncStatus(status);
                      } catch (e) { console.error(e); }
                      setSyncTestRunning(false);
                    }}
                    disabled={syncTestRunning}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 mb-3"
                  >
                    {syncTestRunning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Terminal className="w-4 h-4" />
                    )}
                    {syncTestRunning ? "Creating test..." : "Send Sync Test"}
                  </button>

                  {syncTestResult && (
                    <div className="bg-gray-950 border border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
                        <CheckCircle className="w-4 h-4" />
                        Test file created!
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        Now check on your VPS:
                      </div>
                      <div className="bg-gray-900 rounded p-2 font-mono text-xs text-emerald-400 flex items-center justify-between">
                        <span>{syncTestResult.command}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(syncTestResult.command); setCopied("cmd"); setTimeout(() => setCopied(""), 2000); }}
                          className="text-gray-600 hover:text-white ml-2"
                        >
                          {copied === "cmd" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Expected: <span className="text-white font-mono">{syncTestResult.expected}</span>
                      </div>
                      <button
                        onClick={async () => {
                          await deleteSyncTest(owner, repo);
                          setSyncTestResult(null);
                          const status = await getSyncStatus(owner, repo);
                          setSyncStatus(status);
                        }}
                        className="text-xs text-gray-500 hover:text-red-400 mt-2 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clean up test file
                      </button>
                    </div>
                  )}

                  {!syncTestResult && syncStatus.test_file && (
                    <div className="bg-gray-950 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
                        <AlertCircle className="w-4 h-4" />
                        Previous test file found
                      </div>
                      <div className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                        {syncStatus.test_file.content}
                      </div>
                      <button
                        onClick={async () => {
                          await deleteSyncTest(owner, repo);
                          const status = await getSyncStatus(owner, repo);
                          setSyncStatus(status);
                        }}
                        className="text-xs text-gray-500 hover:text-red-400 mt-2 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clean up test file
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Unable to load sync status.</div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - File list */}
        <div className="w-64 border-r border-gray-800 overflow-y-auto shrink-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Knowledge Files
              </h3>
              {availableFiles.length > 0 && (
                <button
                  onClick={() => setShowNewFile(true)}
                  className="text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Root-level files */}
            {files
              .filter((f) => f.type === "file")
              .map((file) => {
                const meta = FILE_ICONS[file.name] || {
                  icon: FileText,
                  color: "text-gray-400",
                  label: "",
                };
                const Icon = meta.icon;
                const isSelected = selectedFile?.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => loadFile(file.path)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isSelected ? "text-emerald-400" : meta.color
                      }`}
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-medium truncate ${
                          isSelected ? "text-emerald-400" : "text-gray-200"
                        }`}
                      >
                        {file.name}
                      </div>
                      {meta.label && (
                        <div className="text-xs text-gray-500">{meta.label}</div>
                      )}
                    </div>
                  </button>
                );
              })}

            {/* Nested markdown files (from subdirectories) */}
            {(() => {
              const rootPaths = new Set(files.map((f) => f.path));
              const nested = allMdFiles.filter((f) => !rootPaths.has(f.path));
              if (nested.length === 0) return null;

              // Group by directory
              const groups: Record<string, FileItem[]> = {};
              nested.forEach((f) => {
                const dir = f.path.includes("/") ? f.path.substring(0, f.path.lastIndexOf("/")) : "";
                if (!groups[dir]) groups[dir] = [];
                groups[dir].push(f);
              });

              return (
                <>
                  {Object.keys(groups).length > 0 && (
                    <div className="mt-3 mb-2 border-t border-gray-800 pt-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                        All Markdown Files
                      </h3>
                    </div>
                  )}
                  {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([dir, dirFiles]) => (
                    <div key={dir}>
                      {dir && (
                        <div className="flex items-center gap-2 px-2 py-1.5 text-gray-500">
                          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-medium truncate">{dir}/</span>
                        </div>
                      )}
                      {dirFiles.map((file) => {
                        const isSelected = selectedFile?.path === file.path;
                        return (
                          <button
                            key={file.path}
                            onClick={() => loadFile(file.path)}
                            className={`w-full text-left px-3 py-2 rounded-xl mb-0.5 flex items-start gap-2.5 transition-colors ${
                              dir ? "pl-7" : ""
                            } ${
                              isSelected
                                ? "bg-emerald-500/10 border border-emerald-500/30"
                                : "hover:bg-gray-800/50 border border-transparent"
                            }`}
                          >
                            <FileText
                              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                isSelected ? "text-emerald-400" : "text-gray-400"
                              }`}
                            />
                            <div className="min-w-0">
                              <div
                                className={`text-sm font-medium truncate ${
                                  isSelected ? "text-emerald-400" : "text-gray-200"
                                }`}
                              >
                                {file.name}
                              </div>
                              <div className="text-[10px] text-gray-600 truncate">{file.path}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              );
            })()}

            {/* Folders (non-markdown) */}
            {files
              .filter((f) => f.type === "dir")
              .map((dir) => (
                <div
                  key={dir.path}
                  className="w-full text-left px-3 py-2.5 rounded-xl mb-1 flex items-center gap-3 text-gray-500"
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{dir.name}/</span>
                </div>
              ))}
          </div>
        </div>

        {/* Main editor area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  {hasUnsavedChanges && (
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {editContent.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
              <div className="flex-1 overflow-auto" data-color-mode="dark">
                <MDEditor
                  value={editContent}
                  onChange={(val) => setEditContent(val || "")}
                  height="100%"
                  preview="edit"
                  hideToolbar={false}
                  visibleDragbar={false}
                  style={{
                    background: "transparent",
                    minHeight: "100%",
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">
                  Select a file to edit
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Branch Modal */}
      {showNewBranch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                Create Branch
              </h2>
              <button onClick={() => { setShowNewBranch(false); setNewBranchName(""); }} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Create a new branch from <span className="text-purple-400 font-mono">{currentBranch}</span> to make changes safely before merging.
            </p>
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value.replace(/[^a-zA-Z0-9_\-/.]/g, ""))}
              placeholder="e.g. update-soul-personality"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 mb-4"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateBranch(); }}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim() || creatingBranch}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {creatingBranch ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GitBranch className="w-4 h-4" />
                )}
                {creatingBranch ? "Creating..." : "Create Branch"}
              </button>
              <button
                onClick={() => { setShowNewBranch(false); setNewBranchName(""); }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New file modal */}
      {showNewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Knowledge File</h2>
              <button
                onClick={() => setShowNewFile(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {availableFiles.map((f) => {
                const meta = FILE_ICONS[f.name] || {
                  icon: FileText,
                  color: "text-gray-400",
                  label: f.name,
                };
                const Icon = meta.icon;
                return (
                  <button
                    key={f.name}
                    onClick={() => handleCreateFile(f.name, f.content)}
                    disabled={creatingFile}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/50 transition-colors disabled:opacity-50"
                  >
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                    <div>
                      <div className="font-medium text-sm">{f.name}</div>
                      <div className="text-xs text-gray-500">{meta.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
