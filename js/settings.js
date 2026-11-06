/* ==========================================================================
   Медкорпус Конохи — кнопка и окно настроек
   ========================================================================== */
(function () {
  "use strict";

  if (!window.MCPrefs) return;

  var t = window.MCI18n ? MCI18n.t : function (key) { return key; };
  var dialog = null;
  var trigger = null;

  var ACCENT_ORDER = ["green", "red", "purple", "blue", "cyan", "yellow", "orange", "pink", "black", "gold"];

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function iconGear() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3.2"></circle>' +
      '<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.86a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"></path>' +
    "</svg>";
  }

  function keyed(tag, key, className) {
    var node = el(tag, className);
    node.setAttribute("data-i18n", key);
    node.textContent = t(key);
    return node;
  }

  function buildTrigger() {
    var actions = document.querySelector(".header-actions");
    if (!actions || document.getElementById("settingsToggle")) return;

    trigger = el("button", "icon-btn settings-toggle");
    trigger.id = "settingsToggle";
    trigger.type = "button";
    trigger.setAttribute("aria-label", t("settings.open"));
    trigger.setAttribute("title", t("settings.open"));
    trigger.setAttribute("data-i18n-aria", "settings.open");
    trigger.setAttribute("data-i18n-title", "settings.open");
    trigger.innerHTML = iconGear();
    trigger.addEventListener("click", function () {
      if (!dialog) return;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });

    var before = document.getElementById("themeToggle") || document.getElementById("navToggle");
    actions.insertBefore(trigger, before || null);
  }

  function buildDialog() {
    dialog = el("dialog", "modal settings-modal");
    dialog.id = "settingsDialog";
    dialog.setAttribute("aria-labelledby", "settingsTitle");

    var head = el("div", "modal__head settings-modal__head");
    var titles = el("div");
    var h2 = keyed("h2", "settings.title");
    h2.id = "settingsTitle";
    var sub = keyed("p", "settings.subtitle", "settings-modal__sub");
    titles.appendChild(h2);
    titles.appendChild(sub);

    var close = el("button", "icon-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", t("settings.close"));
    close.setAttribute("data-i18n-aria", "settings.close");
    close.addEventListener("click", function () { dialog.close(); });
    head.appendChild(titles);
    head.appendChild(close);

    var body = el("div", "modal__body settings-body");

    /* Оформление */
    var appearance = el("section", "settings-section");
    appearance.appendChild(keyed("h3", "settings.appearance", "settings-section__title"));
    var modeRow = el("div", "settings-row");
    var modeText = el("div", "settings-row__text");
    modeText.appendChild(keyed("b", "settings.mode"));
    modeText.appendChild(keyed("p", "settings.modeHint"));
    var modeGroup = el("div", "segmented");
    modeGroup.setAttribute("role", "group");
    [["dark", "settings.dark"], ["light", "settings.light"]].forEach(function (pair) {
      var btn = keyed("button", pair[1], "segmented__btn");
      btn.type = "button";
      btn.dataset.mode = pair[0];
      btn.addEventListener("click", function () {
        MCPrefs.set({ theme: pair[0] });
        sync();
      });
      modeGroup.appendChild(btn);
    });
    modeRow.appendChild(modeText);
    modeRow.appendChild(modeGroup);
    appearance.appendChild(modeRow);
    body.appendChild(appearance);

    /* Цвет темы */
    var accentSection = el("section", "settings-section");
    accentSection.appendChild(keyed("h3", "settings.accent", "settings-section__title"));
    accentSection.appendChild(keyed("p", "settings.accentHint", "settings-section__hint"));
    var grid = el("div", "theme-grid");
    grid.id = "themeGrid";
    ACCENT_ORDER.forEach(function (id) {
      var item = MCPrefs.ACCENTS[id];
      var btn = el("button", "theme-swatch");
      btn.type = "button";
      btn.dataset.accent = id;
      btn.style.setProperty("--swatch-a", item.dark.accent);
      btn.style.setProperty("--swatch-b", item.dark.accent2);
      btn.style.setProperty("--swatch-c", item.light.accent);
      btn.style.setProperty("--swatch-d", item.light.accent2);
      var dot = el("span", "theme-swatch__dot");
      var label = el("span", "theme-swatch__label");
      btn.appendChild(dot);
      btn.appendChild(label);
      btn.addEventListener("click", function () {
        MCPrefs.set({ accent: id });
        sync();
      });
      grid.appendChild(btn);
    });
    accentSection.appendChild(grid);
    body.appendChild(accentSection);

    /* Язык */
    var langSection = el("section", "settings-section");
    langSection.appendChild(keyed("h3", "settings.language", "settings-section__title"));
    langSection.appendChild(keyed("p", "settings.languageHint", "settings-section__hint"));
    var langGrid = el("div", "lang-grid");
    [
      ["ru", "Русский"],
      ["en", "English"],
      ["uk", "Українська"],
      ["be", "Беларуская"]
    ].forEach(function (pair) {
      var btn = el("button", "lang-btn");
      btn.type = "button";
      btn.dataset.lang = pair[0];
      btn.setAttribute("lang", pair[0]);
      btn.innerHTML = '<span class="lang-btn__code">' + pair[0].toUpperCase() + '</span><span class="lang-btn__name">' + pair[1] + "</span>";
      btn.addEventListener("click", function () {
        if (window.MCI18n) MCI18n.setLang(pair[0]);
        else MCPrefs.set({ lang: pair[0] });
        sync();
      });
      langGrid.appendChild(btn);
    });
    langSection.appendChild(langGrid);
    body.appendChild(langSection);

    /* Чтение и доступность */
    var reading = el("section", "settings-section");
    reading.appendChild(keyed("h3", "settings.reading", "settings-section__title"));

    var textRow = el("div", "settings-row");
    textRow.appendChild(keyed("b", "settings.textSize", "settings-row__label"));
    var fontGroup = el("div", "segmented");
    fontGroup.setAttribute("role", "group");
    [
      [15, "settings.small"],
      [16, "settings.medium"],
      [18, "settings.large"]
    ].forEach(function (pair) {
      var btn = keyed("button", pair[1], "segmented__btn");
      btn.type = "button";
      btn.dataset.font = String(pair[0]);
      btn.addEventListener("click", function () {
        MCPrefs.set({ font: pair[0] });
        sync();
      });
      fontGroup.appendChild(btn);
    });
    textRow.appendChild(fontGroup);
    reading.appendChild(textRow);

    var check = el("label", "settings-check");
    var box = el("input");
    box.type = "checkbox";
    box.id = "prefReduceMotion";
    var checkText = el("span", "settings-check__text");
    checkText.appendChild(keyed("b", "settings.reduceMotion"));
    checkText.appendChild(keyed("span", "settings.reduceMotionHint", "settings-check__hint"));
    box.addEventListener("change", function () {
      MCPrefs.set({ motion: box.checked ? "reduce" : "full" });
      sync();
    });
    check.appendChild(box);
    check.appendChild(checkText);
    reading.appendChild(check);
    body.appendChild(reading);

    /* Поддержка */
    var help = el("section", "settings-section settings-section--support");
    help.appendChild(keyed("h3", "support.settingsTitle", "settings-section__title"));
    help.appendChild(keyed("p", "support.settingsHint", "settings-section__hint"));
    var supportBtn = keyed("button", "support.settingsButton", "btn btn--primary btn--small");
    supportBtn.type = "button";
    supportBtn.addEventListener("click", function () {
      if (dialog) dialog.close();
      if (window.MCSupport) window.MCSupport.open();
    });
    help.appendChild(supportBtn);
    body.appendChild(help);

    var foot = el("div", "settings-footer");
    var reset = keyed("button", "settings.reset", "btn btn--ghost btn--small settings-reset");
    reset.type = "button";
    reset.addEventListener("click", function () {
      MCPrefs.reset();
      if (window.MCI18n) MCI18n.apply();
      sync();
      if (window.MCAuth && MCAuth.toast) MCAuth.toast(t("settings.resetDone"), "ok");
    });
    foot.appendChild(reset);
    foot.appendChild(keyed("span", "settings.saved", "settings-footer__note"));
    body.appendChild(foot);

    dialog.appendChild(head);
    dialog.appendChild(body);

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    document.body.appendChild(dialog);
  }

  function sync() {
    if (!dialog) return;
    var prefs = MCPrefs.current();
    var lang = prefs.lang;

    dialog.querySelectorAll("[data-mode]").forEach(function (btn) {
      var active = btn.dataset.mode === prefs.theme;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    dialog.querySelectorAll("[data-accent]").forEach(function (btn) {
      var active = btn.dataset.accent === prefs.accent;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      var label = btn.querySelector(".theme-swatch__label");
      if (label) label.textContent = MCPrefs.accentLabel(btn.dataset.accent, lang);
    });

    dialog.querySelectorAll("[data-lang]").forEach(function (btn) {
      var active = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    dialog.querySelectorAll("[data-font]").forEach(function (btn) {
      var active = Number(btn.dataset.font) === Number(prefs.font);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var box = dialog.querySelector("#prefReduceMotion");
    if (box) box.checked = prefs.motion === "reduce";

    if (trigger) {
      trigger.setAttribute("aria-label", t("settings.open"));
      trigger.setAttribute("title", t("settings.open"));
    }
  }

  function init() {
    buildTrigger();
    buildDialog();
    sync();
    if (window.MCI18n) MCI18n.apply();
  }

  document.addEventListener("mcprefs:change", function () {
    sync();
    if (window.MCI18n) MCI18n.apply();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
