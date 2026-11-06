/* ==========================================================================
   Медкорпус Конохи — пользовательские настройки (тема, цвет, язык, чтение)
   Загружается в <head> до отрисовки, чтобы не было мигания темы.
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "medcorpus-prefs";
  var THEME_KEY = "medcorpus-theme";

  var DEFAULTS = {
    theme: "dark",
    accent: "green",
    lang: "ru",
    font: 16,
    motion: "full"
  };

  var LANGS = ["ru", "en", "uk", "be"];
  var FONTS = [15, 16, 18];

  /* 10 цветовых схем: id -> подписи и значения для тёмной/светлой темы */
  var ACCENTS = {
    green: {
      ru: "Зелёный", en: "Green", uk: "Зелений", be: "Зялёны",
      dark: { accent: "#388e3c", accent2: "#4caf50", soft: "rgba(56, 142, 60, 0.16)", on: "#ffffff", mid: "#66bb6a" },
      light: { accent: "#2e7d32", accent2: "#388e3c", soft: "rgba(46, 125, 50, 0.1)", on: "#ffffff", mid: "#43a047" }
    },
    red: {
      ru: "Красный", en: "Red", uk: "Червоний", be: "Чырвоны",
      dark: { accent: "#c62828", accent2: "#ef5350", soft: "rgba(239, 83, 80, 0.16)", on: "#ffffff", mid: "#ef5350" },
      light: { accent: "#b71c1c", accent2: "#c62828", soft: "rgba(183, 28, 28, 0.1)", on: "#ffffff", mid: "#d32f2f" }
    },
    purple: {
      ru: "Фиолетовый", en: "Purple", uk: "Фіолетовий", be: "Фіялетавы",
      dark: { accent: "#7b1fa2", accent2: "#ab47bc", soft: "rgba(171, 71, 188, 0.16)", on: "#ffffff", mid: "#ba68c8" },
      light: { accent: "#6a1b9a", accent2: "#7b1fa2", soft: "rgba(106, 27, 154, 0.1)", on: "#ffffff", mid: "#8e24aa" }
    },
    blue: {
      ru: "Синий", en: "Blue", uk: "Синій", be: "Сіні",
      dark: { accent: "#1565c0", accent2: "#42a5f5", soft: "rgba(66, 165, 245, 0.16)", on: "#ffffff", mid: "#64b5f6" },
      light: { accent: "#0d47a1", accent2: "#1565c0", soft: "rgba(13, 71, 161, 0.1)", on: "#ffffff", mid: "#1976d2" }
    },
    cyan: {
      ru: "Бирюзовый", en: "Cyan", uk: "Бірюзовий", be: "Бірузовы",
      dark: { accent: "#00838f", accent2: "#26c6da", soft: "rgba(38, 198, 218, 0.16)", on: "#04252a", mid: "#4dd0e1" },
      light: { accent: "#006064", accent2: "#00838f", soft: "rgba(0, 96, 100, 0.1)", on: "#ffffff", mid: "#0097a7" }
    },
    yellow: {
      ru: "Жёлтый", en: "Yellow", uk: "Жовтий", be: "Жоўты",
      dark: { accent: "#f9a825", accent2: "#fdd835", soft: "rgba(253, 216, 53, 0.16)", on: "#241a00", mid: "#ffe066" },
      light: { accent: "#f57f17", accent2: "#f9a825", soft: "rgba(245, 127, 23, 0.12)", on: "#241a00", mid: "#fbc02d" }
    },
    orange: {
      ru: "Оранжевый", en: "Orange", uk: "Помаранчевий", be: "Аранжавы",
      dark: { accent: "#ef6c00", accent2: "#ff9800", soft: "rgba(255, 152, 0, 0.16)", on: "#241400", mid: "#ffb74d" },
      light: { accent: "#e65100", accent2: "#ef6c00", soft: "rgba(230, 81, 0, 0.1)", on: "#ffffff", mid: "#f57c00" }
    },
    pink: {
      ru: "Розовый", en: "Pink", uk: "Рожевий", be: "Ружовы",
      dark: { accent: "#c2185b", accent2: "#ec407a", soft: "rgba(236, 64, 122, 0.16)", on: "#ffffff", mid: "#f06292" },
      light: { accent: "#ad1457", accent2: "#c2185b", soft: "rgba(173, 20, 87, 0.1)", on: "#ffffff", mid: "#d81b60" }
    },
    black: {
      ru: "Чёрный", en: "Black", uk: "Чорний", be: "Чорны",
      dark: { accent: "#cfcfcf", accent2: "#ffffff", soft: "rgba(255, 255, 255, 0.14)", on: "#111111", mid: "#e0e0e0" },
      light: { accent: "#212121", accent2: "#424242", soft: "rgba(33, 33, 33, 0.1)", on: "#ffffff", mid: "#616161" }
    },
    gold: {
      ru: "Золотой", en: "Gold", uk: "Золотий", be: "Залаты",
      dark: { accent: "#b8860b", accent2: "#d4af37", soft: "rgba(212, 175, 55, 0.16)", on: "#1d1600", mid: "#e6c34a" },
      light: { accent: "#8d6e00", accent2: "#a67c00", soft: "rgba(141, 110, 0, 0.1)", on: "#ffffff", mid: "#c9a227" }
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readStored() {
    var prefs = clone(DEFAULTS);
    var raw = null;

    try {
      raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (parsed.theme === "light" || parsed.theme === "dark") prefs.theme = parsed.theme;
          if (ACCENTS[parsed.accent]) prefs.accent = parsed.accent;
          if (LANGS.indexOf(parsed.lang) !== -1) prefs.lang = parsed.lang;
          if (FONTS.indexOf(Number(parsed.font)) !== -1) prefs.font = Number(parsed.font);
          if (parsed.motion === "reduce" || parsed.motion === "full") prefs.motion = parsed.motion;
        }
      }
    } catch (e) { /* приватный режим или повреждённые данные */ }

    try {
      var legacy = localStorage.getItem(THEME_KEY);
      if ((!raw || !JSON.parse(raw).theme) && (legacy === "light" || legacy === "dark")) {
        prefs.theme = legacy;
      }
    } catch (e) { /* игнорируем */ }

    return prefs;
  }

  var prefs = readStored();

  function accentValues(id, theme) {
    var item = ACCENTS[id] || ACCENTS.green;
    return theme === "light" ? item.light : item.dark;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
      localStorage.setItem(THEME_KEY, prefs.theme);
    } catch (e) { /* приватный режим */ }
  }

  function apply() {
    var root = document.documentElement;
    var theme = prefs.theme === "light" ? "light" : "dark";
    var colors = accentValues(prefs.accent, theme);

    root.dataset.theme = theme;
    root.dataset.accent = prefs.accent;
    root.dataset.lang = prefs.lang;
    root.setAttribute("lang", prefs.lang);

    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-2", colors.accent2);
    root.style.setProperty("--accent-soft", colors.soft);
    root.style.setProperty("--on-accent", colors.on);
    root.style.setProperty("--grad-mid", colors.mid);

    root.style.fontSize = prefs.font + "px";
    root.classList.toggle("prefs-reduce-motion", prefs.motion === "reduce");
    root.classList.toggle("prefs-text-small", prefs.font === FONTS[0]);
    root.classList.toggle("prefs-text-large", prefs.font === FONTS[2] || prefs.font === FONTS[3]);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f6f7f6" : "#0a0e13");
  }

  function emit() {
    try {
      document.dispatchEvent(new CustomEvent("mcprefs:change", { detail: clone(prefs) }));
    } catch (e) {
      var event = document.createEvent("CustomEvent");
      event.initCustomEvent("mcprefs:change", false, false, clone(prefs));
      document.dispatchEvent(event);
    }
  }

  function set(patch) {
    if (!patch) return clone(prefs);
    if (patch.theme === "light" || patch.theme === "dark") prefs.theme = patch.theme;
    if (patch.accent && ACCENTS[patch.accent]) prefs.accent = patch.accent;
    if (patch.lang && LANGS.indexOf(patch.lang) !== -1) prefs.lang = patch.lang;
    if (patch.font != null && FONTS.indexOf(Number(patch.font)) !== -1) prefs.font = Number(patch.font);
    if (patch.motion === "reduce" || patch.motion === "full") prefs.motion = patch.motion;
    save();
    apply();
    emit();
    return clone(prefs);
  }

  function reset() {
    prefs = clone(DEFAULTS);
    save();
    apply();
    emit();
    return clone(prefs);
  }

  function reduceMotion() {
    if (prefs.motion === "reduce") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  apply();

  window.MCPrefs = {
    KEY: KEY,
    DEFAULTS: DEFAULTS,
    LANGS: LANGS.slice(),
    FONTS: FONTS.slice(),
    ACCENTS: ACCENTS,
    current: function () { return clone(prefs); },
    get: function (name) { return prefs[name]; },
    set: set,
    reset: reset,
    apply: apply,
    reduceMotion: reduceMotion,
    accentLabel: function (id, lang) {
      var item = ACCENTS[id] || ACCENTS.green;
      return item[lang] || item.ru;
    },
    fontStep: function (direction) {
      var index = FONTS.indexOf(prefs.font);
      if (index === -1) index = 1;
      index = Math.max(0, Math.min(FONTS.length - 1, index + direction));
      return set({ font: FONTS[index] }).font;
    }
  };
})();
