import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "../lib/api";
import { Zap } from "lucide-react";

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-400 text-lg">Connecting your GitHub account...</p>
      </div>
    </div>
  );
}
