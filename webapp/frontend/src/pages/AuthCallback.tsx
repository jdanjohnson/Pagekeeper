import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "../lib/api";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      setToken(token);
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }, [params, navigate]);

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f2", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Sans', -apple-system, sans-serif" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Instrument+Sans:wght@400;500;600&display=swap');"}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "#e8622a", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Loader2 style={{ width: 28, height: 28, color: "white" }} className="animate-spin" />
        </div>
        <p style={{ fontSize: 16, color: "#5a5450", fontFamily: "'Fraunces', Georgia, serif" }}>Connecting your GitHub account...</p>
      </div>
    </div>
  );
}
