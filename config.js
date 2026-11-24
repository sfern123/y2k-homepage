// config.js: your personal settings. Edit this file, then reload the tab.
// The scheduled task never touches it.
window.HOMEPAGE_CONFIG = {
  name: "friend",                       // shown in the greeting, the main window title and the footer
  courses: [                            // buttons in canvas_links.exe (any links work)
    { label: "COURSE 1", url: "https://canvas.instructure.com" },
    { label: "COURSE 2", url: "https://canvas.instructure.com" },
    { label: "COURSE 3", url: "https://canvas.instructure.com" }
  ]
};

// Applies the settings above to the page. No need to edit below this line.
document.addEventListener("DOMContentLoaded", function () {
  var c = window.HOMEPAGE_CONFIG || {};
  var name = c.name || "friend";
  document.title = "~*~ " + name.toLowerCase() + "'s homepage ~*~";
  document.querySelectorAll("[data-hp-name]").forEach(function (el) {
    el.textContent = el.hasAttribute("data-upper") ? name.toUpperCase() : name.toLowerCase();
  });
  var box = document.getElementById("course-links");
  if (box) (c.courses || []).forEach(function (k) {
    var a = document.createElement("a");
    a.className = "btn"; a.href = k.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = k.label;
    a.style.cssText = "text-decoration:none;min-width:90px;text-align:center";
    box.appendChild(a);
  });
});
