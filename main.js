/* d/acc microgrants — shared UI behaviors.
   Each feature is feature-detected and guarded so this one file can run on
   every page without error, doing only what that page needs. */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme (light / dark) ----------
     The initial theme is applied by a tiny inline script in <head> to avoid a
     flash. Here we wire up the toggle buttons and keep them in sync. */
  var toggles = Array.prototype.slice.call(document.querySelectorAll(".theme-toggle"));

  function syncToggles(theme) {
    var isDark = theme === "dark";
    toggles.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    });
  }

  function setTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem("theme", theme); } catch (e) {}
    }
    syncToggles(theme);
  }

  syncToggles(root.getAttribute("data-theme") || "light");

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = (root.getAttribute("data-theme") === "dark") ? "light" : "dark";
      setTheme(next, true);
    });
  });

  // Follow the OS preference until the visitor has made an explicit choice.
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  var onMediaChange = function (e) {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (err) {}
    if (!stored) setTheme(e.matches ? "dark" : "light", false);
  };
  if (media.addEventListener) media.addEventListener("change", onMediaChange);
  else if (media.addListener) media.addListener(onMediaChange);

  /* ---------- Auto-revealing header (home page) ----------
     On the home page the sticky bar stays hidden until the hero is scrolled
     past, so it never competes with the full-bleed hero. */
  var autoBar = document.querySelector(".site-bar--auto");
  var sentinel = document.querySelector("[data-bar-sentinel]");
  if (autoBar) {
    if (sentinel && "IntersectionObserver" in window) {
      var barObserver = new IntersectionObserver(function (entries) {
        autoBar.classList.toggle("is-visible", !entries[0].isIntersecting);
      }, { rootMargin: "0px" });
      barObserver.observe(sentinel);
    } else {
      autoBar.classList.add("is-visible");
    }
  }

  /* ---------- Scroll-reveal ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (reveals.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
      reveals.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ---------- Projects: category scrollspy ---------- */
  var sectionNav = document.querySelector(".section-nav");
  if (sectionNav) {
    var navLinks = Array.prototype.slice.call(sectionNav.querySelectorAll("a"));
    var linkById = {};
    navLinks.forEach(function (a) {
      var id = (a.getAttribute("href") || "").replace(/^#/, "");
      if (id) linkById[id] = a;
    });
    var areas = Array.prototype.slice.call(document.querySelectorAll(".project-area[id]"));
    if (areas.length && "IntersectionObserver" in window) {
      var setActive = function (id) {
        navLinks.forEach(function (l) {
          var on = l === linkById[id];
          l.classList.toggle("is-active", on);
          if (on) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
        // Keep the active chip in view on small screens.
        var active = linkById[id];
        if (active && active.scrollIntoView) {
          active.scrollIntoView({ block: "nearest", inline: "center" });
        }
      };
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      areas.forEach(function (a) { spy.observe(a); });
    }
  }

  /* ---------- Projects: live search filter ---------- */
  var search = document.getElementById("project-search");
  if (search) {
    var groups = Array.prototype.slice.call(document.querySelectorAll(".project-area"));
    var noResults = document.getElementById("no-results");
    var clearBtn = document.getElementById("search-clear");
    var countEl = document.getElementById("result-count");

    var runFilter = function () {
      var q = search.value.trim().toLowerCase();
      var shownTotal = 0;
      groups.forEach(function (group) {
        var cards = Array.prototype.slice.call(group.querySelectorAll(".project-card"));
        var groupShown = 0;
        cards.forEach(function (card) {
          var hit = !q || card.textContent.toLowerCase().indexOf(q) !== -1;
          card.hidden = !hit;
          if (hit) groupShown++;
        });
        group.classList.toggle("is-hidden", q !== "" && groupShown === 0);
        shownTotal += groupShown;
      });
      if (noResults) noResults.hidden = !(q !== "" && shownTotal === 0);
      if (clearBtn) clearBtn.hidden = q === "";
      if (countEl) {
        countEl.textContent = q === ""
          ? ""
          : shownTotal + (shownTotal === 1 ? " match" : " matches");
      }
    };

    search.addEventListener("input", runFilter);
    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { search.value = ""; runFilter(); }
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        search.value = "";
        runFilter();
        search.focus();
      });
    }
  }

  /* ---------- Back-to-top ---------- */
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    var onScroll = function () {
      toTop.classList.toggle("is-visible", window.pageYOffset > 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
