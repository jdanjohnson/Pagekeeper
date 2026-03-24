import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTimeline, getCommitDetail } from "../lib/api";
import {
  ArrowLeft,
  Bot,
  User,
  Zap,
  Clock,
  FileText,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface TimelineEntry {
  sha: string;
  message: string;
  author_name: string;
  author_login: string;
  author_avatar: string;
  date: string;
  source: "human" | "agent" | "clawsync";
}

interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
}

interface CommitDetail {
  sha: string;
  message: string;
  date: string;
  files: CommitFile[];
}

const SOURCE_CONFIG = {
  human: {
    icon: User,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    label: "You edited",
  },
  agent: {
    icon: Bot,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
    label: "Agent edited",
  },
  clawsync: {
    icon: Zap,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    label: "ClawSync",
  },
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
    try {
      const data = await getTimeline(owner!, repo!, filterFile || undefined);
      setTimeline(data.timeline);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleExpand = async (sha: string) => {
    if (expandedSha === sha) {
      setExpandedSha(null);
      return;
    }
    setExpandedSha(sha);
    if (!commitDetails[sha]) {
      setLoadingDetail(true);
      try {
        const detail = await getCommitDetail(owner!, repo!, sha);
        setCommitDetails((prev) => ({ ...prev, [sha]: detail }));
      } catch (e) {
        console.error(e);
      }
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Group timeline by date
  const grouped: Record<string, TimelineEntry[]> = {};
  for (const entry of timeline) {
    const day = new Date(entry.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(entry);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/agent/${owner}/${repo}`)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold">Timeline</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-400 text-sm">
              {owner}/{repo}
            </span>
          </div>
        </div>
        <div>
          <select
            value={filterFile}
            onChange={(e) => setFilterFile(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All files</option>
            <option value="SOUL.md">SOUL.md</option>
            <option value="MEMORY.md">MEMORY.md</option>
            <option value="USER.md">USER.md</option>
            <option value="AGENTS.md">AGENTS.md</option>
            <option value="IDENTITY.md">IDENTITY.md</option>
            <option value="TOOLS.md">TOOLS.md</option>
          </select>
        </div>
      </nav>

      {/* Legend */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500/30 rounded-full border border-blue-500/50" />
            Your edits
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-purple-500/30 rounded-full border border-purple-500/50" />
            Agent edits
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-500/30 rounded-full border border-emerald-500/50" />
            ClawSync edits
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : timeline.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No changes yet</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 pb-12">
          {Object.entries(grouped).map(([day, entries]) => (
            <div key={day} className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-4 sticky top-0 bg-gray-950 py-2">
                {day}
              </h3>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-800" />

                {entries.map((entry) => {
                  const config = SOURCE_CONFIG[entry.source];
                  const Icon = config.icon;
                  const isExpanded = expandedSha === entry.sha;
                  const detail = commitDetails[entry.sha];

                  return (
                    <div key={entry.sha} className="relative pl-14 pb-6">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-3 w-5 h-5 rounded-full ${config.bg} border ${config.border} flex items-center justify-center`}
                      >
                        <Icon className={`w-3 h-3 ${config.color}`} />
                      </div>

                      {/* Card */}
                      <button
                        onClick={() => toggleExpand(entry.sha)}
                        className={`w-full text-left bg-gray-900/50 border rounded-xl p-4 transition-all hover:bg-gray-900 ${
                          isExpanded
                            ? `${config.border} bg-gray-900`
                            : "border-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${config.color}`}>
                                {config.label}
                              </span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className="text-xs text-gray-500">
                                {timeAgo(entry.date)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-200">
                              {entry.message}
                            </p>
                            {entry.author_login && (
                              <div className="flex items-center gap-1.5 mt-2">
                                {entry.author_avatar && (
                                  <img
                                    src={entry.author_avatar}
                                    alt=""
                                    className="w-4 h-4 rounded-full"
                                  />
                                )}
                                <span className="text-xs text-gray-500">
                                  {entry.author_login}
                                </span>
                              </div>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                          )}
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && detail && (
                          <div
                            className="mt-4 pt-4 border-t border-gray-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {detail.files.map((file) => (
                              <div key={file.filename} className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-xs font-medium text-gray-300">
                                    {file.filename}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {file.status}
                                  </span>
                                  {file.additions > 0 && (
                                    <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                                      <Plus className="w-3 h-3" />
                                      {file.additions}
                                    </span>
                                  )}
                                  {file.deletions > 0 && (
                                    <span className="text-xs text-red-400 flex items-center gap-0.5">
                                      <Minus className="w-3 h-3" />
                                      {file.deletions}
                                    </span>
                                  )}
                                </div>
                                {file.patch && (
                                  <pre className="bg-gray-950 rounded-lg p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto">
                                    {file.patch.split("\n").map((line, i) => (
                                      <div
                                        key={i}
                                        className={
                                          line.startsWith("+")
                                            ? "text-emerald-400"
                                            : line.startsWith("-")
                                            ? "text-red-400"
                                            : line.startsWith("@@")
                                            ? "text-blue-400"
                                            : "text-gray-500"
                                        }
                                      >
                                        {line}
                                      </div>
                                    ))}
                                  </pre>
                                )}
                              </div>
                            ))}
                            <div className="text-xs text-gray-600 mt-2">
                              {formatDate(detail.date)} · {entry.sha.slice(0, 7)}
                            </div>
                          </div>
                        )}

                        {isExpanded && loadingDetail && !detail && (
                          <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center">
                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
