import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { listFiles, listMarkdownFiles, getFile, updateFile, createFile, getSyncStatus, createSyncTest, deleteSyncTest, listBranches, createBranch, compareBranches, mergeBranch, deleteBranch } from "../lib/api";
import MDEditor from "@uiw/react-md-editor";
import {
  ArrowLeft, FileText, FolderOpen, Save, Clock, Plus, Zap, Check, X, Bot, Brain, User,
  Settings, Heart, Wrench, Shield, BookOpen, Terminal, CheckCircle, AlertCircle,
  Copy, Trash2, Wifi, GitBranch, GitMerge, GitPullRequest, ChevronDown, FileDiff,
  PlusCircle, ToggleLeft, ToggleRight, Loader2,
} from "lucide-react";

interface FileItem { name: string; path: string; type: string; size: number; sha: string; }
interface FileContent { name: string; path: string; sha: string; size: number; content: string; }

const C = {
  cream: '#faf7f2', creamDark: '#f0ebe0', paper: '#ffffff',
  ink: '#1a1714', inkMid: '#5a5450', inkLight: '#9e9890', inkFaint: '#d4cfc7',
  claw: '#e8622a', clawLight: '#fde8de', clawMid: '#f4a07a',
  green: '#2d7a4f', greenLight: '#e0f2e9',
  blue: '#3b82f6', blueLight: '#dbeafe',
  purple: '#8b5cf6', purpleLight: '#ede9fe',
};

const FILE_ICONS: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  "SOUL.md": { icon: Heart, color: C.clawMid, label: "Agent Personality" },
  "MEMORY.md": { icon: Brain, color: C.purple, label: "Knowledge Base" },
  "USER.md": { icon: User, color: C.blue, label: "User Preferences" },
  "AGENTS.md": { icon: Settings, color: C.claw, label: "Operational Instructions" },
  "IDENTITY.md": { icon: Shield, color: C.green, label: "Agent Identity" },
  "TOOLS.md": { icon: Wrench, color: C.inkMid, label: "Tool Configuration" },
  "HEARTBEAT.md": { icon: Heart, color: '#dc2626', label: "Periodic Behavior" },
  "BOOTSTRAP.md": { icon: Zap, color: C.claw, label: "Startup Ritual" },
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

/* ---- shared inline-style helpers ---- */
const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${C.inkFaint}`,
  borderRadius: 14,
  ...extra,
});

const btnPrimary: React.CSSProperties = {
  background: C.claw, color: '#fff', border: 'none', borderRadius: 10,
  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
  fontFamily: "'Instrument Sans', sans-serif",
};
const btnSecondary: React.CSSProperties = {
  background: C.creamDark, color: C.inkMid, border: `1px solid ${C.inkFaint}`, borderRadius: 10,
  padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
  fontFamily: "'Instrument Sans', sans-serif",
};
const inputStyle: React.CSSProperties = {
  width: '100%', background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 10,
  padding: '8px 14px', fontSize: 13, color: C.ink, outline: 'none',
  fontFamily: "'Instrument Sans', sans-serif",
};

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

  useEffect(() => { if (owner && repo) loadFiles(); }, [owner, repo]);

  const loadFiles = async (_branch?: string) => {
    setLoading(true);
    try {
      const [rootData, mdData] = await Promise.all([listFiles(owner, repo, ""), listMarkdownFiles(owner, repo)]);
      setFiles(rootData.files);
      setAllMdFiles(mdData.files || []);
      const rootPaths = new Set((rootData.files || []).map((f: FileItem) => f.path));
      const nestedMd = (mdData.files || []).filter((f: FileItem) => !rootPaths.has(f.path));
      const combined = [...(rootData.files || []).filter((f: FileItem) => f.type === "file"), ...nestedMd];
      const mdFile = combined.find((f: FileItem) => f.name.endsWith(".md"));
      if (mdFile) await loadFile(mdFile.path);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadBranches = async () => {
    try {
      const data = await listBranches(owner, repo);
      setBranches(data.branches);
      const main = data.branches.find((b: any) => b.name === "main" || b.name === "master");
      if (main) setDefaultBranch(main.name);
    } catch (e) { console.error(e); }
  };

  const handleToggleAdvanced = async () => {
    const next = !advancedMode;
    setAdvancedMode(next);
    if (next) await loadBranches();
    else { setCurrentBranch(defaultBranch); setShowDiff(false); setDiffData(null); }
  };

  const handleSwitchBranch = async (branch: string) => {
    setCurrentBranch(branch); setShowBranchMenu(false); setShowDiff(false); setDiffData(null);
    await loadFiles(branch);
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setCreatingBranch(true);
    try {
      await createBranch(owner, repo, newBranchName.trim(), currentBranch);
      await loadBranches();
      setCurrentBranch(newBranchName.trim());
      setShowNewBranch(false); setNewBranchName("");
      await loadFiles(newBranchName.trim());
    } catch (e: any) { alert(e?.message || "Failed to create branch"); }
    setCreatingBranch(false);
  };

  const handleLoadDiff = async () => {
    if (currentBranch === defaultBranch) return;
    setDiffLoading(true); setShowDiff(true);
    try { const data = await compareBranches(owner, repo, defaultBranch, currentBranch); setDiffData(data); }
    catch (e) { console.error(e); setDiffData(null); }
    setDiffLoading(false);
  };

  const handleMerge = async () => {
    setMerging(true); setMergeResult(null);
    try {
      const result = await mergeBranch(owner, repo, currentBranch, defaultBranch, commitMsg);
      setMergeResult(result.merged ? "Merged successfully!" : result.message);
      try { await deleteBranch(owner, repo, currentBranch); } catch (_) {}
      await loadBranches();
      setCurrentBranch(defaultBranch);
      await loadFiles(defaultBranch);
      setShowDiff(false); setDiffData(null); setCommitMsg("");
      setTimeout(() => setMergeResult(null), 3000);
    } catch (e: any) {
      const msg = e?.message || "";
      setMergeResult(msg.includes("409") ? "Merge conflict — resolve manually on GitHub" : "Merge failed: " + msg);
    }
    setMerging(false);
  };

  const loadFile = async (path: string) => {
    try { const data = await getFile(owner, repo, path); setSelectedFile(data); setEditContent(data.content); setSaved(false); }
    catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const msg = advancedMode && currentBranch !== defaultBranch
        ? `Update ${selectedFile.path} on ${currentBranch} via Pagekeeper` : undefined;
      const result = await updateFile(owner, repo, selectedFile.path, editContent, selectedFile.sha, msg);
      const newSha = result?.content?.sha || selectedFile.sha;
      setSelectedFile({ ...selectedFile, sha: newSha, content: editContent });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); alert("Failed to save. The file may have been modified externally."); }
    setSaving(false);
  };

  const handleCreateFile = async (name: string, content: string) => {
    setCreatingFile(true);
    try { await createFile(owner, repo, name, content); await loadFiles(); await loadFile(name); setShowNewFile(false); }
    catch (e) { console.error(e); }
    setCreatingFile(false);
  };

  const existingFileNames = files.map((f) => f.name);
  const availableFiles = CREATABLE_FILES.filter((f) => !existingFileNames.includes(f.name));
  const hasUnsavedChanges = selectedFile && editContent !== selectedFile.content;

  const copyText = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 28, height: 28, color: C.claw }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, color: C.ink, fontFamily: "'Instrument Sans', -apple-system, sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700&family=Instrument+Sans:wght@400;500;600&display=swap');
        .pk-serif { font-family: 'Fraunces', Georgia, serif; }
        .pk-sans { font-family: 'Instrument Sans', -apple-system, sans-serif; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,247,242,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.inkFaint}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </button>
          <div style={{ width: 32, height: 32, background: C.clawLight, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot style={{ width: 16, height: 16, color: C.claw }} />
          </div>
          <div>
            <div className="pk-sans" style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{repo}</div>
            <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight }}>{owner}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Sync Check btn */}
          <button onClick={async () => {
            setShowSync(!showSync);
            if (!showSync && !syncStatus) {
              setSyncLoading(true);
              try { const status = await getSyncStatus(owner, repo); setSyncStatus(status); } catch (e) { console.error(e); }
              setSyncLoading(false);
            }
          }} style={{ ...btnSecondary, ...(showSync ? { background: C.clawLight, color: C.claw, borderColor: C.clawMid } : {}) }}>
            <Wifi style={{ width: 14, height: 14 }} />
            <span>Sync Check</span>
          </button>
          {/* Timeline btn */}
          <button onClick={() => navigate(`/timeline/${owner}/${repo}`)} style={btnSecondary}>
            <Clock style={{ width: 14, height: 14 }} />
            <span>Timeline</span>
          </button>
          {/* Advanced toggle */}
          <button onClick={handleToggleAdvanced} style={{ ...btnSecondary, ...(advancedMode ? { background: C.purpleLight, color: C.purple, borderColor: C.purple } : {}) }}>
            {advancedMode ? <ToggleRight style={{ width: 14, height: 14 }} /> : <ToggleLeft style={{ width: 14, height: 14 }} />}
            <span>Advanced</span>
          </button>
          {/* Save btn */}
          {hasUnsavedChanges && (
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : saved ? <Check style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
              <span>{saving ? "Saving..." : saved ? "Saved!" : "Save"}</span>
            </button>
          )}
          {saved && !hasUnsavedChanges && (
            <span style={{ color: C.green, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check style={{ width: 14, height: 14 }} /> Saved
            </span>
          )}
        </div>
      </nav>

      {/* Advanced Mode: Branch Bar */}
      {advancedMode && (
        <div style={{ borderBottom: `1px solid ${C.inkFaint}`, background: 'rgba(250,247,242,0.6)', padding: '8px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Branch picker */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowBranchMenu(!showBranchMenu)} style={{ ...btnSecondary, background: C.purpleLight, color: C.purple, borderColor: C.purple, padding: '6px 12px' }}>
              <GitBranch style={{ width: 14, height: 14 }} />
              <span style={{ fontWeight: 600, fontSize: 12 }}>{currentBranch}</span>
              <ChevronDown style={{ width: 12, height: 12 }} />
            </button>
            {showBranchMenu && (
              <div style={{ ...glass({ position: 'absolute', top: '100%', marginTop: 4, left: 0, zIndex: 50, minWidth: 220, padding: 4, maxHeight: 260, overflowY: 'auto' }) }}>
                {branches.map((b) => (
                  <button key={b.name} onClick={() => handleSwitchBranch(b.name)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 8, cursor: 'pointer', background: b.name === currentBranch ? C.purpleLight : 'transparent', color: b.name === currentBranch ? C.purple : C.inkMid, fontFamily: "'Instrument Sans', sans-serif" }}>
                    <GitBranch style={{ width: 13, height: 13 }} />
                    {b.name}
                    {b.name === defaultBranch && <span style={{ fontSize: 10, background: C.creamDark, color: C.inkLight, padding: '2px 6px', borderRadius: 4, marginLeft: 'auto' }}>default</span>}
                    {b.protected && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, marginLeft: 'auto' }}>protected</span>}
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${C.inkFaint}`, marginTop: 4, paddingTop: 4 }}>
                  <button onClick={() => { setShowBranchMenu(false); setShowNewBranch(true); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: C.claw, fontFamily: "'Instrument Sans', sans-serif" }}>
                    <PlusCircle style={{ width: 13, height: 13 }} /> Create new branch
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentBranch !== defaultBranch && (
            <>
              <span className="pk-sans" style={{ fontSize: 11, color: C.inkLight }}>branched from {defaultBranch}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={handleLoadDiff} disabled={diffLoading} style={{ ...btnSecondary, background: C.blueLight, color: C.blue, borderColor: C.blue, padding: '6px 12px', opacity: diffLoading ? 0.6 : 1 }}>
                  {diffLoading ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <FileDiff style={{ width: 13, height: 13 }} />}
                  <span style={{ fontSize: 12 }}>View Changes</span>
                </button>
                <button onClick={() => setShowDiff(true)} style={{ ...btnSecondary, background: C.greenLight, color: C.green, borderColor: C.green, padding: '6px 12px' }}>
                  <GitMerge style={{ width: 13, height: 13 }} />
                  <span style={{ fontSize: 12 }}>Merge to {defaultBranch}</span>
                </button>
              </div>
            </>
          )}
          {currentBranch === defaultBranch && (
            <span className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginLeft: 'auto' }}>You are on the default branch. Create a new branch to make changes safely.</span>
          )}
        </div>
      )}

      {/* Diff / Merge Panel */}
      {advancedMode && showDiff && currentBranch !== defaultBranch && (
        <div style={{ borderBottom: `1px solid ${C.inkFaint}`, background: 'rgba(250,247,242,0.8)', padding: '20px 24px', flexShrink: 0, overflowY: 'auto', maxHeight: '50vh' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 className="pk-serif" style={{ fontSize: 18, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitPullRequest style={{ width: 18, height: 18, color: C.purple }} />
                Merge <span style={{ color: C.purple, fontFamily: 'monospace', fontSize: 13, background: C.purpleLight, padding: '2px 8px', borderRadius: 6 }}>{currentBranch}</span>
                <ArrowLeft style={{ width: 14, height: 14, color: C.inkLight, transform: 'rotate(180deg)' }} />
                <span style={{ color: C.green, fontFamily: 'monospace', fontSize: 13, background: C.greenLight, padding: '2px 8px', borderRadius: 6 }}>{defaultBranch}</span>
              </h3>
              <button onClick={() => { setShowDiff(false); setMergeResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {diffLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.inkLight }}>
                <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Loading diff...
              </div>
            ) : diffData ? (
              <div>
                {/* Stats */}
                <div className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, marginBottom: 16 }}>
                  <span style={{ color: C.inkLight }}>{diffData.total_commits} commit{diffData.total_commits !== 1 ? "s" : ""} ahead</span>
                  <span style={{ color: C.green }}>+{diffData.files.reduce((s: number, f: any) => s + f.additions, 0)}</span>
                  <span style={{ color: '#dc2626' }}>-{diffData.files.reduce((s: number, f: any) => s + f.deletions, 0)}</span>
                  <span style={{ color: C.inkFaint }}>{diffData.files.length} file{diffData.files.length !== 1 ? "s" : ""} changed</span>
                </div>

                {/* Commits */}
                {diffData.commits.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 className="pk-sans" style={{ fontSize: 11, fontWeight: 600, color: C.inkLight, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8 }}>Commits</h4>
                    {diffData.commits.map((c: any) => (
                      <div key={c.sha} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, background: C.paper, borderRadius: 8, padding: '8px 12px', marginBottom: 4, border: `1px solid ${C.inkFaint}` }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.purple, background: C.purpleLight, padding: '2px 6px', borderRadius: 4 }}>{c.sha}</span>
                        <span style={{ color: C.inkMid, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</span>
                        <span style={{ fontSize: 11, color: C.inkLight, whiteSpace: 'nowrap' }}>{new Date(c.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* File diffs */}
                {diffData.files.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 className="pk-sans" style={{ fontSize: 11, fontWeight: 600, color: C.inkLight, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8 }}>Files Changed</h4>
                    {diffData.files.map((f: any) => (
                      <div key={f.filename} style={{ background: C.paper, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.inkFaint}`, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: `1px solid ${C.inkFaint}` }}>
                          <FileText style={{ width: 14, height: 14, color: C.inkLight }} />
                          <span className="pk-sans" style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{f.filename}</span>
                          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: f.status === "added" ? C.greenLight : f.status === "removed" ? '#fee2e2' : '#fef3c7', color: f.status === "added" ? C.green : f.status === "removed" ? '#dc2626' : '#92400e' }}>{f.status}</span>
                          <span style={{ fontSize: 11, color: C.inkLight, marginLeft: 'auto' }}>
                            <span style={{ color: C.green }}>+{f.additions}</span>{" "}
                            <span style={{ color: '#dc2626' }}>-{f.deletions}</span>
                          </span>
                        </div>
                        {f.patch && (
                          <pre style={{ padding: 12, fontSize: 11, fontFamily: 'monospace', overflowX: 'auto', maxHeight: 200, overflowY: 'auto', background: C.ink, margin: 0 }}>
                            {f.patch.split("\n").map((line: string, i: number) => (
                              <div key={i} style={{ color: line.startsWith("+") ? '#4ade80' : line.startsWith("-") ? '#f87171' : line.startsWith("@@") ? '#93c5fd' : C.inkLight, padding: '0 4px' }}>{line}</div>
                            ))}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Merge controls */}
                <div style={{ ...glass({ padding: 16, marginTop: 16 }) }}>
                  <h4 className="pk-sans" style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GitMerge style={{ width: 16, height: 16, color: C.green }} />
                    Merge into {defaultBranch}
                  </h4>
                  <input type="text" value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} placeholder={`Merge ${currentBranch} into ${defaultBranch} via Pagekeeper`} style={{ ...inputStyle, marginBottom: 12 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={handleMerge} disabled={merging} style={{ ...btnPrimary, background: C.green, opacity: merging ? 0.6 : 1 }}>
                      {merging ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <GitMerge style={{ width: 14, height: 14 }} />}
                      {merging ? "Merging..." : "Confirm Merge"}
                    </button>
                    <button onClick={() => { setShowDiff(false); setMergeResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, fontSize: 13 }}>Cancel</button>
                    {mergeResult && <span style={{ fontSize: 13, color: mergeResult.includes("success") ? C.green : '#dc2626', marginLeft: 8 }}>{mergeResult}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pk-sans" style={{ color: C.inkLight, fontSize: 13 }}>Click "View Changes" to load the diff between branches.</div>
            )}
          </div>
        </div>
      )}

      {/* Sync Check Panel */}
      {showSync && (
        <div style={{ borderBottom: `1px solid ${C.inkFaint}`, background: 'rgba(250,247,242,0.8)', padding: '20px 24px', flexShrink: 0, overflowY: 'auto', maxHeight: 400 }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 className="pk-serif" style={{ fontSize: 18, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wifi style={{ width: 18, height: 18, color: C.claw }} /> VPS Sync Checker
              </h3>
              <button onClick={() => setShowSync(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {syncLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.inkLight }}>
                <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Loading sync status...
              </div>
            ) : syncStatus ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Left: Setup */}
                <div>
                  <h4 className="pk-sans" style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 10 }}>VPS Setup</h4>
                  <div style={{ ...glass({ padding: 12, marginBottom: 8 }) }}>
                    <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginBottom: 4 }}># 1. Clone on your VPS</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 11, color: C.claw }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>git clone {syncStatus.clone_url_ssh} ~/.openclaw/workspace</span>
                      <button onClick={() => copyText(`git clone ${syncStatus.clone_url_ssh} ~/.openclaw/workspace`, "clone")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                        {copied === "clone" ? <Check style={{ width: 12, height: 12, color: C.green }} /> : <Copy style={{ width: 12, height: 12 }} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ ...glass({ padding: 12 }) }}>
                    <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginBottom: 4 }}># 2. Auto-sync every minute</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 11, color: C.claw }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{`(crontab -l 2>/dev/null; echo '* * * * * cd ~/.openclaw/workspace && git pull -q') | crontab -`}</span>
                      <button onClick={() => copyText(`(crontab -l 2>/dev/null; echo '* * * * * cd ~/.openclaw/workspace && git pull -q') | crontab -`, "cron")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                        {copied === "cron" ? <Check style={{ width: 12, height: 12, color: C.green }} /> : <Copy style={{ width: 12, height: 12 }} />}
                      </button>
                    </div>
                  </div>
                  {syncStatus.latest_commit && (
                    <div className="pk-sans" style={{ marginTop: 12, fontSize: 11, color: C.inkLight }}>
                      <span style={{ color: C.inkMid }}>Latest commit:</span>{" "}
                      <span style={{ fontFamily: 'monospace', color: C.claw }}>{syncStatus.latest_commit.sha}</span>{" "}
                      — {syncStatus.latest_commit.message}
                    </div>
                  )}
                </div>

                {/* Right: Test */}
                <div>
                  <h4 className="pk-sans" style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 10 }}>Run Sync Test</h4>
                  <p className="pk-sans" style={{ fontSize: 12, color: C.inkLight, marginBottom: 10 }}>
                    This creates a test file in your GitHub repo. If it appears on your VPS, sync is working.
                  </p>
                  <button onClick={async () => {
                    setSyncTestRunning(true);
                    try { const result = await createSyncTest(owner, repo); setSyncTestResult(result); const status = await getSyncStatus(owner, repo); setSyncStatus(status); }
                    catch (e) { console.error(e); }
                    setSyncTestRunning(false);
                  }} disabled={syncTestRunning} style={{ ...btnPrimary, marginBottom: 10, opacity: syncTestRunning ? 0.6 : 1 }}>
                    {syncTestRunning ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Terminal style={{ width: 14, height: 14 }} />}
                    {syncTestRunning ? "Creating test..." : "Send Sync Test"}
                  </button>

                  {syncTestResult && (
                    <div style={{ ...glass({ padding: 12 }) }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.green, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        <CheckCircle style={{ width: 14, height: 14 }} /> Test file created!
                      </div>
                      <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginBottom: 6 }}>Now check on your VPS:</div>
                      <div style={{ background: C.ink, borderRadius: 8, padding: 8, fontFamily: 'monospace', fontSize: 11, color: C.claw, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{syncTestResult.command}</span>
                        <button onClick={() => copyText(syncTestResult.command, "cmd")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                          {copied === "cmd" ? <Check style={{ width: 12, height: 12, color: C.green }} /> : <Copy style={{ width: 12, height: 12 }} />}
                        </button>
                      </div>
                      <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginTop: 6 }}>
                        Expected: <span style={{ fontFamily: 'monospace', color: C.ink }}>{syncTestResult.expected}</span>
                      </div>
                      <button onClick={async () => { await deleteSyncTest(owner, repo); setSyncTestResult(null); const status = await getSyncStatus(owner, repo); setSyncStatus(status); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                        <Trash2 style={{ width: 11, height: 11 }} /> Clean up test file
                      </button>
                    </div>
                  )}

                  {!syncTestResult && syncStatus.test_file && (
                    <div style={{ ...glass({ padding: 12, borderColor: '#fbbf24' }) }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#92400e', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        <AlertCircle style={{ width: 14, height: 14 }} /> Previous test file found
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.inkMid, whiteSpace: 'pre-wrap' }}>{syncStatus.test_file.content}</div>
                      <button onClick={async () => { await deleteSyncTest(owner, repo); const status = await getSyncStatus(owner, repo); setSyncStatus(status); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                        <Trash2 style={{ width: 11, height: 11 }} /> Clean up test file
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="pk-sans" style={{ color: C.inkLight, fontSize: 13 }}>Unable to load sync status.</div>
            )}
          </div>
        </div>
      )}

      {/* Main content area: sidebar + editor */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 256, borderRight: `1px solid ${C.inkFaint}`, overflowY: 'auto', flexShrink: 0, background: 'rgba(250,247,242,0.5)' }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="pk-sans" style={{ fontSize: 11, fontWeight: 600, color: C.inkLight, letterSpacing: '.05em', textTransform: 'uppercase' }}>Knowledge Files</h3>
              {availableFiles.length > 0 && (
                <button onClick={() => setShowNewFile(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight }}>
                  <Plus style={{ width: 15, height: 15 }} />
                </button>
              )}
            </div>

            {/* Root-level files */}
            {files.filter((f) => f.type === "file").map((file) => {
              const meta = FILE_ICONS[file.name] || { icon: FileText, color: C.inkLight, label: "" };
              const Icon = meta.icon;
              const isSelected = selectedFile?.path === file.path;
              return (
                <button key={file.path} onClick={() => loadFile(file.path)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, marginBottom: 2, display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', transition: 'all .15s', background: isSelected ? C.clawLight : 'transparent', border: isSelected ? `1px solid ${C.clawMid}` : '1px solid transparent', fontFamily: "'Instrument Sans', sans-serif" }}>
                  <Icon style={{ width: 15, height: 15, marginTop: 2, flexShrink: 0, color: isSelected ? C.claw : meta.color }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? C.claw : C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                    {meta.label && <div style={{ fontSize: 11, color: C.inkLight }}>{meta.label}</div>}
                  </div>
                </button>
              );
            })}

            {/* Nested markdown files */}
            {(() => {
              const rootPaths = new Set(files.map((f) => f.path));
              const nested = allMdFiles.filter((f) => !rootPaths.has(f.path));
              if (nested.length === 0) return null;
              const groups: Record<string, FileItem[]> = {};
              nested.forEach((f) => {
                const dir = f.path.includes("/") ? f.path.substring(0, f.path.lastIndexOf("/")) : "";
                if (!groups[dir]) groups[dir] = [];
                groups[dir].push(f);
              });
              return (
                <>
                  {Object.keys(groups).length > 0 && (
                    <div style={{ marginTop: 12, marginBottom: 8, borderTop: `1px solid ${C.inkFaint}`, paddingTop: 12 }}>
                      <h3 className="pk-sans" style={{ fontSize: 11, fontWeight: 600, color: C.inkLight, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>All Markdown Files</h3>
                    </div>
                  )}
                  {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([dir, dirFiles]) => (
                    <div key={dir}>
                      {dir && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', color: C.inkLight }}>
                          <FolderOpen style={{ width: 13, height: 13, flexShrink: 0 }} />
                          <span className="pk-sans" style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dir}/</span>
                        </div>
                      )}
                      {dirFiles.map((file) => {
                        const isSelected = selectedFile?.path === file.path;
                        return (
                          <button key={file.path} onClick={() => loadFile(file.path)} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', paddingLeft: dir ? 28 : 10, borderRadius: 10, marginBottom: 1, display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', transition: 'all .15s', background: isSelected ? C.clawLight : 'transparent', border: isSelected ? `1px solid ${C.clawMid}` : '1px solid transparent', fontFamily: "'Instrument Sans', sans-serif" }}>
                            <FileText style={{ width: 13, height: 13, marginTop: 2, flexShrink: 0, color: isSelected ? C.claw : C.inkLight }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: isSelected ? C.claw : C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                              <div style={{ fontSize: 10, color: C.inkLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</div>
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
            {files.filter((f) => f.type === "dir").map((dir) => (
              <div key={dir.path} style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 10, color: C.inkLight }}>
                <FolderOpen style={{ width: 15, height: 15, flexShrink: 0 }} />
                <span className="pk-sans" style={{ fontSize: 13 }}>{dir.name}/</span>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedFile ? (
            <>
              <div style={{ padding: '10px 24px', borderBottom: `1px solid ${C.inkFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen style={{ width: 14, height: 14, color: C.inkLight }} />
                  <span className="pk-sans" style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{selectedFile.name}</span>
                  {hasUnsavedChanges && <div style={{ width: 7, height: 7, background: C.claw, borderRadius: '50%' }} />}
                </div>
                <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight }}>
                  {editContent.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }} data-color-mode="light">
                <MDEditor
                  value={editContent}
                  onChange={(val) => setEditContent(val || "")}
                  height="100%"
                  preview="edit"
                  hideToolbar={false}
                  visibleDragbar={false}
                  style={{ background: 'transparent', minHeight: '100%' }}
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <FileText style={{ width: 40, height: 40, color: C.inkFaint, margin: '0 auto 12px', display: 'block' }} />
                <p className="pk-sans" style={{ color: C.inkLight }}>Select a file to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Branch Modal */}
      {showNewBranch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ ...glass({ padding: 24, maxWidth: 420, width: '100%', background: C.paper }) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="pk-serif" style={{ fontSize: 20, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitBranch style={{ width: 18, height: 18, color: C.purple }} /> Create Branch
              </h2>
              <button onClick={() => { setShowNewBranch(false); setNewBranchName(""); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <p className="pk-sans" style={{ fontSize: 13, color: C.inkLight, marginBottom: 16 }}>
              Create a new branch from <span style={{ color: C.purple, fontFamily: 'monospace' }}>{currentBranch}</span> to make changes safely before merging.
            </p>
            <input type="text" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value.replace(/[^a-zA-Z0-9_\-/.]/g, ""))} placeholder="e.g. update-soul-personality" style={{ ...inputStyle, marginBottom: 16 }} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleCreateBranch(); }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={handleCreateBranch} disabled={!newBranchName.trim() || creatingBranch} style={{ ...btnPrimary, background: C.purple, opacity: (!newBranchName.trim() || creatingBranch) ? 0.5 : 1 }}>
                {creatingBranch ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <GitBranch style={{ width: 14, height: 14 }} />}
                {creatingBranch ? "Creating..." : "Create Branch"}
              </button>
              <button onClick={() => { setShowNewBranch(false); setNewBranchName(""); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ ...glass({ padding: 24, maxWidth: 420, width: '100%', background: C.paper }) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="pk-serif" style={{ fontSize: 20, fontWeight: 500 }}>Add Knowledge File</h2>
              <button onClick={() => setShowNewFile(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div>
              {availableFiles.map((f) => {
                const meta = FILE_ICONS[f.name] || { icon: FileText, color: C.inkLight, label: f.name };
                const Icon = meta.icon;
                return (
                  <button key={f.name} onClick={() => handleCreateFile(f.name, f.content)} disabled={creatingFile} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.inkFaint}`, marginBottom: 6, cursor: 'pointer', background: C.paper, opacity: creatingFile ? 0.5 : 1, transition: 'all .15s', fontFamily: "'Instrument Sans', sans-serif" }}>
                    <Icon style={{ width: 18, height: 18, color: meta.color }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: C.inkLight }}>{meta.label}</div>
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
