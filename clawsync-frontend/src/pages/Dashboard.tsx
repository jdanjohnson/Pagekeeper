import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAgentRepos, getMe, createAgentRepo, deleteAgentRepo, clearToken, getAllRepos, importRepo } from "../lib/api";
import {
  Plus, Lock, Globe, Clock, LogOut, Bot, Briefcase, Code, User,
  ExternalLink, Key, GitBranch, RefreshCw, Check, Copy, ArrowRight, Wifi,
  BookOpen, Trash2, Upload, AlertTriangle, MessageSquare, PenTool, FolderOpen,
  Search, FileText as FileIcon, Loader2,
} from "lucide-react";

interface Repo { id: number; name: string; full_name: string; private: boolean; description: string | null; updated_at: string; html_url: string; default_branch: string; }
interface GHUser { login: string; avatar_url: string; name: string; }

const TEMPLATE_OPTIONS = [
  { id: "default", name: "Default Agent", desc: "Versatile assistant with smart defaults", icon: Bot, color: "#e8622a" },
  { id: "support", name: "Support Bot", desc: "Full CS playbook with escalation flows", icon: Briefcase, color: "#3b82f6" },
  { id: "personal", name: "Personal Assistant", desc: "Chief of staff \u2014 tasks, calendar, life admin", icon: User, color: "#8b5cf6" },
  { id: "dev", name: "Dev Agent", desc: "Senior engineer with code review & git workflow", icon: Code, color: "#eab308" },
  { id: "sales", name: "Sales & Outreach", desc: "Pipeline tracker, email templates, follow-ups", icon: MessageSquare, color: "#f97316" },
  { id: "content", name: "Content Creator", desc: "Write, schedule & repurpose across platforms", icon: PenTool, color: "#ec4899" },
];

const C = {
  cream: '#faf7f2', creamDark: '#f0ebe0', paper: '#ffffff',
  ink: '#1a1714', inkMid: '#5a5450', inkLight: '#9e9890', inkFaint: '#d4cfc7',
  claw: '#e8622a', clawLight: '#fde8de', clawMid: '#f4a07a',
  green: '#2d7a4f', greenLight: '#e0f2e9',
};

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
  const [setupStep, setSetupStep] = useState(0);
  const [createdRepo, setCreatedRepo] = useState<Repo | null>(null);
  const [copied, setCopied] = useState("");
  const [platform, setPlatform] = useState<"vps" | "mac" | "">("");
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
      const repoData: Repo = result.repo || result || data.repos.find((r: Repo) => r.name === newName.trim());
      if (repoData) { setCreatedRepo(repoData); }
      else {
        setCreatedRepo({
          id: 0, name: newName.trim(), full_name: `${user?.login || "user"}/${newName.trim()}`,
          private: newPrivate, description: null, updated_at: new Date().toISOString(),
          html_url: `https://github.com/${user?.login || "user"}/${newName.trim()}`, default_branch: "main",
        });
      }
      setSetupStep(1);
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const closeSetupFlow = () => { setShowCreate(false); setSetupStep(0); setCreatedRepo(null); setNewName(""); setPlatform(""); };

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
      if (msg.includes("403")) { alert("Permission denied. You may need to re-login to grant delete permissions."); }
      else { alert("Failed to delete repo. Try again."); }
    }
    setDeleting(false);
  };

  const handleOpenImport = async () => {
    setShowImport(true); setLoadingRepos(true);
    try { const data = await getAllRepos(); setAllRepos(data.repos || []); } catch (e) { console.error(e); }
    setLoadingRepos(false);
  };

  const handleImport = async (fullName: string) => {
    setImporting(fullName);
    try {
      const result = await importRepo(fullName);
      setImportResult(result);
      const data = await getAgentRepos();
      setRepos(data.repos);
    } catch (e) { console.error(e); }
    setImporting("");
  };

  const handleLogout = () => { clearToken(); navigate("/"); };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Shared styles
  const modalOverlay = { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 };
  const modalBox = { background: C.paper, border: `1px solid ${C.inkFaint}`, borderRadius: 16, padding: 32, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.12)' };
  const btnPrimary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: C.claw, color: 'white', border: 'none', cursor: 'pointer' } as const;
  const btnSecondary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: C.creamDark, color: C.inkMid, border: 'none', cursor: 'pointer' } as const;
  const inputStyle = { width: '100%', background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, fontFamily: "'Instrument Sans', sans-serif", outline: 'none', color: C.ink } as const;
  const codeBlock = { background: C.ink, borderRadius: 10, padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: C.clawMid, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 } as const;
  const stepBubble = { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 } as const;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 28, height: 28, color: C.claw }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, color: C.ink, fontFamily: "'Instrument Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,500&family=Instrument+Sans:wght@400;500;600&display=swap');
        .pk-serif { font-family: 'Fraunces', Georgia, serif; }
        .pk-sans { font-family: 'Instrument Sans', -apple-system, sans-serif; }
        .pk-card { transition: box-shadow .2s, transform .2s; }
        .pk-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.08); transform: translateY(-2px); }
        * { margin: 0; padding: 0; box-sizing: border-box; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,247,242,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.inkFaint}`, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.ink }}>
          <div style={{ width: 30, height: 30, background: C.claw, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M3 12C3 12 2 7 6 4c2-1.5 5 0 5 3 0-3 2.5-4.5 4-2 1.5 2.5-1 6.5-4 7" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none"/><path d="M5 14c0 0-.5-4.5 2.5-6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/><path d="M8 14c0 0-.2-3.5.2-5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 14c0 0 0-4.5-1-6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </div>
          <span className="pk-serif" style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>Pagekeeper</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={user.avatar_url} alt={user.login} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.inkFaint}` }} />
              <span className="pk-sans" style={{ fontSize: 13, color: C.inkMid, fontWeight: 500 }}>{user.login}</span>
            </div>
          )}
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, display: 'flex', alignItems: 'center' }} title="Log out">
            <LogOut style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h1 className="pk-serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-.02em', marginBottom: 6 }}>Your Agents</h1>
            <p className="pk-sans" style={{ fontSize: 14, color: C.inkMid }}>Each agent is a GitHub repo with knowledge files your AI reads.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={handleOpenImport} className="pk-sans" style={{ ...btnSecondary, gap: 8 }}>
              <FolderOpen style={{ width: 15, height: 15 }} /> Open Existing Repo
            </button>
            <button onClick={() => setShowCreate(true)} className="pk-sans" style={{ ...btnPrimary, gap: 8 }}>
              <Plus style={{ width: 16, height: 16 }} /> New Agent
            </button>
          </div>
        </div>

        {/* Agent cards */}
        {repos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 64, height: 64, background: C.clawLight, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Bot style={{ width: 28, height: 28, color: C.claw }} />
            </div>
            <h3 className="pk-serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>No agents yet</h3>
            <p className="pk-sans" style={{ fontSize: 14, color: C.inkMid, marginBottom: 24 }}>Create your first agent or import an existing GitHub repo.</p>
            <button onClick={() => setShowCreate(true)} className="pk-sans" style={btnPrimary}>
              <Plus style={{ width: 16, height: 16 }} /> Create your first agent
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {repos.map((repo) => (
              <div key={repo.id} className="pk-card" style={{ background: C.paper, borderRadius: 14, border: `1px solid ${C.inkFaint}`, padding: '24px 24px 20px', cursor: 'pointer', position: 'relative' }}>
                <div onClick={() => navigate(`/agent/${repo.full_name}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, background: C.clawLight, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot style={{ width: 20, height: 20, color: C.claw }} />
                    </div>
                    {repo.private ? <Lock style={{ width: 14, height: 14, color: C.inkLight }} /> : <Globe style={{ width: 14, height: 14, color: C.inkLight }} />}
                  </div>
                  <h3 className="pk-serif" style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{repo.name}</h3>
                  {repo.description && <p className="pk-sans" style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.5, marginBottom: 4 }}>{repo.description}</p>}
                  <div className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, fontSize: 12, color: C.inkLight }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 13, height: 13 }} /> {timeAgo(repo.updated_at)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GitBranch style={{ width: 13, height: 13 }} /> {repo.default_branch}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(repo); }} style={{ position: 'absolute', top: 16, right: 16, padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.inkFaint, opacity: 0.5 }} title="Delete agent"
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#dc2626'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = C.inkFaint; }}
                >
                  <Trash2 style={{ width: 15, height: 15 }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* CREATE MODAL + SETUP FLOW */}
        {showCreate && (
          <div style={modalOverlay}>
            <div style={{ ...modalBox, maxWidth: setupStep > 0 ? 640 : 600, maxHeight: '90vh', overflowY: 'auto' }}>

              {/* Step indicator */}
              {setupStep > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ ...stepBubble, background: setupStep >= s ? C.claw : C.creamDark, color: setupStep >= s ? 'white' : C.inkLight }}>
                        {setupStep > s ? <Check style={{ width: 12, height: 12 }} /> : s}
                      </div>
                      {s < 4 && <div style={{ width: 24, height: 2, background: setupStep > s ? C.claw : C.creamDark, borderRadius: 1 }} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 0: Create form */}
              {setupStep === 0 && (
                <>
                  <h2 className="pk-serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 24 }}>Create New Agent</h2>
                  <label className="pk-sans" style={{ display: 'block', fontSize: 12, color: C.inkLight, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8 }}>Agent Name</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. my-support-bot" className="pk-sans" style={{ ...inputStyle, marginBottom: 24 }} />

                  <label className="pk-sans" style={{ display: 'block', fontSize: 12, color: C.inkLight, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}>Template</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
                    {TEMPLATE_OPTIONS.map((t) => (
                      <button key={t.id} onClick={() => setNewTemplate(t.id)} className="pk-sans" style={{
                        textAlign: 'left', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                        border: newTemplate === t.id ? `2px solid ${C.claw}` : `1px solid ${C.inkFaint}`,
                        background: newTemplate === t.id ? C.clawLight : C.paper,
                      }}>
                        <t.icon style={{ width: 18, height: 18, color: t.color, marginBottom: 6 }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: C.inkLight }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>

                  <label onClick={() => setNewPrivate(!newPrivate)} className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, cursor: 'pointer', fontSize: 13, color: C.inkMid }}>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: newPrivate ? C.claw : C.inkFaint, position: 'relative', transition: 'background .2s' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: newPrivate ? 18 : 2, transition: 'left .2s' }} />
                    </div>
                    {newPrivate ? <Lock style={{ width: 14, height: 14 }} /> : <Globe style={{ width: 14, height: 14 }} />}
                    {newPrivate ? "Private repo" : "Public repo"}
                  </label>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowCreate(false)} className="pk-sans" style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
                    <button onClick={handleCreate} disabled={creating || !newName.trim()} className="pk-sans" style={{ ...btnPrimary, flex: 1, opacity: (creating || !newName.trim()) ? 0.5 : 1 }}>
                      {creating ? "Creating..." : "Create Agent"}
                    </button>
                  </div>
                </>
              )}

              {/* Step 1: Agent Created + Platform Picker */}
              {setupStep === 1 && createdRepo && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, background: C.greenLight, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Check style={{ width: 28, height: 28, color: C.green }} />
                    </div>
                    <h2 className="pk-serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>Agent Created!</h2>
                    <p className="pk-sans" style={{ fontSize: 14, color: C.inkMid }}><strong style={{ color: C.ink }}>{createdRepo.name}</strong> is live on GitHub with your knowledge files.</p>
                  </div>

                  <a href={createdRepo.html_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: '14px 16px', textDecoration: 'none', color: C.ink, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <GitBranch style={{ width: 18, height: 18, color: C.inkLight }} />
                      <div>
                        <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600 }}>{createdRepo.full_name}</div>
                        <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight }}>View your agent's repo on GitHub</div>
                      </div>
                    </div>
                    <ExternalLink style={{ width: 14, height: 14, color: C.inkLight }} />
                  </a>

                  <p className="pk-sans" style={{ fontSize: 13, color: C.inkMid, marginBottom: 12 }}>Where does your agent run?</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                    {[
                      { id: 'vps' as const, emoji: '\uD83D\uDDA5\uFE0F', name: 'VPS / Server', desc: 'DigitalOcean, AWS, Hetzner, etc.' },
                      { id: 'mac' as const, emoji: '\uD83D\uDCBB', name: 'Mac (Local)', desc: 'Running your agent on your Mac' },
                    ].map(p => (
                      <button key={p.id} onClick={() => setPlatform(p.id)} className="pk-sans" style={{
                        textAlign: 'left', padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: platform === p.id ? `2px solid ${C.claw}` : `1px solid ${C.inkFaint}`, background: platform === p.id ? C.clawLight : C.paper,
                      }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{p.emoji}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: C.inkLight }}>{p.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { closeSetupFlow(); navigate(`/agent/${createdRepo.full_name}`); }} className="pk-sans" style={{ ...btnSecondary, flex: 1 }}>Skip \u2014 set up later</button>
                    <button onClick={() => setSetupStep(2)} disabled={!platform} className="pk-sans" style={{ ...btnPrimary, flex: 1, opacity: !platform ? 0.5 : 1 }}>
                      Continue <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>

                  {/* Already have files */}
                  <div style={{ marginTop: 16, background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16 }}>
                    <div className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, marginBottom: 8 }}>
                      <Upload style={{ width: 14, height: 14, color: C.claw }} /> <strong>Already have agent files?</strong>
                    </div>
                    <p className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginBottom: 10 }}>Push existing files to this repo:</p>
                    <div style={codeBlock}>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: C.clawMid, fontSize: 11 }}>{`cd /path/to/your/agent/files
git init
git remote add origin git@github.com:${createdRepo.full_name}.git
git add -A
git commit -m "import existing files"
git push -u origin main --force`}</pre>
                      <button onClick={() => copyText(`cd /path/to/your/agent/files\ngit init\ngit remote add origin git@github.com:${createdRepo.full_name}.git\ngit add -A\ngit commit -m "import existing files"\ngit push -u origin main --force`, 'import')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                        {copied === "import" ? <Check style={{ width: 13, height: 13, color: C.green }} /> : <Copy style={{ width: 13, height: 13 }} />}
                      </button>
                    </div>
                    <p className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginTop: 8 }}>Or drag & drop at <a href={createdRepo.html_url + "/upload/main"} target="_blank" rel="noopener noreferrer" style={{ color: C.claw }}>github.com/{createdRepo.full_name}/upload</a></p>
                  </div>
                </>
              )}

              {/* Step 2: Add SSH Key */}
              {setupStep === 2 && createdRepo && (
                <>
                  <h2 className="pk-serif" style={{ fontSize: 20, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Key style={{ width: 18, height: 18, color: C.claw }} />
                    {platform === "mac" ? "Add Your Mac's SSH Key" : "Add Your VPS SSH Key"}
                  </h2>
                  <p className="pk-sans" style={{ fontSize: 13, color: C.inkMid, marginBottom: 24 }}>
                    This lets your {platform === "mac" ? "Mac" : "VPS"} pull from your private repo without a password.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                    <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ ...stepBubble, background: C.claw, color: 'white', marginTop: 2 }}>1</div>
                        <div style={{ flex: 1 }}>
                          <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                            {platform === "mac" ? "Check for an existing SSH key (most Macs have one)" : "Generate an SSH key on your VPS"}
                          </div>
                          <div style={codeBlock}>
                            <span style={{ color: C.clawMid }}>{platform === "mac" ? 'cat ~/.ssh/id_ed25519.pub || ssh-keygen -t ed25519 -C "pagekeeper"' : 'ssh-keygen -t ed25519 -C "pagekeeper" && cat ~/.ssh/id_ed25519.pub'}</span>
                            <button onClick={() => copyText(platform === "mac" ? 'cat ~/.ssh/id_ed25519.pub || ssh-keygen -t ed25519 -C "pagekeeper"' : 'ssh-keygen -t ed25519 -C "pagekeeper" && cat ~/.ssh/id_ed25519.pub', 'sshgen')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                              {copied === "sshgen" ? <Check style={{ width: 13, height: 13, color: C.green }} /> : <Copy style={{ width: 13, height: 13 }} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ ...stepBubble, background: C.claw, color: 'white', marginTop: 2 }}>2</div>
                        <div style={{ flex: 1 }}>
                          <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Copy the key, then add it on GitHub:</div>
                          <a href="https://github.com/settings/keys" target="_blank" rel="noopener noreferrer" className="pk-sans" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.paper, border: `1px solid ${C.inkFaint}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: C.claw, textDecoration: 'none' }}>
                            <Key style={{ width: 14, height: 14 }} /> Open GitHub SSH Keys <ExternalLink style={{ width: 12, height: 12 }} />
                          </a>
                          <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginTop: 6 }}>Click "New SSH key" \u2192 paste your key \u2192 Save</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setSetupStep(1)} className="pk-sans" style={btnSecondary}>Back</button>
                    <button onClick={() => setSetupStep(3)} className="pk-sans" style={{ ...btnPrimary, flex: 1 }}>
                      I've added my key <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Clone & Sync */}
              {setupStep === 3 && createdRepo && (
                <>
                  <h2 className="pk-serif" style={{ fontSize: 20, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw style={{ width: 18, height: 18, color: C.claw }} /> Clone & Enable Auto-Sync
                  </h2>
                  <p className="pk-sans" style={{ fontSize: 13, color: C.inkMid, marginBottom: 24 }}>
                    {platform === "mac" ? "Run these in Terminal to set up two-way sync on your Mac." : "Run these two commands on your VPS."}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                    <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ ...stepBubble, background: C.claw, color: 'white', marginTop: 2 }}>1</div>
                        <div style={{ flex: 1 }}>
                          <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Clone the repo into your workspace</div>
                          <div style={codeBlock}>
                            <span style={{ color: C.clawMid }}>git clone git@github.com:{createdRepo.full_name}.git ~/pagekeeper/workspace</span>
                            <button onClick={() => copyText(`git clone git@github.com:${createdRepo.full_name}.git ~/pagekeeper/workspace`, 'clone')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                              {copied === "clone" ? <Check style={{ width: 13, height: 13, color: C.green }} /> : <Copy style={{ width: 13, height: 13 }} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {platform === "mac" ? (
                      <>
                        <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ ...stepBubble, background: C.claw, color: 'white', marginTop: 2 }}>2</div>
                            <div style={{ flex: 1 }}>
                              <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Create a two-way sync script</div>
                              <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginBottom: 8 }}>Pulls remote changes AND pushes local edits:</div>
                              <div style={codeBlock}>
                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: C.clawMid, fontSize: 11 }}>{`cat > ~/pagekeeper/sync.sh << 'EOF'
#!/bin/bash
cd ~/pagekeeper/workspace || exit 1
git pull -q
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "auto-sync from Mac $(date +%H:%M)"
  git push -q
fi
EOF
chmod +x ~/pagekeeper/sync.sh`}</pre>
                                <button onClick={() => copyText(`cat > ~/pagekeeper/sync.sh << 'EOF'\n#!/bin/bash\ncd ~/pagekeeper/workspace || exit 1\ngit pull -q\nif [ -n "$(git status --porcelain)" ]; then\n  git add -A\n  git commit -m "auto-sync from Mac $(date +%H:%M)"\n  git push -q\nfi\nEOF\nchmod +x ~/pagekeeper/sync.sh`, 'script')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                                  {copied === "script" ? <Check style={{ width: 13, height: 13, color: C.green }} /> : <Copy style={{ width: 13, height: 13 }} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ ...stepBubble, background: C.claw, color: 'white', marginTop: 2 }}>3</div>
                            <div style={{ flex: 1 }}>
                              <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Run it every minute with cron</div>
                              <div style={codeBlock}>
                                <span style={{ color: C.clawMid }}>{`(crontab -l 2>/dev/null; echo '* * * * * ~/pagekeeper/sync.sh') | crontab -`}</span>
                                <button onClick={() => copyText("(crontab -l 2>/dev/null; echo '* * * * * ~/pagekeeper/sync.sh') | crontab -", 'maccron')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                                  {copied === "maccron" ? <Check style={{ width: 13, height: 13, color: C.green }} /> : <Copy style={{ width: 13, height: 13 }} />}
                                </button>
                              </div>
                              <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginTop: 6 }}>Two-way: local edits push to GitHub, Pagekeeper edits pull to your Mac.</div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ ...stepBubble, background: C.claw, color: 'white', marginTop: 2 }}>2</div>
                          <div style={{ flex: 1 }}>
                            <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Set up auto-sync (pulls every minute)</div>
                            <div style={codeBlock}>
                              <span style={{ color: C.clawMid }}>{"(crontab -l 2>/dev/null; echo '* * * * * cd ~/pagekeeper/workspace && git pull -q') | crontab -"}</span>
                              <button onClick={() => copyText("(crontab -l 2>/dev/null; echo '* * * * * cd ~/pagekeeper/workspace && git pull -q') | crontab -", 'cron')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, flexShrink: 0 }}>
                                {copied === "cron" ? <Check style={{ width: 13, height: 13, color: C.green }} /> : <Copy style={{ width: 13, height: 13 }} />}
                              </button>
                            </div>
                            <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginTop: 6 }}>Your agent reads from ~/pagekeeper/workspace/ \u2014 updated files are picked up automatically.</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setSetupStep(2)} className="pk-sans" style={btnSecondary}>Back</button>
                    <button onClick={() => setSetupStep(4)} className="pk-sans" style={{ ...btnPrimary, flex: 1 }}>
                      Done \u2014 verify it works <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </>
              )}

              {/* Step 4: Verify & Go */}
              {setupStep === 4 && createdRepo && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, background: C.greenLight, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Wifi style={{ width: 28, height: 28, color: C.green }} />
                    </div>
                    <h2 className="pk-serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>You're all set!</h2>
                    <p className="pk-sans" style={{ fontSize: 14, color: C.inkMid }}>
                      Your agent is connected. Edit files in Pagekeeper and they'll sync to your {platform === "mac" ? "Mac" : "VPS"}.
                    </p>
                  </div>

                  <div style={{ background: C.cream, borderRadius: 12, padding: 20, marginBottom: 16, border: `1px solid ${C.inkFaint}` }}>
                    <div className="pk-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkLight, marginBottom: 12, textAlign: 'center' }}>How it works now</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        'Edit in Pagekeeper',
                        'Saved to GitHub',
                        platform === 'mac' ? 'Mac syncs both ways' : 'VPS auto-pulls',
                                              'Agent reads latest',
                                            ].map((label, i) => (
                                              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="pk-sans" style={{ background: C.paper, border: `1px solid ${C.inkFaint}`, borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 500 }}>{label}</div>
                                                {i < 3 && <ArrowRight style={{ width: 13, height: 13, color: C.claw }} />}
                                              </div>
                                            ))}
                    </div>
                  </div>

                  <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
                    <div className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 4 }}>
                      <Wifi style={{ width: 14, height: 14, color: C.green }} /> <strong>Want to verify sync is working?</strong>
                    </div>
                    <p className="pk-sans" style={{ fontSize: 12, color: C.inkMid }}>Use the Sync Check feature in the editor to send a test file and verify it arrives on your {platform === "mac" ? "Mac" : "VPS"}.</p>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={createdRepo.html_url} target="_blank" rel="noopener noreferrer" className="pk-sans" style={{ ...btnSecondary, flex: 1, textDecoration: 'none', textAlign: 'center' }}>
                      <ExternalLink style={{ width: 14, height: 14 }} /> View on GitHub
                    </a>
                    <button onClick={() => { closeSetupFlow(); navigate(`/agent/${createdRepo.full_name}`); }} className="pk-sans" style={{ ...btnPrimary, flex: 1 }}>
                      Open Agent Editor <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* IMPORT REPO MODAL */}
        {showImport && (
          <div style={modalOverlay}>
            <div style={{ ...modalBox, maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              {importResult ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, background: C.greenLight, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check style={{ width: 20, height: 20, color: C.green }} />
                    </div>
                    <div>
                      <h3 className="pk-serif" style={{ fontSize: 18, fontWeight: 500 }}>Repo Imported!</h3>
                      <p className="pk-sans" style={{ fontSize: 12, color: C.inkLight }}>{importResult.repo.full_name}</p>
                    </div>
                  </div>

                  {importResult.markdown_files.length > 0 ? (
                    <div style={{ marginBottom: 20 }}>
                      <p className="pk-sans" style={{ fontSize: 13, color: C.inkMid, marginBottom: 10 }}>
                        Found <strong style={{ color: C.claw }}>{importResult.markdown_files.length}</strong> markdown/text file{importResult.markdown_files.length !== 1 ? "s" : ""}:
                      </p>
                      <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, maxHeight: 200, overflowY: 'auto' }}>
                        {importResult.markdown_files.map((f) => (
                          <div key={f.path} className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `1px solid ${C.inkFaint}`, fontSize: 12 }}>
                            <FileIcon style={{ width: 13, height: 13, color: C.claw, flexShrink: 0 }} />
                            <span style={{ color: C.inkMid, fontFamily: 'monospace', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path}</span>
                            <span style={{ color: C.inkLight, fontSize: 11, flexShrink: 0 }}>{f.size > 1024 ? `${(f.size / 1024).toFixed(1)}KB` : `${f.size}B`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 20 }}>
                      <p className="pk-sans" style={{ fontSize: 13, color: C.inkMid }}>No markdown files found yet. You can create them in the editor.</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { setShowImport(false); setImportResult(null); setImportSearch(""); }} className="pk-sans" style={{ ...btnSecondary, flex: 1 }}>Close</button>
                    <button onClick={() => { setShowImport(false); setImportResult(null); setImportSearch(""); navigate(`/agent/${importResult.repo.full_name}`); }} className="pk-sans" style={{ ...btnPrimary, flex: 1 }}>
                      Open in Editor <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, background: C.clawLight, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FolderOpen style={{ width: 20, height: 20, color: C.claw }} />
                    </div>
                    <div>
                      <h3 className="pk-serif" style={{ fontSize: 18, fontWeight: 500 }}>Open Existing Repo</h3>
                      <p className="pk-sans" style={{ fontSize: 12, color: C.inkLight }}>Pick a repo \u2014 Pagekeeper will find all markdown files</p>
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search style={{ width: 15, height: 15, color: C.inkLight, position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={importSearch} onChange={(e) => setImportSearch(e.target.value)} placeholder="Search your repos..." className="pk-sans" style={{ ...inputStyle, paddingLeft: 40 }} autoFocus />
                  </div>

                  <div style={{ flex: 1, overflow: 'auto', minHeight: 0, border: `1px solid ${C.inkFaint}`, borderRadius: 12, background: C.cream }}>
                    {loadingRepos ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
                        <Loader2 style={{ width: 24, height: 24, color: C.claw }} className="animate-spin" />
                      </div>
                    ) : (
                      allRepos
                        .filter((r) => { const q = importSearch.toLowerCase(); return !q || r.name.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q); })
                        .map((r) => {
                          const alreadyImported = repos.some((ar) => ar.full_name === r.full_name);
                          return (
                            <button key={r.id} disabled={!!importing || alreadyImported} onClick={() => handleImport(r.full_name)} className="pk-sans" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${C.inkFaint}`, background: 'transparent', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: C.inkFaint, cursor: alreadyImported ? 'default' : 'pointer', textAlign: 'left', opacity: alreadyImported ? 0.5 : 1 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: C.inkLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.full_name}</div>
                              </div>
                              {alreadyImported ? (
                                <span style={{ fontSize: 11, color: C.green, background: C.greenLight, padding: '3px 8px', borderRadius: 100, fontWeight: 500, flexShrink: 0 }}>Already added</span>
                              ) : importing === r.full_name ? (
                                <Loader2 style={{ width: 15, height: 15, color: C.claw }} className="animate-spin" />
                              ) : (
                                r.private ? <Lock style={{ width: 13, height: 13, color: C.inkLight, flexShrink: 0 }} /> : <Globe style={{ width: 13, height: 13, color: C.inkLight, flexShrink: 0 }} />
                              )}
                            </button>
                          );
                        })
                    )}
                    {!loadingRepos && allRepos.filter((r) => { const q = importSearch.toLowerCase(); return !q || r.name.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q); }).length === 0 && (
                      <div className="pk-sans" style={{ padding: 32, textAlign: 'center', fontSize: 13, color: C.inkLight }}>
                        {importSearch ? "No repos match your search" : "No repos found"}
                      </div>
                    )}
                  </div>

                  <button onClick={() => { setShowImport(false); setImportSearch(""); setAllRepos([]); }} className="pk-sans" style={{ ...btnSecondary, width: '100%', marginTop: 12 }}>Cancel</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {deleteTarget && (
          <div style={modalOverlay}>
            <div style={{ ...modalBox, maxWidth: 420 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, background: '#fde8e8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle style={{ width: 20, height: 20, color: '#dc2626' }} />
                </div>
                <div>
                  <h3 className="pk-serif" style={{ fontSize: 18, fontWeight: 500 }}>Delete Agent</h3>
                  <p className="pk-sans" style={{ fontSize: 12, color: C.inkLight }}>This cannot be undone</p>
                </div>
              </div>
              <p className="pk-sans" style={{ fontSize: 13, color: C.inkMid, marginBottom: 6 }}>
                Are you sure you want to delete <strong style={{ color: C.ink }}>{deleteTarget.name}</strong>?
              </p>
              <p className="pk-sans" style={{ fontSize: 12, color: C.inkLight, marginBottom: 24 }}>
                This will permanently delete <strong>{deleteTarget.full_name}</strong> and all its files, commits, and history.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteTarget(null)} className="pk-sans" style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="pk-sans" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', flex: 1, opacity: deleting ? 0.5 : 1 }}>
                  <Trash2 style={{ width: 14, height: 14 }} /> {deleting ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HOW IT WORKS SECTION */}
        <div style={{ marginTop: 48, background: C.paper, border: `1px solid ${C.inkFaint}`, borderRadius: 16, padding: 40 }}>
          <h2 className="pk-serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>How Pagekeeper Works</h2>
          <p className="pk-sans" style={{ fontSize: 14, color: C.inkMid, marginBottom: 28 }}>Set up once \u2014 then every edit you make here automatically reaches your agent.</p>

          <div style={{ background: C.cream, borderRadius: 12, padding: 20, marginBottom: 24, border: `1px solid ${C.inkFaint}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {['Create agent above', 'Edit in Pagekeeper', 'VPS auto-pulls', 'Agent reads latest'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="pk-sans" style={{ background: C.paper, border: `1px solid ${C.inkFaint}`, borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 500 }}>{label}</div>
                  {i < 3 && <ArrowRight style={{ width: 13, height: 13, color: C.claw }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <a href="https://github.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16, textDecoration: 'none', color: C.ink }}>
              <Key style={{ width: 18, height: 18, color: C.inkLight, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600 }}>Add SSH Key to GitHub</div>
                <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight }}>Required for VPS to pull from private repos</div>
              </div>
              <ExternalLink style={{ width: 14, height: 14, color: C.inkLight }} />
            </a>
            <a href="https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 12, padding: 16, textDecoration: 'none', color: C.ink }}>
              <BookOpen style={{ width: 18, height: 18, color: C.inkLight, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="pk-sans" style={{ fontSize: 13, fontWeight: 600 }}>SSH Key Guide</div>
                <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight }}>GitHub's official guide to generating SSH keys</div>
              </div>
              <ExternalLink style={{ width: 14, height: 14, color: C.inkLight }} />
            </a>
          </div>

          <p className="pk-sans" style={{ fontSize: 12, color: C.inkLight, marginTop: 16 }}>
            Click <strong style={{ color: C.claw }}>"New Agent"</strong> above to get started \u2014 the setup wizard walks you through every step.
          </p>
        </div>
      </div>
    </div>
  );
}
