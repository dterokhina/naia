// Home page: the "dive" chart. Values come from the Naia app's starting model (28-day cycle, 5-day period).
(function () {
  var PH = {
    men:  { name: "Period",      c: "#E88C9C", focus: 2, energy: 1, mood: 3 },
    fol:  { name: "Follicular",  c: "#7DD3A8", focus: 5, energy: 4, mood: 4 },
    ovu:  { name: "Ovulation",   c: "#E9C47E", focus: 4, energy: 5, mood: 4 },
    lut:  { name: "Luteal",      c: "#A99CEB", focus: 3, energy: 3, mood: 3 },
    late: { name: "Late luteal", c: "#A99CEB", focus: 2, energy: 2, mood: 2 }
  };
  var SEGS = [["men", 1, 5], ["fol", 6, 12], ["ovu", 13, 15], ["lut", 16, 22], ["late", 23, 28]];
  function phaseOf(d) { if (d <= 5) return "men"; if (d < 13) return "fol"; if (d <= 15) return "ovu"; if (d >= 23) return "late"; return "lut"; }
  var N = 28, raw = [], depth = [];
  for (var d = 1; d <= N; d++) { var p = PH[phaseOf(d)]; raw.push(5 - (p.focus + p.energy + p.mood) / 3); }
  // gentle smoothing so the dive reads as one path (wraps round: day 28 flows into day 1)
  var tmp = raw.slice();
  for (var pass = 0; pass < 2; pass++) { depth = []; for (var i = 0; i < N; i++) depth.push((tmp[(i + N - 1) % N] + 2 * tmp[i] + tmp[(i + 1) % N]) / 4); tmp = depth; }

  var NS = "http://www.w3.org/2000/svg";
  function el(n, a, parent) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; }
  function dots(v, c) { var s = ""; for (var i = 1; i <= 5; i++) s += '<i style="background:' + (i <= v ? c : "rgba(255,255,255,.12)") + '"></i>'; return '<span class="tdots" aria-hidden="true">' + s + "</span>"; }

  function draw() {
    var fig = document.getElementById("dive");
    if (!fig) return;
    var box = fig.querySelector(".divebox"), svg = fig.querySelector("svg"), tip = fig.querySelector(".divetip");
    var W = Math.max(280, box.clientWidth), small = W < 560;
    var H = small ? 300 : 360;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.style.height = H + "px";
    // keep <title>/<desc>, clear the rest
    Array.prototype.slice.call(svg.childNodes).forEach(function (n) { if (n.nodeName !== "title" && n.nodeName !== "desc") svg.removeChild(n); });

    var L = small ? 8 : 120, R = small ? 8 : 16, band = 10, top = small ? 54 : 46, bottom = H - 34;
    var x = function (day) { return L + (day - 0.5) * (W - L - R) / N; };
    var y = function (v) { return top + 18 + (v / 3.6) * (bottom - top - 18); };
    var cw = (W - L - R) / N;

    var defs = el("defs", {}, svg);
    var g1 = el("linearGradient", { id: "sea", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: "0", "stop-color": "#5FB4D6", "stop-opacity": ".28" }, g1);
    el("stop", { offset: "1", "stop-color": "#5FB4D6", "stop-opacity": "0" }, g1);
    var g2 = el("linearGradient", { id: "path", x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    SEGS.forEach(function (s) {
      el("stop", { offset: ((s[1] - 1) / N).toFixed(3), "stop-color": PH[s[0]].c }, g2);
      el("stop", { offset: (s[2] / N).toFixed(3), "stop-color": PH[s[0]].c }, g2);
    });

    // phase band with direct labels (two rows on phones so nothing collides)
    SEGS.forEach(function (s, i) {
      var x0 = L + (s[1] - 1) * cw, x1 = L + s[2] * cw;
      el("rect", { x: x0 + 1, y: top - band - 8, width: x1 - x0 - 2, height: band, rx: 4, fill: PH[s[0]].c, opacity: s[0] === "late" ? .55 : .9 }, svg);
      var ty = small ? (i % 2 ? top - band - 30 : top - band - 14) : top - band - 14;
      var t = el("text", { x: (x0 + x1) / 2, y: ty, "text-anchor": "middle", class: "dl" }, svg);
      t.textContent = PH[s[0]].name;
    });

    // surface line + depth labels
    el("line", { x1: L, x2: W - R, y1: top + 18, y2: top + 18, class: "surf" }, svg);
    if (!small) {
      var a = el("text", { x: L - 14, y: top + 22, "text-anchor": "end", class: "ax" }, svg); a.textContent = "Easier days";
      var b = el("text", { x: L - 14, y: bottom - 4, "text-anchor": "end", class: "ax" }, svg); b.textContent = "Harder days";
    }

    // the dive path (smooth curve through daily points)
    var pts = depth.map(function (v, i) { return [x(i + 1), y(v)]; });
    // monotone cubic curve: smooth, no overshoot or wobble
    var n = pts.length, dx = [], m = [], t = [];
    for (var i = 0; i < n - 1; i++) { dx.push(pts[i + 1][0] - pts[i][0]); m.push((pts[i + 1][1] - pts[i][1]) / dx[i]); }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (var i3 = 1; i3 < n - 1; i3++) t[i3] = (m[i3 - 1] * m[i3] <= 0) ? 0 : (m[i3 - 1] + m[i3]) / 2;
    for (var i4 = 0; i4 < n - 1; i4++) {
      if (m[i4] === 0) { t[i4] = 0; t[i4 + 1] = 0; continue; }
      var a1 = t[i4] / m[i4], b1 = t[i4 + 1] / m[i4], h = a1 * a1 + b1 * b1;
      if (h > 9) { var k = 3 / Math.sqrt(h); t[i4] = k * a1 * m[i4]; t[i4 + 1] = k * b1 * m[i4]; }
    }
    var dpath = "M" + pts[0][0] + "," + pts[0][1];
    for (var i5 = 0; i5 < n - 1; i5++) {
      var h3 = dx[i5] / 3;
      dpath += " C" + (pts[i5][0] + h3) + "," + (pts[i5][1] + t[i5] * h3) + " " + (pts[i5 + 1][0] - h3) + "," + (pts[i5 + 1][1] - t[i5 + 1] * h3) + " " + pts[i5 + 1][0] + "," + pts[i5 + 1][1];
    }
    el("path", { d: dpath + " L" + pts[N - 1][0] + "," + (top + 18) + " L" + pts[0][0] + "," + (top + 18) + " Z", fill: "url(#sea)" }, svg);
    el("path", { d: dpath, fill: "none", stroke: "url(#path)", "stroke-width": 3, "stroke-linecap": "round", pathLength: 2000 }, svg);

    // day ticks
    [1, 7, 14, 21, 28].forEach(function (dd) {
      var anc = dd === 1 ? "start" : dd === 28 ? "end" : "middle";
      var tx = dd === 1 ? L : dd === 28 ? W - R : x(dd);
      var t = el("text", { x: tx, y: H - 10, "text-anchor": anc, class: "ax" }, svg); t.textContent = (small && dd !== 1 ? "" : "Day ") + dd;
    });
    if (small) {
      var a2 = el("text", { x: L, y: top + 34, class: "ax" }, svg); a2.textContent = "↑ easier";
      var b2 = el("text", { x: L, y: bottom - 4, class: "ax" }, svg); b2.textContent = "↓ harder";
    }

    // hover layer
    var guide = el("line", { y1: top + 18, y2: bottom, class: "guide" }, svg);
    var ring = el("circle", { r: 8, class: "ring" }, svg);
    var hits = el("g", {}, svg);
    for (var dd2 = 1; dd2 <= N; dd2++) {
      el("rect", { x: L + (dd2 - 1) * cw, y: top - band - 10, width: cw, height: bottom - top + band + 12, fill: "transparent", "data-day": dd2 }, hits);
    }
    function show(day) {
      day = Math.max(1, Math.min(N, day)); cur = day;
      var k = phaseOf(day), p = PH[k], px = x(day), py = y(depth[day - 1]);
      guide.setAttribute("x1", px); guide.setAttribute("x2", px);
      ring.setAttribute("cx", px); ring.setAttribute("cy", py); ring.setAttribute("fill", p.c);
      tip.innerHTML = '<b>Day ' + day + '</b> <span class="tp" style="--c:' + p.c + '">' + p.name + '</span>' +
        '<span class="trow">Focus ' + dots(p.focus, p.c) + '</span><span class="trow">Energy ' + dots(p.energy, p.c) + '</span><span class="trow">Mood ' + dots(p.mood, p.c) + '</span>';
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var lx = px + 14; if (lx + tw > W - 4) lx = px - 14 - tw; if (lx < 4) lx = 4;
      var ly = py - th / 2; if (ly < top + 20) ly = top + 20; if (ly + th > bottom) ly = bottom - th;
      tip.style.transform = "translate(" + Math.round(lx) + "px," + Math.round(ly) + "px)";
      svg.setAttribute("aria-valuenow", day);
      svg.setAttribute("aria-valuetext", "Day " + day + ", " + p.name + ". Focus " + p.focus + ", energy " + p.energy + ", mood " + p.mood + " out of 5.");
    }
    var cur = fig._day || 9;
    hits.addEventListener("pointermove", function (e) { var r = e.target.closest("rect"); if (r) { fig._day = +r.dataset.day; show(fig._day); } });
    hits.addEventListener("click", function (e) { var r = e.target.closest("rect"); if (r) { fig._day = +r.dataset.day; show(fig._day); } });
    svg.setAttribute("tabindex", "0");
    svg.setAttribute("role", "slider"); svg.setAttribute("aria-valuemin", 1); svg.setAttribute("aria-valuemax", 28);
    svg.setAttribute("aria-label", "Cycle day. Use left and right arrow keys.");
    svg.onkeydown = function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { fig._day = cur + 1; show(fig._day); e.preventDefault(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { fig._day = cur - 1; show(fig._day); e.preventDefault(); }
    };
    show(cur);
  }
  var t;
  document.addEventListener("DOMContentLoaded", draw);
  addEventListener("resize", function () { clearTimeout(t); t = setTimeout(draw, 120); });
})();
// goal chips, like the app's first question
(function () {
  var OUT = [
    "Naia marks your Good days, so the big stuff lands when you’ve got the most in the tank.",
    "See the harder days coming instead of getting blindsided by them.",
    "Log how your meds feel and spot the weeks they seem weaker. Handy to show your prescriber.",
    "Log your cycle and check-ins. No plans, no pressure."
  ];
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".goal");
    if (!b) return;
    document.querySelectorAll(".goal").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    var o = document.querySelector(".goalout");
    if (o) o.textContent = OUT[+b.dataset.g];
  });
})();
