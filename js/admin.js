/* ==========================================================================
   Медкорпус Конохи — панель разработчика
   ========================================================================== */
(function () {
  "use strict";

  if (!window.MCAuth || !window.MCStore) return;

  var root = document.getElementById("adminRoot");
  if (!root) return;

  var current = MCStore.sessionUser();
  if (!current) {
    window.location.replace("login.html?next=admin.html");
    return;
  }

  var esc = MCAuth.esc;

  if (current.role !== "developer") {
    root.innerHTML =
      '<div class="access-denied">' +
        '<span class="eyebrow">Доступ закрыт</span>' +
        "<h1>Нужны права разработчика</h1>" +
        "<p>Этот раздел доступен только аккаунту разработчика. Вы вошли как <strong>" +
          esc(MCStore.displayName(current)) + "</strong>.</p>" +
        '<div class="hero__actions">' +
          '<a class="btn btn--primary btn--small" href="account.html">Личный кабинет</a>' +
          '<a class="btn btn--ghost btn--small" href="index.html">На главную</a>' +
        "</div>" +
      "</div>";
    return;
  }

  var STATUS_TEXT = { new: "Новый", read: "Прочитан", closed: "Закрыт" };
  var STATUS_CLASS = { new: "badge-status--new", read: "badge-status--read", closed: "badge-status--closed" };
  var query = "";

  var dialog = document.getElementById("userDialog");
  var form = document.getElementById("userForm");
  var formError = form ? form.querySelector(".form-error") : null;
  var dialogTitle = document.getElementById("userDialogTitle");
  var saveButton = document.getElementById("userSave");
  var positionBox = document.getElementById("positionChecks");
  var warningBox = document.getElementById("warningEditor");
  var photoInput = document.getElementById("userPhoto");
  var photoPreview = document.getElementById("userPhotoPreview");

  /* ---------- Форма: должности и выговоры ---------- */
  function renderPositions(selected) {
    if (!positionBox) return;
    positionBox.innerHTML = MCAuth.positionsEditor(selected);
    MCAuth.syncPositions(positionBox);
  }

  function renderWarnings(person) {
    if (!warningBox) return;
    warningBox.innerHTML = MCAuth.warningsEditor(person);
    MCAuth.syncWarnings(warningBox);
  }

  function selectedPositions() {
    return Array.prototype.map.call(
      form.querySelectorAll('input[name="position"]:checked'),
      function (input) { return input.value; }
    );
  }

  function refreshPhotoPreview() {
    if (photoInput) photoInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /* ---------- Карточки пользователей ---------- */
  function userCard(person) {
    var count = MCStore.warningCount(person);
    var active = person.status === "active";
    var isDev = person.role === "developer";
    var haystack = [
      MCStore.displayName(person), person.email, person.clan, person.rank,
      person.positions.join(" "), person.discord
    ].join(" ").toLowerCase();

    if (query && haystack.indexOf(query) === -1) return "";

    return '<article class="admin-user">' +
      '<div class="admin-user__head">' +
        MCAuth.avatar(person, "avatar--sm") +
        "<div>" +
          '<h3 class="admin-user__name">' + esc(MCStore.displayName(person)) +
            (isDev ? ' <span class="user-chip__dev">DEV</span>' : "") + "</h3>" +
          '<p class="admin-user__meta">' + esc(person.email) + "</p>" +
          '<p class="admin-user__meta">' + esc(person.rank) + " · " + esc(person.clan) + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="admin-user__tags">' +
        (person.positions.length
          ? person.positions.map(function (position) {
              return '<span class="tag tag--green">' + esc(position) + "</span>";
            }).join("")
          : '<span class="tag">Без должности</span>') +
        '<span class="status ' + (active ? "status--active" : "status--inactive") + '">' +
          (active ? "Актив" : "Не актив") + "</span>" +
      "</div>" +
      '<div class="admin-user__tags">' +
        '<span class="warn ' + (count.oral ? "warn--on" : "") + '">Устные ' + count.oral + " / 3</span>" +
        '<span class="warn ' + (count.written ? "warn--on" : "") + '">Письменные ' + count.written + " / 2</span>" +
      "</div>" +
      '<div class="admin-user__actions">' +
        '<button class="btn btn--ghost btn--small" type="button" data-edit="' + esc(person.id) + '">Редактировать</button>' +
        (isDev
          ? ""
          : '<a class="btn btn--ghost btn--small" href="index.html#sostav">В составе</a>' +
            '<button class="btn btn--ghost btn--small btn--danger" type="button" data-user-delete="' + esc(person.id) + '">Удалить</button>') +
      "</div>" +
    "</article>";
  }

  /* ---------- Рапорта ---------- */
  function reportCard(report) {
    var status = report.status || "new";
    var author = MCStore.userById(report.userId);
    var name = author ? MCStore.displayName(author) : "Неизвестный пользователь";

    return '<article class="report-item">' +
      '<div class="report-item__head">' +
        "<div>" +
          '<h3 class="report-item__title">' + esc(report.title) + "</h3>" +
          '<p class="report-item__meta">' + esc(name) + " · " + esc(MCAuth.formatDate(report.createdAt)) + "</p>" +
        "</div>" +
        '<span class="badge-status ' + (STATUS_CLASS[status] || "badge-status--read") + '">' +
          (STATUS_TEXT[status] || esc(status)) + "</span>" +
      "</div>" +
      '<p class="report-item__body">' + esc(report.body) + "</p>" +
      '<div class="report-item__actions">' +
        (status === "new"
          ? '<button class="btn btn--ghost btn--small" type="button" data-report-status="read" data-report="' + esc(report.id) + '">Пометить прочитанным</button>'
          : "") +
        (status === "read"
          ? '<button class="btn btn--ghost btn--small" type="button" data-report-status="closed" data-report="' + esc(report.id) + '">Закрыть</button>'
          : "") +
        (status === "closed"
          ? '<button class="btn btn--ghost btn--small" type="button" data-report-status="new" data-report="' + esc(report.id) + '">Вернуть в работу</button>'
          : "") +
        '<button class="btn btn--ghost btn--small" type="button" data-report-delete="' + esc(report.id) + '">Удалить</button>' +
      "</div>" +
    "</article>";
  }

  /* ---------- Отрисовка ---------- */
  function updateStats() {
    var users = MCStore.users();
    var reports = MCStore.reports();
    var staff = users.filter(function (person) { return person.role !== "developer"; }).length;
    var fresh = reports.filter(function (report) { return (report.status || "new") === "new"; }).length;

    var set = function (id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = String(value);
    };
    set("statUsers", users.length);
    set("statStaff", staff);
    set("statReports", fresh);
  }

  function renderUsers() {
    var host = document.getElementById("adminUsers");
    if (!host) return;
    var users = MCStore.users().slice().sort(function (a, b) {
      if (a.role !== b.role) return a.role === "developer" ? -1 : 1;
      return MCStore.displayName(a).localeCompare(MCStore.displayName(b), "ru");
    });
    var html = users.map(userCard).join("");
    host.innerHTML = html || '<div class="empty-state">Никого не найдено. Измените запрос или создайте пользователя.</div>';
    MCAuth.bindAvatars(host);
  }

  function renderReports() {
    var host = document.getElementById("adminReports");
    if (!host) return;
    var reports = MCStore.reports();
    host.innerHTML = reports.length
      ? reports.map(reportCard).join("")
      : '<div class="empty-state">Рапортов пока нет.</div>';
  }

  function refresh() {
    updateStats();
    renderUsers();
    renderReports();
  }

  /* ---------- Диалог создания / редактирования ---------- */
  function showError(message) {
    if (!formError) return;
    formError.textContent = message;
    formError.hidden = !message;
  }

  function openDialog(person) {
    if (!dialog || !form) return;

    form.reset();
    showError("");
    form.elements.userId.value = person ? person.id : "";
    form.elements.password.required = !person;
    form.elements.password.placeholder = person ? "Оставьте пустым, чтобы не менять" : "Минимум 6 символов";

    if (dialogTitle) {
      dialogTitle.textContent = person ? "Редактирование: " + MCStore.displayName(person) : "Новый пользователь";
    }
    if (saveButton) saveButton.textContent = person ? "Сохранить" : "Создать";

    if (person) {
      form.elements.firstName.value = person.firstName || "";
      form.elements.lastName.value = person.lastName || "";
      form.elements.email.value = person.email || "";
      form.elements.discord.value = person.discord || "";
      form.elements.photo.value = person.photo || "";
      form.elements.rank.value = person.rank;
      form.elements.clan.value = person.clan;
      form.elements.status.value = person.status;

      renderPositions(person.positions);
      renderWarnings(person);
    } else {
      form.elements.rank.value = "Интерн";
      form.elements.clan.value = "Нет клана";
      form.elements.status.value = "active";
      renderPositions(["Интерн"]);
      renderWarnings(null);
    }

    refreshPhotoPreview();

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    setTimeout(function () {
      if (form.elements.firstName) form.elements.firstName.focus({ preventScroll: true });
    }, 30);
  }

  function closeDialog() {
    if (dialog) dialog.close();
  }

  /* ---------- Действия ---------- */
  root.addEventListener("click", function (event) {
    var edit = event.target.closest("[data-edit]");
    if (edit) {
      var person = MCStore.userById(edit.dataset.edit);
      if (person) openDialog(person);
      return;
    }

    var create = event.target.closest("#createUser");
    if (create) {
      openDialog(null);
      return;
    }

    var deleteUser = event.target.closest("[data-user-delete]");
    if (deleteUser) {
      var target = MCStore.userById(deleteUser.dataset.userDelete);
      if (!target) return;
      if (!window.confirm("Удалить аккаунт «" + MCStore.displayName(target) + "»? Действие нельзя отменить. Рапорта участника тоже будут удалены.")) return;
      try {
        MCStore.deleteUser(target.id);
        MCAuth.toast("Аккаунт удалён", "ok");
        refresh();
      } catch (error) {
        MCAuth.toast(error.message || "Не удалось удалить аккаунт.", "error");
      }
      return;
    }

    var statusButton = event.target.closest("[data-report-status]");
    if (statusButton) {
      MCStore.updateReport(statusButton.dataset.report, { status: statusButton.dataset.reportStatus });
      MCAuth.toast("Статус рапорта обновлён", "ok");
      refresh();
      return;
    }

    var remove = event.target.closest("[data-report-delete]");
    if (remove) {
      if (!window.confirm("Удалить рапорт без возможности восстановления?")) return;
      MCStore.deleteReport(remove.dataset.reportDelete);
      MCAuth.toast("Рапорт удалён", "ok");
      refresh();
    }
  });

  root.addEventListener("input", function (event) {
    if (event.target.id === "adminSearch") {
      query = event.target.value.trim().toLowerCase();
      renderUsers();
    }
  });

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("[data-close]")) closeDialog();
    });
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      showError("");

      var el = form.elements;
      var id = el.userId.value;
      var firstName = el.firstName.value.trim();
      var lastName = el.lastName.value.trim();
      var email = el.email.value.trim().toLowerCase();
      var password = el.password.value;
      var positions = selectedPositions();

      if (!firstName) { showError("Укажите имя."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("Укажите корректный email."); return; }

      var duplicate = MCStore.userByEmail(email);
      if (duplicate && duplicate.id !== id) {
        showError("Пользователь с таким email уже существует.");
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
          showError("Не удалось найти изображение по ссылке. Укажите прямую ссылку на картинку или ссылку на пост/галерею Imgur.");
          return;
        }
      }
      payload.photo = photo;

      if (saveButton) saveButton.disabled = true;

      try {
        if (!id) {
          if (password.length < 6) {
            showError("Пароль нового пользователя должен быть не короче 6 символов.");
            return;
          }
          payload.passHash = await MCAuth.hashPassword(password);
          payload.role = "user";
          MCStore.createUser(payload);
          MCAuth.toast("Пользователь создан", "ok");
        } else {
          if (password) {
            if (password.length < 6) {
              showError("Пароль должен быть не короче 6 символов.");
              return;
            }
            payload.passHash = await MCAuth.hashPassword(password);
          }
          MCStore.updateUser(id, payload);
          MCAuth.toast("Данные сохранены", "ok");
        }
        closeDialog();
        refresh();
      } catch (error) {
        showError(error.message || "Не удалось сохранить пользователя.");
      } finally {
        if (saveButton) saveButton.disabled = false;
      }
    });
  }

  /* ---------- Каркас страницы ---------- */
  MCAuth.bindPhotoPreview(photoInput, photoPreview);
  renderPositions([]);
  renderWarnings(null);

  root.innerHTML =
    '<div class="admin-stats">' +
      '<div class="admin-stat"><b id="statUsers">0</b><span>всего аккаунтов</span></div>' +
      '<div class="admin-stat"><b id="statStaff">0</b><span>в составе корпуса</span></div>' +
      '<div class="admin-stat"><b id="statReports">0</b><span>новых рапортов</span></div>' +
    "</div>" +

    '<div class="admin-toolbar">' +
      '<button class="btn btn--primary btn--small" id="createUser" type="button">Создать пользователя</button>' +
      '<div class="search"><input id="adminSearch" type="search" placeholder="Поиск: имя, email, клан…" aria-label="Поиск пользователей"></div>' +
    "</div>" +

    '<div class="notice notice--warn">' +
      "<strong>Демо-режим.</strong> Аккаунты и рапорта хранятся в localStorage конкретного браузера. " +
      "Другие посетители сайта не увидят созданных вами пользователей, пока не появится серверная база." +
    "</div>" +

    '<section class="admin-section" style="margin-top:22px">' +
      '<div class="panel">' +
        '<div class="panel__head">' +
          "<div><h2>Пользователи</h2><p>Должности, ранг, клан, статус, выговоры, редактирование и удаление аккаунтов. Должностей можно выдать сколько угодно.</p></div>" +
        "</div>" +
        '<div class="admin-users" id="adminUsers"></div>' +
      "</div>" +
    "</section>" +

    '<section class="admin-section">' +
      '<div class="panel">' +
        '<div class="panel__head">' +
          "<div><h2>Рапорта пользователей</h2><p>Новые обращения сверху. Можно отметить прочитанным, закрыть или удалить.</p></div>" +
        "</div>" +
        '<div class="admin-reports" id="adminReports"></div>' +
      "</div>" +
    "</section>";

  refresh();
})();
