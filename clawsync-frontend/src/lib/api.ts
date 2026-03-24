const API_URL = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("clawsync_token");
}

export function setToken(token: string) {
  localStorage.setItem("clawsync_token", token);
}

export function clearToken() {
  localStorage.removeItem("clawsync_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["X-ClawSync-Token"] = token;
  }
  const resp = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (resp.status === 401) {
    clearToken();
    window.location.href = "/";
    throw new Error("Unauthorized");
  }
  return resp;
}

// Auth
export async function getLoginUrl(): Promise<string> {
  const resp = await fetch(`${API_URL}/auth/github`);
  const data = await resp.json();
  return data.url;
}

export async function getAuthMode(): Promise<{ oauth: boolean; pat: boolean }> {
  const resp = await fetch(`${API_URL}/auth/mode`);
  return resp.json();
}

export async function loginWithPAT(token: string): Promise<{ token: string; user: { login: string; avatar_url: string; name: string } }> {
  const resp = await fetch(`${API_URL}/auth/pat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Login failed");
  }
  return resp.json();
}

export async function getMe() {
  const resp = await apiFetch("/auth/me");
  return resp.json();
}

// Repos / Agents
export async function getAgentRepos() {
  const resp = await apiFetch("/api/repos");
  return resp.json();
}

export async function getAllRepos() {
  const resp = await apiFetch("/api/repos/all");
  return resp.json();
}

export async function createAgentRepo(name: string, template: string, isPrivate: boolean = true) {
  const resp = await apiFetch("/api/repos", {
    method: "POST",
    body: JSON.stringify({ name, template, private: isPrivate }),
  });
  return resp.json();
}

// Files
export async function listFiles(owner: string, repo: string, path: string = "") {
  const params = path ? `?path=${encodeURIComponent(path)}` : "";
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/files${params}`);
  return resp.json();
}

export async function listMarkdownFiles(owner: string, repo: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/markdown-files`);
  return resp.json();
}

export async function getFile(owner: string, repo: string, filePath: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/files/${filePath}`);
  return resp.json();
}

export async function updateFile(
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  sha: string,
  message?: string
) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/files/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({ content, sha, message: message || "" }),
  });
  return resp.json();
}

export async function createFile(
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  message?: string
) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/files/${filePath}`, {
    method: "POST",
    body: JSON.stringify({ content, message: message || "" }),
  });
  return resp.json();
}

// Timeline
export async function getTimeline(owner: string, repo: string, path?: string) {
  const params = path ? `?path=${encodeURIComponent(path)}` : "";
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/timeline${params}`);
  return resp.json();
}

export async function getCommitDetail(owner: string, repo: string, sha: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/commits/${sha}`);
  return resp.json();
}

// Import Existing Repo
export async function importRepo(fullName: string) {
  const resp = await apiFetch("/api/repos/import", {
    method: "POST",
    body: JSON.stringify({ full_name: fullName }),
  });
  return resp.json();
}

// Delete Repo
export async function deleteAgentRepo(owner: string, repo: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}`, { method: "DELETE" });
  return resp.json();
}

// Sync Checker
export async function createSyncTest(owner: string, repo: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/sync-test`, { method: "POST" });
  return resp.json();
}

export async function getSyncStatus(owner: string, repo: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/sync-status`);
  return resp.json();
}

export async function deleteSyncTest(owner: string, repo: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/sync-test`, { method: "DELETE" });
  return resp.json();
}

// Branches (Advanced Mode)
export async function listBranches(owner: string, repo: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/branches`);
  return resp.json();
}

export async function createBranch(owner: string, repo: string, name: string, fromBranch: string = "main") {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/branches`, {
    method: "POST",
    body: JSON.stringify({ name, from_branch: fromBranch }),
  });
  return resp.json();
}

export async function compareBranches(owner: string, repo: string, base: string, head: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/compare/${base}...${head}`);
  return resp.json();
}

export async function mergeBranch(owner: string, repo: string, head: string, base: string = "main", commitMessage: string = "") {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/merge`, {
    method: "POST",
    body: JSON.stringify({ head, base, commit_message: commitMessage }),
  });
  return resp.json();
}

export async function deleteBranch(owner: string, repo: string, branch: string) {
  const resp = await apiFetch(`/api/repos/${owner}/${repo}/branches/${branch}`, { method: "DELETE" });
  return resp.json();
}

export { API_URL };
