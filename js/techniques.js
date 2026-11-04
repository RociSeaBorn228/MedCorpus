/* ==========================================================================
   Медкорпус Конохи — карточки техник
   Клик по технике открывает подробную карточку: описание, теги, тип, ранг,
   применение. Работает и для таблиц состава, и для каталога техник.
   ========================================================================== */
(function () {
  "use strict";

  var ROSTER_TECHNIQUES = {
    "Скальпель": {
      name: "Скальпель чакры",
      jp: "チャクラのメス · «Скальпель чакры»",
      kanji: "刀",
      description: "Тончайшее лезвие из чакры позволяет работать с мышцами и сосудами, не вскрывая кожу. Такая операция экономит пациенту недели восстановления — но требует абсолютной точности: одно неверное движение оставляет внутреннюю рану.",
      tags: ["Скальпель", "Ниндзюцу"],
      type: "Лечебная (хирургия)",
      rank: "B",
      application: "Касание"
    },
    "Тайдзюцу": {
      name: "Медицинское тайдзюцу",
      jp: "医療体術 · «Медицинское тайдзюцу»",
      kanji: "体",
      description: "Медик ведёт бой без оружия: точечные удары по нервным узлам, захваты и броски, чтобы обездвижить противника и удержать его до эвакуации. Техника требует точного знания анатомии — здесь важнее расчёт, а не грубая сила.",
      tags: ["Тайдзюцу", "Ниндзюцу"],
      type: "Боевая / лечебная",
      rank: "B",
      application: "Касание"
    }
  };

  var TYPE_LABELS = {
    heal: "Лечебная",
    surgery: "Хирургическая",
    seal: "Печать",
    reanim: "Реанимация",
    poison: "Токсикология",
    support: "Поддержка"
  };

  var APPLICATION_LABELS = {
    heal: "Касание",
    surgery: "Касание",
    reanim: "Касание",
    poison: "Метание / касание",
    support: "Дистанция",
    seal: "Печать"
  };

  var dialog = null;
  var dialogBody = null;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureDialog() {
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.className = "modal tech-dialog";
    dialog.id = "techniqueDialog";
    dialog.setAttribute("aria-labelledby", "techniqueDialogTitle");
    dialog.innerHTML = '<div id="techniqueDialogBody"></div>';
    document.body.appendChild(dialog);
    dialogBody = dialog.querySelector("#techniqueDialogBody");

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) close();
      if (event.target.closest("[data-tech-close]")) close();
    });

    return dialog;
  }

  function open(data) {
    if (!data || !data.name) return;
    ensureDialog();

    var tags = (data.tags || []).map(function (tag) {
      return '<span class="tag tag--green">' + esc(tag) + "</span>";
    }).join("");

    var facts = "";
    if (data.type) facts += "<dt>Тип</dt><dd>" + esc(data.type) + "</dd>";
    if (data.rank) {
      facts += "<dt>Ранг</dt><dd><span class=\"rank rank--" + esc(String(data.rank).toLowerCase()) + "\">" +
        esc(data.rank) + "</span></dd>";
    }
    if (data.application) facts += "<dt>Применение</dt><dd>" + esc(data.application) + "</dd>";

    dialogBody.innerHTML =
      '<div class="tech-card">' +
        '<div class="tech-card__head">' +
          '<div class="kanji">' + esc(data.kanji || "医") + "</div>" +
          "<div>" +
            '<span class="eyebrow">Техника медкорпуса</span>' +
            '<h2 class="tech-card__name" id="techniqueDialogTitle">' + esc(data.name) + "</h2>" +
            (data.jp ? '<p class="tech-card__jp">' + esc(data.jp) + "</p>" : "") +
          "</div>" +
          '<button class="icon-close" type="button" data-tech-close aria-label="Закрыть">×</button>' +
        "</div>" +
        '<div class="tech-card__body">' +
          '<p class="tech-card__desc">' + esc(data.description || "") + "</p>" +
          (tags ? '<div class="tech-card__tags">' + tags + "</div>" : "") +
          (facts
            ? '<dl class="member-facts tech-card__facts">' + facts + "</dl>"
            : "") +
          '<div class="tech-card__foot">' +
            '<button class="btn btn--ghost btn--small" type="button" data-tech-close>Закрыть</button>' +
          "</div>" +
        "</div>" +
      "</div>";

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function close() {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function openKey(key) {
    var data = ROSTER_TECHNIQUES[key];
    if (!data) return false;
    open(data);
    return true;
  }

  function text(node, selector) {
    var el = node.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }

  function fromCard(card) {
    var desc = Array.prototype.map.call(
      card.querySelectorAll("p"),
      function (p) {
        return p.classList.contains("tech__jp") ? "" : p.textContent.trim();
      }
    ).filter(Boolean).join(" ");

    var category = card.getAttribute("data-cat") || "";

    return {
      name: text(card, "h3"),
      jp: text(card, ".tech__jp"),
      kanji: text(card, ".kanji"),
      description: desc,
      tags: Array.prototype.map.call(card.querySelectorAll(".tech__meta .tag"), function (tag) {
        return tag.textContent.trim();
      }),
      type: TYPE_LABELS[category] || "",
      rank: text(card, ".rank"),
      application: APPLICATION_LABELS[category] || ""
    };
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-technique]");
    if (trigger && openKey(trigger.getAttribute("data-technique"))) {
      event.preventDefault();
      return;
    }

    var card = event.target.closest(".tech[data-cat]");
    if (card) {
      event.preventDefault();
      open(fromCard(card));
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var card = event.target.closest(".tech[data-cat]");
    if (!card) return;
    event.preventDefault();
    open(fromCard(card));
  });

  /* Каталог техник: делаем карточки кликабельными и доступными с клавиатуры. */
  document.addEventListener("DOMContentLoaded", function () {
    var cards = document.querySelectorAll(".tech[data-cat]");
    Array.prototype.forEach.call(cards, function (card) {
      card.classList.add("tech--clickable");
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
    });
  });

  window.MCTechniques = {
    open: open,
    openKey: openKey,
    data: ROSTER_TECHNIQUES
  };
})();
