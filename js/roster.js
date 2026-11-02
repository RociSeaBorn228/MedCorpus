/* ==========================================================================
   Медкорпус Конохи — состав на главной
   ========================================================================== */
(function () {
  "use strict";

  var leadHost = document.getElementById("rosterLead");
  var listHost = document.getElementById("rosterList");
  var emptyHost = document.getElementById("rosterEmpty");
  var countHost = document.getElementById("rosterCount");
  var dialog = document.getElementById("memberDialog");
  var dialogBody = document.getElementById("memberDialogBody");

  if (!leadHost || !listHost || !window.MCStore || !window.MCAuth) return;

  var esc = MCAuth.esc;

  function statusHTML(user) {
    var active = user.status === "active";
    return '<span class="status ' + (active ? "status--active" : "status--inactive") + '">' +
      (active ? "Актив" : "Не актив") + "</span>";
  }

  function positionsHTML(user) {
    if (!user.positions.length) {
      return '<span class="tag">Без должности</span>';
    }
    return user.positions.map(function (position) {
      return '<span class="tag tag--green">' + esc(position) + "</span>";
    }).join("");
  }

  function warningsHTML(user) {
    var count = MCStore.warningCount(user);
    return '<span class="warn ' + (count.oral ? "warn--on" : "") + '">Устные ' + count.oral + " / 3</span>" +
      '<span class="warn ' + (count.written ? "warn--on" : "") + '">Письменные ' + count.written + " / 2</span>";
  }

  function leaderCard(user, roleLabel) {
    if (!user) {
      return '<div class="leader-card leader-card--empty">' +
        "<div><strong>" + esc(roleLabel) + "</strong><br>Место вакантно</div>" +
        "</div>";
    }
    return '<button class="leader-card" type="button" data-user="' + esc(user.id) + '" aria-haspopup="dialog">' +
      '<span class="leader-card__top">' +
        MCAuth.avatar(user, "avatar--lg") +
        "<span>" +
          '<span class="leader-card__name">' + esc(MCStore.displayName(user)) + "</span>" +
          '<span class="leader-card__role">' + esc(roleLabel) + "</span>" +
        "</span>" +
      "</span>" +
      '<span class="leader-card__meta">' + statusHTML(user) +
        '<span class="tag tag--gold">' + esc(user.rank) + "</span>" +
        '<span class="tag">' + esc(user.clan) + "</span>" +
      "</span>" +
      '<span class="leader-card__facts">' +
        "<span><span>Discord</span><span>" + esc(user.discord || "не указан") + "</span></span>" +
        "<span><span>Выговоры</span><span>" + MCStore.warningCount(user).total + " из 5</span></span>" +
      "</span>" +
      '<span class="leader-card__open">Открыть карточку</span>' +
      "</button>";
  }

  function row(user) {
    return '<button class="roster-row" type="button" data-user="' + esc(user.id) + '" aria-haspopup="dialog">' +
      '<span class="roster-row__person">' +
        MCAuth.avatar(user, "avatar--sm") +
        "<span>" +
          '<span class="roster-row__name">' + esc(MCStore.displayName(user)) + "</span>" +
          '<span class="roster-row__rank">' + esc(user.rank) + " · " + esc(user.clan) + "</span>" +
        "</span>" +
      "</span>" +
      '<span class="roster-row__positions">' + positionsHTML(user) + "</span>" +
      statusHTML(user) +
      "</button>";
  }

  function render() {
    var all = MCStore.rosterUsers();
    var lead = all.filter(MCStore.isLead)[0] || null;
    var deputy = all.filter(MCStore.isDeputy)[0] || null;
    var rest = all.filter(function (user) {
      return user !== lead && user !== deputy;
    });

    leadHost.innerHTML =
      leaderCard(lead, "Глава Медицинского Корпуса") +
      leaderCard(deputy, "Заместитель Главы");

    listHost.innerHTML = rest.map(row).join("");
    if (emptyHost) emptyHost.hidden = rest.length > 0;
    if (countHost) countHost.textContent = "Участников: " + rest.length;
  }

  function openMember(user) {
    if (!dialog || !dialogBody) return;

    dialogBody.innerHTML =
      '<div class="member-card">' +
        '<div class="member-card__head">' +
          MCAuth.avatar(user, "avatar--xl") +
          "<div>" +
            '<h2 class="member-card__name" id="memberDialogTitle">' + esc(MCStore.displayName(user)) + "</h2>" +
            '<p class="member-card__role">' + esc(user.positions.join(" · ") || "Без должности") + "</p>" +
            '<div class="leader-card__meta" style="margin-top:8px">' + statusHTML(user) + "</div>" +
          "</div>" +
          '<button class="icon-close" type="button" data-close aria-label="Закрыть карточку">×</button>' +
        "</div>" +
        '<div class="member-card__body">' +
          '<dl class="member-facts">' +
            "<dt>Имя и фамилия</dt><dd>" + esc(MCStore.displayName(user)) + "</dd>" +
            "<dt>Ранг</dt><dd>" + esc(user.rank) + "</dd>" +
            "<dt>Должности</dt><dd>" + positionsHTML(user) + "</dd>" +
            "<dt>Клан</dt><dd>" + esc(user.clan) + "</dd>" +
            "<dt>Статус</dt><dd>" + statusHTML(user) + "</dd>" +
            "<dt>Выговоры</dt><dd>" + warningsHTML(user) + "</dd>" +
            "<dt>Discord</dt><dd>" + (user.discord ? esc(user.discord) : '<span class="tag">Не указан</span>') + "</dd>" +
          "</dl>" +
          '<div class="notice">' + (user.status === "active"
            ? "<strong>Боец в строю.</strong> Участник состава медкорпуса, доступен для назначений."
            : "<strong>Не актив.</strong> Участник временно вне состава: отпуск, ранение или иные обстоятельства.") + "</div>" +
          '<div style="text-align:right"><button class="btn btn--ghost btn--small" type="button" data-close>Закрыть</button></div>' +
        "</div>" +
      "</div>";

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    MCAuth.bindAvatars(dialogBody);
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-user]");
    if (trigger) {
      var user = MCStore.userById(trigger.dataset.user);
      if (user) openMember(user);
      return;
    }
    if (event.target.closest("[data-close]") && dialog) {
      dialog.close();
    }
  });

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  }

  render();
  MCStore.subscribe(render);
})();
