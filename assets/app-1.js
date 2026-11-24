/* LAB ONLY: theme switcher + bubbles. Snapshot copy of dashboard.html; the daily refresh doesn't touch this file. */
(function () {
  const KEY = "sf_home_theme";
  let t; try { t = localStorage.getItem(KEY); } catch (e) {}
  t = "theme-pink98"; /* pink 98 is the house style */
  function apply(name) {
    document.body.classList.remove("theme-aero", "theme-pink98", "theme-lilac98");
    if (name) document.body.classList.add(name);
    document.querySelectorAll("#theme-switch button").forEach(b => b.classList.toggle("on", b.dataset.theme === name));
    try { localStorage.setItem(KEY, name); } catch (e) {}
  }
  document.getElementById("theme-switch").addEventListener("click", e => {
    const b = e.target.closest("button[data-theme]"); if (b) apply(b.dataset.theme);
  });
  apply(t);
  const box = document.getElementById("aero-bubbles");
  for (let i = 0; i < 16; i++) {
    const el = document.createElement("i");
    const size = 18 + Math.random() * 70;
    el.style.width = el.style.height = size.toFixed(0) + "px";
    el.style.left = (Math.random() * 100).toFixed(1) + "%";
    el.style.animationDuration = (14 + Math.random() * 18).toFixed(1) + "s";
    el.style.animationDelay = (-Math.random() * 30).toFixed(1) + "s";
    box.appendChild(el);
  }
})();
