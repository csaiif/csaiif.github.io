/* Baseball data flight: scroll = camera moving forward through the scenes. */
(() => {
  const MOBILE = document.body.dataset.mode === 'mobile';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------------- DATA ---------------- */
  const decades = [
    ['1980–1990', '1 decade (10 years)'],
    ['1990–2000', '1 decade (10 years)'],
    ['2000–2010', '1 decade (10 years)'],
    ['2010–2020', '1 decade (10 years)'],
    ['2020–2024', '0.4 decades (4 years)'],
  ];
  const HIT_DECADE = 2;
  const ranges = ['1980–1985','1985–1990','1990–1995','1995–2000','2000–2005','2005–2010','2010–2015','2015–2020','2020-2024'];
  const HIT_RANGE = 4;

  const pitching = ['Air outs','At bats','Batting average','Balks','Walks','Batters faced','Blown saves',"Catcher's interference",'Caught stealing','Caught stealing percentage','Complete games','Doubles','Earned runs','Earned run average','Games finished','Games pitched','Games started','Grounded into double play','Ground outs','Ground outs to air outs ratio','Hit by pitch','Hits','Hits per 9 innings','Holds','Home runs','Home runs per 9 innings','Inherited runners','Inherited runners scored','Innings pitched','Intentional walks','Losses','Number of pitches','On-base percentage','On-base plus slugging','Outs','Pickoffs','Pitches per inning','Runs','Runs scored per 9 innings','Sacrifice bunts','Sacrifice flies','Save opportunities','Saves','Shutouts','Slugging percentage','Stolen base percentage','Stolen bases','Strikeouts','Strike percentage','Strikeout-to-walk ratio','Strikeouts per 9 innings','Strikes','Total bases','Triples','Walks per 9 innings','Walks plus hits per inning pitched','Wild pitches','Winning percentage','Wins'];
  const fielding = ['Age','Assists','Catcher earned run average',"Catcher's interference",'Caught stealing','Caught stealing percentage','Chances','Double plays','Errors','Fielding percentage','Games played','Games started','Innings','Passed balls','Pickoffs','Position','Put outs','Range factor per 9 innings','Range factor per game','Stolen base percentage','Stolen bases','Throwing errors','Triple plays','Wild pitches'];
  const hitting = ['Age','Air outs','At bats','At bats per home run','Batting average','Batting average on balls in play','Walks',"Catcher's interference",'Caught stealing','Caught stealing percentage','Doubles','Games played','Grounded into double play','Ground outs','Ground outs to air outs ratio','Hit by pitch','Hits','Home runs','Intentional walks','Left on base','Number of pitches','On-base percentage','On-base plus slugging','Plate appearances','Runs batted in','Runs','Sacrifice bunts','Sacrifice flies','Slugging percentage','Stolen base percentage','Stolen bases','Strikeouts','Total bases','Triples'];

  // count: 'xx' until you have the exact numbers; replace with the real number later.
  const cats = [
    { name: 'Game', count: 'xx', items: ['Attendance','Away score','Away team ID','Ballpark ID','Date','Game ID','Game type (includes postseason)','Home score','Home team ID','Losing pitcher ID','Save pitcher ID','Status','Venue name at the time','Winning pitcher ID'] },
    { name: 'Teams', count: 'xx', items: ['Active','Current name','Division','ID','League',
      { name: 'Name history (past names only)', children: ['Name','Through year'] },
      { name: 'Trophies', children: ['Division titles','Pennants','Wild cards','World Series'] }] },
    { name: 'Players', count: 'xx', items: ['Bat side','Birth date','Death date','Debut date','Height','Last active season','Pitch hand','Status','Weight'] },
    { name: 'Managers', count: 'xx', items: ['Birth date','Death date','First season managed','Last season managed','Status'] },
    { name: 'Player-stats', count: 'xx', items: ['Player ID','Team ID','Stat group (pitching, fielding or hitting)',
      { name: 'Pitching stats', children: pitching },
      { name: 'Fielding stats', children: fielding },
      { name: 'Hitting stats', children: hitting }] },
    { name: 'Rosters', count: 'xx', items: ['Year','Teams'] },
    { name: 'Manager-stats', count: 'xx', items: ['Manager ID','Team ID'] },
    { name: 'Awards', count: 'xx', items: ['Award','Player ID','Team ID','Year'] },
    { name: 'Team-stats', count: 'xx', items: ['Division at the time','League at the time','Name at the time','Team ID'] },
    { name: 'Standings', count: 'xx', items: ['Clinched','Division at the time','Division rank','Losses','Team ID','Winning percentage','Wins'] },
    { name: 'Standings-splits', count: 'xx', items: ['Year','Updated','Teams',
      { name: 'Each team', children: ['Team ID','Wins','Losses','Winning percentage','Runs scored','Runs allowed','Run differential','Games behind','Wild card games behind'] },
      { name: 'Splits', children: ['Home','Away','Left','Left home','Left away','Right','Right home','Right away','Last ten games','Extra-inning games','One-run games','Day games','Night games','Grass','Turf'] },
      { name: 'Expected record', children: ['Expected win-loss record','Expected win-loss record for the season'] }] },
    { name: 'Drafts', count: 'xx', items: ['Round','Overall pick number','Team ID','Player ID','Player name','Position','School','Birth date','Height','Weight','Bats (left, right or switch)','Throws (left or right)'] },
  ];
  const PREVIEW = 3;

  /* ---------------- BUILD SCENES ---------------- */
  const ICON = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#folder"/></svg>';
  const stage = $('#stage');
  const scenes = [];
  const labels = ['Raw data', 'Compression', 'Decade labeling', '5-year range labeling', '2004'];

  function add(html, cls) {
    const el = document.createElement('section');
    el.className = 'scene ' + (cls || '');
    el.innerHTML = html;
    stage.appendChild(el);
    scenes.push(el);
    return el;
  }
  const itemHTML = (it) => typeof it === 'string'
    ? `<li>${ICON}<span>${it}</span></li>`
    : `<li class="grp"><div class="gname">${ICON}<span>${it.name}</span></div><ul class="gsub">${it.children.map((c) => `<li>${c}</li>`).join('')}</ul></li>`;

  // 1. Raw data
  add(`<div class="content"><div class="hero-ico hit">${ICON}</div>
    <h1 class="title">Raw data 117GB 1980-2024 <span>(fixed data)</span></h1></div>`);

  // 2. Compression (nested squares pulled into a core)
  let squares = '';
  for (let i = 0; i < 7; i++) {
    const s = 190 - i * 26;
    squares += `<g transform="rotate(${i * 6})"><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" style="animation-delay:${(i * 0.28).toFixed(2)}s"/></g>`;
  }
  add(`<div class="content"><svg class="comp" viewBox="-100 -100 200 200" aria-hidden="true">${squares}<rect class="core" x="-5" y="-5" width="10" height="10"/></svg>
    <h2 class="comp-h">Compression</h2></div>`);

  // 3. Decades
  add(`<div class="content"><h2 class="head">Decade labeling</h2><div class="row decades">${
    decades.map(([l, n], i) => `<div class="node${i === HIT_DECADE ? ' hit' : ''}">${ICON}<b>${l}</b><small>${n}</small></div>`).join('')
  }</div></div>`);

  // 4. 5-year ranges
  add(`<div class="content"><h2 class="head">5-year range labeling</h2><div class="row ranges">${
    ranges.map((l, i) => `<div class="node${i === HIT_RANGE ? ' hit' : ''}">${ICON}<b>${l}</b></div>`).join('')
  }</div></div>`);

  // 5. 2004 and its 12 folders
  const nodesHTML = cats.map((c) => `<div class="rnode">${ICON}<span>${c.name}</span></div>`).join('');
  const yearScene = add(`<div class="content year">
    <svg class="web" aria-hidden="true"></svg>
    <div class="yr-center hit">${ICON}<b>2004</b><small>inside 2000–2005</small></div>
    ${MOBILE ? `<div class="rgrid">${nodesHTML}</div>` : nodesHTML}
  </div>`);

  // 6+. One scene per category folder
  cats.forEach((c, i) => {
    const hidden = c.items.length - PREVIEW;
    const shown = hidden > 0 ? c.items.slice(0, PREVIEW) : c.items;
    add(`<div class="content cat">
      <div class="cat-l"><p class="path">2004 / ${c.name}</p><div class="big-ico">${ICON}</div>
        <h2 class="cname">${c.name}</h2><p class="count">count <b>${c.count}</b></p></div>
      <div class="cat-r"><ul class="entries">${shown.map(itemHTML).join('')}</ul>
        ${hidden > 0 ? `<button class="more" type="button" data-i="${i}"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${hidden} more</button>` : ''}</div>
    </div>`);
    labels.push('2004 / ' + c.name);
  });
  const N = scenes.length;

  /* ---------------- FULL LIST PANEL ---------------- */
  const panel = $('#panel'), veil = $('#veil');
  let opener = null;
  function openPanel(cat, btn) {
    opener = btn;
    $('#panel-title').textContent = cat.name;
    $('#panel-count').textContent = 'count ' + cat.count + ' · ' + cat.items.length + ' fields';
    $('#panel-body').innerHTML = '<ul class="plist">' + cat.items.map(itemHTML).join('') + '</ul>';
    panel.scrollTop = 0;
    panel.classList.add('open'); veil.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('locked');
    $('#panel-close').focus();
  }
  function closePanel() {
    panel.classList.remove('open'); veil.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('locked');
    if (opener) opener.focus();
  }
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('.more');
    if (b) openPanel(cats[+b.dataset.i], b);
  });
  $('#panel-close').addEventListener('click', closePanel);
  veil.addEventListener('click', closePanel);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

  /* ---------------- LAYOUT (ring, origins, scroll length) ---------------- */
  let PER = 0, H0 = innerHeight, lastW = innerWidth;
  const spacer = $('#spacer');
  const per = () => PER;

  function layout() {
    PER = H0 * (MOBILE ? 0.8 : 0.9);
    spacer.style.height = ((N - 1) * PER + H0) + 'px';

    const W = innerWidth, H = innerHeight;
    const origin = (i, x, y) => { scenes[i].style.transformOrigin = `${x}px ${y}px`; };
    const centerOf = (el) => [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2];

    // fly INTO the highlighted folder on the way out of each scene
    [[2, HIT_DECADE, '.decades'], [3, HIT_RANGE, '.ranges']].forEach(([si, hi, sel]) => {
      const el = scenes[si].querySelectorAll(sel + ' .node')[hi];
      const [x, y] = centerOf(el); origin(si, x, y);
    });

    if (!MOBILE) {
      const cx = W / 2, cy = H / 2 + 8, R = Math.min(W * 0.34, H * 0.37);
      const c = yearScene.querySelector('.yr-center');
      c.style.left = cx + 'px'; c.style.top = cy + 'px';
      const pts = [];
      yearScene.querySelectorAll('.rnode').forEach((n, i) => {
        const a = -Math.PI / 2 + i * Math.PI / 6;
        const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        n.style.left = x + 'px'; n.style.top = y + 'px'; pts.push([x, y]);
      });
      const svg = yearScene.querySelector('.web');
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      let g = '';
      pts.forEach(([x, y]) => { g += `<line class="spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; });
      [1, 0.68, 0.36].forEach((k) => {
        g += `<polygon points="${pts.map(([x, y]) => `${cx + (x - cx) * k},${cy + (y - cy) * k}`).join(' ')}"/>`;
      });
      svg.innerHTML = g;
      origin(4, pts[0][0], pts[0][1]);
    } else {
      const first = yearScene.querySelector('.rnode');
      const r = first.getBoundingClientRect(); // scene is at rest scale 1 only when live; fall back to center
      origin(4, W / 2, H * 0.55);
    }
  }

  /* ---------------- RAIL / HUD ---------------- */
  const rail = $('#rail'), readout = $('#readout'), hint = $('#hint');
  const ticks = scenes.map((_, i) => {
    const b = document.createElement('button');
    b.className = 'tick' + (i < 5 ? ' major' : '');
    b.type = 'button';
    b.setAttribute('aria-label', labels[i]);
    b.addEventListener('click', () => scrollTo({ top: i * per(), behavior: reduce ? 'auto' : 'smooth' }));
    rail.appendChild(b);
    return b;
  });
  let curIdx = -1;
  function setCurrent(i) {
    if (i === curIdx) return;
    curIdx = i;
    ticks.forEach((t, k) => t.classList.toggle('on', k === i));
    readout.innerHTML = `Step <b>${Math.min(i, 4) + 1}</b> of 5 · ${labels[i]}`;
  }

  /* ---------------- CANVAS: tunnel rings + stars ---------------- */
  const cv = $('#fx'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function sizeCanvas() {
    if (W === innerWidth && H === innerHeight) return;
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const rnd = () => Math.random() * 2 - 1;
  const stars = Array.from({ length: MOBILE ? 70 : 150 }, () => ({ x: rnd(), y: rnd(), z: Math.random() * 0.95 + 0.05 }));
  let ox = 0, oy = 0, tox = 0, toy = 0;
  if (!MOBILE) addEventListener('mousemove', (e) => { tox = -(e.clientX / innerWidth - 0.5) * 34; toy = -(e.clientY / innerHeight - 0.5) * 22; });

  function drawFx(v, dt) {
    ctx.clearRect(0, 0, W, H);
    ox += (tox - ox) * 0.05; oy += (toy - oy) * 0.05;
    const cx = W / 2 + ox, cy = H / 2 + oy;

    // octagon gates, spaced half a scene apart, rushing toward the viewer
    const RING = 14, gap = 0.5, span = RING * gap, base = Math.min(W, H) * 0.2;
    ctx.lineWidth = 1; ctx.lineCap = 'butt';
    for (let j = 0; j < RING; j++) {
      const z = (((j * gap - cam) % span) + span) % span;
      const a = smooth(0, 0.7, z) * (1 - smooth(4.2, span, z)) * 0.34;
      if (a < 0.012) continue;
      const r = base / (0.12 + z * 0.5), rot = j * 0.21 + cam * 0.08;
      ctx.strokeStyle = `rgba(169,191,209,${a.toFixed(3)})`;
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) {
        const ang = rot + k * Math.PI / 4, px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }

    // stars stretch into streaks while you move
    const k = Math.min(W, H) * 0.28;
    const dz = v * dt * 0.35 + (reduce ? 0 : 0.0005);
    ctx.lineCap = 'round';
    for (const s of stars) {
      const pz = s.z; s.z -= dz;
      if (s.z < 0.03) { s.z = 1; s.x = rnd(); s.y = rnd(); continue; }
      if (s.z > 1) { s.z = 0.05 + Math.random() * 0.1; s.x = rnd(); s.y = rnd(); continue; }
      const x = cx + s.x / s.z * k, y = cy + s.y / s.z * k;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) { s.z = 1; s.x = rnd(); s.y = rnd(); continue; }
      const px = cx + s.x / pz * k, py = cy + s.y / pz * k;
      ctx.strokeStyle = `rgba(200,220,235,${(0.12 + (1 - s.z) * 0.75).toFixed(3)})`;
      ctx.lineWidth = 1 + (1 - s.z) * 0.8;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x + 0.01, y); ctx.stroke();
    }
  }

  /* ---------------- SCROLL -> CAMERA ---------------- */
  // Each scene gets a "dwell" so it stays readable, then you travel to the next.
  const ease = (fr) => { const t = clamp((fr - 0.25) / 0.5, 0, 1); return t * t * t * (t * (6 * t - 15) + 10); };
  function readTarget() {
    const f = clamp(scrollY / per(), 0, N - 1);
    const i = Math.min(N - 1, Math.floor(f));
    return i >= N - 1 ? N - 1 : i + ease(f - i);
  }

  let cam = reduce ? 0 : -0.9;   // start "in warp" and arrive at the raw data
  let vs = 0, lastT = performance.now();

  function updateScenes() {
    for (let i = 0; i < N; i++) {
      const el = scenes[i], d = i - cam;
      let sc, op;
      if (d >= 0) { sc = 1 / (1 + d * 1.6); op = clamp(1 - d * 1.2, 0, 1); }
      else { const t = -d; sc = 1 + t * 8; op = clamp(1 - t * 2.2, 0, 1); }
      if (op < 0.01) { if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'; el.classList.remove('live'); continue; }
      el.style.visibility = 'visible';
      el.style.opacity = op.toFixed(3);
      el.style.transform = `scale(${sc.toFixed(4)})`;
      el.classList.toggle('live', Math.abs(d) < 0.3);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000)); lastT = now;
    const target = readTarget(), prev = cam;
    cam = reduce ? target : cam + (target - cam) * (1 - Math.exp(-dt * 6));
    if (Math.abs(target - cam) < 0.0004) cam = target;
    vs = vs * 0.8 + ((cam - prev) / dt) * 0.2;
    updateScenes();
    setCurrent(clamp(Math.round(cam), 0, N - 1));
    hint.classList.toggle('gone', cam > 0.25);
    drawFx(vs, dt);
    requestAnimationFrame(frame);
  }

  /* ---------------- INIT ---------------- */
  function onResize() {
    sizeCanvas();
    if (innerWidth !== lastW || Math.abs(innerHeight - H0) > 160) {
      const f = scrollY / (PER || 1);
      lastW = innerWidth; H0 = innerHeight;
      layout();
      scrollTo(0, f * PER);
    } else if (!MOBILE) { layout(); }
  }
  addEventListener('resize', onResize);
  sizeCanvas(); layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  requestAnimationFrame(frame);
})();
