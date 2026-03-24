import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import AgentDetail from "./pages/AgentDetail";
import Timeline from "./pages/Timeline";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agent/*" element={<AgentDetail />} />
        <Route path="/timeline/:owner/:repo" element={<Timeline />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
