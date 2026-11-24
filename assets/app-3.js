/* LAB ONLY: LCD clock + emoji row */
(function () {
  function tick() {
    const d = new Date();
    const el = document.getElementById("lab-clock");
    if (el) el.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toUpperCase();
    const e = document.getElementById("lab-emo");
    if (e) e.textContent = document.body.classList.contains("theme-lilac98") ? "🦋💜☁️🔮⭐" : "💖✨🍓🎀🌸";
  }
  tick(); setInterval(tick, 5000);
  document.getElementById("theme-switch").addEventListener("click", () => setTimeout(tick, 0));
})();
