/* ==========================================================================
   Медкорпус Конохи — личный кабинет
   ========================================================================== */
(function () {
  "use strict";

  if (!window.MCAuth || !window.MCStore) return;

  var root = document.getElementById("accountRoot");
  var user = MCAuth.requireLogin();
  if (!root || !user) return;

  var esc = MCAuth.esc;

  var STATUS_TEXT = { new: "Новый", read: "Прочитан", closed: "Закрыт" };
  var STATUS_CLASS = { new: "badge-status--new", read: "badge-status--read", closed: "badge-status--closed" };

  function day(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit", month: "long", year: "numeric"
    }).format(date);
  }

  function positionsHTML(person) {
    if (!person.positions.length) return '<span class="tag">Без должности</span>';
    return person.positions.map(function (position) {
      return '<span class="tag tag--green">' + esc(position) + "</span>";
    }).join("");
  }

  function statusHTML(person) {
    var active = person.status === "active";
    return '<span class="status ' + (active ? "status--active" : "status--inactive") + '">' +
      (active ? "Актив" : "Не актив") + "</span>";
  }

  function warningsHTML(person) {
    var count = MCStore.warningCount(person);
    return '<span class="warn ' + (count.oral ? "warn--on" : "") + '">Устные ' + count.oral + " / 3</span>" +
      '<span class="warn ' + (count.written ? "warn--on" : "") + '">Письменные ' + count.written + " / 2</span>";
  }

  function myReports(person) {
    return MCStore.reports().filter(function (report) {
      return report.userId === person.id;
    });
  }

  function reportHTML(report) {
    var status = report.status || "new";
    return '<article class="report-item">' +
      '<div class="report-item__head">' +
        '<div>' +
          '<h3 class="report-item__title">' + esc(report.title) + "</h3>" +
          '<p class="report-item__meta">' + esc(MCAuth.formatDate(report.createdAt)) + "</p>" +
        "</div>" +
        '<span class="badge-status ' + (STATUS_CLASS[status] || "badge-status--read") + '">' +
          (STATUS_TEXT[status] || status) + "</span>" +
      "</div>" +
      '<p class="report-item__body">' + esc(report.body) + "</p>" +
      "</article>";
  }

  function render() {
    var fresh = MCStore.sessionUser();
    if (!fresh) {
      window.location.replace("login.html?next=account.html");
      return;
    }
    user = fresh;

    var reports = myReports(user);
    var isDev = user.role === "developer";
    var warningTotal = MCStore.warningCount(user).total;

    root.innerHTML =
      '<div class="account-grid">' +
        '<aside class="panel profile">' +
          '<div class="profile__head">' +
            MCAuth.avatar(user, "avatar--xl") +
            '<div>' +
              '<h2 class="profile__name">' + esc(MCStore.displayName(user)) + "</h2>" +
              '<p class="profile__sub">' + esc(user.email) + "</p>" +
            "</div>" +
            statusHTML(user) +
          "</div>" +
          '<details class="profile-photo">' +
            "<summary>Изменить фото профиля</summary>" +
            '<form class="form" id="photoForm" novalidate>' +
              '<p class="form-error" hidden></p>' +
              '<div class="field">' +
                '<label for="profilePhoto">Ссылка на фото</label>' +
                '<input id="profilePhoto" name="photo" type="url" maxlength="1000" placeholder="https://i.imgur.com/…jpg" value="' + esc(user.photo || "") + '">' +
                '<p class="field__hint">Прямая ссылка на картинку или ссылка на пост/галерею Imgur. Перед сохранением ссылка проверяется.</p>' +
              "</div>" +
              '<div class="photo-preview" id="photoPreview" hidden></div>' +
              '<div class="photo-form__actions">' +
                '<button class="btn btn--primary btn--small" type="submit">Сохранить фото</button>' +
                '<button class="btn btn--ghost btn--small" type="button" data-photo-remove>Удалить фото</button>' +
              "</div>" +
            "</form>" +
          "</details>" +
          '<ul class="profile-facts">' +
            "<li><b>Ранг</b><span>" + esc(user.rank) + "</span></li>" +
            "<li><b>Клан</b><span>" + esc(user.clan) + "</span></li>" +
            "<li><b>Должности</b><span>" + positionsHTML(user) + "</span></li>" +
            "<li><b>Выговоры</b><span>" + warningsHTML(user) + "</span></li>" +
            "<li><b>Discord</b><span>" + (user.discord ? esc(user.discord) : "не указан") + "</span></li>" +
            "<li><b>В корпусе с</b><span>" + day(user.createdAt) + "</span></li>" +
          "</ul>" +
          (warningTotal >= 3
            ? '<div class="notice notice--warn"><strong>Внимание.</strong> У вас ' + warningTotal +
              " выговор(а). Следующий может привести к исключению из состава.</div>"
            : "") +
          '<div class="profile__actions">' +
            (isDev ? '<a class="btn btn--primary btn--small" href="admin.html">Панель разработчика</a>' : "") +
            '<a class="btn btn--ghost btn--small" href="sostav.html">Состав корпуса</a>' +
            '<button class="btn btn--ghost btn--small" type="button" data-logout>Выйти из аккаунта</button>' +
          "</div>" +
        "</aside>" +

        '<div style="display:grid;gap:20px">' +
          '<section class="panel">' +
            '<div class="panel__head">' +
              "<div><h2>Мои рапорта</h2><p>Рапорт увидит разработчик корпуса. Всего: " + reports.length + "</p></div>" +
            "</div>" +
            '<form class="form report-form" id="reportForm" novalidate>' +
              '<p class="form-error" hidden></p>' +
              '<div class="field">' +
                '<label for="reportTitle">Тема рапорта</label>' +
                '<input id="reportTitle" name="title" type="text" maxlength="120" placeholder="Например: перевод в хирургию" required>' +
              "</div>" +
              '<div class="field">' +
                '<label for="reportBody">Текст</label>' +
                '<textarea id="reportBody" name="body" maxlength="2000" placeholder="Опишите ситуацию, просьбу или отчёт о смене." required></textarea>' +
              "</div>" +
              '<div><button class="btn btn--primary btn--small" type="submit">Отправить рапорт</button></div>' +
            "</form>" +
            '<div class="report-list" id="reportList">' +
              (reports.length
                ? reports.map(reportHTML).join("")
                : '<div class="empty-state">Вы ещё не отправляли рапортов. Первый рапорт появится здесь.</div>') +
            "</div>" +
          "</section>" +
        "</div>" +
      "</div>";

    MCAuth.bindAvatars(root);

    var photoForm = document.getElementById("photoForm");
    if (photoForm) {
      var photoInput = photoForm.elements.photo;
      var photoPreview = document.getElementById("photoPreview");
      MCAuth.bindPhotoPreview(photoInput, photoPreview);

      photoForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var errorBox = photoForm.querySelector(".form-error");
        var submit = photoForm.querySelector('button[type="submit"]');
        var value = photoInput.value.trim();
        errorBox.hidden = true;

        if (!value) {
          errorBox.textContent = "Укажите ссылку на фото или нажмите «Удалить фото».";
          errorBox.hidden = false;
          return;
        }

        if (submit) {
          submit.disabled = true;
          submit.dataset.label = submit.textContent;
          submit.textContent = "Проверяем…";
        }

        try {
          var direct = await MCAuth.resolvePhotoUrl(value);
          if (!direct) {
            throw new Error("Не удалось найти изображение. Укажите прямую ссылку на картинку или ссылку на пост/галерею Imgur.");
          }
          MCStore.updateUser(user.id, { photo: direct });
          MCAuth.toast("Фото профиля обновлено", "ok");
          render();
        } catch (error) {
          errorBox.textContent = error.message || "Не удалось сохранить фото.";
          errorBox.hidden = false;
        } finally {
          if (submit && submit.isConnected) {
            submit.disabled = false;
            submit.textContent = submit.dataset.label || "Сохранить фото";
          }
        }
      });

      var removePhoto = photoForm.querySelector("[data-photo-remove]");
      if (removePhoto) {
        removePhoto.addEventListener("click", function () {
          if (!user.photo) {
            MCAuth.toast("У вас ещё нет фото", "ok");
            return;
          }
          if (!window.confirm("Удалить фото профиля?")) return;
          MCStore.updateUser(user.id, { photo: "" });
          MCAuth.toast("Фото профиля удалено", "ok");
          render();
        });
      }
    }

    var form = document.getElementById("reportForm");
    var errorBox = form.querySelector(".form-error");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      errorBox.hidden = true;

      var title = form.elements.title.value.trim();
      var body = form.elements.body.value.trim();
      if (title.length < 3) {
        errorBox.textContent = "Тема должна быть не короче 3 символов.";
        errorBox.hidden = false;
        return;
      }
      if (body.length < 10) {
        errorBox.textContent = "Опишите ситуацию подробнее (минимум 10 символов).";
        errorBox.hidden = false;
        return;
      }

      try {
        MCStore.addReport(user.id, title, body);
        MCAuth.toast("Рапорт отправлен разработчику", "ok");
        render();
      } catch (error) {
        errorBox.textContent = error.message || "Не удалось отправить рапорт.";
        errorBox.hidden = false;
      }
    });
  }

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-logout]")) {
      MCAuth.logout();
      window.location.replace("index.html");
    }
  });

  render();
})();
