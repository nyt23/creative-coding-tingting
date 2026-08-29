/* Berlin, As Found — scatter the prints, lift one off the paper on click. */

(() => {
  const SPOTS = window.SPOTS || [];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('work-title').textContent = window.WORK_TITLE || '';
  document.getElementById('work-sub').textContent = window.WORK_SUB || '';

  const scatter = document.getElementById('scatter');
  const masthead = document.getElementById('masthead');

  // seeded PRNG — same "random" layout on every reload
  function seedFrom(str){
    let h = 2166136261;
    for (let i = 0; i < str.length; i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(seed){
    return function(){
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function slugify(str){
    return str
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // remember dragged positions per browser
  const POS_KEY = 'berlin-as-found:positions';
  function loadPositions(){
    try { return JSON.parse(localStorage.getItem(POS_KEY)) || {}; }
    catch { return {}; }
  }
  function savePosition(place, left, top){
    try {
      const all = loadPositions();
      all[place] = { left, top };
      localStorage.setItem(POS_KEY, JSON.stringify(all));
    } catch {}
  }
  const savedPositions = loadPositions();

  const TAPE_COLORS = [
    'rgba(255, 214, 110, .42)',   // yellow
    'rgba(255, 158, 184, .4)',    // pink
    'rgba(140, 214, 180, .42)',   // mint
    'rgba(130, 180, 230, .4)',    // sky
    'rgba(216, 170, 120, .38)',   // kraft
    'rgba(200, 165, 230, .4)',    // lavender
    'rgba(255, 170, 120, .42)',   // peach
  ];
  const PIN_COLORS = [
    'radial-gradient(circle at 35% 30%, #ff8a7a, #c23b30 70%)', // red
    'radial-gradient(circle at 35% 30%, #7fe3d1, #1f8f7a 70%)', // teal
    'radial-gradient(circle at 35% 30%, #ffd873, #c98a12 70%)', // mustard
    'radial-gradient(circle at 35% 30%, #9fb3e6, #3a5490 70%)', // navy
    'radial-gradient(circle at 35% 30%, #ffb199, #d9603f 70%)', // coral
  ];

  // hand out colours from a shuffled deck instead of picking independently,
  // so no two tape strips (or pins) land on the same colour
  function shuffled(arr, seed){
    const out = arr.slice();
    const rand = mulberry32(seed);
    for (let i = out.length - 1; i > 0; i--){
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  const tapeDeck = shuffled(TAPE_COLORS, seedFrom('tape' + SPOTS.length));
  const pinDeck = shuffled(PIN_COLORS, seedFrom('pin' + SPOTS.length));
  let tapeDraw = 0, pinDraw = 0;

  const prints = SPOTS.map((spot, i) => {
    const rand = mulberry32(seedFrom(spot.place + i));
    const rot = spot.rot !== undefined ? spot.rot : (rand() * 14 - 7);
    const scale = 1.05 + rand() * .35;

    const el = document.createElement('div');
    el.className = `print size-${spot.size || 'md'}`;
    el.style.setProperty('--rot', rot + 'deg');
    el.style.setProperty('--scale', scale.toFixed(2));
    el.setAttribute('role', 'listitem');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Open ${spot.place}`);

    const frame = document.createElement('div');
    frame.className = 'print-frame';

    const photo = document.createElement('div');
    photo.className = 'print-photo';
    if (spot.src){
      photo.style.backgroundImage = `url('${spot.src}')`;
      if (spot.focus) photo.style.backgroundPosition = spot.focus;
    } else {
      photo.classList.add('is-placeholder');
      photo.textContent = `photos/${slugify(spot.place)}.jpg`;
    }
    frame.appendChild(photo);

    const caption = document.createElement('div');
    caption.className = 'print-caption';
    caption.textContent = spot.place;
    caption.style.setProperty('--cap-rot', (rand() * 5 - 2.5).toFixed(1) + 'deg');
    frame.appendChild(caption);

    if (spot.pin === 'pin'){
      const pin = document.createElement('div');
      pin.className = 'pin-dot';
      pin.style.background = pinDeck[pinDraw++ % pinDeck.length];
      frame.appendChild(pin);
    } else if (spot.pin !== 'none'){
      const tapeColor = tapeDeck[tapeDraw++ % tapeDeck.length];
      const a = document.createElement('div'); a.className = 'tape-strip a';
      const b = document.createElement('div'); b.className = 'tape-strip b';
      a.style.backgroundColor = b.style.backgroundColor = tapeColor;
      a.style.transform = `rotate(${-46 + rand() * 12}deg)`;
      b.style.transform = `rotate(${34 + rand() * 12}deg)`;
      const w = 40 + rand() * 14;
      a.style.width = b.style.width = w + 'px';
      frame.appendChild(a); frame.appendChild(b);
    }

    el.appendChild(frame);
    scatter.appendChild(el);

    // a saved drag position wins over the layout's own choice
    const saved = savedPositions[spot.place];
    const authored = spot.top !== undefined && spot.left !== undefined
      ? { left: spot.left, top: spot.top } : null;
    const record = {
      spot, el, frame, scale,
      manual: !!(saved || authored),
      pos: saved || authored,
    };

    const open = () => openViewer(spot, el, photo, rot);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); }
    });

    // drag to reposition; click with no movement opens the viewer
    let drag = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      drag = {
        id: e.pointerId,
        startX: e.clientX, startY: e.clientY,
        left: el.offsetLeft, top: el.offsetTop,
        moved: false,
      };
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (drag && drag.id === e.pointerId){
        const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
        if (drag.moved){
          el.style.left = (drag.left + dx) + 'px';
          el.style.top = (drag.top + dy) + 'px';
        }
      }
    });
    const endDrag = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      el.classList.remove('dragging');
      const wasDrag = drag.moved;
      drag = null;
      if (wasDrag){
        const left = (el.offsetLeft / scatter.clientWidth) * 100;
        const top = (el.offsetTop / scatter.clientHeight) * 100;
        record.manual = true;
        record.pos = { left, top };
        savePosition(spot.place, left, top);
      } else {
        open();
      }
    };
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    el.style.opacity = '0';
    return record;
  });

  // lay the prints across the paper, sized to fit inside the window
  function layout(){
    const width = scatter.clientWidth;
    const bleed = 12; // room for a rotated print's corners to clear the edge
    const auto = prints.filter(p => !p.manual);

    const fieldHeight = Math.max(200, window.innerHeight - masthead.offsetHeight - 24);
    scatter.style.height = fieldHeight + 'px';

    const gap = 6;

    // grid cell size (for placement only, not sizing) comes from a
    // typical photo, not the single biggest
    const SCALE_MAX = 1.4; // top of the random --scale range below
    const widths = auto.map(p => p.frame.offsetWidth).sort((a, b) => a - b);
    const heights = auto.map(p => p.frame.offsetHeight).sort((a, b) => a - b);
    // rounded to the nearest 10px — sub-pixel measurement differences
    // between browsers shouldn't be able to flip the column count
    const round10 = (n) => Math.round(n / 10) * 10;
    const pick = (arr) => round10(arr[Math.floor(arr.length * 0.7)] || 80);
    const typicalW = pick(widths) * SCALE_MAX;
    const typicalH = pick(heights) * SCALE_MAX;
    const cols = Math.max(1, Math.min(auto.length, Math.floor(round10(width) / (typicalW + gap))));
    const rows = Math.ceil(auto.length / cols);
    const cellW = width / cols, cellH = fieldHeight / rows;

    // shrink everything together if it'd overfill the paper
    const rawArea = prints.reduce((s, p) =>
      s + (p.frame.offsetWidth * p.scale) * (p.frame.offsetHeight * p.scale), 0);
    const fill = rawArea / (width * fieldHeight);
    const densityShrink = fill > 0.78 ? Math.sqrt(0.78 / fill) : 1;

    const placed = []; // boxes already claimed, for collision-avoidance

    // --scale enlarges the frame around its center, so collision checks
    // need the rendered footprint, not the pre-transform box. Shrink is
    // the same single factor for every photo, so their relative sizes
    // (sm/md/lg, the random per-photo scale) stay intact — a photo never
    // gets clamped down to match its neighbor's cell.
    function footprint(frame, scale){
      const w = frame.offsetWidth, h = frame.offsetHeight;
      const s = scale * densityShrink;
      return { w, h, s, expX: (w * s - w) / 2, expY: (h * s - h) / 2 };
    }

    prints.forEach(({ frame, el, scale, manual, pos }) => {
      if (!manual) return;
      el.style.left = pos.left + '%';
      el.style.top = pos.top + '%';
      const { w, h, s, expX, expY } = footprint(frame, scale);
      el.style.setProperty('--scale', s.toFixed(2));
      const left = (pos.left / 100) * width;
      const top = (pos.top / 100) * fieldHeight;
      placed.push({
        left: left - expX - 10, top: top - expY - 10,
        right: left + w + expX + 10, bottom: top + h + expY + 10,
      });
    });

    // shuffle cells so photos don't land in reading order — seeded from
    // the grid shape (small integers), not raw pixel size, so a sub-pixel
    // measurement difference between browsers can't reshuffle everything
    const shuffleSeed = mulberry32(seedFrom('grid' + auto.length + cols + rows));
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c });
    for (let i = cells.length - 1; i > 0; i--){
      const j = Math.floor(shuffleSeed() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // biggest prints get first pick of a cell — ranked by the declared
    // size, not measured pixels, so browsers agree on the order
    const SIZE_RANK = { lg: 3, md: 2, sm: 1 };
    const byArea = auto.slice().sort((a, b) =>
      (SIZE_RANK[b.spot.size] || 2) - (SIZE_RANK[a.spot.size] || 2));

    const settled = [];

    byArea.forEach(({ spot, el, frame, scale }, i) => {
      const rand = mulberry32(seedFrom(spot.place + i + 'xy'));
      const { w, h, s, expX, expY } = footprint(frame, scale);
      el.style.setProperty('--scale', s.toFixed(2));

      const cell = cells[i];
      const cellLeft = cell.c * cellW, cellTop = cell.r * cellH;
      const loX = cellLeft + Math.max(0, expX - (cellW - w) / 2);
      const hiX = cellLeft + Math.max(loX - cellLeft, cellW - w - expX);
      const loY = cellTop + Math.max(0, expY - (cellH - h) / 2);
      const hiY = cellTop + Math.max(loY - cellTop, cellH - h - expY);

      let best = { left: loX, top: loY }, bestOverlap = Infinity;
      for (let attempt = 0; attempt < 40; attempt++){
        const left = loX + rand() * Math.max(0, hiX - loX);
        const top = loY + rand() * Math.max(0, hiY - loY);
        let overlap = 0;
        for (const r of placed){
          const ox = Math.max(0, Math.min(left + w + expX, r.right) - Math.max(left - expX, r.left));
          const oy = Math.max(0, Math.min(top + h + expY, r.bottom) - Math.max(top - expY, r.top));
          overlap += ox * oy;
        }
        if (overlap < bestOverlap){ bestOverlap = overlap; best = { left, top }; }
        if (overlap === 0) break;
      }

      // keep clear of the field's outer edge
      best.left = Math.max(bleed + expX, Math.min(width - w - bleed - expX, best.left));
      best.top = Math.max(expY, Math.min(fieldHeight - h - expY, best.top));

      placed.push({
        left: best.left - expX - 12, top: best.top - expY - 12,
        right: best.left + w + expX + 12, bottom: best.top + h + expY + 12,
      });
      settled.push({ el, left: best.left, top: best.top, w, expX });
    });

    // re-center the cluster as a group if it drifted off to one side
    if (settled.length){
      const clusterLeft = Math.min(...settled.map(p => p.left - p.expX));
      const clusterRight = Math.max(...settled.map(p => p.left + p.w + p.expX));
      const shiftX = (width - (clusterLeft + clusterRight)) / 2;
      settled.forEach(({ el, left, top }) => {
        el.style.left = (left + shiftX) + 'px';
        el.style.top = top + 'px';
      });
    }

    prints.forEach(({ el }) => { el.style.removeProperty('opacity'); });
  }

  requestAnimationFrame(() => requestAnimationFrame(layout));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  let resizeT;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(layout, 150);
  });

  const viewer = document.getElementById('viewer');
  const viewerPhoto = document.getElementById('viewer-photo');
  const viewerPlace = document.getElementById('viewer-place');
  const viewerLine = document.getElementById('viewer-line');
  const viewerMeta = document.getElementById('viewer-meta');
  const viewerScrim = document.getElementById('viewer-scrim');
  const viewerCard = document.getElementById('viewer-card');

  let activeOrigin = null;

  function openViewer(spot, originEl, photoEl, rot){
    activeOrigin = { originEl, photoEl, rot };

    viewerPhoto.style.backgroundImage = photoEl.style.backgroundImage || 'none';
    viewerPhoto.style.backgroundPosition = photoEl.style.backgroundPosition || 'center';
    viewerPhoto.style.backgroundColor = getComputedStyle(photoEl).backgroundColor;
    viewerPlace.textContent = spot.place;
    viewerLine.textContent = spot.line || '';
    viewerMeta.textContent = spot.meta || '';

    // card stays hidden on the paper until the viewer closes
    originEl.classList.add('is-lifted');

    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // opens straight into the frame — no fly-in from the thumbnail
    viewerPhoto.style.transition = 'none';
    viewerPhoto.style.transform = 'none';

    viewerCard.focus();
  }

  function closeViewer(){
    if (!activeOrigin) return;
    const { originEl, photoEl, rot } = activeOrigin;

    // fade the card back in right away, in step with the closing motion —
    // waiting for the flight to land first read as a delay
    originEl.classList.remove('is-lifted');

    if (reduceMotion){
      finishClose();
      return;
    }

    const finalRect = photoEl.getBoundingClientRect();
    const currentRect = viewerPhoto.getBoundingClientRect();

    const dx = finalRect.left - currentRect.left;
    const dy = finalRect.top - currentRect.top;
    const sx = finalRect.width / currentRect.width;
    const sy = finalRect.height / currentRect.height;

    viewer.classList.remove('is-open');
    viewerPhoto.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1)';
    viewerPhoto.style.transform =
      `translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotate(${rot}deg)`;

    const done = () => {
      viewerPhoto.removeEventListener('transitionend', done);
      finishClose();
    };
    viewerPhoto.addEventListener('transitionend', done);
  }

  function finishClose(){
    const { originEl } = activeOrigin;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    viewerPhoto.style.transition = 'none';
    viewerPhoto.style.transform = 'none';
    originEl.focus();
    activeOrigin = null;
  }

  if (!reduceMotion){
    viewerCard.addEventListener('pointermove', (e) => {
      const r = viewerCard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      viewerCard.style.setProperty('--tiltx', (-py * 12).toFixed(2) + 'deg');
      viewerCard.style.setProperty('--tilty', (px * 12).toFixed(2) + 'deg');
    });
    viewerCard.addEventListener('pointerleave', () => {
      viewerCard.style.setProperty('--tiltx', '0deg');
      viewerCard.style.setProperty('--tilty', '0deg');
    });
  }

  viewerScrim.addEventListener('click', closeViewer);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && viewer.classList.contains('is-open')) closeViewer();
  });
})();
