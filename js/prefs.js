/* ==========================================================================
   Медкорпус Конохи — пользовательские настройки
   Тема, цвет, язык, чтение, плотность, контраст и эффекты.
   Загружается в <head> до отрисовки, чтобы не было мигания темы.
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "medcorpus-prefs";
  var THEME_KEY = "medcorpus-theme";

  var FONT_MIN = 14;
  var FONT_MAX = 20;

  var DEFAULTS = {
    theme: "dark",
    accent: "green",
    customColor: "#388e3c",
    lang: "ru",
    font: 16,
    motion: "full",
    density: "comfortable",
    contrast: "normal",
    links: "normal",
    effects: "full"
  };

  var LANGS = ["ru", "en", "uk", "be"];
  var FONTS = [14, 15, 16, 17, 18, 19, 20];

  var CUSTOM_LABEL = {
    ru: "Свой цвет",
    en: "Custom color",
    uk: "Свій колір",
    be: "Свой колер"
  };

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

  function clampFont(value) {
    var number = Math.round(Number(value));
    if (isNaN(number)) return DEFAULTS.font;
    return Math.max(FONT_MIN, Math.min(FONT_MAX, number));
  }

  function isHex(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || ""));
  }

  function readStored() {
    var prefs = clone(DEFAULTS);
    var raw = null;
    var parsed = null;

    try {
      raw = localStorage.getItem(KEY);
      if (raw) {
        parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system") prefs.theme = parsed.theme;
          if (parsed.accent === "custom" || ACCENTS[parsed.accent]) prefs.accent = parsed.accent;
          if (isHex(parsed.customColor)) prefs.customColor = String(parsed.customColor).toLowerCase();
          if (LANGS.indexOf(parsed.lang) !== -1) prefs.lang = parsed.lang;
          if (parsed.font != null && !isNaN(Number(parsed.font))) prefs.font = clampFont(parsed.font);
          if (parsed.motion === "reduce" || parsed.motion === "full") prefs.motion = parsed.motion;
          if (parsed.density === "comfortable" || parsed.density === "compact") prefs.density = parsed.density;
          if (parsed.contrast === "normal" || parsed.contrast === "high") prefs.contrast = parsed.contrast;
          if (parsed.links === "normal" || parsed.links === "underline") prefs.links = parsed.links;
          if (parsed.effects === "full" || parsed.effects === "reduced") prefs.effects = parsed.effects;
        }
      }
    } catch (e) { /* приватный режим или повреждённые данные */ }

    try {
      var legacy = localStorage.getItem(THEME_KEY);
      if ((!parsed || !parsed.theme) && (legacy === "light" || legacy === "dark")) {
        prefs.theme = legacy;
      }
    } catch (e) { /* игнорируем */ }

    return prefs;
  }

  var prefs = readStored();
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function resolveTheme() {
    if (prefs.theme === "system") return media && !media.matches ? "light" : "dark";
    return prefs.theme === "light" ? "light" : "dark";
  }

  /* ---------- Свой цвет: генерируем оттенки из одного HEX ---------- */
  function hexToRgb(hex) {
    var clean = String(hex || "").replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(clean)) clean = "388e3c";
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    ];
  }

  function rgbToHex(rgb) {
    return "#" + rgb.map(function (part) {
      var value = Math.max(0, Math.min(255, Math.round(part))).toString(16);
      return value.length === 1 ? "0" + value : value;
    }).join("");
  }

  function mix(hex, target, amount) {
    var rgb = hexToRgb(hex);
    return rgbToHex(rgb.map(function (part, index) {
      return part + (target[index] - part) * amount;
    }));
  }

  function luminance(hex) {
    var rgb = hexToRgb(hex).map(function (part) {
      var channel = part / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function onColor(hex) {
    return luminance(hex) > 0.55 ? "#111111" : "#ffffff";
  }

  function rgba(hex, alpha) {
    var rgb = hexToRgb(hex);
    return "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + alpha + ")";
  }

  function customValues(hex, theme) {
    var color = isHex(hex) ? hex.toLowerCase() : DEFAULTS.customColor;
    if (theme === "light") {
      var dark = mix(color, [0, 0, 0], 0.2);
      return {
        accent: dark,
        accent2: mix(color, [0, 0, 0], 0.06),
        soft: rgba(color, 0.12),
        on: onColor(dark),
        mid: color
      };
    }
    return {
      accent: color,
      accent2: mix(color, [255, 255, 255], 0.28),
      soft: rgba(color, 0.18),
      on: onColor(color),
      mid: mix(color, [255, 255, 255], 0.45)
    };
  }

  function accentValues(id, theme, customColor) {
    if (id === "custom") return customValues(customColor || DEFAULTS.customColor, theme);
    var item = ACCENTS[id] || ACCENTS.green;
    return theme === "light" ? item.light : item.dark;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
      localStorage.setItem(THEME_KEY, resolveTheme());
    } catch (e) { /* приватный режим */ }
  }

  function apply() {
    var root = document.documentElement;
    var theme = resolveTheme();
    var colors = accentValues(prefs.accent, theme, prefs.customColor);

    root.dataset.theme = theme;
    root.dataset.themeMode = prefs.theme;
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
    root.classList.toggle("prefs-text-small", prefs.font <= 14);
    root.classList.toggle("prefs-text-large", prefs.font >= 19);
    root.classList.toggle("prefs-compact", prefs.density === "compact");
    root.classList.toggle("prefs-contrast", prefs.contrast === "high");
    root.classList.toggle("prefs-underline", prefs.links === "underline");
    root.classList.toggle("prefs-reduced-effects", prefs.effects === "reduced");

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
    if (patch.theme === "light" || patch.theme === "dark" || patch.theme === "system") prefs.theme = patch.theme;
    if (patch.accent === "custom" || ACCENTS[patch.accent]) prefs.accent = patch.accent;
    if (isHex(patch.customColor)) prefs.customColor = String(patch.customColor).toLowerCase();
    if (patch.lang && LANGS.indexOf(patch.lang) !== -1) prefs.lang = patch.lang;
    if (patch.font != null && !isNaN(Number(patch.font))) prefs.font = clampFont(patch.font);
    if (patch.motion === "reduce" || patch.motion === "full") prefs.motion = patch.motion;
    if (patch.density === "comfortable" || patch.density === "compact") prefs.density = patch.density;
    if (patch.contrast === "normal" || patch.contrast === "high") prefs.contrast = patch.contrast;
    if (patch.links === "normal" || patch.links === "underline") prefs.links = patch.links;
    if (patch.effects === "full" || patch.effects === "reduced") prefs.effects = patch.effects;
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

  function syncSystemTheme() {
    if (prefs.theme !== "system") return;
    apply();
    save();
    emit();
  }

  if (media) {
    if (typeof media.addEventListener === "function") media.addEventListener("change", syncSystemTheme);
    else if (typeof media.addListener === "function") media.addListener(syncSystemTheme);
  }

  apply();

  window.MCPrefs = {
    KEY: KEY,
    DEFAULTS: DEFAULTS,
    LANGS: LANGS.slice(),
    FONTS: FONTS.slice(),
    FONT_MIN: FONT_MIN,
    FONT_MAX: FONT_MAX,
    ACCENTS: ACCENTS,
    current: function () { return clone(prefs); },
    get: function (name) { return prefs[name]; },
    set: set,
    reset: reset,
    apply: apply,
    reduceMotion: reduceMotion,
    resolvedTheme: resolveTheme,
    isHex: isHex,
    accentLabel: function (id, lang) {
      if (id === "custom") return CUSTOM_LABEL[lang] || CUSTOM_LABEL.ru;
      var item = ACCENTS[id] || ACCENTS.green;
      return item[lang] || item.ru;
    },
    fontStep: function (direction) {
      return set({ font: clampFont(prefs.font + direction) }).font;
    }
  };
})();
