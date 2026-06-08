import { useState, useEffect, useCallback } from "react";

// ─── ALL 48 TEAMS + 104 MATCHES ──────────────────────────────────────────────

const TEAM_FLAGS = {
  "Mexico":"🇲🇽","South Africa":"🇿🇦","South Korea":"🇰🇷","Czechia":"🇨🇿",
  "Canada":"🇨🇦","Bosnia & Herzegovina":"🇧🇦","Qatar":"🇶🇦","Switzerland":"🇨🇭",
  "Brazil":"🇧🇷","Morocco":"🇲🇦","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Haiti":"🇭🇹",
  "USA":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Türkiye":"🇹🇷",
  "Germany":"🇩🇪","Ecuador":"🇪🇨","Ivory Coast":"🇨🇮","Curaçao":"🇨🇼",
  "Netherlands":"🇳🇱","Japan":"🇯🇵","Tunisia":"🇹🇳","Ukraine":"🇺🇦",
  "Belgium":"🇧🇪","Iran":"🇮🇷","Egypt":"🇪🇬","New Zealand":"🇳🇿",
  "Spain":"🇪🇸","Uruguay":"🇺🇾","Saudi Arabia":"🇸🇦","Cape Verde":"🇨🇻",
  "France":"🇫🇷","Senegal":"🇸🇳","Norway":"🇳🇴","Iraq":"🇮🇶",
  "Argentina":"🇦🇷","Austria":"🇦🇹","Algeria":"🇩🇿","Jordan":"🇯🇴",
  "Portugal":"🇵🇹","Colombia":"🇨🇴","Uzbekistan":"🇺🇿","DR Congo":"🇨🇩",
  "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croatia":"🇭🇷","Panama":"🇵🇦","Ghana":"🇬🇭"
};

const tf = (t) => `${TEAM_FLAGS[t]||"🏳️"} ${t}`;

// ISO date string → "Jun 11" label
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB",{month:"short",day:"numeric"});
}

// Returns true if current time is at least 1 hour AFTER the match kickoff (predictions closed)
function isPredictionLocked(kickoffISO) {
  if (!kickoffISO) return false;
  const ko = new Date(kickoffISO).getTime();
  const now = Date.now();
  return now >= ko - 60 * 60 * 1000; // 1 hour before kickoff
}

// Time until deadline
function timeUntilDeadline(kickoffISO) {
  if (!kickoffISO) return null;
  const deadline = new Date(kickoffISO).getTime() - 60 * 60 * 1000;
  const diff = deadline - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) return null; // don't show if too far away
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

// Group stage: each pair plays once
function buildGroupMatches(group, teams, dates) {
  const pairs = [];
  let dateIdx = 0;
  for (let i = 0; i < teams.length; i++)
    for (let j = i+1; j < teams.length; j++) {
      pairs.push({
        id: `${group}${pairs.length+1}`,
        group, stage: `Group ${group}`,
        home: teams[i], away: teams[j],
        kickoff: dates[dateIdx++] || null
      });
    }
  return pairs;
}

const GROUP_MATCHES = [
  ...buildGroupMatches("A",["Mexico","South Africa","South Korea","Czechia"],
    ["2026-06-11T19:00:00Z","2026-06-18T16:00:00Z","2026-06-18T21:00:00Z",
     "2026-06-11T02:00:00Z","2026-06-24T01:00:00Z","2026-06-24T01:00:00Z"]),
  ...buildGroupMatches("B",["Canada","Bosnia & Herzegovina","Qatar","Switzerland"],
    ["2026-06-12T19:00:00Z","2026-06-18T19:00:00Z","2026-06-18T22:00:00Z",
     "2026-06-13T19:00:00Z","2026-06-24T19:00:00Z","2026-06-24T19:00:00Z"]),
  ...buildGroupMatches("C",["Brazil","Morocco","Scotland","Haiti"],
    ["2026-06-13T22:00:00Z","2026-06-19T22:00:00Z","2026-06-19T01:00:00Z",
     "2026-06-13T01:00:00Z","2026-06-24T22:00:00Z","2026-06-24T22:00:00Z"]),
  ...buildGroupMatches("D",["USA","Paraguay","Australia","Türkiye"],
    ["2026-06-12T01:00:00Z","2026-06-19T19:00:00Z","2026-06-13T08:00:00Z",
     "2026-06-19T06:00:00Z","2026-06-25T02:00:00Z","2026-06-25T02:00:00Z"]),
  ...buildGroupMatches("E",["Germany","Ecuador","Ivory Coast","Curaçao"],
    ["2026-06-14T19:00:00Z","2026-06-20T21:00:00Z","2026-06-14T23:00:00Z",
     "2026-06-20T01:00:00Z","2026-06-25T21:00:00Z","2026-06-25T21:00:00Z"]),
  ...buildGroupMatches("F",["Netherlands","Japan","Tunisia","Ukraine"],
    ["2026-06-14T22:00:00Z","2026-06-20T19:00:00Z","2026-06-14T02:00:00Z",
     "2026-06-20T06:00:00Z","2026-06-25T01:00:00Z","2026-06-25T01:00:00Z"]),
  ...buildGroupMatches("G",["Belgium","Iran","Egypt","New Zealand"],
    ["2026-06-15T19:00:00Z","2026-06-21T22:00:00Z","2026-06-15T01:00:00Z",
     "2026-06-21T01:00:00Z","2026-06-26T02:00:00Z","2026-06-26T02:00:00Z"]),
  ...buildGroupMatches("H",["Spain","Uruguay","Saudi Arabia","Cape Verde"],
    ["2026-06-15T17:00:00Z","2026-06-21T17:00:00Z","2026-06-15T23:00:00Z",
     "2026-06-21T23:00:00Z","2026-06-26T02:00:00Z","2026-06-26T02:00:00Z"]),
  ...buildGroupMatches("I",["France","Senegal","Norway","Iraq"],
    ["2026-06-16T20:00:00Z","2026-06-22T22:00:00Z","2026-06-16T23:00:00Z",
     "2026-06-22T01:00:00Z","2026-06-26T20:00:00Z","2026-06-26T20:00:00Z"]),
  ...buildGroupMatches("J",["Argentina","Austria","Algeria","Jordan"],
    ["2026-06-16T01:00:00Z","2026-06-22T19:00:00Z","2026-06-16T08:00:00Z",
     "2026-06-22T06:00:00Z","2026-06-27T02:00:00Z","2026-06-27T02:00:00Z"]),
  ...buildGroupMatches("K",["Portugal","Colombia","Uzbekistan","DR Congo"],
    ["2026-06-17T19:00:00Z","2026-06-23T19:00:00Z","2026-06-17T01:00:00Z",
     "2026-06-23T01:00:00Z","2026-06-27T22:30:00Z","2026-06-27T22:30:00Z"]),
  ...buildGroupMatches("L",["England","Croatia","Panama","Ghana"],
    ["2026-06-17T22:00:00Z","2026-06-23T21:00:00Z","2026-06-17T00:00:00Z",
     "2026-06-23T00:00:00Z","2026-06-27T22:00:00Z","2026-06-27T22:00:00Z"]),
];

const KO_MATCHES = [
  ...Array.from({length:16},(_,i)=>({id:`R32_${i+1}`,group:"KO",stage:"Round of 32",home:`R32 TBD`,away:`R32 TBD`,kickoff:null})),
  ...Array.from({length:8},(_,i)=>({id:`R16_${i+1}`,group:"KO",stage:"Round of 16",home:`R16 TBD`,away:`R16 TBD`,kickoff:null})),
  {id:"QF1",group:"KO",stage:"Quarter-Finals",home:"QF TBD",away:"QF TBD",kickoff:"2026-07-09T21:00:00Z"},
  {id:"QF2",group:"KO",stage:"Quarter-Finals",home:"QF TBD",away:"QF TBD",kickoff:"2026-07-10T23:00:00Z"},
  {id:"QF3",group:"KO",stage:"Quarter-Finals",home:"QF TBD",away:"QF TBD",kickoff:"2026-07-11T22:00:00Z"},
  {id:"QF4",group:"KO",stage:"Quarter-Finals",home:"QF TBD",away:"QF TBD",kickoff:"2026-07-11T03:00:00Z"},
  {id:"SF1",group:"KO",stage:"Semi-Finals",home:"SF TBD",away:"SF TBD",kickoff:"2026-07-14T21:00:00Z"},
  {id:"SF2",group:"KO",stage:"Semi-Finals",home:"SF TBD",away:"SF TBD",kickoff:"2026-07-15T20:00:00Z"},
  {id:"3RD",group:"KO",stage:"3rd Place",home:"3rd TBD",away:"3rd TBD",kickoff:"2026-07-18T22:00:00Z"},
  {id:"FIN",group:"KO",stage:"🏆 Final",home:"Finalist 1",away:"Finalist 2",kickoff:"2026-07-19T20:00:00Z"},
];

const ALL_MATCHES = [...GROUP_MATCHES, ...KO_MATCHES];
const GROUP_TABS = ["A","B","C","D","E","F","G","H","I","J","K","L","KO"];

// ─── SCORING ─────────────────────────────────────────────────────────────────
function calcPoints(predictions, results) {
  let pts = 0;
  for (const [id, pred] of Object.entries(predictions)) {
    if (!pred || pred.home == null || pred.away == null) continue;
    const r = results[id];
    if (!r || r.home == null || r.away == null) continue;
    if (pred.home==="" || pred.away==="" || r.home==="" || r.away==="") continue;
    const ph=parseInt(pred.home), pa=parseInt(pred.away);
    const rh=parseInt(r.home), ra=parseInt(r.away);
    if (isNaN(ph)||isNaN(pa)||isNaN(rh)||isNaN(ra)) continue;
    if (ph===rh&&pa===ra) { pts+=3; continue; }
    const pw=ph>pa?"H":ph<pa?"A":"D", rw=rh>ra?"H":rh<ra?"A":"D";
    if (pw===rw) pts+=1;
  }
  return pts;
}

function getInitials(n) {
  return n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
}

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://msqaqhavdkomvqwehqkv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcWFxaGF2ZGtvbXZxd2VocWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODIxNzUsImV4cCI6MjA5NjQ1ODE3NX0.XgNKe1v9B7ua6nAJobEoqEM7i4ItmVcpmeq0GG-3hnw";

const db = {
  async query(path, options = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json",
        "Prefer": options.prefer || "return=representation",
        ...options.headers
      },
      method: options.method || "GET",
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },

  // Register new user via Supabase RPC
  async register(name, password) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_user`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_name: name, p_password: password })
    });
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return rows?.[0] || null; // null = name already taken
  },

  // Login existing user via Supabase RPC
  async login(name, password) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_user`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_name: name, p_password: password })
    });
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return rows?.[0] || null; // null = wrong credentials
  },

  // Load all predictions for a user
  async loadPredictions(userId) {
    const rows = await db.query(`predictions?user_id=eq.${userId}&select=match_id,home_score,away_score`);
    const map = {};
    (rows || []).forEach(r => { map[r.match_id] = { home: String(r.home_score), away: String(r.away_score) }; });
    return map;
  },

  // Save predictions (upsert all at once)
  async savePredictions(userId, predictions) {
    const rows = Object.entries(predictions)
      .filter(([, p]) => p && p.home !== "" && p.away !== "")
      .map(([matchId, p]) => ({
        user_id: userId,
        match_id: matchId,
        home_score: parseInt(p.home),
        away_score: parseInt(p.away)
      }));
    if (!rows.length) return;
    await db.query("predictions", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: rows
    });
  },

  // Load leaderboard from view
  async loadLeaderboard() {
    return await db.query("leaderboard?select=name,points,predictions_count") || [];
  },

  // Load all results from matches table
  async loadResults() {
    const rows = await db.query("matches?select=id,home_score,away_score&home_score=not.is.null");
    const map = {};
    (rows || []).forEach(r => {
      if (r.home_score != null && r.away_score != null)
        map[r.id] = { home: String(r.home_score), away: String(r.away_score) };
    });
    return map;
  },

  // Save a single match result
  async saveResult(matchId, homeScore, awayScore) {
    await db.query(`matches?id=eq.${matchId}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: { home_score: parseInt(homeScore), away_score: parseInt(awayScore) }
    });
  },

  // Remove user from leaderboard (delete user + cascade predictions)
  async removeUser(name) {
    await db.query(`users?name=eq.${encodeURIComponent(name)}`, { method: "DELETE", prefer: "return=minimal" });
  }
};


const ADMIN_PIN = "wc2026SH";

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("predict");

  // Auth
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [nameInput, setNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Predictions & results
  const [predictions, setPredictions] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState({});      // { matchId: {home, away} }
  const [activeGroup, setActiveGroup] = useState("A");

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);

  // Admin
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminGroup, setAdminGroup] = useState("A");

  // AI fetch state
  const [fetching, setFetching] = useState(false);
  const [fetchLog, setFetchLog] = useState([]);
  const [lastFetched, setLastFetched] = useState(null);

  // UI
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Ticker for countdown timers
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n+1), 30000);
    return () => clearInterval(t);
  }, []);

  function showToast(msg, type="success") {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3200);
  }

  // ─── SUPABASE DATA FUNCTIONS ───────────────────────────────────────────────
  useEffect(() => { loadGlobal(); }, []);

  async function loadGlobal() {
    try {
      const lb = await db.loadLeaderboard();
      setLeaderboard(lb.map(r => ({ name: r.name, points: r.points || 0, count: r.predictions_count || 0 })));
    } catch(e) { console.error("loadLeaderboard failed", e); }
    try {
      const res = await db.loadResults();
      setResults(res);
    } catch(e) { console.error("loadResults failed", e); }
  }

  async function loadMyPredictions(uid) {
    try {
      const preds = await db.loadPredictions(uid);
      if (Object.keys(preds).length > 0) { setPredictions(preds); setSubmitted(true); }
    } catch(e) { console.error("loadMyPredictions failed", e); }
  }

  async function handleLogin() {
    const name = nameInput.trim();
    const pass = passwordInput;
    if (!name) { setAuthError("Enter your name"); return; }
    if (!pass) { setAuthError("Enter your password"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const user = await db.login(name, pass);
      if (!user) { setAuthError("Incorrect name or password"); setAuthLoading(false); return; }
      setUserName(user.name); setUserId(user.id);
      await loadMyPredictions(user.id);
    } catch(e) { setAuthError("Login failed — please try again"); }
    setAuthLoading(false);
  }

  async function handleRegister() {
    const name = nameInput.trim();
    const pass = passwordInput;
    if (!name || name.length < 2) { setAuthError("Name must be at least 2 characters"); return; }
    if (!pass || pass.length < 6) { setAuthError("Password must be at least 6 characters"); return; }
    if (pass !== confirmPassword) { setAuthError("Passwords do not match"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const user = await db.register(name, pass);
      if (!user) { setAuthError("That name is already taken — choose another or log in"); setAuthLoading(false); return; }
      setUserName(user.name); setUserId(user.id);
      showToast(`Welcome, ${user.name}! Account created.`);
    } catch(e) { setAuthError("Registration failed — please try again"); }
    setAuthLoading(false);
  }

  function handleLogout() {
    setUserName(""); setUserId(null);
    setPredictions({}); setSubmitted(false);
    setNameInput(""); setPasswordInput(""); setConfirmPassword("");
    setAuthError(""); setAuthMode("login");
  }

  function setPred(id, side, val) {
    const clean = val===""?"":String(Math.max(0,Math.min(99,parseInt(val)||0)));
    setPredictions(p => ({...p,[id]:{...p[id],[side]:clean}}));
  }

  async function submitPredictions() {
    const anyFilled = Object.values(predictions).some(p => p!=null&&p.home!=null&&p.away!=null&&p.home!==""&&p.away!=="");
    if (!anyFilled) { showToast("Fill in at least one score","error"); return; }
    if (!userId) { showToast("User not found — try re-entering your name","error"); return; }
    setSaving(true);
    try {
      // Filter out locked matches before saving
      const toSave = {};
      Object.entries(predictions).forEach(([id, p]) => {
        const match = ALL_MATCHES.find(m => m.id === id);
        if (match && isPredictionLocked(match.kickoff)) return;
        toSave[id] = p;
      });
      await db.savePredictions(userId, toSave);
      const total = Object.values(predictions).filter(p=>p!=null&&p.home!=null&&p.away!=null&&p.home!==""&&p.away!=="").length;
      const pts = calcPoints(predictions, results);
      setSubmitted(true);
      // Refresh leaderboard
      const lb = await db.loadLeaderboard();
      setLeaderboard(lb.map(r => ({ name: r.name, points: r.points || 0, count: r.predictions_count || 0 })));
      showToast(`Saved! ${total} predictions · ${pts} pts so far`);
    } catch(e) { showToast("Save failed — check connection","error"); console.error(e); }
    setSaving(false);
  }

  // ─── AI RESULT FETCHER ─────────────────────────────────────────────────────
  async function fetchTodaysResults() {
    setFetching(true);
    setFetchLog([]);

    const today = new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    const todayISO = new Date().toISOString().slice(0,10);

    // Build list of today's matches (by kickoff date)
    const todayMatches = ALL_MATCHES.filter(m => {
      if (!m.kickoff) return false;
      return m.kickoff.slice(0,10) === todayISO ||
        new Date(m.kickoff).toLocaleDateString("en-CA") === todayISO;
    });

    // Also include matches from last 2 days that don't have results yet
    const recentMatches = ALL_MATCHES.filter(m => {
      if (!m.kickoff) return false;
      const matchDate = new Date(m.kickoff);
      const diffDays = (Date.now() - matchDate.getTime()) / (1000*60*60*24);
      return diffDays >= 0 && diffDays <= 2 && !results[m.id];
    });

    const targetMatches = [...new Map([...todayMatches,...recentMatches].map(m=>[m.id,m])).values()];

    if (targetMatches.length === 0) {
      setFetchLog(["No matches scheduled for today or recent days without results."]);
      setFetching(false);
      return;
    }

    const matchList = targetMatches.map(m =>
      `${m.home} vs ${m.away} (${fmtDate(m.kickoff)})`
    ).join(", ");

    setFetchLog([`🔍 Searching for results of ${targetMatches.length} match(es)...`]);

    try {
      const prompt = `Today is ${today}.

Search the web for the final scores of these FIFA World Cup 2026 matches that should have been played recently:
${matchList}

For each match, find the final full-time score. Return ONLY a JSON array, no other text, no markdown, no explanation. Format:
[{"home":"TeamName","away":"TeamName","home_score":0,"away_score":0,"status":"finished"},...]

If a match result is not yet available or the match hasn't finished, omit it from the array.
Use exact team names as given. Be precise with scores.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();

      // Extract text from response (may include tool_use blocks)
      const textBlocks = data.content?.filter(b => b.type==="text").map(b=>b.text) || [];
      const fullText = textBlocks.join("\n");

      setFetchLog(prev => [...prev, `📡 AI searched the web and returned response...`]);

      // Parse JSON from response
      let parsed = [];
      try {
        const jsonMatch = fullText.match(/\[[\s\S]*\]/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch(e) {
        setFetchLog(prev => [...prev, `⚠️ Could not parse JSON from response. Raw: ${fullText.slice(0,200)}`]);
        setFetching(false);
        return;
      }

      if (!parsed.length) {
        setFetchLog(prev => [...prev, "⚠️ No completed results found yet. Try again after matches finish."]);
        setFetching(false);
        return;
      }

      // Match parsed results back to our match IDs
      const newResults = {...results};
      let updated = 0;

      for (const r of parsed) {
        const match = targetMatches.find(m => {
          const hn = m.home.toLowerCase().replace(/[^a-z]/g,"");
          const an = m.away.toLowerCase().replace(/[^a-z]/g,"");
          const rhn = (r.home||"").toLowerCase().replace(/[^a-z]/g,"");
          const ran = (r.away||"").toLowerCase().replace(/[^a-z]/g,"");
          return (hn.includes(rhn)||rhn.includes(hn)) && (an.includes(ran)||ran.includes(an));
        });
        if (match && r.home_score!=null && r.away_score!=null) {
          newResults[match.id] = { home: String(r.home_score), away: String(r.away_score) };
          // Save to Supabase matches table
          await db.saveResult(match.id, r.home_score, r.away_score);
          updated++;
          setFetchLog(prev => [...prev,
            `✅ ${match.home} ${r.home_score}–${r.away_score} ${match.away}`
          ]);
        }
      }

      if (!updated) {
        setFetchLog(prev => [...prev, "No results could be matched to today's fixtures."]);
        setFetching(false);
        return;
      }

      setResults(newResults);

      // Refresh leaderboard from Supabase view (auto-calculated)
      setFetchLog(prev => [...prev, `💾 Saved ${updated} result(s). Recalculating leaderboard...`]);
      const updated_lb = await db.loadLeaderboard();
      setLeaderboard(updated_lb.map(r => ({ name: r.name, points: r.points || 0, count: r.predictions_count || 0 })));
      setLastFetched(new Date());
      setFetchLog(prev => [...prev, `🏆 Leaderboard updated for ${updated_lb.length} player(s)!`]);
      showToast(`${updated} result(s) fetched & scores updated`);
    } catch(e) {
      setFetchLog(prev => [...prev, `❌ Error: ${e.message}`]);
    }
    setFetching(false);
  }

  // ─── DISPLAY HELPERS ───────────────────────────────────────────────────────
  function getGroupMatchList(g) {
    if (g==="KO") return KO_MATCHES;
    return GROUP_MATCHES.filter(m => m.group===g);
  }

  const activeMatchList = getGroupMatchList(activeGroup);
  const adminMatchList = getGroupMatchList(adminGroup);
  const totalPreds = Object.values(predictions).filter(p=>p!=null&&p.home!=null&&p.away!=null&&p.home!==""&&p.away!=="").length;
  const totalResults = Object.keys(results).length;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh",
      background:"#282930",
      fontFamily:"'Inter,system-ui,sans-serif",
      color:"#e8f2fb",
      position:"relative",
      overflowX:"hidden"
    }}>
      {/* Diagonal pitch lines */}
      <div style={{
        position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        backgroundImage:`repeating-linear-gradient(
          -45deg,
          transparent 0px,
          transparent 80px,
          rgba(255,255,255,0.007) 80px,
          rgba(255,255,255,0.007) 81px
        )`
      }}/>

      {/* Gold top accent */}
      <div style={{
        position:"fixed",top:0,left:0,right:0,height:2,zIndex:100,
        background:"linear-gradient(90deg,transparent,#1c76bc 30%,#292562 50%,#1c76bc 70%,transparent)"
      }}/>

      {/* ── HEADER ── */}
      <header style={{
        position:"sticky",top:0,zIndex:50,
        background:"rgba(40,41,48,0.97)",
        backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(28,118,188,0.25)",
        padding:"0 20px"
      }}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"16px 0 10px"
          }}>
            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{
                width:40,height:40,borderRadius:10,
                background:"linear-gradient(135deg,#1c76bc 0%,#292562 100%)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,boxShadow:"0 0 20px rgba(28,118,188,0.4),0 4px 12px rgba(0,0,0,0.5)"
              }}>⚽</div>
              <div>
                <div style={{
                  fontSize:16,fontWeight:700,color:"#fff",
                  letterSpacing:0.5,lineHeight:1.1
                }}>World Cup 2026</div>
                <div style={{
                  fontSize:12,letterSpacing:4,color:"#a2ceec",
                  textTransform:"uppercase",marginTop:1
                }}>PBD Predictor</div>
              </div>
            </div>

            {/* Right: stats + user */}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {totalResults>0 && (
                <div style={{
                  fontSize:10,color:"rgba(255,255,255,0.3)",
                  background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:20,padding:"4px 10px"
                }}>{totalResults} results in</div>
              )}
              {userName && (
                <>
                <div style={{
                  display:"flex",alignItems:"center",gap:7,
                  background:"rgba(28,118,188,0.1)",
                  border:"1px solid rgba(28,118,188,0.2)",
                  borderRadius:30,padding:"5px 12px 5px 6px"
                }}>
                  <div style={{
                    width:26,height:26,borderRadius:"50%",
                    background:"linear-gradient(135deg,#1c76bc,#1c76bc)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:12,fontWeight:800,color:"#000"
                  }}>{getInitials(userName)}</div>
                  <span style={{fontSize:12,color:"#a2ceec",fontWeight:600}}>{userName}</span>
                  {submitted && <span style={{fontSize:12,color:"rgba(28,118,188,0.5)"}}>{totalPreds}</span>}
                </div>
                <button onClick={handleLogout} style={{
                  background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:20,padding:"5px 10px",
                  color:"rgba(255,255,255,0.3)",fontSize:10,
                  cursor:"pointer",fontFamily:"inherit",marginLeft:4
                }}>Log out</button>
                </>
              )}
            </div>
          </div>

          {/* Nav tabs */}
          <div style={{display:"flex",gap:0}}>
            {[
              {id:"predict",label:"Predict"},
              {id:"leaderboard",label:"Leaderboard"},
              {id:"admin",label:"Admin"}
            ].map(t => (
              <button key={t.id} onClick={()=>{setTab(t.id);if(t.id==="leaderboard")loadGlobal();}} style={{
                padding:"10px 20px",background:"none",border:"none",
                cursor:"pointer",fontFamily:"inherit",
                fontSize:15,fontWeight:600,letterSpacing:1.2,textTransform:"uppercase",
                color:tab===t.id?"#a2ceec":"rgba(255,255,255,0.28)",
                borderBottom:tab===t.id?"2px solid #1c76bc":"2px solid transparent",
                marginBottom:-1,transition:"all 0.15s"
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{position:"relative",zIndex:1,maxWidth:800,margin:"0 auto",padding:"0 20px 100px"}}>

        {/* ═══ PREDICT TAB ═══ */}
        {tab==="predict" && (
          !userName ? (
            // ── AUTH SCREEN ──
            <div style={{
              maxWidth:400,margin:"60px auto",
              background:"rgba(28,118,188,0.05)",
              border:"1px solid rgba(28,118,188,0.2)",
              borderRadius:20,padding:"44px 32px"
            }}>
              {/* Logo */}
              <div style={{textAlign:"center",marginBottom:28}}>
                <div style={{fontSize:48,marginBottom:12}}>🏆</div>
                <h2 style={{margin:"0 0 4px",fontSize:20,color:"#fff",fontWeight:700}}>
                  FIFA World Cup 2026
                </h2>
                <p style={{margin:0,fontSize:15,color:"rgba(255,255,255,0.3)"}}>
                  USA · Canada · Mexico · Jun 11 – Jul 19
                </p>
              </div>

              {/* Login / Register toggle */}
              <div style={{
                display:"flex",background:"rgba(255,255,255,0.05)",
                borderRadius:10,padding:4,marginBottom:24
              }}>
                {["login","register"].map(mode => (
                  <button key={mode} onClick={()=>{setAuthMode(mode);setAuthError("");}}
                    style={{
                      flex:1,padding:"8px 0",border:"none",borderRadius:8,
                      background:authMode===mode?"rgba(28,118,188,0.5)":"transparent",
                      color:authMode===mode?"#fff":"rgba(255,255,255,0.35)",
                      fontWeight:authMode===mode?700:400,
                      fontSize:12,cursor:"pointer",fontFamily:"inherit",
                      letterSpacing:0.5,textTransform:"capitalize",
                      transition:"all 0.15s"
                    }}>{mode === "login" ? "Log In" : "Register"}</button>
                ))}
              </div>

              {/* Fields */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <input
                  value={nameInput}
                  onChange={e=>{setNameInput(e.target.value);setAuthError("");}}
                  onKeyDown={e=>e.key==="Enter"&&(authMode==="login"?handleLogin():handleRegister())}
                  placeholder="Your name"
                  style={{
                    padding:"11px 14px",
                    background:"rgba(255,255,255,0.07)",
                    border:"1px solid rgba(255,255,255,0.13)",
                    borderRadius:9,color:"#fff",fontSize:15,
                    fontFamily:"inherit",outline:"none"
                  }}
                />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e=>{setPasswordInput(e.target.value);setAuthError("");}}
                  onKeyDown={e=>e.key==="Enter"&&(authMode==="login"?handleLogin():handleRegister())}
                  placeholder={authMode==="register"?"Create a password (min 6 chars)":"Password"}
                  style={{
                    padding:"11px 14px",
                    background:"rgba(255,255,255,0.07)",
                    border:"1px solid rgba(255,255,255,0.13)",
                    borderRadius:9,color:"#fff",fontSize:15,
                    fontFamily:"inherit",outline:"none"
                  }}
                />
                {authMode==="register" && (
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e=>{setConfirmPassword(e.target.value);setAuthError("");}}
                    onKeyDown={e=>e.key==="Enter"&&handleRegister()}
                    placeholder="Confirm password"
                    style={{
                      padding:"11px 14px",
                      background:"rgba(255,255,255,0.07)",
                      border:"1px solid rgba(255,255,255,0.13)",
                      borderRadius:9,color:"#fff",fontSize:15,
                      fontFamily:"inherit",outline:"none"
                    }}
                  />
                )}
              </div>

              {/* Error */}
              {authError && (
                <div style={{
                  marginTop:12,padding:"9px 12px",
                  background:"rgba(248,113,113,0.1)",
                  border:"1px solid rgba(248,113,113,0.25)",
                  borderRadius:7,fontSize:12,color:"#f87171"
                }}>{authError}</div>
              )}

              {/* Submit button */}
              <button
                onClick={authMode==="login"?handleLogin:handleRegister}
                disabled={authLoading}
                style={{
                  width:"100%",marginTop:16,padding:"12px",
                  background:authLoading?"rgba(28,118,188,0.3)":"linear-gradient(135deg,#1c76bc,#292562)",
                  border:"none",borderRadius:9,
                  color:authLoading?"rgba(255,255,255,0.4)":"#fff",
                  fontWeight:700,fontSize:15,cursor:authLoading?"not-allowed":"pointer",
                  fontFamily:"inherit",letterSpacing:0.3,
                  boxShadow:"0 4px 14px rgba(28,118,188,0.3)"
                }}
              >
                {authLoading
                  ? (authMode==="login"?"Logging in…":"Creating account…")
                  : (authMode==="login"?"Log In":"Create Account")}
              </button>

              {/* Switch mode hint */}
              <p style={{textAlign:"center",marginTop:16,fontSize:15,color:"rgba(255,255,255,0.2)"}}>
                {authMode==="login"
                  ? <>No account? <span onClick={()=>{setAuthMode("register");setAuthError("");}} style={{color:"#a2ceec",cursor:"pointer",textDecoration:"underline"}}>Register here</span></>
                  : <>Already registered? <span onClick={()=>{setAuthMode("login");setAuthError("");}} style={{color:"#a2ceec",cursor:"pointer",textDecoration:"underline"}}>Log in</span></>
                }
              </p>

              <div style={{
                marginTop:20,padding:"8px 12px",
                background:"rgba(28,118,188,0.06)",border:"1px solid rgba(28,118,188,0.12)",
                borderRadius:7,fontSize:10,color:"rgba(255,255,255,0.25)",textAlign:"center"
              }}>
                ⏱ Predictions lock 1 hour before each kick-off
              </div>
            </div>
          ) : (
            <>
              {/* Status bar */}
              {submitted && (
                <div style={{
                  margin:"16px 0 0",
                  background:"rgba(74,222,128,0.06)",
                  border:"1px solid rgba(74,222,128,0.18)",
                  borderRadius:9,padding:"9px 14px",
                  display:"flex",alignItems:"center",gap:8,
                  fontSize:15,color:"rgba(74,222,128,0.8)"
                }}>
                  <span>✓</span>
                  <span>{totalPreds} predictions saved · {calcPoints(predictions,results)} pts so far · Locked matches shown in grey</span>
                </div>
              )}

              {/* Group tabs */}
              <div style={{
                display:"flex",flexWrap:"wrap",gap:3,
                margin:"14px 0 0",
                background:"rgba(255,255,255,0.025)",
                borderRadius:11,padding:5
              }}>
                {GROUP_TABS.map(g => {
                  const gm = getGroupMatchList(g);
                  const filled = gm.filter(m=>{const p=predictions[m.id];return p!=null&&p.home!=null&&p.away!=null&&p.home!==""&&p.away!==""}).length;
                  const done = filled===gm.length && gm.length>0;
                  const hasLive = gm.some(m=>isPredictionLocked(m.kickoff)&&!results[m.id]);
                  return (
                    <button key={g} onClick={()=>setActiveGroup(g)} style={{
                      padding:"6px 10px",borderRadius:8,
                      background:activeGroup===g?"rgba(28,118,188,0.18)":"transparent",
                      border:activeGroup===g?"1px solid rgba(28,118,188,0.35)":"1px solid transparent",
                      color:activeGroup===g?"#a2ceec":done?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.25)",
                      fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                      display:"flex",alignItems:"center",gap:3
                    }}>
                      {g==="KO"?"KO":g}
                      {done&&<span style={{color:"#4ade80",fontSize:15}}>✓</span>}
                      {hasLive&&<span style={{color:"#fbbf24",fontSize:7}}>●</span>}
                    </button>
                  );
                })}
              </div>

              {/* Match rows */}
              <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:10}}>
                {activeMatchList.map(match => {
                  const pred = predictions[match.id] || {home:"",away:""};
                  const result = results[match.id];
                  const locked = isPredictionLocked(match.kickoff);
                  const hasPred = pred && pred.home!==""&&pred.away!=="";
                  const hasResult = result!=null && result.home!=null && result.away!=null && result.home!==""&&result.away!=="";
                  const deadline = timeUntilDeadline(match.kickoff);

                  // Points badge for finished match
                  let ptsBadge = null;
                  if (hasResult && hasPred) {
                    const ph=parseInt(pred.home),pa=parseInt(pred.away);
                    const rh=parseInt(result.home),ra=parseInt(result.away);
                    if (!isNaN(ph)&&!isNaN(pa)) {
                      if(ph===rh&&pa===ra) ptsBadge={v:"+10",c:"#4ade80",b:"rgba(74,222,128,0.12)"};
                      else {
                        const pw=ph>pa?"H":ph<pa?"A":"D",rw=rh>ra?"H":rh<ra?"A":"D";
                        ptsBadge = pw===rw
                          ? {v:"+5",c:"#60a5fa",b:"rgba(96,165,250,0.12)"}
                          : {v:"0",c:"rgba(255,255,255,0.25)",b:"rgba(255,255,255,0.04)"};
                      }
                    }
                  }

                  return (
                    <div key={match.id} style={{
                      background:locked
                        ? hasResult
                          ? "rgba(255,255,255,0.025)"
                          : "rgba(255,200,0,0.03)"
                        : hasPred
                          ? "rgba(28,118,188,0.05)"
                          : "rgba(255,255,255,0.02)",
                      border:`1px solid ${
                        locked && hasResult ? "rgba(255,255,255,0.06)"
                        : locked ? "rgba(251,191,36,0.15)"
                        : hasPred ? "rgba(28,118,188,0.18)"
                        : "rgba(255,255,255,0.06)"}`,
                      borderRadius:9,padding:"9px 12px",
                      display:"flex",alignItems:"center",gap:8,
                      opacity: locked && !hasResult ? 0.6 : 1
                    }}>
                      {/* Date / lock state */}
                      <div style={{minWidth:60,textAlign:"center",flexShrink:0}}>
                        {hasResult ? (
                          <div style={{fontSize:15,color:"rgba(255,255,255,0.25)",fontWeight:600}}>FT</div>
                        ) : locked ? (
                          <div style={{fontSize:12,color:"#fbbf24"}}>🔒</div>
                        ) : deadline ? (
                          <div style={{fontSize:15,color:"#fbbf24",fontWeight:600}}>{deadline}</div>
                        ) : match.kickoff ? (
                          <div style={{fontSize:15,color:"rgba(255,255,255,0.22)"}}>
                            {fmtDate(match.kickoff)}<br/>
                            {new Date(match.kickoff).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
                          </div>
                        ) : (
                          <div style={{fontSize:15,color:"rgba(255,255,255,0.18)"}}>TBD</div>
                        )}
                        {ptsBadge && (
                          <div style={{
                            marginTop:3,fontSize:12,fontWeight:700,
                            color:ptsBadge.c,background:ptsBadge.b,
                            borderRadius:4,padding:"1px 5px",display:"inline-block"
                          }}>{ptsBadge.v}</div>
                        )}
                      </div>

                      {/* Home team */}
                      <span style={{
                        flex:1,fontSize:15,textAlign:"right",
                        color: locked?"rgba(255,255,255,0.35)":"#e8f2fb",
                        lineHeight:1.3,fontWeight:500
                      }}>{tf(match.home)}</span>

                      {/* Score inputs */}
                      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                        <input type="number" min={0} max={99}
                          value={pred.home}
                          onChange={e=>!locked&&setPred(match.id,"home",e.target.value)}
                          readOnly={locked}
                          placeholder="-"
                          style={{
                            width:34,height:32,textAlign:"center",
                            background:locked
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(255,255,255,0.08)",
                            border:`1px solid ${locked?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.18)"}`,
                            borderRadius:6,
                            color:locked?"rgba(255,255,255,0.3)":"#fff",
                            fontSize:15,fontWeight:700,fontFamily:"inherit",outline:"none",
                            cursor:locked?"not-allowed":"text"
                          }}
                        />
                        <span style={{color:"rgba(255,255,255,0.2)",fontSize:10,fontWeight:300}}>:</span>
                        <input type="number" min={0} max={99}
                          value={pred.away}
                          onChange={e=>!locked&&setPred(match.id,"away",e.target.value)}
                          readOnly={locked}
                          placeholder="-"
                          style={{
                            width:34,height:32,textAlign:"center",
                            background:locked
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(255,255,255,0.08)",
                            border:`1px solid ${locked?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.18)"}`,
                            borderRadius:6,
                            color:locked?"rgba(255,255,255,0.3)":"#fff",
                            fontSize:15,fontWeight:700,fontFamily:"inherit",outline:"none",
                            cursor:locked?"not-allowed":"text"
                          }}
                        />
                      </div>

                      {/* Away team */}
                      <span style={{
                        flex:1,fontSize:15,
                        color:locked?"rgba(255,255,255,0.35)":"#e8f2fb",
                        lineHeight:1.3,fontWeight:500
                      }}>{tf(match.away)}</span>

                      {/* Result badge */}
                      {hasResult && (
                        <div style={{
                          fontSize:15,fontWeight:700,
                          minWidth:40,textAlign:"center",
                          background:"rgba(74,222,128,0.08)",
                          border:"1px solid rgba(74,222,128,0.2)",
                          borderRadius:6,padding:"3px 7px",
                          color:"#4ade80",flexShrink:0
                        }}>{result.home}:{result.away}</div>
                      )}
                      {locked && !hasResult && (
                        <div style={{
                          fontSize:12,color:"rgba(251,191,36,0.5)",
                          minWidth:40,textAlign:"center",flexShrink:0
                        }}>Pending</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit */}
              <div style={{marginTop:20,display:"flex",justifyContent:"center",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <button onClick={submitPredictions} disabled={saving} style={{
                  padding:"13px 44px",
                  background:saving?"rgba(28,118,188,0.25)":"linear-gradient(135deg,#1c76bc,#1c76bc)",
                  border:"none",borderRadius:50,
                  color:saving?"rgba(255,255,255,0.4)":"#fff",
                  fontWeight:800,fontSize:15,cursor:saving?"not-allowed":"pointer",
                  fontFamily:"inherit",letterSpacing:0.5,
                  boxShadow:"0 4px 20px rgba(28,118,188,0.3)"
                }}>{saving?"Saving…":submitted?"Update Predictions":"Submit Predictions"}</button>
                <span style={{fontSize:15,color:"rgba(255,255,255,0.2)"}}>
                  {totalPreds} / 104 filled
                </span>
              </div>
              <p style={{textAlign:"center",marginTop:8,fontSize:10,color:"rgba(255,255,255,0.17)"}}>
                +10 exact score · +5 correct result · Locks 1hr before kick-off
              </p>
            </>
          )
        )}

        {/* ═══ LEADERBOARD TAB ═══ */}
        {tab==="leaderboard" && (
          <div style={{paddingTop:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h2 style={{margin:0,fontSize:16,color:"#fff",letterSpacing:0.2}}>Company Rankings</h2>
              <button onClick={loadGlobal} style={{
                background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:8,padding:"5px 12px",color:"rgba(255,255,255,0.35)",
                fontSize:10,cursor:"pointer",fontFamily:"inherit"
              }}>↻ Refresh</button>
            </div>

            {/* Legend */}
            <div style={{
              display:"flex",gap:16,padding:"9px 14px",marginBottom:12,
              background:"rgba(255,255,255,0.025)",borderRadius:8,flexWrap:"wrap"
            }}>
              {[
                {pts:"+10",label:"Exact score",c:"#1c76bc"},
                {pts:"+5",label:"Correct result",c:"#60a5fa"},
                {pts:"1040",label:"Max pts",c:"rgba(255,255,255,0.5)"}
              ].map(({pts,label,c})=>(
                <span key={label} style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>
                  <span style={{color:c,fontWeight:700}}>{pts}</span> {label}
                </span>
              ))}
            </div>

            {loadingLB ? (
              <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.2)",fontSize:12}}>Loading…</div>
            ) : leaderboard.length===0 ? (
              <div style={{textAlign:"center",padding:60,color:"rgba(255,255,255,0.18)",fontSize:12}}>
                No predictions yet — be the first!
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {leaderboard.map((entry,i)=>{
                  const isMe = userName && entry.name.toLowerCase()===userName.toLowerCase();
                  const medals=["🥇","🥈","🥉"];
                  const maxPts = leaderboard[0]?.points||1;
                  const pct = Math.max(4,Math.round((entry.points/maxPts)*100));
                  return (
                    <div key={entry.name} style={{
                      position:"relative",overflow:"hidden",
                      background:isMe?"rgba(28,118,188,0.08)":"rgba(255,255,255,0.025)",
                      border:isMe?"1px solid rgba(28,118,188,0.28)":"1px solid rgba(255,255,255,0.055)",
                      borderRadius:10,padding:"12px 16px"
                    }}>
                      {/* Progress bar bg */}
                      <div style={{
                        position:"absolute",left:0,top:0,bottom:0,
                        width:`${pct}%`,
                        background:isMe
                          ? "rgba(28,118,188,0.07)"
                          : i===0 ? "rgba(28,118,188,0.04)"
                          : "rgba(255,255,255,0.015)",
                        transition:"width 0.6s ease"
                      }}/>
                      <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
                        <span style={{
                          fontSize:i<3?18:12,minWidth:26,textAlign:"center",
                          color:i>=3?"rgba(255,255,255,0.2)":undefined
                        }}>{i<3?medals[i]:i+1}</span>
                        <div style={{
                          width:30,height:30,borderRadius:"50%",flexShrink:0,
                          background:isMe?"linear-gradient(135deg,#1c76bc,#1c76bc)":"rgba(255,255,255,0.07)",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:10,fontWeight:800,color:isMe?"#000":"rgba(255,255,255,0.35)"
                        }}>{getInitials(entry.name)}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,color:isMe?"#a2ceec":"#e8f2fb",fontWeight:isMe?700:400}}>
                            {entry.name} {isMe&&<span style={{fontSize:12,opacity:0.4}}>(you)</span>}
                          </div>
                          {entry.count&&(
                            <div style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:1}}>
                              {entry.count} predictions
                            </div>
                          )}
                        </div>
                        <div>
                          <span style={{
                            fontSize:22,fontWeight:700,
                            color:i===0?"#a2ceec":i<3?"#e8f2fb":"rgba(255,255,255,0.35)"
                          }}>{entry.points}</span>
                          <span style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginLeft:3}}>pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ ADMIN TAB ═══ */}
        {tab==="admin" && (
          <div style={{paddingTop:20}}>
            {!adminUnlocked ? (
              <div style={{
                maxWidth:340,margin:"40px auto",
                background:"rgba(255,255,255,0.025)",
                border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:16,padding:"44px 28px",textAlign:"center"
              }}>
                <div style={{fontSize:36,marginBottom:14}}>🔐</div>
                <h2 style={{margin:"0 0 8px",fontSize:17,color:"#fff"}}>Admin Panel</h2>
                <p style={{margin:"0 0 22px",fontSize:12,color:"rgba(255,255,255,0.3)",lineHeight:1.5}}>
                  Fetch today's match results from the web with one click. AI searches and parses scores automatically.
                </p>
                <input type="password" placeholder="Enter PIN"
                  value={adminPin} onChange={e=>setAdminPin(e.target.value)}
                  onKeyDown={e=>{
                    if(e.key==="Enter"){
                      if(adminPin===ADMIN_PIN) setAdminUnlocked(true);
                      else showToast("Wrong PIN","error");
                    }
                  }}
                  style={{
                    width:"100%",padding:"10px 14px",boxSizing:"border-box",
                    background:"rgba(255,255,255,0.07)",
                    border:"1px solid rgba(255,255,255,0.12)",
                    borderRadius:8,color:"#fff",fontSize:14,
                    fontFamily:"inherit",outline:"none",marginBottom:10
                  }}
                />
                <button onClick={()=>{
                  if(adminPin===ADMIN_PIN) setAdminUnlocked(true);
                  else showToast("Wrong PIN","error");
                }} style={{
                  padding:"10px 28px",
                  background:"linear-gradient(135deg,#1c76bc,#1c76bc)",
                  border:"none",borderRadius:8,
                  color:"#000",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit"
                }}>Unlock</button>
              
              </div>
            ) : (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <h2 style={{margin:"0 0 2px",fontSize:16,color:"#fff"}}>Admin Panel</h2>
                    <p style={{margin:0,fontSize:15,color:"rgba(255,255,255,0.3)"}}>
                      Fetch results via AI web search · Manually override below
                    </p>
                  </div>
                  <span style={{
                    fontSize:10,color:"#4ade80",
                    background:"rgba(74,222,128,0.08)",
                    border:"1px solid rgba(74,222,128,0.2)",
                    borderRadius:20,padding:"3px 10px"
                  }}>● Admin</span>
                </div>

                {/* ── AI FETCH BUTTON ── */}
                <div style={{
                  background:"rgba(28,118,188,0.06)",
                  border:"1px solid rgba(28,118,188,0.18)",
                  borderRadius:14,padding:"20px",marginBottom:20
                }}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:"#a2ceec",marginBottom:4}}>
                        🤖 Auto-Fetch Results
                      </div>
                      <div style={{fontSize:15,color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>
                        Searches the web for today's & recent World Cup 2026 results,<br/>
                        parses scores automatically and updates the leaderboard.
                      </div>
                      {lastFetched && (
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:6}}>
                          Last run: {lastFetched.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={fetchTodaysResults}
                      disabled={fetching}
                      style={{
                        padding:"12px 24px",flexShrink:0,
                        background:fetching
                          ? "rgba(28,118,188,0.2)"
                          : "linear-gradient(135deg,#1c76bc,#1c76bc)",
                        border:"none",borderRadius:10,
                        color:fetching?"rgba(0,0,0,0.4)":"#000",
                        fontWeight:800,fontSize:15,
                        cursor:fetching?"not-allowed":"pointer",
                        fontFamily:"inherit",
                        boxShadow:fetching?"none":"0 4px 16px rgba(28,118,188,0.3)",
                        whiteSpace:"nowrap"
                      }}
                    >
                      {fetching ? "⏳ Searching…" : "🔍 Fetch Today's Results"}
                    </button>
                  </div>

                  {/* Fetch log */}
                  {fetchLog.length > 0 && (
                    <div style={{
                      marginTop:14,
                      background:"rgba(0,0,0,0.3)",
                      border:"1px solid rgba(255,255,255,0.06)",
                      borderRadius:8,padding:"12px 14px",
                      fontFamily:"monospace",fontSize:15,
                      display:"flex",flexDirection:"column",gap:4
                    }}>
                      {fetchLog.map((line,i) => (
                        <div key={i} style={{
                          color: line.startsWith("✅")?"#4ade80"
                            :line.startsWith("❌")||line.startsWith("⚠️")?"#f87171"
                            :line.startsWith("🏆")?"#a2ceec"
                            :"rgba(255,255,255,0.45)"
                        }}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── USER MANAGEMENT ── */}
                <div style={{
                  background:"rgba(239,68,68,0.05)",
                  border:"1px solid rgba(239,68,68,0.15)",
                  borderRadius:14,padding:"16px 20px",marginBottom:20
                }}>
                  <div style={{fontSize:15,fontWeight:700,color:"#f87171",marginBottom:12}}>
                    👥 Manage Players
                  </div>
                  {leaderboard.length === 0 ? (
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",textAlign:"center",padding:"12px 0"}}>
                      No players yet
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {leaderboard.map((entry, i) => (
                        <div key={entry.name} style={{
                          display:"flex",alignItems:"center",gap:10,
                          background:"rgba(255,255,255,0.03)",
                          border:"1px solid rgba(255,255,255,0.07)",
                          borderRadius:8,padding:"8px 12px"
                        }}>
                          <div style={{
                            width:28,height:28,borderRadius:"50%",flexShrink:0,
                            background:"rgba(255,255,255,0.08)",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)"
                          }}>{getInitials(entry.name)}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,color:"#e8f2fb"}}>{entry.name}</div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>
                              {entry.points} pts · {entry.count||0} predictions
                            </div>
                          </div>
                          <button onClick={async () => {
                            if (!window.confirm(`Remove ${entry.name} from the leaderboard?`)) return;
                            try {
                              await db.removeUser(entry.name);
                              const updated = leaderboard.filter(e => e.name !== entry.name);
                              setLeaderboard(updated);
                              showToast(`${entry.name} removed`);
                            } catch { showToast("Failed to remove","error"); }
                          }} style={{
                            padding:"5px 12px",
                            background:"rgba(239,68,68,0.12)",
                            border:"1px solid rgba(239,68,68,0.25)",
                            borderRadius:6,color:"#f87171",
                            fontSize:15,fontWeight:700,
                            cursor:"pointer",fontFamily:"inherit",
                            flexShrink:0
                          }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── MANUAL OVERRIDE ── */}
                <div style={{marginBottom:10,fontSize:12,color:"rgba(255,255,255,0.35)",fontWeight:600,letterSpacing:0.5}}>
                  Manual Override
                </div>

                {/* Group tabs */}
                <div style={{
                  display:"flex",flexWrap:"wrap",gap:3,marginBottom:10,
                  background:"rgba(255,255,255,0.025)",borderRadius:10,padding:5
                }}>
                  {GROUP_TABS.map(g=>(
                    <button key={g} onClick={()=>setAdminGroup(g)} style={{
                      padding:"5px 9px",borderRadius:7,
                      background:adminGroup===g?"rgba(74,222,128,0.12)":"transparent",
                      border:adminGroup===g?"1px solid rgba(74,222,128,0.3)":"1px solid transparent",
                      color:adminGroup===g?"#4ade80":"rgba(255,255,255,0.25)",
                      fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"
                    }}>{g==="KO"?"KO":g}</button>
                  ))}
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {adminMatchList.map(match => {
                    const r = results[match.id] || {home:"",away:""};
                    return (
                      <div key={match.id} style={{
                        background:"rgba(255,255,255,0.025)",
                        border:"1px solid rgba(255,255,255,0.06)",
                        borderRadius:9,padding:"9px 12px",
                        display:"flex",alignItems:"center",gap:8
                      }}>
                        <div style={{minWidth:52,textAlign:"center"}}>
                          {match.kickoff&&(
                            <div style={{fontSize:15,color:"rgba(255,255,255,0.2)"}}>
                              {fmtDate(match.kickoff)}
                            </div>
                          )}
                          {r.home!==""&&r.away!==""&&(
                            <div style={{fontSize:15,color:"#4ade80",marginTop:2}}>✓ saved</div>
                          )}
                        </div>
                        <span style={{flex:1,fontSize:15,textAlign:"right",color:"#e8f2fb"}}>{tf(match.home)}</span>
                        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                          <input type="number" min={0} max={99}
                            value={r.home}
                            onChange={async e => {
                              const newR = {...results,[match.id]:{...(results[match.id]||{}),home:e.target.value}};
                              setResults(newR);
                              if (e.target.value !== "" && results[match.id]?.away !== "")
                                await db.saveResult(match.id, e.target.value, results[match.id]?.away || 0);
                            }}
                            placeholder="-"
                            style={{
                              width:34,height:30,textAlign:"center",
                              background:"rgba(74,222,128,0.07)",
                              border:"1px solid rgba(74,222,128,0.2)",
                              borderRadius:5,color:"#4ade80",
                              fontSize:14,fontWeight:700,fontFamily:"inherit",outline:"none"
                            }}
                          />
                          <span style={{color:"rgba(255,255,255,0.18)",fontSize:10}}>:</span>
                          <input type="number" min={0} max={99}
                            value={r.away}
                            onChange={async e => {
                              const newR = {...results,[match.id]:{...(results[match.id]||{}),away:e.target.value}};
                              setResults(newR);
                              if (e.target.value !== "" && results[match.id]?.home !== "")
                                await db.saveResult(match.id, results[match.id]?.home || 0, e.target.value);
                            }}
                            placeholder="-"
                            style={{
                              width:34,height:30,textAlign:"center",
                              background:"rgba(74,222,128,0.07)",
                              border:"1px solid rgba(74,222,128,0.2)",
                              borderRadius:5,color:"#4ade80",
                              fontSize:14,fontWeight:700,fontFamily:"inherit",outline:"none"
                            }}
                          />
                        </div>
                        <span style={{flex:1,fontSize:15,color:"#e8f2fb"}}>{tf(match.away)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Recalculate button */}
                <div style={{marginTop:16,display:"flex",justifyContent:"center"}}>
                  <button onClick={async () => {
                    setSaving(true);
                    try {
                      // Save all current results to Supabase
                      await Promise.all(
                        Object.entries(results).map(([matchId, r]) =>
                          r.home !== "" && r.away !== ""
                            ? db.saveResult(matchId, r.home, r.away)
                            : Promise.resolve()
                        )
                      );
                      // Refresh leaderboard from Supabase view
                      const updated = await db.loadLeaderboard();
                      setLeaderboard(updated.map(r => ({ name: r.name, points: r.points || 0, count: r.predictions_count || 0 })));
                      showToast("Results saved & leaderboard recalculated");
                    } catch { showToast("Save failed","error"); }
                    setSaving(false);
                  }} disabled={saving} style={{
                    padding:"11px 36px",
                    background:saving?"rgba(74,222,128,0.15)":"linear-gradient(135deg,#16a34a,#15803d)",
                    border:"none",borderRadius:50,
                    color:"#fff",fontWeight:800,fontSize:12,
                    cursor:saving?"not-allowed":"pointer",
                    fontFamily:"inherit",boxShadow:"0 4px 16px rgba(22,163,74,0.25)"
                  }}>{saving?"Saving…":"Save Manual Results & Recalculate"}</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
          background:toast.type==="error"?"rgba(120,20,20,0.97)":"rgba(15,60,35,0.97)",
          border:`1px solid ${toast.type==="error"?"#f87171":"#4ade80"}`,
          borderRadius:10,padding:"11px 22px",
          color:"#fff",fontSize:12,fontWeight:600,zIndex:200,
          whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"
        }}>
          {toast.type==="error"?"✗ ":"✓ "}{toast.msg}
        </div>
      )}

      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}
