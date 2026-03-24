import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTimeline, getCommitDetail } from "../lib/api";
import {
  ArrowLeft, Bot, User, Clock, FileText, Plus, Minus, ChevronDown, ChevronRight, Loader2,
} from "lucide-react";

interface TimelineEntry {
  sha: string; message: string; author_name: string; author_login: string;
  author_avatar: string; date: string; source: "human" | "agent" | "clawsync";
}
interface CommitFile { filename: string; status: string; additions: number; deletions: number; patch: string; }
interface CommitDetail { sha: string; message: string; date: string; files: CommitFile[]; }

const C = {
  cream: '#faf7f2', creamDark: '#f0ebe0', paper: '#ffffff',
  ink: '#1a1714', inkMid: '#5a5450', inkLight: '#9e9890', inkFaint: '#d4cfc7',
  claw: '#e8622a', clawLight: '#fde8de', clawMid: '#f4a07a',
  green: '#2d7a4f', greenLight: '#e0f2e9',
  blue: '#3b82f6', blueLight: '#dbeafe',
  purple: '#8b5cf6', purpleLight: '#ede9fe',
};

const SOURCE_CONFIG = {
  human: { icon: User, color: C.blue, bg: C.blueLight, label: "You edited" },
  agent: { icon: Bot, color: C.purple, bg: C.purpleLight, label: "Agent edited" },
  clawsync: { icon: Clock, color: C.claw, bg: C.clawLight, label: "Pagekeeper" },
};

export default function Timeline() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSha, setExpandedSha] = useState<string | null>(null);
  const [commitDetails, setCommitDetails] = useState<Record<string, CommitDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterFile, setFilterFile] = useState("");

  useEffect(() => {
    if (!owner || !repo) return;
    loadTimeline();
  }, [owner, repo, filterFile]);

  const loadTimeline = async () => {
    setLoading(true);
    try { const data = await getTimeline(owner!, repo!, filterFile || undefined); setTimeline(data.timeline); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleExpand = async (sha: string) => {
    if (expandedSha === sha) { setExpandedSha(null); return; }
    setExpandedSha(sha);
    if (!commitDetails[sha]) {
      setLoadingDetail(true);
      try { const detail = await getCommitDetail(owner!, repo!, sha); setCommitDetails((prev) => ({ ...prev, [sha]: detail })); }
      catch (e) { console.error(e); }
      setLoadingDetail(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const grouped: Record<string, TimelineEntry[]> = {};
  for (const entry of timeline) {
    const day = new Date(entry.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(entry);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, color: C.ink, fontFamily: "'Instrument Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700&family=Instrument+Sans:wght@400;500;600&display=swap');
        .pk-serif { font-family: 'Fraunces', Georgia, serif; }
        .pk-sans { font-family: 'Instrument Sans', -apple-system, sans-serif; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,247,242,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.inkFaint}`, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(`/agent/${owner}/${repo}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ width: 18, height: 18, color: C.claw }} />
            <span className="pk-serif" style={{ fontSize: 16, fontWeight: 500 }}>Timeline</span>
            <span style={{ color: C.inkFaint }}>&middot;</span>
            <span className="pk-sans" style={{ fontSize: 13, color: C.inkLight }}>{owner}/{repo}</span>
          </div>
        </div>
        <select value={filterFile} onChange={(e) => setFilterFile(e.target.value)} className="pk-sans" style={{ background: C.cream, border: `1px solid ${C.inkFaint}`, borderRadius: 8, padding: '6px 12px', fontSize: 13, color: C.inkMid, outline: 'none' }}>
          <option value="">All files</option>
          <option value="SOUL.md">SOUL.md</option>
          <option value="MEMORY.md">MEMORY.md</option>
          <option value="USER.md">USER.md</option>
          <option value="AGENTS.md">AGENTS.md</option>
          <option value="IDENTITY.md">IDENTITY.md</option>
          <option value="TOOLS.md">TOOLS.md</option>
        </select>
      </nav>

      {/* Legend */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 24px 0' }}>
        <div className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: C.inkLight, marginBottom: 24 }}>
          {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, background: cfg.bg, borderRadius: '50%', border: `1.5px solid ${cfg.color}` }} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 style={{ width: 28, height: 28, color: C.claw }} className="animate-spin" />
        </div>
      ) : timeline.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Clock style={{ width: 40, height: 40, color: C.inkFaint, margin: '0 auto 12px', display: 'block' }} />
          <p className="pk-sans" style={{ color: C.inkLight }}>No changes yet</p>
        </div>
      ) : (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 48px' }}>
          {Object.entries(grouped).map(([day, entries]) => (
            <div key={day} style={{ marginBottom: 32 }}>
              <h3 className="pk-sans" style={{ fontSize: 12, fontWeight: 600, color: C.inkLight, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 16, position: 'sticky', top: 60, background: C.cream, padding: '8px 0', zIndex: 10 }}>{day}</h3>
              <div style={{ position: 'relative' }}>
                {/* Timeline line */}
                <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 1, background: C.inkFaint }} />

                {entries.map((entry) => {
                  const config = SOURCE_CONFIG[entry.source];
                  const Icon = config.icon;
                  const isExpanded = expandedSha === entry.sha;
                  const detail = commitDetails[entry.sha];

                  return (
                    <div key={entry.sha} style={{ position: 'relative', paddingLeft: 48, paddingBottom: 20 }}>
                      {/* Timeline dot */}
                      <div style={{ position: 'absolute', left: 9, width: 16, height: 16, borderRadius: '50%', background: config.bg, border: `1.5px solid ${config.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: 9, height: 9, color: config.color }} />
                      </div>

                      {/* Card */}
                      <button onClick={() => toggleExpand(entry.sha)} style={{ width: '100%', textAlign: 'left', background: isExpanded ? C.paper : 'transparent', border: `1px solid ${isExpanded ? C.inkFaint : 'transparent'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all .15s' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <div className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: config.color }}>{config.label}</span>
                              <span style={{ fontSize: 11, color: C.inkFaint }}>&middot;</span>
                              <span style={{ fontSize: 11, color: C.inkLight }}>{timeAgo(entry.date)}</span>
                            </div>
                            <p className="pk-sans" style={{ fontSize: 13, color: C.ink }}>{entry.message}</p>
                            {entry.author_login && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                {entry.author_avatar && <img src={entry.author_avatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />}
                                <span className="pk-sans" style={{ fontSize: 11, color: C.inkLight }}>{entry.author_login}</span>
                              </div>
                            )}
                          </div>
                          {isExpanded ? <ChevronDown style={{ width: 14, height: 14, color: C.inkLight, flexShrink: 0 }} /> : <ChevronRight style={{ width: 14, height: 14, color: C.inkLight, flexShrink: 0 }} />}
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && detail && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.inkFaint}` }} onClick={(e) => e.stopPropagation()}>
                            {detail.files.map((file) => (
                              <div key={file.filename} style={{ marginBottom: 12 }}>
                                <div className="pk-sans" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <FileText style={{ width: 13, height: 13, color: C.inkLight }} />
                                  <span style={{ fontSize: 12, fontWeight: 600, color: C.inkMid }}>{file.filename}</span>
                                  <span style={{ fontSize: 11, color: C.inkLight }}>{file.status}</span>
                                  {file.additions > 0 && <span style={{ fontSize: 11, color: C.green, display: 'flex', alignItems: 'center', gap: 2 }}><Plus style={{ width: 10, height: 10 }} />{file.additions}</span>}
                                  {file.deletions > 0 && <span style={{ fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 2 }}><Minus style={{ width: 10, height: 10 }} />{file.deletions}</span>}
                                </div>
                                {file.patch && (
                                  <pre style={{ background: C.ink, borderRadius: 10, padding: 12, fontSize: 11, fontFamily: 'monospace', overflowX: 'auto', maxHeight: 200, overflowY: 'auto' }}>
                                    {file.patch.split("\n").map((line, i) => (
                                      <div key={i} style={{ color: line.startsWith("+") ? '#4ade80' : line.startsWith("-") ? '#f87171' : line.startsWith("@@") ? C.blue : C.inkLight }}>{line}</div>
                                    ))}
                                  </pre>
                                )}
                              </div>
                            ))}
                            <div className="pk-sans" style={{ fontSize: 11, color: C.inkLight, marginTop: 8 }}>{formatDate(detail.date)} &middot; {entry.sha.slice(0, 7)}</div>
                          </div>
                        )}

                        {isExpanded && loadingDetail && !detail && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.inkFaint}`, display: 'flex', justifyContent: 'center' }}>
                            <Loader2 style={{ width: 18, height: 18, color: C.claw }} className="animate-spin" />
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
