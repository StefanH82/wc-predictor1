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

// ─── SAFE STORAGE WRAPPER ────────────────────────────────────────────────────
// Falls back to localStorage if window.storage (Claude artifact API) unavailable
const store = {
  async get(key, shared) {
    try {
      if (window.storage) return await window.storage.get(key, shared);
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    } catch { return null; }
  },
  async set(key, value, shared) {
    try {
      if (window.storage) return await window.storage.set(key, value, shared);
      localStorage.setItem(key, value); return { value };
    } catch { return null; }
  }
};


const ADMIN_PIN = "wc2026admin";

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("predict");

  // User
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");

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

  // ─── STORAGE ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadGlobal();
  }, []);

  async function loadGlobal() {
    try {
      const lb = await store.get("wc26_lb", true);
      if (lb) setLeaderboard(JSON.parse(lb.value));
    } catch {}
    try {
      const res = await store.get("wc26_results", true);
      if (res) setResults(JSON.parse(res.value));
    } catch {}
  }

  async function loadMyPredictions(name) {
    try {
      const k = `wc26_p_${name.toLowerCase().replace(/\s+/g,"_")}`;
      const p = await store.get(k, true);
      if (p) { setPredictions(JSON.parse(p.value)); setSubmitted(true); }
    } catch {}
  }

  function handleSetName() {
    const n = nameInput.trim();
    if (!n || n.length < 2) { setNameError("Enter at least 2 characters"); return; }
    setUserName(n); setNameError("");
    loadMyPredictions(n);
  }

  function setPred(id, side, val) {
    const clean = val===""?"":String(Math.max(0,Math.min(99,parseInt(val)||0)));
    setPredictions(p => ({...p,[id]:{...p[id],[side]:clean}}));
  }

  async function submitPredictions() {
    const filled = ALL_MATCHES.filter(m => {
      const p = predictions[m.id];
      // can only predict unlocked matches
      if (isPredictionLocked(m.kickoff)) return false;
      return p && p.home!=="" && p.away!=="";
    });
    // also allow predictions for future/null kickoff
    const anyFilled = Object.values(predictions).some(p => p!=null&&p.home!=null&&p.away!=null&&p.home!==""&&p.away!=="");
    if (!anyFilled) { showToast("Fill in at least one score","error"); return; }
    setSaving(true);
    try {
      const k = `wc26_p_${userName.toLowerCase().replace(/\s+/g,"_")}`;
      await store.set(k, JSON.stringify(predictions), true);
      const pts = calcPoints(predictions, results);
      const lb = [...leaderboard];
      const idx = lb.findIndex(e => e.name.toLowerCase()===userName.toLowerCase());
      const total = Object.values(predictions).filter(p=>p!=null&&p.home!=null&&p.away!=null&&p.home!==""&&p.away!=="").length;
      const entry = {name:userName,points:pts,count:total,submitted:new Date().toISOString()};
      if (idx>=0) lb[idx]=entry; else lb.push(entry);
      lb.sort((a,b)=>b.points-a.points);
      await store.set("wc26_lb", JSON.stringify(lb), true);
      setLeaderboard(lb); setSubmitted(true);
      showToast(`Saved! ${total} predictions · ${pts} pts so far`);
    } catch { showToast("Save failed","error"); }
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

      // Save results
      await store.set("wc26_results", JSON.stringify(newResults), true);
      setResults(newResults);

      // Recalculate all leaderboard scores
      setFetchLog(prev => [...prev, `💾 Saved ${updated} result(s). Recalculating leaderboard...`]);
      const lb = [...leaderboard];
      const updated_lb = await Promise.all(lb.map(async entry => {
        try {
          const k = `wc26_p_${entry.name.toLowerCase().replace(/\s+/g,"_")}`;
          const p = await store.get(k, true);
          if (!p) return entry;
          const preds = JSON.parse(p.value);
          return {...entry, points: calcPoints(preds, newResults)};
        } catch { return entry; }
      }));
      updated_lb.sort((a,b)=>b.points-a.points);
      await store.set("wc26_lb", JSON.stringify(updated_lb), true);
      setLeaderboard(updated_lb);
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
      background:"#07080f",
      fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif",
      color:"#c8d8e8",
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
        background:"linear-gradient(90deg,transparent,#c9a227 30%,#f5d060 50%,#c9a227 70%,transparent)"
      }}/>

      {/* ── HEADER ── */}
      <header style={{
        position:"sticky",top:0,zIndex:50,
        background:"rgba(7,8,15,0.97)",
        backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(201,162,39,0.12)",
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
                background:"linear-gradient(135deg,#c9a227 0%,#f5d060 50%,#c9a227 100%)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,boxShadow:"0 0 20px rgba(201,162,39,0.35),0 4px 12px rgba(0,0,0,0.5)"
              }}>⚽</div>
              <div>
                <div style={{
                  fontSize:16,fontWeight:700,color:"#fff",
                  letterSpacing:0.5,lineHeight:1.1
                }}>World Cup 2026</div>
                <div style={{
                  fontSize:9,letterSpacing:4,color:"#c9a227",
                  textTransform:"uppercase",marginTop:1
                }}>Company Predictor</div>
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
                <div style={{
                  display:"flex",alignItems:"center",gap:7,
                  background:"rgba(201,162,39,0.1)",
                  border:"1px solid rgba(201,162,39,0.2)",
                  borderRadius:30,padding:"5px 12px 5px 6px"
                }}>
                  <div style={{
                    width:26,height:26,borderRadius:"50%",
                    background:"linear-gradient(135deg,#c9a227,#e8a010)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:9,fontWeight:800,color:"#000"
                  }}>{getInitials(userName)}</div>
                  <span style={{fontSize:12,color:"#f5d060",fontWeight:600}}>{userName}</span>
                  {submitted && <span style={{fontSize:9,color:"rgba(201,162,39,0.5)"}}>{totalPreds}</span>}
                </div>
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
                fontSize:11,fontWeight:600,letterSpacing:1.2,textTransform:"uppercase",
                color:tab===t.id?"#f5d060":"rgba(255,255,255,0.28)",
                borderBottom:tab===t.id?"2px solid #c9a227":"2px solid transparent",
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
            // Name entry
            <div style={{
              maxWidth:380,margin:"70px auto",
              background:"linear-gradient(135deg,rgba(201,162,39,0.06),rgba(255,255,255,0.02))",
              border:"1px solid rgba(201,162,39,0.2)",
              borderRadius:20,padding:"48px 32px",textAlign:"center"
            }}>
              <div style={{fontSize:52,marginBottom:16,filter:"drop-shadow(0 4px 12px rgba(201,162,39,0.4))"}}>🏆</div>
              <h2 style={{margin:"0 0 4px",fontSize:22,color:"#fff",fontWeight:700,letterSpacing:-0.3}}>
                FIFA World Cup 2026
              </h2>
              <p style={{margin:"0 0 4px",fontSize:12,color:"rgba(255,255,255,0.35)"}}>
                USA · Canada · Mexico · Jun 11 – Jul 19
              </p>
              <p style={{margin:"0 0 28px",fontSize:11,color:"rgba(255,255,255,0.2)"}}>
                48 teams · 104 matches · 12 groups
              </p>

              <div style={{
                fontSize:10,color:"rgba(201,162,39,0.6)",
                background:"rgba(201,162,39,0.08)",border:"1px solid rgba(201,162,39,0.15)",
                borderRadius:8,padding:"8px 12px",marginBottom:20,letterSpacing:0.3
              }}>
                ⏱ Predictions lock 1 hour before each kick-off
              </div>

              <div style={{display:"flex",gap:8}}>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleSetName()}
                  placeholder="Enter your name"
                  style={{
                    flex:1,padding:"11px 14px",
                    background:"rgba(255,255,255,0.07)",
                    border:"1px solid rgba(255,255,255,0.13)",
                    borderRadius:9,color:"#fff",fontSize:13,
                    fontFamily:"inherit",outline:"none"
                  }}
                />
                <button onClick={handleSetName} style={{
                  padding:"11px 20px",
                  background:"linear-gradient(135deg,#c9a227,#e8a010)",
                  border:"none",borderRadius:9,color:"#000",
                  fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit",
                  boxShadow:"0 4px 14px rgba(201,162,39,0.35)"
                }}>Start</button>
              </div>
              {nameError && <p style={{color:"#f87171",fontSize:11,marginTop:8}}>{nameError}</p>}
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
                  fontSize:11,color:"rgba(74,222,128,0.8)"
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
                      background:activeGroup===g?"rgba(201,162,39,0.18)":"transparent",
                      border:activeGroup===g?"1px solid rgba(201,162,39,0.35)":"1px solid transparent",
                      color:activeGroup===g?"#f5d060":done?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.25)",
                      fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                      display:"flex",alignItems:"center",gap:3
                    }}>
                      {g==="KO"?"KO":g}
                      {done&&<span style={{color:"#4ade80",fontSize:8}}>✓</span>}
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
                      if(ph===rh&&pa===ra) ptsBadge={v:"+3",c:"#4ade80",b:"rgba(74,222,128,0.12)"};
                      else {
                        const pw=ph>pa?"H":ph<pa?"A":"D",rw=rh>ra?"H":rh<ra?"A":"D";
                        ptsBadge = pw===rw
                          ? {v:"+1",c:"#60a5fa",b:"rgba(96,165,250,0.12)"}
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
                          ? "rgba(201,162,39,0.05)"
                          : "rgba(255,255,255,0.02)",
                      border:`1px solid ${
                        locked && hasResult ? "rgba(255,255,255,0.06)"
                        : locked ? "rgba(251,191,36,0.15)"
                        : hasPred ? "rgba(201,162,39,0.18)"
                        : "rgba(255,255,255,0.06)"}`,
                      borderRadius:9,padding:"9px 12px",
                      display:"flex",alignItems:"center",gap:8,
                      opacity: locked && !hasResult ? 0.6 : 1
                    }}>
                      {/* Date / lock state */}
                      <div style={{minWidth:60,textAlign:"center",flexShrink:0}}>
                        {hasResult ? (
                          <div style={{fontSize:8,color:"rgba(255,255,255,0.25)",fontWeight:600}}>FT</div>
                        ) : locked ? (
                          <div style={{fontSize:9,color:"#fbbf24"}}>🔒</div>
                        ) : deadline ? (
                          <div style={{fontSize:8,color:"#fbbf24",fontWeight:600}}>{deadline}</div>
                        ) : match.kickoff ? (
                          <div style={{fontSize:8,color:"rgba(255,255,255,0.22)"}}>
                            {fmtDate(match.kickoff)}<br/>
                            {new Date(match.kickoff).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
                          </div>
                        ) : (
                          <div style={{fontSize:8,color:"rgba(255,255,255,0.18)"}}>TBD</div>
                        )}
                        {ptsBadge && (
                          <div style={{
                            marginTop:3,fontSize:9,fontWeight:700,
                            color:ptsBadge.c,background:ptsBadge.b,
                            borderRadius:4,padding:"1px 5px",display:"inline-block"
                          }}>{ptsBadge.v}</div>
                        )}
                      </div>

                      {/* Home team */}
                      <span style={{
                        flex:1,fontSize:11,textAlign:"right",
                        color: locked?"rgba(255,255,255,0.35)":"#c8d8e8",
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
                        flex:1,fontSize:11,
                        color:locked?"rgba(255,255,255,0.35)":"#c8d8e8",
                        lineHeight:1.3,fontWeight:500
                      }}>{tf(match.away)}</span>

                      {/* Result badge */}
                      {hasResult && (
                        <div style={{
                          fontSize:13,fontWeight:700,
                          minWidth:40,textAlign:"center",
                          background:"rgba(74,222,128,0.08)",
                          border:"1px solid rgba(74,222,128,0.2)",
                          borderRadius:6,padding:"3px 7px",
                          color:"#4ade80",flexShrink:0
                        }}>{result.home}:{result.away}</div>
                      )}
                      {locked && !hasResult && (
                        <div style={{
                          fontSize:9,color:"rgba(251,191,36,0.5)",
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
                  background:saving?"rgba(201,162,39,0.25)":"linear-gradient(135deg,#c9a227,#e8a010)",
                  border:"none",borderRadius:50,
                  color:saving?"rgba(0,0,0,0.4)":"#000",
                  fontWeight:800,fontSize:13,cursor:saving?"not-allowed":"pointer",
                  fontFamily:"inherit",letterSpacing:0.5,
                  boxShadow:"0 4px 20px rgba(201,162,39,0.3)"
                }}>{saving?"Saving…":submitted?"Update Predictions":"Submit Predictions"}</button>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>
                  {totalPreds} / 104 filled
                </span>
              </div>
              <p style={{textAlign:"center",marginTop:8,fontSize:10,color:"rgba(255,255,255,0.17)"}}>
                +3 exact score · +1 correct result · Locks 1hr before kick-off
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
                {pts:"+3",label:"Exact score",c:"#c9a227"},
                {pts:"+1",label:"Correct result",c:"#60a5fa"},
                {pts:"312",label:"Max pts",c:"rgba(255,255,255,0.5)"}
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
                      background:isMe?"rgba(201,162,39,0.08)":"rgba(255,255,255,0.025)",
                      border:isMe?"1px solid rgba(201,162,39,0.28)":"1px solid rgba(255,255,255,0.055)",
                      borderRadius:10,padding:"12px 16px"
                    }}>
                      {/* Progress bar bg */}
                      <div style={{
                        position:"absolute",left:0,top:0,bottom:0,
                        width:`${pct}%`,
                        background:isMe
                          ? "rgba(201,162,39,0.07)"
                          : i===0 ? "rgba(201,162,39,0.04)"
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
                          background:isMe?"linear-gradient(135deg,#c9a227,#e8a010)":"rgba(255,255,255,0.07)",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:10,fontWeight:800,color:isMe?"#000":"rgba(255,255,255,0.35)"
                        }}>{getInitials(entry.name)}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:isMe?"#f5d060":"#c8d8e8",fontWeight:isMe?700:400}}>
                            {entry.name} {isMe&&<span style={{fontSize:9,opacity:0.4}}>(you)</span>}
                          </div>
                          {entry.count&&(
                            <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginTop:1}}>
                              {entry.count} predictions
                            </div>
                          )}
                        </div>
                        <div>
                          <span style={{
                            fontSize:22,fontWeight:700,
                            color:i===0?"#c9a227":i<3?"#e2e8f0":"rgba(255,255,255,0.35)"
                          }}>{entry.points}</span>
                          <span style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginLeft:3}}>pts</span>
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
                  background:"linear-gradient(135deg,#c9a227,#e8a010)",
                  border:"none",borderRadius:8,
                  color:"#000",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"
                }}>Unlock</button>
                <p style={{fontSize:10,color:"rgba(255,255,255,0.15)",marginTop:14}}>
                  Default PIN: wc2026admin
                </p>
              </div>
            ) : (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <h2 style={{margin:"0 0 2px",fontSize:16,color:"#fff"}}>Admin Panel</h2>
                    <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.3)"}}>
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
                  background:"rgba(201,162,39,0.06)",
                  border:"1px solid rgba(201,162,39,0.18)",
                  borderRadius:14,padding:"20px",marginBottom:20
                }}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#f5d060",marginBottom:4}}>
                        🤖 Auto-Fetch Results
                      </div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>
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
                          ? "rgba(201,162,39,0.2)"
                          : "linear-gradient(135deg,#c9a227,#e8a010)",
                        border:"none",borderRadius:10,
                        color:fetching?"rgba(0,0,0,0.4)":"#000",
                        fontWeight:800,fontSize:13,
                        cursor:fetching?"not-allowed":"pointer",
                        fontFamily:"inherit",
                        boxShadow:fetching?"none":"0 4px 16px rgba(201,162,39,0.3)",
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
                      fontFamily:"monospace",fontSize:11,
                      display:"flex",flexDirection:"column",gap:4
                    }}>
                      {fetchLog.map((line,i) => (
                        <div key={i} style={{
                          color: line.startsWith("✅")?"#4ade80"
                            :line.startsWith("❌")||line.startsWith("⚠️")?"#f87171"
                            :line.startsWith("🏆")?"#c9a227"
                            :"rgba(255,255,255,0.45)"
                        }}>{line}</div>
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
                            <div style={{fontSize:8,color:"rgba(255,255,255,0.2)"}}>
                              {fmtDate(match.kickoff)}
                            </div>
                          )}
                          {r.home!==""&&r.away!==""&&(
                            <div style={{fontSize:8,color:"#4ade80",marginTop:2}}>✓ saved</div>
                          )}
                        </div>
                        <span style={{flex:1,fontSize:11,textAlign:"right",color:"#c8d8e8"}}>{tf(match.home)}</span>
                        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                          <input type="number" min={0} max={99}
                            value={r.home}
                            onChange={async e => {
                              const newR = {...results,[match.id]:{...(results[match.id]||{}),home:e.target.value}};
                              setResults(newR);
                              await store.set("wc26_results",JSON.stringify(newR),true);
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
                              await store.set("wc26_results",JSON.stringify(newR),true);
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
                        <span style={{flex:1,fontSize:11,color:"#c8d8e8"}}>{tf(match.away)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Recalculate button */}
                <div style={{marginTop:16,display:"flex",justifyContent:"center"}}>
                  <button onClick={async () => {
                    setSaving(true);
                    try {
                      await store.set("wc26_results",JSON.stringify(results),true);
                      const lb=[...leaderboard];
                      const updated=await Promise.all(lb.map(async entry=>{
                        try {
                          const k=`wc26_p_${entry.name.toLowerCase().replace(/\s+/g,"_")}`;
                          const p=await store.get(k,true);
                          if(!p) return entry;
                          return {...entry,points:calcPoints(JSON.parse(p.value),results)};
                        } catch { return entry; }
                      }));
                      updated.sort((a,b)=>b.points-a.points);
                      await store.set("wc26_lb",JSON.stringify(updated),true);
                      setLeaderboard(updated);
                      showToast("Scores saved & leaderboard recalculated");
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
