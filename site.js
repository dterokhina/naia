// Naia website: text size + motion settings (like the app) and a quiet sea.
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  function get(k, d) { try { return localStorage.getItem("naia." + k) || d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem("naia." + k, v); } catch (e) {} }


  function apply() {
    var size = get("size", "normal");
    var motion = get("motion", (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ? "still" : "moving");
    root.dataset.size = size;
    root.classList.remove("moving", "still", "nosea");
    root.classList.add(motion === "off" ? "nosea" : motion);
    document.querySelectorAll("[data-set]").forEach(function (b) {
      var k = b.dataset.set, v = b.dataset.val;
      b.setAttribute("aria-pressed", String((k === "size" ? size : motion) === v));
    });
  }

  // Sea: a few bubbles and fish. Positions are fixed so "Still" looks the same each time.
  function sea() {
    var s = document.querySelector(".sea");
    if (!s) return;
    var B = [[8,6,22,0,70],[17,10,26,-6,35],[29,5,19,-12,82],[46,8,30,-3,55],[63,12,24,-15,25],[74,6,21,-9,66],[86,9,28,-1,44],[93,5,18,-18,15]];
    B.forEach(function (b) {
      var e = document.createElement("i");
      e.className = "bubble";
      e.style.cssText = "left:" + b[0] + "%;width:" + b[1] + "px;height:" + b[1] + "px;--t:" + b[2] + "s;--d:" + b[3] + "s;--y:" + b[4] + "%";
      s.appendChild(e);
    });
    var F = [[22,90,-10,12,18],[58,120,-50,48,12],[78,140,-95,70,14]];
    F.forEach(function (f) {
      var e = document.createElement("span");
      e.className = "fish";
      e.style.cssText = "top:" + f[0] + "%;--t:" + f[1] + "s;--d:" + f[2] + "s;--x:" + f[3] + "%;width:" + f[4] * 2 + "px";
      e.innerHTML = '<svg viewBox="0 0 40 16" fill="currentColor" aria-hidden="true" style="transform:scaleX(-1)"><path d="M2 8c6-7 18-7 26 0-8 7-20 7-26 0zM28 8l10-6v12z"/></svg>';
      s.appendChild(e);
    });
  }
  // scroll: progress line, depth gauge, deeper sea
  var tick = false;
  function onScroll() {
    tick = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    root.style.setProperty("--p", p.toFixed(4));
    root.style.setProperty("--deep", Math.min(1, p * 1.15).toFixed(3));
    var n = document.getElementById("depthNum");
    if (n) n.textContent = Math.round(p * 1000) + " m";
  }
  addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  function reveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-set]");
    if (b) { set(b.dataset.set, b.dataset.val); apply(); return; }
    var t = e.target.closest("#settingsBtn");
    var p = document.getElementById("settings");
    if (t && p) { var open = p.hidden; p.hidden = !open; t.setAttribute("aria-expanded", String(open)); return; }
    if (p && !p.hidden && !e.target.closest("#settings")) { p.hidden = true; document.getElementById("settingsBtn").setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", function (e) {
    var p = document.getElementById("settings");
    if (e.key === "Escape" && p && !p.hidden) { p.hidden = true; var t = document.getElementById("settingsBtn"); t.setAttribute("aria-expanded", "false"); t.focus(); }
  });

  apply();
  document.addEventListener("DOMContentLoaded", function () { sea(); apply(); reveal(); onScroll(); });
})();
// store buttons: the app isn't live yet, so tapping explains that and offers a launch email
document.addEventListener("click", function (e) {
  var b = e.target.closest(".store");
  var pops = document.querySelectorAll(".storepop");
  if (!b) { if (!e.target.closest(".storepop")) pops.forEach(function (p) { p.hidden = true; }); return; }
  var wrap = b.closest(".stores"), pop = wrap && wrap.nextElementSibling;
  if (!pop || !pop.classList.contains("storepop")) return;
  var same = !pop.hidden && pop.dataset.for === b.dataset.store;
  pops.forEach(function (p) { p.hidden = true; });
  if (same) return;
  pop.dataset.for = b.dataset.store;
  pop.querySelector(".sp-t").textContent = "Naia isn’t on " + (b.dataset.store === "App Store" ? "the App Store" : "Google Play") + " yet.";
  pop.hidden = false;
  pop.classList.remove("pop-in"); void pop.offsetWidth; pop.classList.add("pop-in");
});
