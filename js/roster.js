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

  var TECH_SEATS = 10;
  var techniqueBlocks = [
    {
      position: "Скальпель",
      list: document.getElementById("scalpelList"),
      count: document.getElementById("scalpelCount")
    },
    {
      position: "Тайдзюцу",
      list: document.getElementById("taijutsuList"),
      count: document.getElementById("taijutsuCount")
    }
  ];

  if (!leadHost || !listHost || !window.MCStore || !window.MCAuth) return;

  var esc = MCAuth.esc;

  function isAdmin() {
    var user = MCStore.sessionUser();
    return !!user && user.role === "developer";
  }

  function statusHTML(user) {
    var active = user.status === "active";
    return '<span class="status ' + (active ? "status--active" : "status--inactive") + '">' +
      (active ? "Актив" : "Не актив") + "</span>";
  }

  function techStatusHTML(user) {
    var active = user.status === "active";
    return '<span class="status ' + (active ? "status--active" : "status--vacation") + '">' +
      (active ? "Активен" : "В отпуске") + "</span>";
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

  function techRow(user, position) {
    var needle = MCStore.normalizePosition(position);
    var others = user.positions.filter(function (item) {
      return MCStore.normalizePosition(item) !== needle;
    });
    var role = others.length
      ? others.map(function (item) { return '<span class="tag tag--green">' + esc(item) + "</span>"; }).join("")
      : '<span class="tag">' + esc(user.rank) + "</span>";

    return '<button class="roster-row" type="button" data-user="' + esc(user.id) + '" aria-haspopup="dialog">' +
      '<span class="roster-row__person">' +
        MCAuth.avatar(user, "avatar--sm") +
        "<span>" +
          '<span class="roster-row__name">' + esc(MCStore.displayName(user)) + "</span>" +
          '<span class="roster-row__rank">' + esc(user.clan) + "</span>" +
        "</span>" +
      "</span>" +
      '<span class="roster-row__positions">' + role + "</span>" +
      techStatusHTML(user) +
      "</button>";
  }

  function vacantRow() {
    return '<div class="roster-row roster-row--vacant" aria-hidden="true">' +
      '<span class="roster-row__person">' +
        '<span class="roster-row__name roster-row__name--vacant">Свободное место</span>' +
      "</span>" +
      '<span class="roster-row__positions"></span>' +
      '<span class="status status--vacant">Вакансия</span>' +
      "</div>";
  }

  function renderTechniques(all) {
    techniqueBlocks.forEach(function (block) {
      if (!block.list) return;

      var members = all.filter(function (user) {
        return MCStore.hasPosition(user, block.position);
      });
      var seats = Math.max(TECH_SEATS, members.length);

      block.list.innerHTML = members.map(function (user) {
        return techRow(user, block.position);
      }).join("") + new Array(seats - members.length + 1).join(vacantRow());

      if (block.count) {
        block.count.textContent = members.length + " / " + seats + " мест";
      }
      MCAuth.bindAvatars(block.list);
    });
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

    MCAuth.bindAvatars(leadHost);
    MCAuth.bindAvatars(listHost);
    renderTechniques(all);
  }

  /* ---------- Редактирование (только разработчик) ---------- */
  function adminActions(user) {
    if (!isAdmin()) return "";
    return '<div class="member-admin">' +
      '<div class="member-admin__head">' +
        '<span class="eyebrow">Разработчик</span>' +
        "<p>Должности, выговоры и данные аккаунта можно изменить прямо здесь.</p>" +
      "</div>" +
      '<div class="member-admin__actions">' +
        '<button class="btn btn--primary btn--small" type="button" data-member-edit="' + esc(user.id) + '">Редактировать</button>' +
        '<button class="btn btn--ghost btn--small btn--danger" type="button" data-member-delete="' + esc(user.id) + '">Удалить аккаунт</button>' +
      "</div>" +
    "</div>";
  }

  function option(value, label, selected) {
    return '<option value="' + esc(value) + '"' + (value === selected ? " selected" : "") + ">" + esc(label) + "</option>";
  }

  function showDialog() {
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function openMember(user) {
    if (!dialog || !dialogBody || !user) return;

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
          adminActions(user) +
          '<div style="text-align:right"><button class="btn btn--ghost btn--small" type="button" data-close>Закрыть</button></div>' +
        "</div>" +
      "</div>";

    showDialog();
    MCAuth.bindAvatars(dialogBody);
  }

  function openEdit(user) {
    if (!dialog || !dialogBody || !user || !isAdmin()) return;

    dialogBody.innerHTML =
      '<div class="member-card">' +
        '<div class="member-card__head">' +
          MCAuth.avatar(user, "avatar--xl") +
          "<div>" +
            '<h2 class="member-card__name" id="memberDialogTitle">Редактирование</h2>' +
            '<p class="member-card__role">' + esc(MCStore.displayName(user)) + "</p>" +
          "</div>" +
          '<button class="icon-close" type="button" data-close aria-label="Закрыть карточку">×</button>' +
        "</div>" +
        '<div class="member-card__body">' +
          '<form class="form" id="memberEditForm" data-id="' + esc(user.id) + '" novalidate>' +
            '<p class="form-error" hidden></p>' +
            '<div class="field-grid">' +
              '<div class="field"><label for="memberFirstName">Имя</label>' +
                '<input id="memberFirstName" name="firstName" type="text" maxlength="40" required value="' + esc(user.firstName) + '"></div>' +
              '<div class="field"><label for="memberLastName">Фамилия</label>' +
                '<input id="memberLastName" name="lastName" type="text" maxlength="60" value="' + esc(user.lastName) + '"></div>' +
            "</div>" +
            '<div class="field-grid">' +
              '<div class="field"><label for="memberEmail">Email</label>' +
                '<input id="memberEmail" name="email" type="email" required value="' + esc(user.email) + '"></div>' +
              '<div class="field"><label for="memberDiscord">Discord</label>' +
                '<input id="memberDiscord" name="discord" type="text" maxlength="60" value="' + esc(user.discord) + '"></div>' +
            "</div>" +
            '<div class="field-grid">' +
              '<div class="field"><label for="memberRank">Ранг</label><select id="memberRank" name="rank">' +
                MCStore.RANKS.map(function (rank) { return option(rank, rank, user.rank); }).join("") +
              "</select></div>" +
              '<div class="field"><label for="memberClan">Клан</label><select id="memberClan" name="clan">' +
                MCStore.CLANS.map(function (clan) { return option(clan, clan, user.clan); }).join("") +
              "</select></div>" +
            "</div>" +
            '<div class="field-grid">' +
              '<div class="field"><label for="memberStatus">Статус</label><select id="memberStatus" name="status">' +
                option("active", "Актив", user.status) +
                option("inactive", "Не актив", user.status) +
              "</select></div>" +
              '<div class="field"><label for="memberPassword">Новый пароль</label>' +
                '<input id="memberPassword" name="password" type="password" autocomplete="new-password" placeholder="Оставьте пустым, чтобы не менять"></div>' +
            "</div>" +
            '<div class="field">' +
              '<span class="field__label">Должности</span>' +
              MCAuth.positionsEditor(user.positions) +
            "</div>" +
            '<div class="field">' +
              '<span class="field__label">Выговоры</span>' +
              MCAuth.warningsEditor(user) +
            "</div>" +
            '<div class="field"><label for="memberPhoto">Фото (URL)</label>' +
              '<input id="memberPhoto" name="photo" type="text" value="' + esc(user.photo) + '" placeholder="https://imgur.com/… или https://…/photo.jpg">' +
              '<p class="field__hint">Необязательно. Подходит прямая ссылка на картинку или ссылка на пост/галерею Imgur. Без фото показывается монограмма.</p>' +
              '<div class="photo-preview" id="memberPhotoPreview" hidden></div></div>' +
            '<div class="member-form__actions">' +
              '<button class="btn btn--ghost btn--small" type="button" data-member-cancel>Отмена</button>' +
              '<button class="btn btn--primary btn--small" type="submit">Сохранить</button>' +
            "</div>" +
          "</form>" +
        "</div>" +
      "</div>";

    showDialog();
    MCAuth.bindAvatars(dialogBody);
    MCAuth.syncPositions(dialogBody);
    MCAuth.syncWarnings(dialogBody);
    MCAuth.bindPhotoPreview(
      dialogBody.querySelector("#memberPhoto"),
      dialogBody.querySelector("#memberPhotoPreview")
    );

    setTimeout(function () {
      var first = dialogBody.querySelector("#memberFirstName");
      if (first) first.focus({ preventScroll: true });
    }, 30);
  }

  /* ---------- Сохранение формы ---------- */
  if (dialogBody) {
    dialogBody.addEventListener("submit", async function (event) {
      var form = event.target.closest ? event.target.closest("#memberEditForm") : null;
      if (!form) return;
      event.preventDefault();

      var errorBox = form.querySelector(".form-error");
      var fail = function (message) {
        if (!errorBox) return;
        errorBox.textContent = message;
        errorBox.hidden = false;
      };
      if (errorBox) errorBox.hidden = true;

      var el = form.elements;
      var id = form.dataset.id;
      var firstName = el.firstName.value.trim();
      var lastName = el.lastName.value.trim();
      var email = el.email.value.trim().toLowerCase();
      var password = el.password.value;
      var positions = Array.prototype.map.call(
        form.querySelectorAll('input[name="position"]:checked'),
        function (input) { return input.value; }
      );

      if (!firstName) { fail("Укажите имя."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fail("Укажите корректный email."); return; }

      var duplicate = MCStore.userByEmail(email);
      if (duplicate && duplicate.id !== id) {
        fail("Пользователь с таким email уже существует.");
        return;
      }
      if (password && password.length < 6) {
        fail("Пароль должен быть не короче 6 символов.");
        return;
      }

      var payload = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        discord: el.discord.value.trim(),
        positions: positions,
        rank: el.rank.value,
        clan: el.clan.value,
        status: el.status.value,
        warnings: {
          oral: [el.oral0.checked, el.oral1.checked, el.oral2.checked],
          written: [el.written0.checked, el.written1.checked]
        }
      };

      var rawPhoto = el.photo.value.trim();
      var photo = "";
      if (rawPhoto) {
        photo = await MCAuth.resolvePhotoUrl(rawPhoto);
        if (!photo) {
          fail("Не удалось найти изображение по ссылке. Укажите прямую ссылку на картинку или ссылку на пост/галерею Imgur.");
          return;
        }
      }
      payload.photo = photo;

      var save = form.querySelector('button[type="submit"]');
      if (save) save.disabled = true;

      try {
        if (password) payload.passHash = await MCAuth.hashPassword(password);
        var updated = MCStore.updateUser(id, payload);
        MCAuth.toast("Данные участника сохранены", "ok");
        openMember(updated);
      } catch (error) {
        fail(error.message || "Не удалось сохранить изменения.");
      } finally {
        if (save) save.disabled = false;
      }
    });
  }

  /* ---------- Действия в карточке ---------- */
  document.addEventListener("click", function (event) {
    var edit = event.target.closest("[data-member-edit]");
    if (edit) {
      var editTarget = MCStore.userById(edit.dataset.memberEdit);
      if (editTarget) openEdit(editTarget);
      return;
    }

    var remove = event.target.closest("[data-member-delete]");
    if (remove) {
      var target = MCStore.userById(remove.dataset.memberDelete);
      if (!target) return;
      if (!window.confirm("Удалить аккаунт «" + MCStore.displayName(target) + "»? Действие нельзя отменить. Рапорта участника тоже будут удалены.")) return;
      try {
        MCStore.deleteUser(target.id);
        if (dialog) dialog.close();
        MCAuth.toast("Аккаунт удалён", "ok");
      } catch (error) {
        MCAuth.toast(error.message || "Не удалось удалить аккаунт.", "error");
      }
      return;
    }

    var cancel = event.target.closest("[data-member-cancel]");
    if (cancel) {
      var editForm = cancel.closest("#memberEditForm");
      var currentUser = editForm ? MCStore.userById(editForm.dataset.id) : null;
      if (currentUser) openMember(currentUser);
      return;
    }

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

  /* Изменения в другой вкладке (например, в панели разработчика) — обновляем состав. */
  window.addEventListener("storage", function (event) {
    if (event.key && event.key.indexOf("medcorpus.db") !== 0) return;
    render();
  });
})();
