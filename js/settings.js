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

  function optionRow(titleKey, hintKey, name, options) {
    var row = el("div", "settings-row");
    var text = el("div", "settings-row__text");
    text.appendChild(keyed("b", titleKey));
    if (hintKey) text.appendChild(keyed("p", hintKey));
    var group = el("div", "segmented");
    group.setAttribute("role", "group");
    options.forEach(function (pair) {
      var btn = keyed("button", pair[1], "segmented__btn");
      btn.type = "button";
      btn.dataset[name] = pair[0];
      btn.addEventListener("click", function () {
        var patch = {};
        patch[name] = pair[0];
        MCPrefs.set(patch);
        sync();
      });
      group.appendChild(btn);
    });
    row.appendChild(text);
    row.appendChild(group);
    return row;
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
    [["dark", "settings.dark"], ["light", "settings.light"], ["system", "settings.system"]].forEach(function (pair) {
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

    /* Свой цвет */
    var customRow = el("div", "settings-custom");
    customRow.id = "customColorRow";
    var customText = el("div", "settings-custom__text");
    customText.appendChild(keyed("span", "settings.customColor", "settings-custom__label"));
    customText.appendChild(keyed("span", "settings.customColorHint", "settings-custom__hint"));

    var customControls = el("div", "settings-custom__controls");
    var colorInput = el("input", "settings-color");
    colorInput.type = "color";
    colorInput.id = "prefCustomColor";
    var hexInput = el("input", "settings-hex");
    hexInput.type = "text";
    hexInput.id = "prefCustomHex";
    hexInput.maxLength = 7;
    hexInput.spellcheck = false;
    hexInput.setAttribute("aria-label", t("settings.customColor"));
    hexInput.setAttribute("data-i18n-aria", "settings.customColor");
    var applyBtn = keyed("button", "settings.applyColor", "btn btn--ghost btn--small");
    applyBtn.type = "button";
    var colorError = keyed("span", "settings.colorInvalid", "settings-custom__error");
    colorError.hidden = true;

    function applyCustom(value) {
      var hex = String(value || "").trim();
      if (hex.charAt(0) !== "#") hex = "#" + hex;
      if (!MCPrefs.isHex(hex)) {
        colorError.hidden = false;
        return false;
      }
      colorError.hidden = true;
      hex = hex.toLowerCase();
      hexInput.value = hex;
      colorInput.value = hex;
      MCPrefs.set({ accent: "custom", customColor: hex });
      sync();
      return true;
    }

    colorInput.addEventListener("input", function () { applyCustom(colorInput.value); });
    applyBtn.addEventListener("click", function () { applyCustom(hexInput.value); });
    hexInput.addEventListener("change", function () { applyCustom(hexInput.value); });
    hexInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCustom(hexInput.value);
      }
    });

    customControls.appendChild(colorInput);
    customControls.appendChild(hexInput);
    customControls.appendChild(applyBtn);
    customRow.appendChild(customText);
    customRow.appendChild(customControls);
    customRow.appendChild(colorError);
    accentSection.appendChild(customRow);
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

    var textBlock = el("div", "settings-slider");
    var textHead = el("div", "settings-slider__head");
    var textLabels = el("div", "settings-row__text");
    textLabels.appendChild(keyed("b", "settings.textSize"));
    textLabels.appendChild(keyed("p", "settings.textSizeHint"));
    var fontValue = el("output", "settings-slider__value", "16 px");
    fontValue.id = "prefFontValue";
    textHead.appendChild(textLabels);
    textHead.appendChild(fontValue);

    var slider = el("input", "settings-range");
    slider.type = "range";
    slider.id = "prefFont";
    slider.min = String(MCPrefs.FONT_MIN);
    slider.max = String(MCPrefs.FONT_MAX);
    slider.step = "1";
    slider.addEventListener("input", function () {
      MCPrefs.set({ font: slider.value });
      sync();
    });

    textBlock.appendChild(textHead);
    textBlock.appendChild(slider);
    reading.appendChild(textBlock);

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

    /* Интерфейс */
    var ui = el("section", "settings-section");
    ui.appendChild(keyed("h3", "settings.interface", "settings-section__title"));
    ui.appendChild(keyed("p", "settings.interfaceHint", "settings-section__hint"));
    ui.appendChild(optionRow("settings.density", "settings.densityHint", "density", [
      ["comfortable", "settings.comfortable"],
      ["compact", "settings.compact"]
    ]));
    ui.appendChild(optionRow("settings.contrast", "settings.contrastHint", "contrast", [
      ["normal", "settings.contrastNormal"],
      ["high", "settings.contrastHigh"]
    ]));
    ui.appendChild(optionRow("settings.links", "settings.linksHint", "links", [
      ["normal", "settings.linksNormal"],
      ["underline", "settings.linksUnderline"]
    ]));
    ui.appendChild(optionRow("settings.effects", "settings.effectsHint", "effects", [
      ["full", "settings.effectsFull"],
      ["reduced", "settings.effectsReduced"]
    ]));
    body.appendChild(ui);

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

    var customRow = dialog.querySelector("#customColorRow");
    if (customRow) {
      customRow.classList.toggle("is-active", prefs.accent === "custom");
      var colorInput = dialog.querySelector("#prefCustomColor");
      var hexInput = dialog.querySelector("#prefCustomHex");
      if (colorInput) colorInput.value = prefs.customColor;
      if (hexInput) hexInput.value = prefs.customColor;
    }

    var slider = dialog.querySelector("#prefFont");
    if (slider) slider.value = String(prefs.font);
    var fontValue = dialog.querySelector("#prefFontValue");
    if (fontValue) fontValue.textContent = prefs.font + " px";

    ["density", "contrast", "links", "effects"].forEach(function (name) {
      dialog.querySelectorAll("[data-" + name + "]").forEach(function (btn) {
        var active = btn.dataset[name] === prefs[name];
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
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
