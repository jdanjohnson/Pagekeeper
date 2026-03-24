import { useNavigate } from "react-router-dom";
import { getLoginUrl, getAuthMode, loginWithPAT, setToken, isAuthenticated } from "../lib/api";
import { useEffect, useState } from "react";
import { Key, ExternalLink, AlertCircle, Check } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<{ oauth: boolean; pat: boolean }>({ oauth: true, pat: true });
  const [showPAT, setShowPAT] = useState(false);
  const [patValue, setPatValue] = useState("");
  const [patLoading, setPatLoading] = useState(false);
  const [patError, setPatError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) { navigate("/dashboard"); }
    getAuthMode().then(setAuthMode).catch(() => {});
  }, [navigate]);

  const handleLogin = async () => {
    if (authMode.oauth) { const url = await getLoginUrl(); window.location.href = url; }
    else { setShowPAT(true); }
  };

  const handlePATLogin = async () => {
    if (!patValue.trim()) return;
    setPatLoading(true); setPatError("");
    try { const result = await loginWithPAT(patValue.trim()); setToken(result.token); navigate("/dashboard"); }
    catch (e: any) { setPatError(e?.message || "Invalid token"); }
    setPatLoading(false);
  };

  const C = {
    cream: '#faf7f2', creamDark: '#f0ebe0', paper: '#ffffff',
    ink: '#1a1714', inkMid: '#5a5450', inkLight: '#9e9890', inkFaint: '#d4cfc7',
    claw: '#e8622a', clawLight: '#fde8de', clawMid: '#f4a07a',
    green: '#2d7a4f', greenLight: '#e0f2e9',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, color: C.ink, fontFamily: "'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,500&family=Instrument+Sans:wght@400;500;600&display=swap');
        .pk-serif { font-family: 'Fraunces', Georgia, serif; }
        .pk-sans { font-family: 'Instrument Sans', -apple-system, sans-serif; }
        @keyframes pkRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pkBlink { 50% { opacity: 0; } }
        .pk-r1 { opacity:0; animation: pkRise .5s ease forwards .1s; }
        .pk-r2 { opacity:0; animation: pkRise .6s ease forwards .2s; }
        .pk-r3 { opacity:0; animation: pkRise .6s ease forwards .35s; }
        .pk-r4 { opacity:0; animation: pkRise .6s ease forwards .45s; }
        .pk-r5 { opacity:0; animation: pkRise .5s ease forwards .6s; }
        .pk-r6 { opacity:0; animation: pkRise .8s ease forwards .7s; }
        .pk-blink { display:inline-block; width:2px; height:14px; background:#e8622a; vertical-align:middle; margin-left:1px; animation:pkBlink 1s step-end infinite; }
        .pk-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.08); transform: translateY(-2px); }
        .pk-feat:hover { background: #272320 !important; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(250,247,242,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderBottom:`1px solid ${C.inkFaint}`, padding:'0 48px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>
        <a href="#" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', color:C.ink }}>
          <div style={{ width:30, height:30, background:C.claw, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M3 12C3 12 2 7 6 4c2-1.5 5 0 5 3 0-3 2.5-4.5 4-2 1.5 2.5-1 6.5-4 7" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none"/><path d="M5 14c0 0-.5-4.5 2.5-6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/><path d="M8 14c0 0-.2-3.5.2-5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 14c0 0 0-4.5-1-6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </div>
          <span className="pk-serif" style={{ fontSize:17, fontWeight:500, letterSpacing:'-0.01em' }}>Pagekeeper</span>
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <a href="#how" className="pk-sans" style={{ fontSize:13, color:C.inkMid, textDecoration:'none', fontWeight:500 }}>How it works</a>
          <a href="#features" className="pk-sans" style={{ fontSize:13, color:C.inkMid, textDecoration:'none', fontWeight:500 }}>Features</a>
          {authMode.oauth ? (
            <button onClick={handleLogin} className="pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:100, fontSize:13, fontWeight:600, background:C.claw, color:'white', border:'none', cursor:'pointer' }}>Get Started</button>
          ) : (
            <button onClick={() => setShowPAT(true)} className="pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:100, fontSize:13, fontWeight:600, background:C.claw, color:'white', border:'none', cursor:'pointer' }}>Connect with Token</button>
          )}
        </div>
      </nav>

      {/* PAT MODAL */}
      {showPAT && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
          <div style={{ background:'white', border:`1px solid ${C.inkFaint}`, borderRadius:16, padding:32, width:'100%', maxWidth:420, boxShadow:'0 24px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
              <div style={{ width:40, height:40, background:C.clawLight, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Key style={{ width:20, height:20, color:C.claw }} />
              </div>
              <div>
                <h2 className="pk-serif" style={{ fontSize:18, fontWeight:500 }}>Sign in with Token</h2>
                <p className="pk-sans" style={{ fontSize:13, color:C.inkLight }}>Paste a GitHub Personal Access Token</p>
              </div>
            </div>
            <div style={{ background:C.cream, border:`1px solid ${C.inkFaint}`, borderRadius:10, padding:16, marginBottom:16 }}>
              <p className="pk-sans" style={{ fontSize:13, color:C.inkMid, marginBottom:10 }}>
                Create a token with <code style={{ background:C.creamDark, padding:'2px 6px', borderRadius:4, fontFamily:'monospace', fontSize:11, color:C.claw }}>repo</code> and <code style={{ background:C.creamDark, padding:'2px 6px', borderRadius:4, fontFamily:'monospace', fontSize:11, color:C.claw }}>delete_repo</code> scopes:
              </p>
              <a href="https://github.com/settings/tokens/new?description=Pagekeeper&scopes=repo,delete_repo" target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:C.claw, textDecoration:'none', fontWeight:500 }}>
                <ExternalLink style={{ width:14, height:14 }} /> Create token on GitHub
              </a>
            </div>
            <input type="password" value={patValue} onChange={(e) => { setPatValue(e.target.value); setPatError(""); }} placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="pk-sans" style={{ width:'100%', background:C.cream, border:`1px solid ${C.inkFaint}`, borderRadius:8, padding:'12px 16px', fontSize:13, fontFamily:'monospace', marginBottom:12, outline:'none', color:C.ink }} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handlePATLogin(); }} />
            {patError && (
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#dc2626', fontSize:13, marginBottom:12 }}>
                <AlertCircle style={{ width:16, height:16 }} /> {patError}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={handlePATLogin} disabled={!patValue.trim() || patLoading} className="pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:100, fontSize:13, fontWeight:600, background:C.claw, color:'white', border:'none', cursor:'pointer', opacity:(!patValue.trim() || patLoading) ? 0.5 : 1 }}>
                {patLoading ? "Connecting..." : "Connect"}
              </button>
              <button onClick={() => { setShowPAT(false); setPatValue(""); setPatError(""); }} className="pk-sans" style={{ fontSize:13, color:C.inkLight, background:'none', border:'none', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ padding:'80px 48px 60px', maxWidth:1100, margin:'0 auto' }}>
        <div className="pk-r1 pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:6, background:C.greenLight, color:C.green, padding:'5px 12px', borderRadius:100, fontSize:12, fontWeight:600, marginBottom:28 }}>
          <span style={{ width:6, height:6, background:C.green, borderRadius:'50%' }} /> Free while in beta
        </div>
        <h1 className="pk-serif pk-r2" style={{ fontSize:'clamp(42px,6vw,76px)', fontWeight:500, lineHeight:1.05, letterSpacing:'-.03em', maxWidth:720, marginBottom:24 }}>
          Edit your docs.<br/><em style={{ fontStyle:'italic', color:C.claw }}>No git required.</em>
        </h1>
        <p className="pk-sans pk-r3" style={{ fontSize:18, color:C.inkMid, maxWidth:520, lineHeight:1.65, marginBottom:36 }}>
          GitHub is powerful &#8212; but it shouldn&#8217;t be hard just to update your agent&#8217;s knowledge files. Pagekeeper lets you make changes how you know best, and keeps everything synced in the background.
        </p>
        <div className="pk-r4" style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          {authMode.oauth ? (
            <button onClick={handleLogin} className="pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'12px 28px', borderRadius:100, fontSize:14, fontWeight:600, background:C.claw, color:'white', border:'none', cursor:'pointer' }}>Try Pagekeeper free &#8594;</button>
          ) : (
            <button onClick={() => setShowPAT(true)} className="pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'12px 28px', borderRadius:100, fontSize:14, fontWeight:600, background:C.claw, color:'white', border:'none', cursor:'pointer' }}>Try Pagekeeper free &#8594;</button>
          )}
          <a href="#how" className="pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'12px 28px', borderRadius:100, fontSize:14, fontWeight:600, background:'transparent', color:C.ink, border:`1.5px solid ${C.inkFaint}`, textDecoration:'none', cursor:'pointer' }}>See how it works</a>
        </div>
        <p className="pk-sans pk-r5" style={{ fontSize:12, color:C.inkLight, marginTop:14 }}>Works with any public or private GitHub repo. No database needed.</p>
      </section>

      {/* EDITOR MOCKUP */}
      <div className="pk-r6" style={{ maxWidth:1100, margin:'20px auto 0', padding:'0 48px 80px' }}>
        <div style={{ background:'white', borderRadius:16, border:`1px solid ${C.inkFaint}`, boxShadow:'0 4px 8px rgba(0,0,0,.04), 0 24px 60px rgba(0,0,0,.1)', overflow:'hidden' }}>
          {/* Title bar */}
          <div style={{ background:'#f5f3ef', borderBottom:`1px solid ${C.inkFaint}`, padding:'10px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', gap:6 }}>
              <div style={{ width:11, height:11, borderRadius:'50%', background:'#ff5f57' }} />
              <div style={{ width:11, height:11, borderRadius:'50%', background:'#febc2e' }} />
              <div style={{ width:11, height:11, borderRadius:'50%', background:'#28c840' }} />
            </div>
            <div className="pk-sans" style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:C.inkLight, marginLeft:8 }}>
              <span style={{ background:C.creamDark, padding:'3px 10px', borderRadius:100, color:C.inkMid, fontWeight:500, fontSize:11 }}>my-agent</span>
              <span style={{ color:C.inkFaint }}>/</span>
              <span style={{ color:C.claw, fontWeight:600, fontSize:12 }}>SOUL.md</span>
            </div>
            <div className="pk-sans" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.green, fontWeight:500 }}>
              <Check style={{ width:12, height:12 }} /> Saved to GitHub
            </div>
          </div>
          {/* Body */}
          <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 1fr', minHeight:300 }}>
            {/* File tree */}
            <div style={{ borderRight:`1px solid ${C.inkFaint}`, padding:'16px 0', background:'#faf9f7' }}>
              <div className="pk-sans" style={{ padding:'0 14px 8px', fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:C.inkLight }}>Files</div>
              {['SOUL.md','MEMORY.md','USER.md','AGENTS.md'].map((f,i) => (
                <div key={f} className="pk-sans" style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 14px', fontSize:12, color:i===0?C.claw:C.inkMid, cursor:'pointer', background:i===0?C.clawLight:'transparent', fontWeight:i===0?600:400 }}>
                  &#128196; {f}
                </div>
              ))}
              <div className="pk-sans" style={{ padding:'8px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:C.inkLight }}>Knowledge</div>
              <div className="pk-sans" style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 14px', fontSize:12, color:C.inkMid, cursor:'pointer' }}>&#128193; guides/</div>
              <div className="pk-sans" style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 14px', fontSize:12, color:C.inkMid, cursor:'pointer' }}>&#128196; faq.md</div>
            </div>
            {/* Editor */}
            <div style={{ borderRight:`1px solid ${C.inkFaint}`, padding:'24px 28px' }}>
              <div className="pk-sans" style={{ fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:C.inkLight, marginBottom:16 }}>Editing</div>
              <div className="pk-serif" style={{ fontSize:18, fontWeight:700, marginBottom:12 }}># Soul</div>
              <div className="pk-sans" style={{ color:C.inkMid, fontSize:12, marginBottom:10, lineHeight:1.75 }}>You are a friendly, knowledgeable assistant built on OpenClaw.</div>
              <div className="pk-serif" style={{ fontSize:14, fontWeight:600, margin:'14px 0 8px' }}>## Personality</div>
              <div className="pk-sans" style={{ color:C.inkMid, fontSize:12, marginBottom:10, lineHeight:1.75 }}>Be warm and conversational. Use plain language.<span className="pk-blink" /></div>
              <div className="pk-serif" style={{ fontSize:14, fontWeight:600, margin:'14px 0 8px' }}>## Rules</div>
              <div className="pk-sans" style={{ color:C.inkMid, fontSize:12, lineHeight:1.75 }}>Always cite sources. Never make up facts.</div>
            </div>
            {/* Preview */}
            <div style={{ padding:'24px 28px', background:'white' }}>
              <div className="pk-sans" style={{ fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:C.inkLight, marginBottom:16 }}>Preview</div>
              <div className="pk-serif" style={{ fontSize:20, fontWeight:700, marginBottom:12 }}>Soul</div>
              <div className="pk-sans" style={{ color:C.inkMid, fontSize:12, marginBottom:10, lineHeight:1.75 }}>You are a friendly, knowledgeable assistant built on OpenClaw.</div>
              <div className="pk-serif" style={{ fontSize:15, fontWeight:600, margin:'14px 0 8px' }}>Personality</div>
              <div className="pk-sans" style={{ color:C.inkMid, fontSize:12, marginBottom:10, lineHeight:1.75 }}>Be warm and conversational. Use plain language.</div>
              <div className="pk-serif" style={{ fontSize:15, fontWeight:600, margin:'14px 0 8px' }}>Rules</div>
              <div className="pk-sans" style={{ color:C.inkMid, fontSize:12, lineHeight:1.75 }}>Always cite sources. Never make up facts.</div>
            </div>
          </div>
          {/* Toolbar */}
          <div className="pk-sans" style={{ borderTop:`1px solid ${C.inkFaint}`, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, background:'#faf9f7' }}>
            {['B','I','H1','H2'].map(b => (
              <button key={b} style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:6, border:`1px solid ${C.inkFaint}`, background:'white', color:C.inkMid, cursor:'pointer', fontFamily:'inherit' }}>{b}</button>
            ))}
            <button style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:6, border:`1px solid ${C.greenLight}`, background:C.greenLight, color:C.green, cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}>Commit</button>
            <button style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:6, border:`1px solid ${C.claw}`, background:C.claw, color:'white', cursor:'pointer', fontFamily:'inherit' }}>Save to GitHub</button>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth:1100, margin:'0 auto', padding:'80px 48px' }}>
        <div className="pk-sans" style={{ fontSize:12, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:C.claw, marginBottom:14 }}>How it works</div>
        <h2 className="pk-serif" style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:500, letterSpacing:'-.025em', lineHeight:1.1, marginBottom:56, maxWidth:500 }}>
          Three steps.<br/><em style={{ fontStyle:'italic', color:C.inkMid }}>That&#8217;s really it.</em>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {[
            { n:'1', t:'Connect your repo', d:'Sign in with GitHub and pick any repo &#8212; or create a new one. Pagekeeper finds all your markdown files automatically.', tag:'No setup needed' },
            { n:'2', t:'Edit in your browser', d:'Click any file and start writing. Live preview shows you exactly how it will look &#8212; no commands, no terminal.', tag:'What you see is what you get' },
            { n:'3', t:'Syncs everywhere', d:'Save and your changes go to GitHub. Your VPS, Mac, or any connected device pulls the latest automatically.', tag:'Always up to date' },
          ].map(s => (
            <div key={s.n} className="pk-card" style={{ background:'white', borderRadius:12, border:`1px solid ${C.inkFaint}`, padding:'32px 28px', transition:'box-shadow .2s, transform .2s', cursor:'default' }}>
              <div className="pk-serif" style={{ fontSize:40, fontWeight:300, color:C.inkFaint, lineHeight:1, marginBottom:16 }}>{s.n}</div>
              <div className="pk-serif" style={{ fontSize:18, fontWeight:500, marginBottom:10 }}>{s.t}</div>
              <p className="pk-sans" style={{ fontSize:13, color:C.inkMid, lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: s.d }} />
              <span className="pk-sans" style={{ display:'inline-block', marginTop:16, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:100, background:C.clawLight, color:C.claw }}>{s.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background:C.ink, color:C.cream, padding:'80px 48px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="pk-sans" style={{ fontSize:12, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:C.clawMid, marginBottom:14 }}>Features</div>
          <h2 className="pk-serif" style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:500, letterSpacing:'-.025em', lineHeight:1.1, marginBottom:48, maxWidth:500, color:C.cream }}>
            Everything you need.<br/><em style={{ fontStyle:'italic', color:C.inkLight }}>Nothing you don&#8217;t.</em>
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:1, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, overflow:'hidden' }}>
            {[
              { i:'&#128065;&#65039;', t:'Live preview', d:'See your rendered markdown as you type. No more guessing what your formatting will look like.' },
              { i:'&#128274;', t:'Version history built-in', d:'Every save is a commit. Scroll back through changes anytime and restore any previous version.' },
              { i:'&#128193;', t:'Full repo file tree', d:'Browse all your markdown files in one place. Nested folders, search &#8212; everything organized.' },
              { i:'&#128256;', t:'Advanced mode', d:'Branch, diff, and merge like a pro &#8212; without touching the terminal. PR-style workflow built in.' },
              { i:'&#129514;', t:'Sync checker', d:'Test that your VPS or Mac is actually pulling changes. One-click verification with real-time status.' },
              { i:'&#129309;', t:'Works with your team', d:'Share access with collaborators. Everyone edits the same repo &#8212; no emailing files back and forth.' },
            ].map(f => (
              <div key={f.t} className="pk-feat" style={{ background:C.ink, padding:'36px 32px', transition:'background .2s' }}>
                <div style={{ fontSize:28, marginBottom:16 }} dangerouslySetInnerHTML={{ __html: f.i }} />
                <div className="pk-serif" style={{ fontSize:18, fontWeight:500, color:C.cream, marginBottom:10 }}>{f.t}</div>
                <p className="pk-sans" style={{ fontSize:13, color:C.inkLight, lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: f.d }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'80px 48px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
        <blockquote className="pk-serif" style={{ fontSize:'clamp(22px,3vw,34px)', fontWeight:300, fontStyle:'italic', lineHeight:1.35, letterSpacing:'-.02em' }}>
          &#8220;GitHub is powerful. But it <strong style={{ fontStyle:'normal', fontWeight:500, color:C.claw }}>shouldn&#8217;t be hard</strong> just to update your agent&#8217;s brain.&#8221;
        </blockquote>
        <div>
          <p className="pk-sans" style={{ fontSize:15, color:C.inkMid, lineHeight:1.7, marginBottom:24 }}>
            Pagekeeper is for anyone who works with AI agents but doesn&#8217;t want to wrestle with git every time they need to update a knowledge file.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {['Creators building with OpenClaw','Teams managing shared agent knowledge','Non-developers who want to edit docs visually','Anyone who just wants their agent files to stay current'].map(p => (
              <div key={p} className="pk-sans" style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:C.inkMid }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:C.clawMid, flexShrink:0 }} /> {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:C.clawLight, borderTop:'1px solid rgba(232,98,42,.15)', borderBottom:'1px solid rgba(232,98,42,.15)', padding:'80px 48px', textAlign:'center' as const }}>
        <div className="pk-sans" style={{ fontSize:12, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' as const, color:C.claw, marginBottom:14 }}>Get started</div>
        <h2 className="pk-serif" style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:500, letterSpacing:'-.025em', lineHeight:1.1, marginBottom:16 }}>
          Start editing.<br/><em style={{ fontStyle:'italic', color:C.inkMid }}>Free during beta.</em>
        </h2>
        <p className="pk-sans" style={{ fontSize:16, color:C.inkMid, marginBottom:36 }}>Connect your GitHub and start managing your agent files in seconds.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' as const }}>
          {authMode.oauth && (
            <button onClick={handleLogin} className="pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 32px', borderRadius:100, fontSize:14, fontWeight:600, background:C.claw, color:'white', border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(232,98,42,.3)' }}>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Connect with GitHub
            </button>
          )}
          <button onClick={() => setShowPAT(true)} className="pk-sans" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'14px 32px', borderRadius:100, fontSize:14, fontWeight:600, background:'transparent', color:C.ink, border:`1.5px solid ${C.inkFaint}`, cursor:'pointer' }}>
            <Key style={{ width:16, height:16 }} /> Use a token instead
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pk-sans" style={{ padding:'32px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:`1px solid ${C.inkFaint}` }}>
        <div style={{ fontSize:12, color:C.inkLight }}>&#169; 2026 Pagekeeper</div>
        <div style={{ display:'flex', gap:24 }}>
          <a href="https://github.com/jdanjohnson/Pagekeeper" target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.inkLight, textDecoration:'none' }}>GitHub</a>
          <a href="#" style={{ fontSize:12, color:C.inkLight, textDecoration:'none' }}>Docs</a>
          <a href="#" style={{ fontSize:12, color:C.inkLight, textDecoration:'none' }}>Privacy</a>
        </div>
      </footer>
    </div>
  );
}
