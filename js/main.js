/* ==========================================================================
   Медкорпус Конохи — интерактив
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Тема ---------- */
  var themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem("medcorpus-theme", theme); } catch (e) { /* приватный режим */ }
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему");
      themeToggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    }
  }

  if (themeToggle) {
    applyTheme(root.dataset.theme === "light" ? "light" : "dark");
    themeToggle.addEventListener("click", function () {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  /* ---------- Мобильное меню ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");

  function closeNav() {
    if (!nav || !nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }

  if (nav && navToggle) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      document.body.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1120) closeNav();
    });
  }

  /* ---------- Активный пункт меню ---------- */
  var current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href) return;
    if (href === current || (current === "" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---------- Кнопка «наверх» ---------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("is-visible", window.scrollY > 600);
    }, { passive: true });
  }

  /* ---------- Год в подвале ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Появление блоков ---------- */
  var revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      revealItems.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ---------- Счётчики ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var animateCounter = function (el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      if (reduceMotion) { el.textContent = String(target); return; }
      var started = null;
      var duration = 1100;
      var step = function (timestamp) {
        if (!started) started = timestamp;
        var progress = Math.min((timestamp - started) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = String(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------- Фильтр техник ---------- */
  var filterBar = document.getElementById("techFilters");
  if (filterBar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-cat]"));
    var searchInput = document.getElementById("techSearch");
    var countOutput = document.getElementById("techCount");
    var emptyState = document.getElementById("techEmpty");
    var activeFilter = "all";

    var applyFilters = function () {
      var query = (searchInput ? searchInput.value : "").trim().toLowerCase();
      var visible = 0;

      cards.forEach(function (card) {
        var matchesCategory = activeFilter === "all" || card.dataset.cat === activeFilter;
        var haystack = (card.textContent + " " + (card.dataset.title || "")).toLowerCase();
        var matchesQuery = !query || haystack.indexOf(query) !== -1;
        var show = matchesCategory && matchesQuery;

        card.hidden = !show;
        card.classList.toggle("is-visible", show);
        if (show) visible += 1;
      });

      if (countOutput) {
        countOutput.textContent = "Найдено техник: " + visible + " из " + cards.length;
      }
      if (emptyState) emptyState.hidden = visible !== 0;
    };

    filterBar.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-filter]");
      if (!chip) return;
      activeFilter = chip.dataset.filter;
      filterBar.querySelectorAll("[data-filter]").forEach(function (btn) {
        btn.classList.toggle("is-active", btn === chip);
        btn.setAttribute("aria-pressed", btn === chip ? "true" : "false");
      });
      applyFilters();
    });

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
      searchInput.addEventListener("search", applyFilters);
    }

    applyFilters();
  }

  /* ---------- Аттестация ---------- */
  var quiz = document.getElementById("quizForm");
  if (quiz) {
    var result = document.getElementById("quizResult");
    var scoreEl = document.getElementById("quizScore");
    var titleEl = document.getElementById("quizTitle");
    var messageEl = document.getElementById("quizMessage");
    var restart = document.getElementById("quizRestart");

    var levels = [
      { min: 8, title: "Глава медкорпуса", text: "Безупречно. Вы знаете ирьё-ниндзюцу так, будто сами ассистировали Цунаде. Медкорпус Конохи гордится вами." },
      { min: 6, title: "Ирьё-нин", text: "Отличный результат. Вы уверенно разбираетесь в техниках, ядах и правилах медкорпуса — осталось отточить детали." },
      { min: 4, title: "Полевой санитар", text: "Неплохо для начала. Основы усвоены, но перед настоящей миссией стоит перечитать разделы о печатях и токсикологии." },
      { min: 0, title: "Ученик академии", text: "Есть куда расти. Начните с «Техник» и «Устава» — и возвращайтесь на аттестацию." }
    ];

    var clearMarks = function () {
      quiz.querySelectorAll("label").forEach(function (label) {
        label.classList.remove("is-correct", "is-wrong");
      });
    };

    quiz.addEventListener("submit", function (event) {
      event.preventDefault();
      clearMarks();

      var questions = quiz.querySelectorAll(".q");
      var score = 0;

      questions.forEach(function (question) {
        var checked = question.querySelector("input:checked");
        if (!checked) return;

        var correctValue = question.dataset.correct;
        var labels = question.querySelectorAll("label");

        if (checked.value === correctValue) {
          score += 1;
          checked.closest("label").classList.add("is-correct");
        } else {
          checked.closest("label").classList.add("is-wrong");
          labels.forEach(function (label) {
            var input = label.querySelector("input");
            if (input && input.value === correctValue) label.classList.add("is-correct");
          });
        }
      });

      var level = levels.find(function (item) { return score >= item.min; });

      if (scoreEl) scoreEl.textContent = score + " / " + questions.length;
      if (titleEl) titleEl.textContent = level.title;
      if (messageEl) messageEl.textContent = level.text;
      if (result) {
        result.hidden = false;
        result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });

    if (restart) {
      restart.addEventListener("click", function () {
        quiz.reset();
        clearMarks();
        if (result) result.hidden = true;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  }
})();
