/* ---------- data ---------- */

const decades = [
  ["1980–1990","1 decade (10 years)"],
  ["1990–2000","1 decade (10 years)"],
  ["2000–2010","1 decade (10 years)"],
  ["2010–2020","1 decade (10 years)"],
  ["2020–2024","0.4 decades (4 years)"],
];

const ranges = ["1980–1985","1985–1990","1990–1995","1995–2000","2000–2005","2005–2010","2010–2015","2015–2020","2020–2024"];

// [name, count, first3, rest]  — rest items prefixed "  " render as sub-level
const categories = [
  ["Game","xx",
    ["Attendance","Away score","Away team ID"],
    ["Ballpark ID","Date","Game ID","Game type (includes postseason)","Home score","Home team ID","Losing pitcher ID","Save pitcher ID","Status","Venue name at the time","Winning pitcher ID"]],
  ["Teams","xx",
    ["Active","Current name","Division"],
    ["ID","League","Name history (past names only)","  Name","  Through year","Trophies","  Division titles","  Pennants","  Wild cards","  World Series"]],
  ["Players","xx",
    ["Bat side","Birth date","Death date"],
    ["Height","Last active season","Pitch hand","Status","Weight"]],
  ["Managers","xx",
    ["Birth date","Death date","First season managed"],
    ["Last season managed","Status"]],
  ["Player-stats","xx",
    ["Player ID","Team ID","Stat group (pitching, fielding or hitting)"],
    ["Stats:",
     "  Pitching — Air outs, At bats, Batting average, Balks, Walks, Batters faced, Blown saves, Catcher's interference, Caught stealing, Caught stealing %, Complete games, Doubles, Earned runs, ERA, Games finished, Games pitched, Games started, Grounded into double play, Ground outs, GO/AO ratio, Hit by pitch, Hits, Hits/9, Holds, Home runs, HR/9, Inherited runners, Inherited runners scored, Innings pitched, Intentional walks, Losses, Pitches thrown, On-base %, OPS, Outs, Pickoffs, Pitches per inning, Runs, Runs/9, Sacrifice bunts, Sacrifice flies, Save opportunities, Saves, Shutouts, Slugging %, Stolen base %, Stolen bases, Strikeouts, Strike %, K/BB ratio, K/9, Strikes, Total bases, Triples, Walks/9, WHIP, Wild pitches, Winning %, Wins",
     "  Fielding — Age, Assists, Catcher ERA, Catcher's interference, Caught stealing, Caught stealing %, Chances, Double plays, Errors, Fielding %, Games played, Games started, Innings, Passed balls, Pickoffs, Position, Put outs, Range factor/9, Range factor/game, Stolen base %, Stolen bases, Throwing errors, Triple plays, Wild pitches",
     "  Hitting — Age, Air outs, At bats, At bats/HR, Batting average, BABIP, Walks, Catcher's interference, Caught stealing, Caught stealing %, Doubles, Games played, Grounded into double play, Ground outs, GO/AO ratio, Hit by pitch, Hits, Home runs, Intentional walks, Left on base, Pitches seen, On-base %, OPS, Plate appearances, RBI, Runs, Sacrifice bunts, Sacrifice flies, Slugging %, Stolen base %, Stolen bases, Strikeouts, Total bases, Triples"]],
  ["Rosters","xx",["Year","Teams"],[]],
  ["Manager-stats","xx",["Manager ID","Team ID"],[]],
  ["Awards","xx",["Award","Player ID","Team ID"],["Year"]],
  ["Team-stats","xx",["Division at the time","League at the time","Name at the time"],["Team ID"]],
  ["Standings","xx",
    ["Clinched","Division at the time","Division rank"],
    ["Losses","Team ID","Winning percentage","Wins"]],
  ["Standings-splits","xx",
    ["Year","Updated","Teams"],
    ["  each team — Team ID, Wins, Losses, Winning %, Runs scored, Runs allowed, Run differential, Games behind, Wild card games behind",
     "Splits:","  Home","  Away","  Left","  Left home","  Left away","  Right","  Right home","  Right away","  Last ten games","  Extra-inning games","  One-run games","  Day games","  Night games","  Grass","  Turf",
     "Expected record:","  Expected win-loss record","  Expected win-loss record for the season"]],
  ["Drafts","xx",
    ["Round","Overall pick number","Team ID"],
    ["Player ID","Player name","Position","School","Birth date","Height","Weight","Bats (left, right or switch)","Throws (left or right)"]],
];

/* ---------- layout ---------- */

const trunk = [
  {id:"raw",       x:170, y:40,  w:260, h:56, label:"Raw data", detail:"117GB · 1980–2024 (fixed data)"},
  {id:"compress",  x:170, y:150, w:260, h:44, label:"Compression"},
  {id:"decadeLbl", x:170, y:250, w:260, h:44, label:"Decade labeling"},
  {id:"rangeLbl",  x:170, y:350, w:260, h:44, label:"5yr range labeling"},
  {id:"yearLbl",   x:170, y:450, w:260, h:64, label:"Yearly structure", detail:"range 2000–2005 → year 2004"},
];
const trunkEdges = [["raw","compress"],["compress","decadeLbl"],["decadeLbl","rangeLbl"],["rangeLbl","yearLbl"]];

const decadeNodes = decades.map(([r,n],i)=>({
  id:"dec"+i, x:560+i*210, y:250, w:190, h:44, label:r, sub:n
}));

const rangeNodes = ranges.map((r,i)=>({
  id:"rng"+i, x:560+i*164, y:350, w:150, h:40, label:r
}));

const cols = 4;
const cardW = 260, cardGapX = 40, cardGapY = 340;
const catNodes = categories.map(([name,count,first,rest],i)=>{
  const col = i % cols, row = Math.floor(i/cols);
  return {id:"cat"+i, x:560+col*(cardW+cardGapX), y:560+row*cardGapY, w:cardW, name, count, first, rest};
});

const worldW = 560 + cols*(cardW+cardGapX) + 40;
const worldH = 560 + Math.ceil(categories.length/cols)*cardGapY + 300;

/* ---------- render ---------- */

const world = document.getElementById("world");
world.style.width = worldW+"px";
world.style.height = worldH+"px";

const nodesLayer = document.getElementById("nodes");
const edgesLayer = document.getElementById("edges");

function fieldRow(text){
  const sub = text.startsWith("  ");
  const t = sub ? text.slice(2) : text;
  return `<div class="field${sub?" sub":""}"><span class="fdot"></span>${t}</div>`;
}

let html = "";

trunk.forEach(n=>{
  html += `<div class="node" style="left:${n.x}px;top:${n.y}px;width:${n.w}px">
    <div class="heading"><span class="dot"></span>${n.label}</div>
    ${n.detail ? `<div class="detail">${n.detail}</div>` : ""}
  </div>`;
});

decadeNodes.forEach(n=>{
  html += `<div class="chip" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px">
    <span class="dot"></span>${n.label}<span class="n">${n.sub}</span>
  </div>`;
});

rangeNodes.forEach(n=>{
  html += `<div class="chip" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px">
    <span class="dot"></span>${n.label}
  </div>`;
});

catNodes.forEach(n=>{
  const firstHtml = n.first.map(fieldRow).join("");
  if(n.rest.length === 0){
    html += `<div class="card" style="left:${n.x}px;top:${n.y}px;width:${n.w}px">
      <div class="cname">${n.name}<span class="n">(${n.count})</span></div>${firstHtml}
    </div>`;
  } else {
    const restHtml = n.rest.map(fieldRow).join("");
    html += `<details class="card" id="${n.id}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px">
      <summary>
        <div class="cname">${n.name}<span class="n">(${n.count})</span></div>
        ${firstHtml}
        <div class="more-toggle" data-count="${n.rest.length}"></div>
      </summary>
      ${restHtml}
    </details>`;
  }
});

nodesLayer.innerHTML = html;

// bring expanded cards to front so they don't hide under the next row
nodesLayer.querySelectorAll("details.card").forEach(d=>{
  d.addEventListener("toggle", ()=> d.classList.toggle("top", d.open));
});

/* ---------- edges (simple elbow connectors) ---------- */

function elbow(x1,y1,x2,y2){
  const midY = y1 + (y2-y1)/2;
  return `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
}

const byId = {};
trunk.forEach(n=>byId[n.id]=n);

let paths = "";

trunkEdges.forEach(([a,b])=>{
  const A=byId[a], B=byId[b];
  paths += `<path d="${elbow(A.x+A.w/2, A.y+A.h, B.x+B.w/2, B.y)}"/>`;
});

const decadeLbl = byId.decadeLbl;
decadeNodes.forEach(n=>{
  paths += `<path d="${elbow(decadeLbl.x+decadeLbl.w, decadeLbl.y+decadeLbl.h/2, n.x, n.y+n.h/2)}"/>`;
});

const rangeLbl = byId.rangeLbl;
rangeNodes.forEach(n=>{
  paths += `<path d="${elbow(rangeLbl.x+rangeLbl.w, rangeLbl.y+rangeLbl.h/2, n.x, n.y+n.h/2)}"/>`;
});

const yearLbl = byId.yearLbl;
catNodes.forEach(n=>{
  paths += `<path d="${elbow(yearLbl.x+yearLbl.w, yearLbl.y+yearLbl.h/2, n.x, n.y+24)}"/>`;
});

edgesLayer.innerHTML = paths;

/* ---------- pan & zoom ---------- */

const viewport = document.getElementById("viewport");

let scale = 0.8, tx = 40, ty = 60;
let dragging = false, lastX = 0, lastY = 0;

function apply(){
  world.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
}

function clampScale(s){ return Math.min(2.5, Math.max(0.25, s)); }

function zoomAt(clientX, clientY, factor){
  const rect = viewport.getBoundingClientRect();
  const mx = clientX - rect.left, my = clientY - rect.top;
  const wx = (mx - tx) / scale, wy = (my - ty) / scale;
  scale = clampScale(scale * factor);
  tx = mx - wx * scale;
  ty = my - wy * scale;
  apply();
}

// wheel: plain scroll pans, ctrl/cmd+scroll (trackpad pinch) zooms
viewport.addEventListener("wheel", (e)=>{
  e.preventDefault();
  if(e.ctrlKey || e.metaKey){
    const factor = Math.exp(-e.deltaY * 0.01);
    zoomAt(e.clientX, e.clientY, factor);
  } else {
    tx -= e.deltaX;
    ty -= e.deltaY;
    apply();
  }
}, {passive:false});

// drag to pan (mouse) — only when starting on empty canvas
viewport.addEventListener("mousedown", (e)=>{
  if(e.target.closest(".card, .chip, .node")) return;
  dragging = true;
  lastX = e.clientX; lastY = e.clientY;
  viewport.classList.add("grabbing");
});
window.addEventListener("mousemove", (e)=>{
  if(!dragging) return;
  tx += e.clientX - lastX;
  ty += e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  apply();
});
window.addEventListener("mouseup", ()=>{
  dragging = false;
  viewport.classList.remove("grabbing");
});

// touch: one-finger pan, two-finger pinch zoom
let touchMode = null, lastDist = 0, lastMid = null, touchLast = null;

function dist(t0,t1){ return Math.hypot(t1.clientX-t0.clientX, t1.clientY-t0.clientY); }
function mid(t0,t1){ return {x:(t0.clientX+t1.clientX)/2, y:(t0.clientY+t1.clientY)/2}; }

viewport.addEventListener("touchstart", (e)=>{
  if(e.touches.length === 1){
    touchMode = "pan";
    touchLast = {x:e.touches[0].clientX, y:e.touches[0].clientY};
  } else if(e.touches.length === 2){
    touchMode = "pinch";
    lastDist = dist(e.touches[0], e.touches[1]);
    lastMid = mid(e.touches[0], e.touches[1]);
  }
}, {passive:true});

viewport.addEventListener("touchmove", (e)=>{
  if(touchMode === "pan" && e.touches.length === 1){
    const t = e.touches[0];
    tx += t.clientX - touchLast.x;
    ty += t.clientY - touchLast.y;
    touchLast = {x:t.clientX, y:t.clientY};
    apply();
  } else if(touchMode === "pinch" && e.touches.length === 2){
    const d = dist(e.touches[0], e.touches[1]);
    const m = mid(e.touches[0], e.touches[1]);
    zoomAt(m.x, m.y, d / lastDist);
    lastDist = d; lastMid = m;
  }
  e.preventDefault();
}, {passive:false});

viewport.addEventListener("touchend", ()=>{ touchMode = null; });

// buttons
document.getElementById("zoomIn").addEventListener("click", ()=>{
  const r = viewport.getBoundingClientRect();
  zoomAt(r.left+r.width/2, r.top+r.height/2, 1.2);
});
document.getElementById("zoomOut").addEventListener("click", ()=>{
  const r = viewport.getBoundingClientRect();
  zoomAt(r.left+r.width/2, r.top+r.height/2, 1/1.2);
});
document.getElementById("zoomReset").addEventListener("click", ()=>{
  scale = 0.8; tx = 40; ty = 60; apply();
});

apply();
