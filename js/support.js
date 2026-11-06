/* ==========================================================================
   Медкорпус Конохи — техническая поддержка
   Гость может написать команде, указав контакт. Участник корпуса видит
   ответы в личном кабинете.
   ========================================================================== */
(function () {
  "use strict";

  if (!window.MCStore || !window.MCAuth) return;

  var t = window.MCI18n ? MCI18n.t : function (key) { return key; };
  var dialog = null;
  var trigger = null;
  var content = null;
  var lastFocus = null;

  var TOPICS = [
    ["question", "support.topicQuestion"],
    ["bug", "support.topicBug"],
    ["account", "support.topicAccount"],
    ["other", "support.topicOther"]
  ];

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function keyed(tag, key, className) {
    var node = el(tag, className);
    node.setAttribute("data-i18n", key);
    node.textContent = t(key);
    return node;
  }

  function iconSupport() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"></circle>' +
      '<circle cx="12" cy="12" r="3.4"></circle>' +
      '<path d="M5.7 5.7l3.9 3.9M14.4 14.4l3.9 3.9M18.3 5.7l-3.9 3.9M9.6 14.4l-3.9 3.9"></path>' +
    "</svg>";
  }

  function buildTrigger() {
    var actions = document.querySelector(".header-actions");
    if (!actions || document.getElementById("supportToggle")) return;

    trigger = el("button", "icon-btn support-toggle");
    trigger.id = "supportToggle";
    trigger.type = "button";
    trigger.setAttribute("aria-label", t("support.open"));
    trigger.setAttribute("title", t("support.open"));
    trigger.setAttribute("data-i18n-aria", "support.open");
    trigger.setAttribute("data-i18n-title", "support.open");
    trigger.innerHTML = iconSupport();
    trigger.addEventListener("click", function () { open(); });

    var before = document.getElementById("settingsToggle") ||
      document.getElementById("themeToggle") ||
      document.getElementById("navToggle");
    actions.insertBefore(trigger, before || null);
  }

  function buildDialog() {
    dialog = el("dialog", "modal support-modal");
    dialog.id = "supportDialog";
    dialog.setAttribute("aria-labelledby", "supportTitle");

    var head = el("div", "modal__head support-modal__head");
    var titles = el("div");
    var h2 = keyed("h2", "support.title");
    h2.id = "supportTitle";
    var sub = keyed("p", "support.subtitle", "support-modal__sub");
    titles.appendChild(h2);
    titles.appendChild(sub);

    var close = el("button", "icon-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", t("support.close"));
    close.setAttribute("data-i18n-aria", "support.close");
    close.addEventListener("click", function () { dialog.close(); });
    head.appendChild(titles);
    head.appendChild(close);

    content = el("div", "modal__body support-body");
    dialog.appendChild(head);
    dialog.appendChild(content);

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    document.body.appendChild(dialog);
  }

  function identityBlock(user) {
    if (user) {
      var box = el("div", "support-identity");
      box.innerHTML = MCAuth.avatar(user, "avatar--sm") +
        '<div class="support-identity__text">' +
          '<b>' + MCAuth.esc(MCStore.displayName(user)) + "</b>" +
          "<span>" + MCAuth.esc(user.email) + "</span>" +
        "</div>";
      var note = keyed("span", "support.loggedIn", "support-identity__note");
      box.appendChild(note);
      MCAuth.bindAvatars(box);
      return box;
    }

    var guest = el("div", "support-fields");
    var nameField = el("label", "field");
    nameField.appendChild(keyed("span", "support.name", "field__label"));
    var nameInput = el("input");
    nameInput.type = "text";
    nameInput.name = "supportName";
    nameInput.maxLength = 60;
    nameInput.placeholder = t("support.namePlaceholder");
    nameInput.setAttribute("data-i18n-placeholder", "support.namePlaceholder");
    nameField.appendChild(nameInput);

    var contactField = el("label", "field");
    contactField.appendChild(keyed("span", "support.contact", "field__label"));
    var contactInput = el("input");
    contactInput.type = "text";
    contactInput.name = "supportContact";
    contactInput.maxLength = 120;
    contactInput.placeholder = t("support.contactPlaceholder");
    contactInput.setAttribute("data-i18n-placeholder", "support.contactPlaceholder");
    contactField.appendChild(contactInput);
    contactField.appendChild(keyed("span", "support.contactHint", "field__hint"));

    guest.appendChild(nameField);
    guest.appendChild(contactField);
    return guest;
  }

  function renderForm(user) {
    if (!content) return;
    content.innerHTML = "";

    var form = el("form", "form support-form");
    form.noValidate = true;

    form.appendChild(identityBlock(user));

    var error = el("p", "form-error");
    error.hidden = true;
    form.appendChild(error);

    var topicField = el("label", "field");
    topicField.appendChild(keyed("span", "support.topic", "field__label"));
    var select = el("select");
    select.name = "supportTopic";
    TOPICS.forEach(function (pair) {
      var option = el("option", null, t(pair[1]));
      option.value = pair[0];
      option.setAttribute("data-i18n", pair[1]);
      select.appendChild(option);
    });
    topicField.appendChild(select);
    form.appendChild(topicField);

    var messageField = el("label", "field");
    messageField.appendChild(keyed("span", "support.message", "field__label"));
    var textarea = el("textarea");
    textarea.name = "supportMessage";
    textarea.maxLength = 4000;
    textarea.required = true;
    textarea.placeholder = t("support.messagePlaceholder");
    textarea.setAttribute("data-i18n-placeholder", "support.messagePlaceholder");
    messageField.appendChild(textarea);

    var meta = el("div", "support-meta");
    meta.appendChild(keyed("span", "support.messageHint", "field__hint"));
    var counter = el("span", "support-counter", "0 / 4000");
    meta.appendChild(counter);
    messageField.appendChild(meta);
    form.appendChild(messageField);

    textarea.addEventListener("input", function () {
      counter.textContent = textarea.value.length + " / 4000";
    });

    var actions = el("div", "support-actions");
    var submit = keyed("button", "support.send", "btn btn--primary btn--small");
    submit.type = "submit";
    var cancel = keyed("button", "common.cancel", "btn btn--ghost btn--small");
    cancel.type = "button";
    cancel.addEventListener("click", function () { dialog.close(); });
    actions.appendChild(submit);
    actions.appendChild(cancel);
    form.appendChild(actions);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      error.hidden = true;

      var message = textarea.value.trim();
      var contact = "";
      var name = "";

      if (!user) {
        var contactInput = form.elements.supportContact;
        var nameInput = form.elements.supportName;
        contact = contactInput.value.trim();
        name = nameInput.value.trim();
        if (contact.length < 3) {
          error.textContent = t("support.errorContact");
          error.hidden = false;
          contactInput.focus();
          return;
        }
      }

      if (message.length < 10) {
        error.textContent = t("support.errorShort");
        error.hidden = false;
        textarea.focus();
        return;
      }

      submit.disabled = true;
      submit.textContent = t("support.sending");

      try {
        var ticket = MCStore.addSupport({
          userId: user ? user.id : "",
          name: name || (user ? MCStore.displayName(user) : t("support.guest")),
          contact: contact || (user ? user.email : ""),
          topic: select.value,
          message: message
        });
        renderSuccess(ticket, !!user);
        if (MCAuth.toast) MCAuth.toast(t("support.sent"), "ok");
      } catch (err) {
        error.textContent = err.message || t("support.errorFailed");
        error.hidden = false;
        submit.disabled = false;
        submit.textContent = t("support.send");
      }
    });

    content.appendChild(form);
    if (window.MCI18n) MCI18n.apply(form);

    setTimeout(function () {
      textarea.focus({ preventScroll: true });
    }, 40);
  }

  function renderSuccess(ticket, loggedIn) {
    if (!content) return;
    content.innerHTML = "";

    var box = el("div", "support-success");
    box.appendChild(el("div", "support-success__icon", "✓"));
    box.appendChild(keyed("h3", "support.successTitle"));
    box.appendChild(keyed("p", "support.successText"));
    if (loggedIn) box.appendChild(keyed("p", "support.successAccount", "support-success__note"));
    box.appendChild(el("code", "support-success__id", ticket.id));

    var actions = el("div", "support-actions");
    var close = keyed("button", "common.close", "btn btn--primary btn--small");
    close.type = "button";
    close.addEventListener("click", function () { dialog.close(); });
    actions.appendChild(close);
    if (loggedIn) {
      var link = keyed("a", "support.goAccount", "btn btn--ghost btn--small");
      link.href = "account.html";
      actions.appendChild(link);
    }
    box.appendChild(actions);

    content.appendChild(box);
    if (window.MCI18n) MCI18n.apply(box);
  }

  function open(topic) {
    if (!dialog) return;
    var user = MCStore.sessionUser();
    lastFocus = document.activeElement;
    renderForm(user);
    if (topic && content) {
      var select = content.querySelector('select[name="supportTopic"]');
      if (select) select.value = topic;
    }
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function init() {
    buildTrigger();
    buildDialog();
    if (window.MCI18n) MCI18n.apply();
  }

  document.addEventListener("click", function (event) {
    var opener = event.target.closest ? event.target.closest("[data-support-open]") : null;
    if (!opener) return;
    event.preventDefault();
    open(opener.getAttribute("data-support-topic") || "");
  });

  document.addEventListener("mcprefs:change", function () {
    if (trigger) {
      trigger.setAttribute("aria-label", t("support.open"));
      trigger.setAttribute("title", t("support.open"));
    }
    if (dialog && dialog.open) renderForm(MCStore.sessionUser());
    if (window.MCI18n) MCI18n.apply();
  });

  document.addEventListener("close", function (event) {
    if (dialog && event.target === dialog && lastFocus && lastFocus.isConnected) {
      lastFocus.focus({ preventScroll: true });
    }
  }, true);

  window.MCSupport = {
    open: open,
    el: el,
    keyed: keyed
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
