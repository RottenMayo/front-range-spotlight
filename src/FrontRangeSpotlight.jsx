import React, { useState, useEffect, useRef } from "react";
import { useForm, ValidationError } from "@formspree/react";

// ============================================================
// Golden Home Guide — 9x12 Postcard Operator Site + Dashboard
// Public landing page for prospects + private operator dashboard.
// Data persists via window.storage (shared) so leads + analytics
// aggregate across visitors. For real deployment, swap storage
// for a backend (Firebase/Supabase) — your call, Matthew.
// ============================================================

const ACCENT = "#C28A2C";
const INK = "#211C16";
const PAPER = "#F4EEE3";
const PINE = "#2E4034";

const DEFAULT_CONFIG = {
  businessName: "Front Range Spotlight",
  cardName: "Golden Spotlight",
  pricePerSlot: 500,
  targetZips: ["80401", "80403"],
  households: 8000,
  medianAge: 35,
  ownerOccupied: 57,
  mailDate: "July 2026",
  homes: 5000,
  slots: Array.from({ length: 16 }, (_, i) => ({ id: i + 1, business: "", status: "available" })),
  canvaUrl: "",
};

// ---- storage helpers (localStorage) ----
async function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("save failed", e);
  }
}

const fontStack = `'Hanken Grotesk', -apple-system, sans-serif`;
const displayStack = `'Fraunces', Georgia, serif`;

export default function App() {
  const [view, setView] = useState("site");
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState({ views: 0, submissions: 0, visitors: [] });
  const [loaded, setLoaded] = useState(false);
  const trackedRef = useRef(false);

  // load everything on mount
  useEffect(() => {
    (async () => {
      const [c, l, a] = await Promise.all([
        loadKey("ghg_config", DEFAULT_CONFIG),
        loadKey("ghg_leads", []),
        loadKey("ghg_analytics", { views: 0, submissions: 0, visitors: [] }),
      ]);
      setConfig(c);
      setLeads(l);
      // track a page view once per session
      if (!trackedRef.current) {
        trackedRef.current = true;
        const sessionId = Math.random().toString(36).slice(2);
        const newAnalytics = {
          ...a,
          views: (a.views || 0) + 1,
          visitors: [...(a.visitors || []), sessionId],
        };
        setAnalytics(newAnalytics);
        saveKey("ghg_analytics", newAnalytics);
      } else {
        setAnalytics(a);
      }
      setLoaded(true);
    })();
  }, []);

  const handleNewLead = async (lead) => {
    const entry = {
      ...lead,
      id: Date.now(),
      status: "new",
      created: new Date().toISOString(),
    };
    const updated = [entry, ...leads];
    setLeads(updated);
    await saveKey("ghg_leads", updated);
    const newAnalytics = { ...analytics, submissions: (analytics.submissions || 0) + 1 };
    setAnalytics(newAnalytics);
    await saveKey("ghg_analytics", newAnalytics);
  };

  const updateLead = async (id, changes) => {
    const updated = leads.map((l) => (l.id === id ? { ...l, ...changes } : l));
    setLeads(updated);
    await saveKey("ghg_leads", updated);
  };

  const updateConfig = async (newConfig) => {
    setConfig(newConfig);
    await saveKey("ghg_config", newConfig);
  };

  return (
    <div style={{ fontFamily: fontStack, background: PAPER, color: INK, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; padding: 0; }
        @keyframes riseIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .rise { animation: riseIn 0.7s cubic-bezier(.16,1,.3,1) both; }
        .ghg-input { width: 100%; padding: 12px 14px; border: 1.5px solid #D8CDB8; border-radius: 9px; font-family: ${fontStack}; font-size: 15px; background: #FBF8F1; color: ${INK}; outline: none; transition: border-color .2s; }
        .ghg-input:focus { border-color: ${ACCENT}; }
        .ghg-btn { cursor: pointer; border: none; font-family: ${fontStack}; font-weight: 600; transition: transform .12s, box-shadow .2s, background .2s; }
        .ghg-btn:active { transform: translateY(1px); }
        .slot-row:hover { background: #FBF8F1; }
      `}</style>


      {!loaded ? (
        <div style={{ padding: 80, textAlign: "center", color: "#9a8e78" }}>Loading…</div>
      ) : view === "site" ? (
        <PublicSite config={config} onLead={handleNewLead} onDashboard={() => setView("dashboard")} />
      ) : (
        <Dashboard
          config={config}
          leads={leads}
          analytics={analytics}
          updateLead={updateLead}
          updateConfig={updateConfig}
          onSite={() => setView("site")}
        />
      )}
    </div>
  );
}

// ============================================================
// PUBLIC SITE
// ============================================================
function PublicSite({ config, onLead, onDashboard }) {
  const available = config.slots.filter((s) => s.status === "available").length;
  const sold = config.slots.length - available;

  return (
    <div>
      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", color: PAPER, padding: "0 0 0 0", backgroundImage: "url('./hero-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(46,64,52,0.72)" }} />
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "70px 24px 90px", position: "relative", zIndex: 2 }}>
          <div className="rise" style={{ display: "inline-block", border: `1.5px solid ${ACCENT}`, color: ACCENT, padding: "5px 13px", borderRadius: 20, fontSize: 12.5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 22 }}>
            Golden, Colorado · 80401 & 80403
          </div>
          <h1 className="rise" style={{ fontFamily: displayStack, fontWeight: 900, fontSize: "clamp(38px, 6vw, 68px)", lineHeight: 1.02, margin: "0 0 20px", letterSpacing: -1, maxWidth: 760 }}>
            One postcard. Your business in front of {config.homes.toLocaleString()} neighbors, every month.
          </h1>
          <p className="rise" style={{ fontSize: "clamp(16px, 2vw, 20px)", lineHeight: 1.5, maxWidth: 600, opacity: 0.92, margin: "0 0 32px", animationDelay: ".08s" }}>
            The {config.cardName} is a premium oversized mailer delivered straight to Golden mailboxes. One business per category — and when it lands on a kitchen counter, it stays there.
          </p>
          <div className="rise" style={{ display: "flex", gap: 14, flexWrap: "wrap", animationDelay: ".16s" }}>
            <a href="#reserve" className="ghg-btn" style={{ background: ACCENT, color: INK, padding: "14px 26px", borderRadius: 10, fontSize: 16, textDecoration: "none" }}>
              Reserve your spot →
            </a>
            <a href="#card" className="ghg-btn" style={{ background: "transparent", color: PAPER, border: `1.5px solid rgba(244,238,227,.4)`, padding: "14px 26px", borderRadius: 10, fontSize: 16, textDecoration: "none" }}>
              See the card
            </a>
          </div>
          <div className="rise" style={{ marginTop: 40, display: "flex", gap: 36, flexWrap: "wrap", animationDelay: ".24s" }}>
            <Stat big={`${available}`} label={`of ${config.slots.length} slots left`} />
            <Stat big={`${config.homes.toLocaleString()}`} label="homes mailed" />
            <Stat big={`$${config.pricePerSlot}`} label="per business" />
          </div>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "70px 24px" }}>
        <h2 style={{ fontFamily: displayStack, fontSize: 34, fontWeight: 700, margin: "0 0 8px", letterSpacing: -0.5 }}>
          Why a postcard beats another Google ad
        </h2>
        <p style={{ color: "#6f6453", fontSize: 17, maxWidth: 620, margin: "0 0 40px" }}>
          Online ads get scrolled past and forgotten. A card on the fridge waits for the exact moment a homeowner needs you.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          <Feature title="Category exclusivity" body="Only one HVAC company. One landscaper. One detailer. You own your category on the card — no bidding war against competitors." />
          <Feature title="It stays in the home" body="Direct mail sits on counters and fridges for weeks. When the furnace dies in January, your card is right there." />
          <Feature title="Real Golden homeowners" body={`Mailed to owner-occupied homes across 80401 and 80403 — roughly ${config.ownerOccupied}% owner-occupied, the people who actually pay for home services.`} />
          <Feature title="You'll know it worked" body="Every card carries a QR code to track how many Golden homeowners reached out." />
        </div>
      </section>

      {/* CARD PREVIEW */}
      <section id="card" style={{ background: "#EFE7D7", padding: "70px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2 style={{ fontFamily: displayStack, fontSize: 34, fontWeight: 700, margin: "0 0 8px", letterSpacing: -0.5, textAlign: "center" }}>
            Reserve your spot on the card
          </h2>
          <p style={{ color: "#6f6453", fontSize: 17, textAlign: "center", margin: "0 auto 40px", maxWidth: 560 }}>
            {sold > 0 ? `${sold} ${sold === 1 ? "category is" : "categories are"} already claimed. ` : ""}
            Here's what's still open for the {config.mailDate} mailing.
          </p>
          <CardPreview config={config} />
        </div>
      </section>

      {/* TARGET MAP */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "70px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div style={{ minWidth: 260 }}>
            <h2 style={{ fontFamily: displayStack, fontSize: 32, fontWeight: 700, margin: "0 0 14px", letterSpacing: -0.5 }}>
              Where your ad is going
            </h2>
            <p style={{ color: "#6f6453", fontSize: 16, lineHeight: 1.6, margin: "0 0 24px" }}>
              The {config.mailDate} card mails to established residential carrier routes across Golden to the neighborhoods with the highest owner-occupancy.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <MapStat value={config.households.toLocaleString()} label="Households in area" />
              <MapStat value={config.homes.toLocaleString()} label="Homes this mailing" />
              <MapStat value={config.medianAge} label="Median age" />
              <MapStat value={`${config.ownerOccupied}%`} label="Owner-occupied" />
            </div>
            <p style={{ fontSize: 12.5, color: "#9a8e78", marginTop: 16 }}>
              Targeting: {config.targetZips.map((z) => `ZIP ${z}`).join(" · ")}
            </p>
          </div>
          <GoldenMap zips={config.targetZips} />
        </div>
      </section>

      {/* RESERVE / LEAD FORM */}
      <section id="reserve" style={{ background: INK, color: PAPER, padding: "70px 24px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <h2 style={{ fontFamily: displayStack, fontSize: 34, fontWeight: 700, margin: "0 0 8px", letterSpacing: -0.5 }}>
            Claim your spot
          </h2>
          <p style={{ opacity: 0.82, fontSize: 16, margin: "0 0 32px" }}>
            Select your category and we will reach out within 24 hours to confirm availability and send an invoice. Payment locks your spot before we go to print..
          </p>
          <LeadForm config={config} onLead={onLead} />
        </div>
      </section>

      <footer style={{ background: INK, color: "rgba(244,238,227,.5)", padding: "24px", textAlign: "center", fontSize: 13, borderTop: "1px solid rgba(244,238,227,.1)" }}>
        {config.businessName} · Golden, Colorado · Local direct mail done right
        <span style={{ marginLeft: 16 }}>
          <button className="ghg-btn" onClick={onDashboard} style={{ background: "transparent", color: "rgba(244,238,227,.2)", fontSize: 12, padding: 0 }}>
            operator
          </button>
        </span>
      </footer>
    </div>
  );
}

function Stat({ big, label }) {
  return (
    <div>
      <div style={{ fontFamily: displayStack, fontSize: 34, fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{big}</div>
      <div style={{ fontSize: 13.5, opacity: 0.8, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Feature({ title, body }) {
  return (
    <div style={{ background: "#FBF8F1", border: "1px solid #E4DAC6", borderRadius: 14, padding: "24px 22px" }}>
      <div style={{ width: 30, height: 3, background: ACCENT, borderRadius: 2, marginBottom: 14 }} />
      <h3 style={{ fontFamily: displayStack, fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>{title}</h3>
      <p style={{ color: "#6f6453", fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>{body}</p>
    </div>
  );
}

function MapStat({ value, label }) {
  return (
    <div style={{ background: "#FBF8F1", border: "1px solid #E4DAC6", borderRadius: 11, padding: "14px 16px" }}>
      <div style={{ fontFamily: displayStack, fontSize: 26, fontWeight: 700, color: PINE, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: "#8a7e6a", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ---- Decorative mountain backdrop (SVG) ----
function MountainBackdrop() {
  return (
    <svg viewBox="0 0 1080 420" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a5043" />
          <stop offset="100%" stopColor="#2E4034" />
        </linearGradient>
      </defs>
      <rect width="1080" height="420" fill="url(#sky)" />
      <path d="M0 420 L0 250 L160 150 L300 240 L420 120 L560 230 L700 90 L860 220 L1080 140 L1080 420 Z" fill="#27382E" />
      <path d="M0 420 L0 320 L200 230 L380 310 L560 220 L760 320 L980 240 L1080 300 L1080 420 Z" fill="#1f2e25" />
      <circle cx="860" cy="80" r="34" fill="#C28A2C" opacity="0.5" />
    </svg>
  );
}

// ---- Normalize a Canva design URL to embed mode ----
// Only transforms canva.com URLs — short links (canva.link) cannot be path-modified.
// Canva embed format: https://www.canva.com/design/[ID]/[slug]/view?embed
function canvaEmbedUrl(url) {
  const u = (url || "").trim();
  if (!u) return "";
  if (!u.includes("canva.com")) return u; // pass short links / other URLs through unchanged
  const base = u.split("?")[0].replace(/\/?$/, "");
  const withView = base.includes("/view") ? base : `${base}/view`;
  return `${withView}?embed`;
}

const EXAMPLE_CANVA_URL = "https://www.canva.com/design/DAHLRoSLOFw/_5KwUBOPjCdUEUhBm6uafg/view";

// ---- Card preview — tabs for slot grid, current card, and example card ----
function CardPreview({ config }) {
  const [tab, setTab] = useState("example");

  const tabs = [];
  if (config.canvaUrl) tabs.push(["current", "Current Card"]);
  tabs.push(["example", "Example"]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1.5px solid #D8CDB8" }}>
        {tabs.map(([k, label]) => (
          <button
            key={k}
            className="ghg-btn"
            onClick={() => setTab(k)}
            style={{
              background: "transparent",
              color: tab === k ? ACCENT : "#8a7e6a",
              borderBottom: tab === k ? `2.5px solid ${ACCENT}` : "2.5px solid transparent",
              padding: "10px 20px",
              borderRadius: 0,
              fontSize: 15,
              marginBottom: -1.5,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "current" && config.canvaUrl && (
        <iframe
          src={canvaEmbedUrl(config.canvaUrl)}
          style={{
            width: "100%",
            height: 500,
            border: "1px solid #e0d6c2",
            borderRadius: 8,
            boxShadow: "0 24px 60px rgba(33,28,22,.22)",
            display: "block",
          }}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title="Current Card"
        />
      )}

      {tab === "example" && (
        <iframe
          src={canvaEmbedUrl(EXAMPLE_CANVA_URL)}
          style={{
            width: "100%",
            height: 500,
            border: "1px solid #e0d6c2",
            borderRadius: 8,
            boxShadow: "0 24px 60px rgba(33,28,22,.22)",
            display: "block",
          }}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title="Example Card"
        />
      )}
    </div>
  );
}

// ---- Golden map photo ----
function GoldenMap() {
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #E4DAC6", minWidth: 260 }}>
      <img
        src="./golden-map.png"
        alt="Golden, CO target area map"
        style={{ width: "100%", display: "block" }}
      />
    </div>
  );
}

// ---- Lead capture form ----
function LeadForm({ config, onLead }) {
  const [state, handleFormspreeSubmit] = useForm("mjgzdobo");
  const [form, setForm] = useState({ name: "", business: "", email: "", phone: "", category: "", message: "" });
  const availableCount = config.slots.filter((s) => s.status === "available").length;

  // Once Formspree confirms success, also log the lead locally for the dashboard
  useEffect(() => {
    if (state.succeeded) onLead(form);
  }, [state.succeeded]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (state.succeeded) {
    return (
      <div style={{ background: "rgba(194,138,44,.12)", border: `1.5px solid ${ACCENT}`, borderRadius: 14, padding: "32px 28px", textAlign: "center" }}>
        <div style={{ fontFamily: displayStack, fontSize: 26, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>You're on the list.</div>
        <p style={{ opacity: 0.85, margin: 0, fontSize: 15.5 }}>
          Thanks, {form.name.split(" ")[0]}. I'll reach out within 24 hours to confirm your spot and send an invoice.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormspreeSubmit} style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <input className="ghg-input" placeholder="Your name *" name="name" required value={form.name} onChange={set("name")} />
        <input className="ghg-input" placeholder="Business name *" name="business" required value={form.business} onChange={set("business")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <input className="ghg-input" placeholder="Email *" name="email" type="email" required value={form.email} onChange={set("email")} />
        <input className="ghg-input" placeholder="Phone" name="phone" value={form.phone} onChange={set("phone")} />
      </div>
      <input className="ghg-input" placeholder={`What type of service do you offer? (${availableCount} slot${availableCount !== 1 ? "s" : ""} still open)`} name="service" value={form.category} onChange={set("category")} />
      <textarea className="ghg-input" placeholder="Anything else? (optional)" name="message" rows={3} value={form.message} onChange={set("message")} style={{ resize: "vertical" }} />
      <ValidationError errors={state.errors} style={{ color: "#c0392b", fontSize: 13 }} />
      <button
        className="ghg-btn"
        type="submit"
        disabled={state.submitting}
        style={{ background: ACCENT, color: INK, padding: "15px", borderRadius: 10, fontSize: 16.5, marginTop: 4, opacity: state.submitting ? 0.7 : 1 }}
      >
        {state.submitting ? "Sending…" : "Reserve my spot →"}
      </button>
      <p style={{ fontSize: 12.5, opacity: 0.55, textAlign: "center", margin: 0 }}>* required fields.</p>
    </form>
  );
}

// ============================================================
// OPERATOR DASHBOARD
// ============================================================
function Dashboard({ config, leads, analytics, updateLead, updateConfig, onSite }) {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [tab, setTab] = useState("overview");

  if (!authed) {
    return (
      <div style={{ maxWidth: 380, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontFamily: displayStack, fontSize: 30, fontWeight: 700, marginBottom: 8 }}>Operator Login</div>
        <input
          className="ghg-input"
          type="password"
          placeholder="Passcode"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pass === import.meta.env.VITE_OPERATOR_PASS && setAuthed(true)}
        />
        <button
          className="ghg-btn"
          onClick={() => pass === import.meta.env.VITE_OPERATOR_PASS && setAuthed(true)}
          style={{ background: ACCENT, color: INK, padding: "13px", borderRadius: 10, fontSize: 16, marginTop: 14, width: "100%" }}
        >
          Enter dashboard
        </button>
      </div>
    );
  }

  const submissions = analytics.submissions || 0;
  const views = analytics.views || 0;
  const uniqueVisitors = (analytics.visitors || []).length;
  const convRate = views > 0 ? ((submissions / views) * 100).toFixed(1) : "0.0";
  const soldCount = config.slots.filter((s) => s.status === "sold").length;
  const projectedRevenue = soldCount * config.pricePerSlot;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 28, borderBottom: "1px solid #E4DAC6", flexWrap: "wrap", alignItems: "center" }}>
        <button className="ghg-btn" onClick={onSite} style={{ background: "transparent", color: "#9a8e78", padding: "10px 14px", fontSize: 13, marginRight: 8 }}>← Site</button>
        {[["overview", "Overview"], ["leads", `Leads (${leads.length})`], ["slots", "Card Slots"], ["settings", "Settings"]].map(([k, label]) => (
          <button
            key={k}
            className="ghg-btn"
            onClick={() => setTab(k)}
            style={{
              background: "transparent",
              color: tab === k ? ACCENT : "#8a7e6a",
              borderBottom: tab === k ? `2.5px solid ${ACCENT}` : "2.5px solid transparent",
              padding: "10px 14px",
              borderRadius: 0,
              fontSize: 15,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 30 }}>
            <MetricCard value={views} label="Page views" />
            <MetricCard value={uniqueVisitors} label="Unique visitors" />
            <MetricCard value={submissions} label="Form submissions" />
            <MetricCard value={`${convRate}%`} label="Conversion rate" accent />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#FBF8F1", border: "1px solid #E4DAC6", borderRadius: 14, padding: 24 }}>
              <div style={{ fontFamily: displayStack, fontSize: 19, fontWeight: 700, marginBottom: 14 }}>Card progress</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: displayStack, fontSize: 40, fontWeight: 700, color: ACCENT }}>{soldCount}</span>
                <span style={{ color: "#8a7e6a" }}>of {config.slots.length} slots sold</span>
              </div>
              <div style={{ height: 10, background: "#EFE7D7", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${(soldCount / config.slots.length) * 100}%`, height: "100%", background: ACCENT, borderRadius: 6, transition: "width .4s" }} />
              </div>
              <div style={{ marginTop: 18, fontSize: 14.5, color: "#6f6453" }}>
                Projected revenue: <strong style={{ color: INK }}>${projectedRevenue.toLocaleString()}</strong>
                <span style={{ color: "#9a8e78" }}> · potential ${(config.slots.length * config.pricePerSlot).toLocaleString()} at full card</span>
              </div>
            </div>
            <div style={{ background: "#FBF8F1", border: "1px solid #E4DAC6", borderRadius: 14, padding: 24 }}>
              <div style={{ fontFamily: displayStack, fontSize: 19, fontWeight: 700, marginBottom: 14 }}>Lead pipeline</div>
              {["new", "contacted", "sold", "lost"].map((st) => {
                const count = leads.filter((l) => l.status === st).length;
                return (
                  <div key={st} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #EFE7D7" }}>
                    <span style={{ textTransform: "capitalize", color: "#6f6453" }}>{st}</span>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: "#9a8e78", marginTop: 20 }}>
            Analytics aggregate across everyone who opens this site link. Each browser session counts as one visit (no cross-session tracking without a backend).
          </p>
        </div>
      )}

      {tab === "leads" && (
        <LeadsTable leads={leads} updateLead={updateLead} />
      )}

      {tab === "slots" && (
        <SlotsManager config={config} updateConfig={updateConfig} />
      )}

      {tab === "settings" && (
        <SettingsPanel config={config} updateConfig={updateConfig} />
      )}
    </div>
  );
}

function MetricCard({ value, label, accent }) {
  return (
    <div style={{ background: accent ? PINE : "#FBF8F1", color: accent ? PAPER : INK, border: accent ? "none" : "1px solid #E4DAC6", borderRadius: 14, padding: "22px 20px" }}>
      <div style={{ fontFamily: displayStack, fontSize: 38, fontWeight: 700, color: accent ? ACCENT : INK, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13.5, marginTop: 6, opacity: accent ? 0.85 : 0.65 }}>{label}</div>
    </div>
  );
}

function LeadsTable({ leads, updateLead }) {
  const statusColors = { new: ACCENT, contacted: "#3b82c4", sold: PINE, lost: "#a85d5d" };
  if (leads.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9a8e78" }}>
        <div style={{ fontFamily: displayStack, fontSize: 22, marginBottom: 6, color: "#6f6453" }}>No leads yet</div>
        <p style={{ fontSize: 14.5 }}>When a prospect fills out the form on your public site, they'll show up here.</p>
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#8a7e6a", fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <th style={{ padding: "10px 12px" }}>Business</th>
            <th style={{ padding: "10px 12px" }}>Contact</th>
            <th style={{ padding: "10px 12px" }}>Category</th>
            <th style={{ padding: "10px 12px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="slot-row" style={{ borderTop: "1px solid #E4DAC6" }}>
              <td style={{ padding: "12px" }}>
                <div style={{ fontWeight: 600 }}>{l.business}</div>
                <div style={{ fontSize: 12.5, color: "#9a8e78" }}>{l.name}</div>
              </td>
              <td style={{ padding: "12px", fontSize: 13 }}>
                <div>{l.email}</div>
                <div style={{ color: "#9a8e78" }}>{l.phone || "—"}</div>
              </td>
              <td style={{ padding: "12px", fontSize: 13 }}>{l.category || "—"}</td>
              <td style={{ padding: "12px" }}>
                <select
                  value={l.status}
                  onChange={(e) => updateLead(l.id, { status: e.target.value })}
                  style={{
                    border: `1.5px solid ${statusColors[l.status]}`,
                    color: statusColors[l.status],
                    background: "transparent",
                    borderRadius: 7,
                    padding: "5px 9px",
                    fontFamily: fontStack,
                    fontWeight: 600,
                    fontSize: 13,
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                >
                  {["new", "contacted", "sold", "lost"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlotsManager({ config, updateConfig }) {
  const toggle = (id) => {
    const slots = config.slots.map((s) =>
      s.id === id ? { ...s, status: s.status === "sold" ? "available" : "sold" } : s
    );
    updateConfig({ ...config, slots });
  };
  const setBusiness = (id, business) => {
    const slots = config.slots.map((s) => (s.id === id ? { ...s, business } : s));
    updateConfig({ ...config, slots });
  };
  return (
    <div>
      <p style={{ color: "#6f6453", fontSize: 14.5, marginBottom: 20 }}>
        Mark a slot sold and add the business name. Updates the slot count on the public site.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {config.slots.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FBF8F1", border: "1px solid #E4DAC6", borderRadius: 11, padding: "12px 16px", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 60px", fontWeight: 600, color: "#8a7e6a", fontSize: 13.5 }}>#{s.id}</div>
            <input
              className="ghg-input"
              placeholder="Business name"
              value={s.business}
              onChange={(e) => setBusiness(s.id, e.target.value)}
              style={{ flex: "1 1 160px", width: "auto", padding: "8px 11px" }}
              disabled={s.status !== "sold"}
            />
            <button
              className="ghg-btn"
              onClick={() => toggle(s.id)}
              style={{
                background: s.status === "sold" ? PINE : "transparent",
                color: s.status === "sold" ? PAPER : ACCENT,
                border: `1.5px solid ${s.status === "sold" ? PINE : ACCENT}`,
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13.5,
                whiteSpace: "nowrap",
              }}
            >
              {s.status === "sold" ? "✓ Sold" : "Mark sold"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({ config, updateConfig }) {
  const [draft, setDraft] = useState(config);
  const [saved, setSaved] = useState(false);
  const set = (k, val) => { setDraft({ ...draft, [k]: val }); setSaved(false); };
  const save = () => {
    updateConfig({
      ...draft,
      pricePerSlot: Number(draft.pricePerSlot),
      households: Number(draft.households),
      homes: Number(draft.homes),
      medianAge: Number(draft.medianAge),
      ownerOccupied: Number(draft.ownerOccupied),
    });
    setSaved(true);
  };
  const field = (label, key, type = "text") => (
    <div>
      <label style={{ fontSize: 13, color: "#8a7e6a", display: "block", marginBottom: 5 }}>{label}</label>
      <input className="ghg-input" type={type} value={draft[key]} onChange={(e) => set(key, e.target.value)} />
    </div>
  );
  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ color: "#6f6453", fontSize: 14.5, marginBottom: 20 }}>
        Edit campaign details. Changes update the public site instantly.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {field("Card name", "cardName")}
        {field("Mail date label", "mailDate")}
        {field("Price per slot ($)", "pricePerSlot", "number")}
        {field("Homes this mailing", "homes", "number")}
        {field("Households in area", "households", "number")}
        {field("Median age", "medianAge", "number")}
        {field("Owner-occupied (%)", "ownerOccupied", "number")}
      </div>
      <div style={{ marginTop: 20 }}>
        <label style={{ fontSize: 13, color: "#8a7e6a", display: "block", marginBottom: 5 }}>Canva Design URL</label>
        <input
          className="ghg-input"
          type="url"
          placeholder="https://www.canva.com/design/…"
          value={draft.canvaUrl || ""}
          onChange={(e) => set("canvaUrl", e.target.value)}
        />
        <p style={{ fontSize: 12, color: "#9a8e78", margin: "6px 0 0" }}>
          Use the full design URL, not a short link. In Canva: <strong>Share → More → Embed</strong>, then copy the <code style={{ background: "#EFE7D7", padding: "1px 5px", borderRadius: 3 }}>src</code> URL from the iframe snippet.
        </p>
        {draft.canvaUrl && (
          <div style={{ marginTop: 12, border: "1px solid #E4DAC6", borderRadius: 8, overflow: "hidden", background: "#FBF8F1" }}>
            <div style={{ padding: "7px 12px", fontSize: 12, color: "#8a7e6a", borderBottom: "1px solid #E4DAC6" }}>
              Design preview
            </div>
            <iframe
              src={canvaEmbedUrl(draft.canvaUrl)}
              style={{ width: "100%", height: 220, border: "none", display: "block" }}
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title="Canva design thumbnail"
            />
          </div>
        )}
      </div>
      <button className="ghg-btn" onClick={save} style={{ background: ACCENT, color: INK, padding: "13px 28px", borderRadius: 10, fontSize: 15.5, marginTop: 20 }}>
        {saved ? "✓ Saved" : "Save changes"}
      </button>
    </div>
  );
}
