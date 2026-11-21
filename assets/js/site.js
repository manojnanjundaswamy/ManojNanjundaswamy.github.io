// Theme switch (remembers the choice on this device) and the playable Untangle Art board.
(function () {
  var root = document.documentElement;
  var KEY = 'mn-theme';
  try { var saved = localStorage.getItem(KEY); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}

  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function paintToggle(btn) {
    var dark = isDark();
    btn.innerHTML = dark ? SUN : MOON;
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme');
    if (btn) {
      paintToggle(btn);
      btn.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
        paintToggle(btn);
      });
    }
    var board = document.getElementById('board');
    if (board && window.WHALE) initBoard(board, window.WHALE);
  });

  // ------------------------------------------------------------ the board
  // Geometry matches the game: stroke 0.17 cell, head 0.5 cell, exit speeding up as it goes.
  var STROKE = 0.17, HEAD = 0.5, NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function exitDistance(t) { return t <= 0 ? 0 : (24 / 1.8) * (Math.exp(1.8 * t) - 1); }

  function slide(a, d, cols, rows) {
    var L = a.p.length - 1, far = cols + rows + L + 4, head = a.p[L];
    var P = a.p.concat([[head[0] + a.d[0] * far, head[1] + a.d[1] * far]]);
    if (d > L + Math.max(cols, rows) + 2) return null;
    function at(s) {
      var acc = 0;
      for (var i = 1; i < P.length; i++) {
        var len = Math.abs(P[i][0] - P[i - 1][0]) + Math.abs(P[i][1] - P[i - 1][1]);
        if (s <= acc + len || i === P.length - 1) {
          var k = len ? (s - acc) / len : 0;
          return { p: [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k], seg: i };
        }
        acc += len;
      }
      return { p: P[P.length - 1], seg: P.length - 1 };
    }
    var a0 = at(d), a1 = at(d + L), pts = [a0.p];
    for (var i = a0.seg; i < a1.seg; i++) pts.push(P[i]);
    pts.push(a1.p);
    var prev = pts.length > 1 ? pts[pts.length - 2] : a0.p;
    var dx = a1.p[0] - prev[0], dy = a1.p[1] - prev[1], n = Math.hypot(dx, dy) || 1;
    dx /= n; dy /= n;
    var tip = [a1.p[0] + 0.5, a1.p[1] + 0.5];
    var stemEnd = [tip[0] - dx * HEAD * 0.3, tip[1] - dy * HEAD * 0.3];
    var body = pts.slice(0, -1).map(function (q) { return [q[0] + 0.5, q[1] + 0.5]; }).concat([stemEnd]);
    return { path: 'M' + body.map(function (q) { return q[0].toFixed(3) + ' ' + q[1].toFixed(3); }).join('L'), tip: tip, dir: [dx, dy] };
  }
  function headPath(tip, dir) {
    var dx = dir[0], dy = dir[1], h = HEAD;
    var f = [tip[0] + dx * h * 0.62, tip[1] + dy * h * 0.62], b = [tip[0] - dx * h * 0.38, tip[1] - dy * h * 0.38];
    return 'M' + f[0] + ' ' + f[1] + 'L' + (b[0] - dy * h * 0.42) + ' ' + (b[1] + dx * h * 0.42) + 'L' + (b[0] + dy * h * 0.42) + ' ' + (b[1] - dx * h * 0.42) + 'Z';
  }

  function initBoard(el, L) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + L.cols + ' ' + L.rows);
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Arrow puzzle. Each arrow slides out the way it points when nothing blocks it.');
    el.insertBefore(svg, el.firstChild);
    var status = document.getElementById('board-status');
    var solveBtn = document.getElementById('board-solve');

    var owner = {}; // "x,y" -> arrow index, for cells still on the board
    var alive = L.arrows.map(function () { return true; });
    L.arrows.forEach(function (a, i) { a.p.forEach(function (c) { owner[c[0] + ',' + c[1]] = i; }); });
    var left = L.arrows.length;

    var groups = L.arrows.map(function (a, i) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'arrow');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', 'Arrow ' + (i + 1));
      var s = slide(a, 0, L.cols, L.rows);
      var hit = document.createElementNS(NS, 'path'); hit.setAttribute('class', 'hit'); hit.setAttribute('d', s.path);
      var body = document.createElementNS(NS, 'path'); body.setAttribute('class', 'body');
      body.setAttribute('d', s.path); body.setAttribute('fill', 'none'); body.setAttribute('stroke', 'var(--board-ink)');
      body.setAttribute('stroke-width', STROKE); body.setAttribute('stroke-linecap', 'round'); body.setAttribute('stroke-linejoin', 'round');
      var tip = document.createElementNS(NS, 'path'); tip.setAttribute('class', 'tip'); tip.setAttribute('d', headPath(s.tip, s.dir)); tip.setAttribute('fill', 'var(--board-ink)');
      g.appendChild(hit); g.appendChild(body); g.appendChild(tip);
      g.addEventListener('click', function () { tap(i); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(i); } });
      svg.appendChild(g);
      return { g: g, body: body, tip: tip };
    });

    function blocker(i) {
      var a = L.arrows[i], h = a.p[a.p.length - 1], x = h[0] + a.d[0], y = h[1] + a.d[1];
      while (x >= 0 && y >= 0 && x < L.cols && y < L.rows) {
        var o = owner[x + ',' + y];
        if (o !== undefined && o !== i) return o;
        x += a.d[0]; y += a.d[1];
      }
      return -1;
    }
    function say(t) { if (status) status.textContent = t; }

    function launch(i) {
      alive[i] = false; left--;
      L.arrows[i].p.forEach(function (c) { delete owner[c[0] + ',' + c[1]]; });
      var G = groups[i];
      G.g.style.pointerEvents = 'none';
      G.g.removeAttribute('tabindex');
      if (reduce) { G.g.remove(); return done(); }
      var t0 = performance.now();
      (function step(now) {
        var s = slide(L.arrows[i], exitDistance((now - t0) / 1000), L.cols, L.rows);
        if (!s) { G.g.remove(); return; }
        G.body.setAttribute('d', s.path); G.tip.setAttribute('d', headPath(s.tip, s.dir));
        requestAnimationFrame(step);
      })(t0);
      done();
    }
    function done() {
      if (left > 0) { say(left + ' arrows left'); return; }
      el.classList.add('solved');
      say("It's a whale. Every level of Untangle Art hides a picture like this.");
      if (solveBtn) solveBtn.hidden = true;
    }
    function tap(i) {
      if (!alive[i]) return;
      var b = blocker(i);
      if (b === -1) return launch(i);
      var G = groups[i];
      G.g.classList.add('blocked');
      setTimeout(function () { G.g.classList.remove('blocked'); }, 420);
      say('Blocked. Something is in its way, so clear that first.');
    }
    if (solveBtn) solveBtn.addEventListener('click', function () {
      solveBtn.disabled = true;
      var queue = L.order.filter(function (i) { return alive[i]; });
      var k = 0;
      (function next() {
        // the game's own solving order, so every launch is legal
        while (k < queue.length && !alive[queue[k]]) k++;
        if (k >= queue.length) return;
        var i = queue[k++];
        if (blocker(i) === -1) launch(i); else { queue.push(i); }
        setTimeout(next, reduce ? 0 : Math.max(28, 120 - k * 3));
      })();
    });

    // the hidden picture, revealed when the board is clear
    var art = document.createElement('div');
    art.className = 'art';
    art.innerHTML = (window.WHALE_ART || '').replace(/fill="#000"/g, 'fill="var(--board-ink)"');
    el.appendChild(art);
  }
})();
