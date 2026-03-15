"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import "./styles.css";

// ── Animated Number Ticker ──
function NumberTicker({ value, visible, suffix = "" }: { value: string; visible: boolean; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const numericPart = value.replace(/[^0-9.]/g, "");
  const prefix = value.match(/^[^0-9]*/)?.[0] || "";
  const postfix = value.match(/[^0-9]*$/)?.[0] || "";

  useEffect(() => {
    if (!visible) return;
    const target = parseFloat(numericPart.replace(/,/g, ""));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    if (isNaN(target)) { setDisplay(value); return; }
    const duration = 1800;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += target / steps;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      const formatted = current >= 1000
        ? Math.floor(current).toLocaleString()
        : Number.isInteger(target) ? Math.floor(current).toString() : current.toFixed(0);
      setDisplay(formatted);
    }, stepTime);
    return () => clearInterval(timer);
  }, [visible, numericPart, value]);

  if (!visible) return <span style={{opacity:0}}>0</span>;
  return <span>{prefix}{display}{postfix}{suffix}</span>;
}

// ══ SKINS ══
export const SKINS = [
  {
    id: "dark",
    name: "Dark Premium",
    nameHe: "כהה פרימיום",
    desc: "גלאסמורפיזם כהה",
    preview: ["#07090e", "#f97316", "#3b82f6"] as [string, string, string],
    vars: {
      "--ds-bg": "#07090e", "--ds-bg-card": "rgba(255,255,255,0.05)",
      "--ds-border": "rgba(255,255,255,0.08)", "--ds-border-hover": "rgba(255,255,255,0.15)",
      "--ds-accent": "#f97316", "--ds-accent-glow": "rgba(249,115,22,0.4)", "--ds-accent-soft": "rgba(249,115,22,0.10)", "--ds-accent-glow-40": "rgba(249,115,22,0.16)",
      "--ds-blue": "#3b82f6", "--ds-green": "#22c55e", "--ds-purple": "#a855f7", "--ds-yellow": "#eab308", "--ds-cyan": "#06b6d4",
      "--ds-text": "#f1f5f9", "--ds-text-soft": "#94a3b8", "--ds-text-muted": "#475569",
      "--ds-nav-bg": "rgba(7,9,14,0.85)", "--ds-glass": "rgba(255,255,255,0.05)",
      "--ds-hero-grad": "linear-gradient(135deg,#fff 0%,#f1f5f9 40%,#f97316 70%,#ea580c 100%)",
      "--ds-card-bg": "rgba(255,255,255,0.04)", "--ds-card-border": "rgba(255,255,255,0.08)",
      "--ds-orb1": "rgba(249,115,22,0.07)", "--ds-orb2": "rgba(59,130,246,0.05)",
      "--ds-input-bg": "rgba(255,255,255,0.06)", "--ds-input-border": "rgba(255,255,255,0.1)",
      "--ds-footer-bg": "rgba(255,255,255,0.01)",
      "--ds-blur": "blur(20px) saturate(180%)",
      "--ds-radius": "16px", "--ds-radius-sm": "10px", "--ds-radius-btn": "12px",
      "--ds-glass-line": "rgba(255,255,255,0.12)",
      "--ds-card-shadow-hover": "rgba(0,0,0,0.55)",
      "--ds-testimonial-shadow": "rgba(0,0,0,0.4)",
      "--ds-secondary-border": "rgba(255,255,255,0.2)",
      "--ds-secondary-hover-bg": "rgba(255,255,255,0.07)",
      "--ds-nav-hover-bg": "rgba(255,255,255,0.06)",
      "--ds-select-option-bg": "#0f1117",
      "--ds-logo-grad-end": "#ea580c",
    },
  },
  {
    id: "light",
    name: "Light Pro",
    nameHe: "בהיר מקצועי",
    desc: "נקי ומקצועי",
    preview: ["#f8fafc", "#f97316", "#1e40af"] as [string, string, string],
    vars: {
      "--ds-bg": "#f8fafc", "--ds-bg-card": "#ffffff",
      "--ds-border": "rgba(0,0,0,0.08)", "--ds-border-hover": "rgba(249,115,22,0.4)",
      "--ds-accent": "#ea580c", "--ds-accent-glow": "rgba(234,88,12,0.2)", "--ds-accent-soft": "rgba(234,88,12,0.08)", "--ds-accent-glow-40": "rgba(234,88,12,0.12)",
      "--ds-blue": "#1d4ed8", "--ds-green": "#16a34a", "--ds-purple": "#7c3aed", "--ds-yellow": "#ca8a04", "--ds-cyan": "#0891b2",
      "--ds-text": "#0f172a", "--ds-text-soft": "#475569", "--ds-text-muted": "#94a3b8",
      "--ds-nav-bg": "rgba(248,250,252,0.92)", "--ds-glass": "rgba(255,255,255,0.8)",
      "--ds-hero-grad": "linear-gradient(135deg,#0f172a 0%,#1e3a5f 40%,#ea580c 70%,#c2410c 100%)",
      "--ds-card-bg": "#ffffff", "--ds-card-border": "rgba(0,0,0,0.07)",
      "--ds-orb1": "rgba(234,88,12,0.08)", "--ds-orb2": "rgba(29,78,216,0.06)",
      "--ds-input-bg": "#f1f5f9", "--ds-input-border": "rgba(0,0,0,0.12)",
      "--ds-footer-bg": "#f1f5f9",
      "--ds-blur": "blur(20px)",
      "--ds-radius": "14px", "--ds-radius-sm": "9px", "--ds-radius-btn": "10px",
      "--ds-glass-line": "rgba(0,0,0,0.06)",
      "--ds-card-shadow-hover": "rgba(0,0,0,0.12)",
      "--ds-testimonial-shadow": "rgba(0,0,0,0.08)",
      "--ds-secondary-border": "rgba(0,0,0,0.18)",
      "--ds-secondary-hover-bg": "rgba(0,0,0,0.05)",
      "--ds-nav-hover-bg": "rgba(0,0,0,0.05)",
      "--ds-select-option-bg": "#ffffff",
      "--ds-logo-grad-end": "#ea580c",
    },
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    nameHe: "כחול חצות",
    desc: "כחול עמוק",
    preview: ["#040d1a", "#60a5fa", "#818cf8"] as [string, string, string],
    vars: {
      "--ds-bg": "#040d1a", "--ds-bg-card": "rgba(96,165,250,0.05)",
      "--ds-border": "rgba(96,165,250,0.12)", "--ds-border-hover": "rgba(96,165,250,0.3)",
      "--ds-accent": "#60a5fa", "--ds-accent-glow": "rgba(96,165,250,0.35)", "--ds-accent-soft": "rgba(96,165,250,0.10)", "--ds-accent-glow-40": "rgba(96,165,250,0.14)",
      "--ds-blue": "#818cf8", "--ds-green": "#34d399", "--ds-purple": "#a78bfa", "--ds-yellow": "#fbbf24", "--ds-cyan": "#22d3ee",
      "--ds-text": "#e2e8f0", "--ds-text-soft": "#94a3b8", "--ds-text-muted": "#475569",
      "--ds-nav-bg": "rgba(4,13,26,0.9)", "--ds-glass": "rgba(96,165,250,0.05)",
      "--ds-hero-grad": "linear-gradient(135deg,#e2e8f0 0%,#bfdbfe 40%,#60a5fa 70%,#818cf8 100%)",
      "--ds-card-bg": "rgba(96,165,250,0.04)", "--ds-card-border": "rgba(96,165,250,0.1)",
      "--ds-orb1": "rgba(96,165,250,0.08)", "--ds-orb2": "rgba(129,140,248,0.06)",
      "--ds-input-bg": "rgba(96,165,250,0.06)", "--ds-input-border": "rgba(96,165,250,0.15)",
      "--ds-footer-bg": "rgba(96,165,250,0.02)",
      "--ds-blur": "blur(20px) saturate(160%)",
      "--ds-radius": "16px", "--ds-radius-sm": "10px", "--ds-radius-btn": "12px",
      "--ds-glass-line": "rgba(255,255,255,0.12)",
      "--ds-card-shadow-hover": "rgba(0,0,0,0.55)",
      "--ds-testimonial-shadow": "rgba(0,0,0,0.4)",
      "--ds-secondary-border": "rgba(255,255,255,0.2)",
      "--ds-secondary-hover-bg": "rgba(255,255,255,0.07)",
      "--ds-nav-hover-bg": "rgba(255,255,255,0.06)",
      "--ds-select-option-bg": "#0f1117",
      "--ds-logo-grad-end": "#6366f1",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    nameHe: "ירוק יער",
    desc: "ירוק טבעי",
    preview: ["#0a1a0f", "#22c55e", "#84cc16"] as [string, string, string],
    vars: {
      "--ds-bg": "#0a1a0f", "--ds-bg-card": "rgba(34,197,94,0.05)",
      "--ds-border": "rgba(34,197,94,0.12)", "--ds-border-hover": "rgba(34,197,94,0.3)",
      "--ds-accent": "#22c55e", "--ds-accent-glow": "rgba(34,197,94,0.35)", "--ds-accent-soft": "rgba(34,197,94,0.08)", "--ds-accent-glow-40": "rgba(34,197,94,0.12)",
      "--ds-blue": "#34d399", "--ds-green": "#84cc16", "--ds-purple": "#a3e635", "--ds-yellow": "#fbbf24", "--ds-cyan": "#2dd4bf",
      "--ds-text": "#f0fdf4", "--ds-text-soft": "#86efac", "--ds-text-muted": "#4ade80",
      "--ds-nav-bg": "rgba(10,26,15,0.88)", "--ds-glass": "rgba(34,197,94,0.05)",
      "--ds-hero-grad": "linear-gradient(135deg,#f0fdf4 0%,#bbf7d0 40%,#22c55e 70%,#16a34a 100%)",
      "--ds-card-bg": "rgba(34,197,94,0.04)", "--ds-card-border": "rgba(34,197,94,0.1)",
      "--ds-orb1": "rgba(34,197,94,0.08)", "--ds-orb2": "rgba(132,204,22,0.06)",
      "--ds-input-bg": "rgba(34,197,94,0.06)", "--ds-input-border": "rgba(34,197,94,0.15)",
      "--ds-footer-bg": "rgba(34,197,94,0.02)",
      "--ds-blur": "blur(20px) saturate(160%)",
      "--ds-radius": "18px", "--ds-radius-sm": "11px", "--ds-radius-btn": "14px",
      "--ds-glass-line": "rgba(255,255,255,0.12)",
      "--ds-card-shadow-hover": "rgba(0,0,0,0.55)",
      "--ds-testimonial-shadow": "rgba(0,0,0,0.4)",
      "--ds-secondary-border": "rgba(255,255,255,0.2)",
      "--ds-secondary-hover-bg": "rgba(255,255,255,0.07)",
      "--ds-nav-hover-bg": "rgba(255,255,255,0.06)",
      "--ds-select-option-bg": "#0f1117",
      "--ds-logo-grad-end": "#16a34a",
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    nameHe: "סגול מלכותי",
    desc: "סגול יוקרתי",
    preview: ["#0d0a1a", "#a855f7", "#ec4899"] as [string, string, string],
    vars: {
      "--ds-bg": "#0d0a1a", "--ds-bg-card": "rgba(168,85,247,0.05)",
      "--ds-border": "rgba(168,85,247,0.12)", "--ds-border-hover": "rgba(168,85,247,0.3)",
      "--ds-accent": "#a855f7", "--ds-accent-glow": "rgba(168,85,247,0.35)", "--ds-accent-soft": "rgba(168,85,247,0.08)", "--ds-accent-glow-40": "rgba(168,85,247,0.12)",
      "--ds-blue": "#818cf8", "--ds-green": "#34d399", "--ds-purple": "#ec4899", "--ds-yellow": "#fbbf24", "--ds-cyan": "#22d3ee",
      "--ds-text": "#faf5ff", "--ds-text-soft": "#d8b4fe", "--ds-text-muted": "#7c3aed",
      "--ds-nav-bg": "rgba(13,10,26,0.88)", "--ds-glass": "rgba(168,85,247,0.05)",
      "--ds-hero-grad": "linear-gradient(135deg,#faf5ff 0%,#e9d5ff 40%,#a855f7 70%,#7c3aed 100%)",
      "--ds-card-bg": "rgba(168,85,247,0.04)", "--ds-card-border": "rgba(168,85,247,0.1)",
      "--ds-orb1": "rgba(168,85,247,0.08)", "--ds-orb2": "rgba(236,72,153,0.05)",
      "--ds-input-bg": "rgba(168,85,247,0.06)", "--ds-input-border": "rgba(168,85,247,0.15)",
      "--ds-footer-bg": "rgba(168,85,247,0.02)",
      "--ds-blur": "blur(20px) saturate(160%)",
      "--ds-radius": "20px", "--ds-radius-sm": "12px", "--ds-radius-btn": "16px",
      "--ds-glass-line": "rgba(255,255,255,0.12)",
      "--ds-card-shadow-hover": "rgba(0,0,0,0.55)",
      "--ds-testimonial-shadow": "rgba(0,0,0,0.4)",
      "--ds-secondary-border": "rgba(255,255,255,0.2)",
      "--ds-secondary-hover-bg": "rgba(255,255,255,0.07)",
      "--ds-nav-hover-bg": "rgba(255,255,255,0.06)",
      "--ds-select-option-bg": "#0f1117",
      "--ds-logo-grad-end": "#7c3aed",
    },
  },
] as const;

export type SkinId = (typeof SKINS)[number]["id"];

const SERVICES = [
  { icon:"📋", title:"רישום קבלנים", desc:"רישום מהיר ומקצועי בפנקס הקבלנים הממשלתי.", stat:"800+", statLabel:"רשומו בהצלחה" },
  { icon:"🏆", title:"סיווג קבלנים", desc:"שדרוג סיווג לקבלות עסקאות גדולות יותר.", stat:"95%", statLabel:"אחוז הצלחה" },
  { icon:"🤝", title:"כוח אדם",      desc:"גיוס והצבת עובדים מקצועיים לפרויקטי בנייה.", stat:"3,200+", statLabel:"מקצוענים במאגר" },
  { icon:"🏗", title:"תיווך פרויקטים", desc:"חיבור בין קבלנים לפרויקטים פעילים.", stat:"120+", statLabel:"פרויקטים תווכו" },
  { icon:"🏢", title:"תיווך חברות",  desc:"מכירה ורכישה של חברות קבלניות.", stat:"40+", statLabel:"עסקאות הושלמו" },
  { icon:"📄", title:"ביטוח קבלנים", desc:"ביטוחי אחריות מקצועית, עובדים ופרויקטים.", stat:"500+", statLabel:"פוליסות פעילות" },
];

const STATS = [
  { val:"12", suffix:"+", label:"שנות ניסיון", icon:"📅" },
  { val:"4,000", suffix:"+", label:"לקוחות", icon:"👷" },
  { val:"180", suffix:"M+ ₪", label:"שווי פרויקטים", icon:"💰" },
  { val:"98", suffix:"%", label:"שביעות רצון", icon:"⭐" },
];

const TESTIMONIALS = [
  { name:"מוחמד חטיב", role:"קבלן בנייה, חיפה", text:"GAM עזרו לי לעלות מסיווג ג׳2 לב׳1 תוך 3 חודשים. תהליך חלק ומקצועי.", avatar:"מ" },
  { name:"ג'ורג' חדאד", role:"קבלן, נצרת", text:"דרך GAM מצאתי פרויקט של 2.4 מיליון שקל. השיתוף פעולה היה מדויק.", avatar:"ג" },
  { name:"יוסי לוי", role:"מנהל עבודה, ת\"א", text:"הם מצאו לי עבודה תוך שבוע. אנסטסיה הייתה זמינה בכל שלב.", avatar:"י" },
  { name:"אחמד עבאס", role:"קבלן שלד, ירושלים", text:"רישום ראשוני — הם טיפלו בכל הניירת. חסכתי חודשים של בירוקרטיה.", avatar:"א" },
];

// ── Skin Switcher UI ──
function SkinSwitcher({ current, onChange }: { current: SkinId; onChange: (id: SkinId) => void }) {
  const [open, setOpen] = useState(false);
  const cur = SKINS.find(s => s.id === current)!;
  return (
    <div style={{position:"fixed",bottom:24,left:24,zIndex:1000}}>
      {open && (
        <div style={{
          position:"absolute",bottom:"calc(100% + 10px)",left:0,
          background:"rgba(10,10,15,0.97)",border:"1px solid rgba(255,255,255,.12)",
          borderRadius:16,padding:12,display:"flex",flexDirection:"column",gap:6,
          backdropFilter:"blur(20px)",boxShadow:"0 20px 60px rgba(0,0,0,.8)",
          minWidth:200,animation:"popUp .2s ease"
        }}>
          <div style={{fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:1,padding:"0 4px",marginBottom:2}}>בחר עיצוב</div>
          {SKINS.map(s=>(
            <div key={s.id} onClick={()=>{onChange(s.id as SkinId);setOpen(false);}}
              style={{
                display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,cursor:"pointer",
                background:current===s.id?"rgba(255,255,255,.08)":"transparent",
                border:`1px solid ${current===s.id?"rgba(255,255,255,.15)":"transparent"}`,
                transition:"all .15s",
              }}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.06)")}
              onMouseLeave={e=>(e.currentTarget.style.background=current===s.id?"rgba(255,255,255,.08)":"transparent")}
            >
              <div style={{display:"flex",gap:2,flexShrink:0}}>
                {s.preview.map((c,i)=>(
                  <div key={i} style={{width:i===0?14:10,height:i===0?14:10,borderRadius:"50%",background:c,border:"1px solid rgba(255,255,255,.15)",marginTop:i===0?0:2}}/>
                ))}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:700,color:"#f1f5f9"}}>{s.name}</div>
                <div style={{fontSize:10.5,color:"rgba(255,255,255,.4)"}}>{s.desc}</div>
              </div>
              {current===s.id && <div style={{fontSize:12,color:s.preview[1]}}>✓</div>}
            </div>
          ))}
        </div>
      )}
      <button onClick={()=>setOpen(p=>!p)} style={{
        display:"flex",alignItems:"center",gap:8,
        background:"rgba(10,10,15,0.95)",border:"1px solid rgba(255,255,255,.15)",
        borderRadius:12,padding:"9px 14px",cursor:"pointer",
        backdropFilter:"blur(20px)",boxShadow:"0 8px 30px rgba(0,0,0,.6)",
        transition:"all .2s",fontFamily:"'Heebo',sans-serif",
        color:"#f1f5f9",
      }}
        onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,.3)")}
        onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,.15)")}
      >
        <div style={{display:"flex",gap:2}}>
          {cur.preview.map((c,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:c}}/>
          ))}
        </div>
        <span style={{fontSize:12,fontWeight:700}}>{cur.name}</span>
        <span style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{open?"▲":"▼"}</span>
      </button>
    </div>
  );
}

// ── Main Landing ──
export default function GAMLanding() {
  const [skinId, setSkinId] = useState<SkinId>("dark");
  const [formData, setFormData] = useState({name:"",phone:"",service:""});
  const [submitted, setSubmitted] = useState(false);
  const [activeService, setActiveService] = useState<number|null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const skin = useMemo(() => SKINS.find(s => s.id === skinId)!, [skinId]);
  const S = skin.vars;

  useEffect(() => {
    const saved = localStorage.getItem("gam-skin") as SkinId | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
    if (saved && SKINS.some(s => s.id === saved)) setSkinId(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("gam-skin", skinId);
  }, [skinId]);

  // Apply CSS custom properties on the wrapper element
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    Object.entries(S).forEach(([key, value]) => {
      el.style.setProperty(key, value);
    });
  }, [S]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: .3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="gam-landing">
      <div className="noise-overlay" />

      {/* ══ NAV ══ */}
      <nav style={{position:"fixed",top:0,right:0,left:0,zIndex:100,padding:"0 24px",height:58,display:"flex",alignItems:"center",gap:16,background:"var(--ds-nav-bg)",backdropFilter:"var(--ds-blur)",borderBottom:"1px solid var(--ds-border)",transition:"background .4s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div style={{width:34,height:34,borderRadius:"var(--ds-radius-sm)",background:`linear-gradient(135deg,var(--ds-accent),var(--ds-logo-grad-end))`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#fff",boxShadow:"0 0 14px var(--ds-accent-glow)"}}>G</div>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:"var(--ds-text)"}}>GAM</div>
            <div style={{fontSize:9,color:"var(--ds-text-muted)",fontWeight:600}}>שירותי קבלנות</div>
          </div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:2}}>
          {["שירותים","תהליך","המלצות","צור קשר"].map(l=>(
            <a key={l} href={`#${l}`} className="nav-link">{l}</a>
          ))}
        </div>
        <a href="#צור קשר" style={{textDecoration:"none"}}>
          <button className="cta-btn" style={{padding:"7px 16px",fontSize:12.5,animation:"none",boxShadow:"0 0 10px var(--ds-accent-glow)"}}>📞 דברו איתנו</button>
        </a>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",paddingTop:80,paddingBottom:60,paddingRight:24,paddingLeft:24}}>
        <div className="orb" style={{width:600,height:600,background:"var(--ds-orb1)",top:-100,right:-80,animationDuration:"16s"}}/>
        <div className="orb" style={{width:400,height:400,background:"var(--ds-orb2)",bottom:0,left:-80,animationDuration:"20s",animationDelay:"-8s"}}/>

        <div style={{maxWidth:880,width:"100%",textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"var(--ds-accent-soft)",border:"1px solid var(--ds-accent-glow-40)",borderRadius:20,padding:"5px 15px",marginBottom:22,animation:"fadeIn 1s ease both"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"var(--ds-accent)",animation:"glow 2s infinite"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"var(--ds-accent)"}}>מוביל ענף הקבלנות בישראל מאז 2012</span>
          </div>

          <h1 className="hero-title" style={{marginBottom:18}}>
            הצלחה בענף הבנייה<br/>מתחילה כאן
          </h1>

          <p style={{fontSize:"clamp(15px,2.2vw,19px)",color:"var(--ds-text-soft)",lineHeight:1.75,maxWidth:600,margin:"0 auto 32px",animation:"fadeUp .8s ease .2s both"}}>
            GAM מספקת שירותי רישום וסיווג קבלנים, גיוס כוח אדם מקצועי, תיווך פרויקטים וחברות — הכל תחת קורת גג אחת.
          </p>

          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",animation:"fadeUp .8s ease .35s both"}}>
            <a href="#צור קשר" style={{textDecoration:"none"}}><button className="cta-btn">🚀 ייעוץ חינם עכשיו</button></a>
            <a href="#שירותים" style={{textDecoration:"none"}}><button className="secondary-btn">← הכר את השירותים</button></a>
          </div>

          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:36,animation:"fadeUp .8s ease .5s both"}}>
            {["✓ ייעוץ ראשוני חינם","✓ ליווי עד סגירה","✓ 12 שנות ניסיון","✓ זמינות 24/7"].map((t,i)=>(
              <span key={i} className="stat-badge">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section ref={statsRef} style={{padding:"50px 24px",background:"var(--ds-footer-bg)",borderTop:"1px solid var(--ds-border)",borderBottom:"1px solid var(--ds-border)"}}>
        <div style={{maxWidth:880,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))"}}>
          {STATS.map((s,i)=>(
            <div key={i} style={{textAlign:"center",padding:"18px 12px",animation:`fadeUp .5s ease ${i*.08}s both`}}>
              <div style={{fontSize:26,marginBottom:5}}>{s.icon}</div>
              <div style={{fontSize:30,fontWeight:900,color:"var(--ds-accent)",lineHeight:1,marginBottom:4}}>
                <NumberTicker value={s.val} visible={statsVisible} suffix={s.suffix} />
              </div>
              <div style={{fontSize:11.5,color:"var(--ds-text-muted)",fontWeight:600}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section id="שירותים" style={{padding:"70px 24px"}}>
        <div className="orb" style={{width:450,height:450,background:"var(--ds-orb2)",top:-40,left:-80,animationDuration:"18s"}}/>
        <div style={{maxWidth:1080,margin:"0 auto",position:"relative",zIndex:1}}>
          <div style={{textAlign:"center",marginBottom:46}}>
            <div style={{fontSize:11.5,fontWeight:700,color:"var(--ds-accent)",letterSpacing:2,marginBottom:10}}>מה אנחנו עושים</div>
            <h2 style={{fontSize:"clamp(26px,4vw,42px)",fontWeight:900,letterSpacing:-1,color:"var(--ds-text)",marginBottom:12}}>שירותים לכל <span className="shimmer-text">קבלן</span></h2>
            <p style={{fontSize:15,color:"var(--ds-text-muted)",maxWidth:480,margin:"0 auto",lineHeight:1.7}}>מרישום ראשוני ועד תיווך עסקאות מורכבות</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
            {SERVICES.map((s,i)=>(
              <div key={i} className="service-card"
                style={{borderColor:activeService===i?`var(--ds-accent)`:undefined,background:activeService===i?`var(--ds-accent-soft)`:undefined}}
                onMouseEnter={()=>setActiveService(i)} onMouseLeave={()=>setActiveService(null)}
              >
                {activeService===i && <div style={{position:"absolute",top:0,right:0,left:0,height:2,background:`linear-gradient(90deg,transparent,var(--ds-accent),transparent)`,borderRadius:"var(--ds-radius) var(--ds-radius) 0 0"}}/>}
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                  <div style={{width:44,height:44,borderRadius:"var(--ds-radius-sm)",background:"var(--ds-accent-soft)",border:"1px solid var(--ds-accent-glow-40)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:activeService===i?"0 0 18px var(--ds-accent-glow)":"none",transition:"all .3s"}}>{s.icon}</div>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:"var(--ds-text)",marginBottom:4}}>{s.title}</div>
                    <div style={{fontSize:12.5,color:"var(--ds-text-muted)",lineHeight:1.6}}>{s.desc}</div>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:"1px solid var(--ds-border)"}}>
                  <div>
                    <div style={{fontSize:19,fontWeight:900,color:"var(--ds-accent)"}}>{s.stat}</div>
                    <div style={{fontSize:10,color:"var(--ds-text-muted)",fontWeight:600}}>{s.statLabel}</div>
                  </div>
                  <span style={{fontSize:12.5,fontWeight:700,color:"var(--ds-accent)",cursor:"pointer"}}>קרא עוד ←</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="המלצות" style={{padding:"70px 24px",background:"var(--ds-footer-bg)",borderTop:"1px solid var(--ds-border)",borderBottom:"1px solid var(--ds-border)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontSize:11.5,fontWeight:700,color:"var(--ds-accent)",letterSpacing:2,marginBottom:10}}>מה אומרים עלינו</div>
            <h2 style={{fontSize:"clamp(24px,4vw,38px)",fontWeight:900,color:"var(--ds-text)"}}>4,000+ לקוחות מרוצים</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12}}>
            {TESTIMONIALS.map((t,i)=>(
              <div key={i} className="testimonial-card">
                <div style={{fontSize:26,color:"var(--ds-accent)",opacity:.5,marginBottom:8}}>&ldquo;</div>
                <p style={{fontSize:13,color:"var(--ds-text-soft)",lineHeight:1.7,marginBottom:14}}>{t.text}</p>
                <div style={{display:"flex",alignItems:"center",gap:9,paddingTop:12,borderTop:"1px solid var(--ds-border)"}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:"var(--ds-accent-soft)",border:"1px solid var(--ds-accent-glow-40)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--ds-accent)",flexShrink:0}}>{t.avatar}</div>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:700,color:"var(--ds-text)"}}>{t.name}</div>
                    <div style={{fontSize:10.5,color:"var(--ds-text-muted)"}}>{t.role}</div>
                  </div>
                  <div style={{marginRight:"auto",color:"var(--ds-yellow)",fontSize:12}}>★★★★★</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTACT ══ */}
      <section id="צור קשר" style={{padding:"70px 24px"}}>
        <div className="orb" style={{width:500,height:500,background:"var(--ds-orb1)",top:-80,left:"50%",transform:"translateX(-50%)",animationDuration:"15s"}}/>
        <div style={{maxWidth:520,margin:"0 auto",position:"relative",zIndex:1}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:11.5,fontWeight:700,color:"var(--ds-accent)",letterSpacing:2,marginBottom:10}}>בואו נדבר</div>
            <h2 style={{fontSize:"clamp(24px,4vw,38px)",fontWeight:900,color:"var(--ds-text)",marginBottom:10}}>מוכן להתחיל?</h2>
            <p style={{fontSize:14.5,color:"var(--ds-text-muted)",lineHeight:1.7}}>מלא את הטופס ונחזור אליך תוך שעה.</p>
          </div>

          {!submitted ? (
            <div className="glass-card" style={{padding:26}}>
              <div style={{display:"flex",flexDirection:"column",gap:11}}>
                <input className="input-field" placeholder="שם מלא *" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/>
                <input className="input-field" placeholder="טלפון *" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} type="tel"/>
                <select className="input-field" value={formData.service} onChange={e=>setFormData({...formData,service:e.target.value})}>
                  <option value="">בחר שירות</option>
                  {SERVICES.map(s=><option key={s.title} value={s.title}>{s.icon} {s.title}</option>)}
                </select>
                <button className="cta-btn" style={{justifyContent:"center",marginTop:4,animation:"none"}} onClick={()=>{if(formData.name&&formData.phone)setSubmitted(true);}}>
                  📩 שלח פנייה — ייעוץ חינם
                </button>
                <div style={{textAlign:"center",fontSize:11.5,color:"var(--ds-text-muted)"}}>
                  או WhatsApp ישירות:&nbsp;
                  <span style={{color:"var(--ds-green)",fontWeight:700,cursor:"pointer"}}>📱 050-000-0000</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{padding:32,textAlign:"center",borderColor:"var(--ds-green)",background:"var(--ds-accent-soft)"}}>
              <div style={{fontSize:44,marginBottom:10,animation:"float 3s ease-in-out infinite"}}>🎉</div>
              <div style={{fontSize:19,fontWeight:800,color:"var(--ds-text)",marginBottom:6}}>הפנייה נשלחה!</div>
              <div style={{fontSize:13.5,color:"var(--ds-text-muted)",lineHeight:1.7}}>תודה {formData.name}! נחזור אליך תוך שעה.</div>
            </div>
          )}
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{padding:"28px 24px",borderTop:"1px solid var(--ds-border)",background:"var(--ds-footer-bg)"}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,var(--ds-accent),var(--ds-logo-grad-end))`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#fff"}}>G</div>
            <div>
              <div style={{fontSize:12.5,fontWeight:800,color:"var(--ds-text)"}}>GAM — שירותי קבלנות</div>
              <div style={{fontSize:10,color:"var(--ds-text-muted)"}}>© 2024 · gam.org.il</div>
            </div>
          </div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            {["פרטיות","תנאים","נגישות","LinkedIn"].map(l=>(
              <span key={l} style={{fontSize:12,color:"var(--ds-text-muted)",cursor:"pointer",fontWeight:500,transition:"color .15s"}}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* ══ SKIN SWITCHER ══ */}
      <SkinSwitcher current={skinId} onChange={setSkinId}/>
    </div>
  );
}
