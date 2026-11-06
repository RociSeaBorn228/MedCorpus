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
  var t = window.MCI18n ? MCI18n.t : function (key) { return key; };

  var STATUS_TEXT = { new: "Новый", read: "Прочитан", closed: "Закрыт" };
  var STATUS_CLASS = { new: "badge-status--new", read: "badge-status--read", closed: "badge-status--closed" };

  var SUPPORT_TOPIC_KEYS = {
    question: "support.topicQuestion",
    bug: "support.topicBug",
    account: "support.topicAccount",
    other: "support.topicOther"
  };
  var SUPPORT_STATUS_KEYS = {
    new: "support.statusNew",
    read: "support.statusRead",
    closed: "support.statusClosed"
  };
  var SUPPORT_STATUS_CLASS = {
    new: "badge-status--new",
    read: "badge-status--read",
    closed: "badge-status--closed"
  };

  var MAX_REPORT_PHOTOS = 3;
  var MAX_PHOTO_CHARS = 170000;

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Не удалось прочитать фото.")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("Не удалось открыть изображение.")); };
        img.onload = function () { resolve(img); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function drawPhoto(img, maxSide, quality) {
    var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    var width = Math.max(1, Math.round(img.width * scale));
    var height = Math.max(1, Math.round(img.height * scale));
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    var data = canvas.toDataURL("image/webp", quality);
    if (data.indexOf("data:image/webp") === 0) return data;
    return canvas.toDataURL("image/jpeg", quality);
  }

  async function compressReportPhoto(file) {
    if (!file || !/^image\//i.test(file.type || "")) {
      throw new Error("Можно прикрепить только изображение.");
    }
    if (file.size > 12 * 1024 * 1024) {
      throw new Error("Фото больше 12 МБ. Выберите файл поменьше.");
    }
    var img = await loadImage(file);
    var attempts = [
      [1200, 0.8],
      [1000, 0.72],
      [860, 0.62],
      [720, 0.55],
      [600, 0.5]
    ];
    for (var i = 0; i < attempts.length; i += 1) {
      var data = drawPhoto(img, attempts[i][0], attempts[i][1]);
      if (data.length <= MAX_PHOTO_CHARS) return data;
    }
    throw new Error("Не удалось сжать фото. Попробуйте изображение поменьше.");
  }

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
      MCAuth.photoGallery(report.photos) +
      "</article>";
  }

  function supportCard(ticket) {
    var status = ticket.status || "new";
    var topic = t(SUPPORT_TOPIC_KEYS[ticket.topic] || "support.topicOther");
    var replied = !!ticket.reply;
    return '<article class="support-ticket">' +
      '<div class="support-ticket__head">' +
        '<div>' +
          '<h3 class="support-ticket__title">' + esc(topic) + "</h3>" +
          '<p class="support-ticket__meta">' + esc(MCAuth.formatDate(ticket.createdAt)) + "</p>" +
        "</div>" +
        '<span class="badge-status ' + (SUPPORT_STATUS_CLASS[status] || "badge-status--read") + '">' +
          esc(t(SUPPORT_STATUS_KEYS[status] || "support.statusNew")) + "</span>" +
      "</div>" +
      '<p class="support-ticket__body">' + esc(ticket.message) + "</p>" +
      '<div class="support-reply' + (replied ? " is-answered" : "") + '">' +
        '<span class="support-reply__label">' + esc(t("support.team")) + "</span>" +
        (replied
          ? '<p class="support-reply__text">' + esc(ticket.reply) + "</p>"
          : '<p class="support-reply__pending">' + esc(t("support.replyPending")) + "</p>") +
      "</div>" +
    "</article>";
  }

  function renderSupport(person) {
    var host = document.getElementById("supportList");
    if (!host || !person) return;
    var tickets = MCStore.supportByUser ? MCStore.supportByUser(person.id) : [];
    host.innerHTML = tickets.length
      ? tickets.map(supportCard).join("")
      : '<div class="empty-state" data-i18n="support.historyEmpty">' + esc(t("support.historyEmpty")) + "</div>";
    if (window.MCI18n) MCI18n.apply(host);
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
              '<div class="field">' +
                '<span class="field__label">Фото к рапорту</span>' +
                '<div class="report-drop" id="reportPhotoDrop">' +
                  '<label class="report-drop__btn" for="reportPhotoInput">' +
                    '<span class="report-drop__icon" aria-hidden="true">＋</span>' +
                    "<span>Добавить фото</span>" +
                  "</label>" +
                  '<input id="reportPhotoInput" type="file" accept="image/*" multiple hidden>' +
                  '<p class="report-drop__hint" id="reportPhotoHint">До 3 фото. Можно вставить изображение из буфера обмена: Ctrl+V (Mac: Cmd+V) прямо в форму.</p>' +
                "</div>" +
                '<div class="report-attachments" id="reportAttachments" hidden></div>' +
                '<p class="form-error" id="reportPhotoError" hidden></p>' +
              "</div>" +
              '<div><button class="btn btn--primary btn--small" type="submit">Отправить рапорт</button></div>' +
            "</form>" +
            '<div class="report-list" id="reportList">' +
              (reports.length
                ? reports.map(reportHTML).join("")
                : '<div class="empty-state">Вы ещё не отправляли рапортов. Первый рапорт появится здесь.</div>') +
            "</div>" +
          "</section>" +

          '<section class="panel support-panel">' +
            '<div class="panel__head">' +
              '<div>' +
                '<h2 data-i18n="support.historyTitle">' + esc(t("support.historyTitle")) + "</h2>" +
                '<p data-i18n="support.historyLead">' + esc(t("support.historyLead")) + "</p>" +
              "</div>" +
              '<button class="btn btn--primary btn--small" type="button" data-support-open data-i18n="support.newMessage">' +
                esc(t("support.newMessage")) +
              "</button>" +
            "</div>" +
            '<div class="support-list" id="supportList"></div>' +
          "</section>" +
        "</div>" +
      "</div>";

    MCAuth.bindAvatars(root);
    renderSupport(user);

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
    var photoInput = document.getElementById("reportPhotoInput");
    var photoDrop = document.getElementById("reportPhotoDrop");
    var photoList = document.getElementById("reportAttachments");
    var photoError = document.getElementById("reportPhotoError");
    var photoHint = document.getElementById("reportPhotoHint");
    var defaultPhotoHint = photoHint.textContent;
    var photos = [];
    var pendingPhotos = 0;

    function showPhotoError(message) {
      photoError.textContent = message || "";
      photoError.hidden = !message;
    }

    function updatePhotoHint() {
      if (pendingPhotos > 0) {
        photoHint.textContent = "Обрабатываем фото…";
      } else {
        photoHint.textContent = defaultPhotoHint;
      }
    }

    function renderPhotos() {
      photoList.hidden = !photos.length;
      photoList.innerHTML = photos.map(function (src, index) {
        return '<figure class="report-attach">' +
          '<img src="' + esc(src) + '" alt="Фото ' + (index + 1) + '">' +
          '<button class="report-attach__remove" type="button" data-report-photo-remove="' + index + '" aria-label="Удалить фото">×</button>' +
        "</figure>";
      }).join("");
    }

    function addPhoto(file) {
      if (!file) return;
      showPhotoError("");
      if (photos.length + pendingPhotos >= MAX_REPORT_PHOTOS) {
        showPhotoError("Можно прикрепить не больше " + MAX_REPORT_PHOTOS + " фото.");
        return;
      }
      pendingPhotos += 1;
      updatePhotoHint();
      compressReportPhoto(file).then(function (data) {
        if (photos.length < MAX_REPORT_PHOTOS && photos.indexOf(data) === -1) {
          photos.push(data);
          renderPhotos();
        }
      }).catch(function (error) {
        showPhotoError(error.message || "Не удалось добавить фото.");
      }).finally(function () {
        pendingPhotos -= 1;
        updatePhotoHint();
      });
    }

    if (photoInput) {
      photoInput.addEventListener("change", function () {
        Array.prototype.forEach.call(photoInput.files || [], addPhoto);
        photoInput.value = "";
      });
    }

    if (photoList) {
      photoList.addEventListener("click", function (event) {
        var button = event.target.closest("[data-report-photo-remove]");
        if (!button) return;
        photos.splice(Number(button.dataset.reportPhotoRemove), 1);
        showPhotoError("");
        renderPhotos();
      });
    }

    if (photoDrop) {
      ["dragenter", "dragover"].forEach(function (name) {
        photoDrop.addEventListener(name, function (event) {
          event.preventDefault();
          photoDrop.classList.add("is-dragover");
        });
      });
      ["dragleave", "drop"].forEach(function (name) {
        photoDrop.addEventListener(name, function (event) {
          event.preventDefault();
          photoDrop.classList.remove("is-dragover");
        });
      });
      photoDrop.addEventListener("drop", function (event) {
        var files = event.dataTransfer && event.dataTransfer.files;
        Array.prototype.forEach.call(files || [], addPhoto);
      });
    }

    form.addEventListener("paste", function (event) {
      var clipboard = event.clipboardData;
      if (!clipboard) return;
      var files = [];
      Array.prototype.forEach.call(clipboard.items || [], function (item) {
        if (item.kind === "file" && /^image\//i.test(item.type || "")) {
          var file = item.getAsFile();
          if (file) files.push(file);
        }
      });
      if (!files.length) {
        Array.prototype.forEach.call(clipboard.files || [], function (file) {
          if (/^image\//i.test(file.type || "")) files.push(file);
        });
      }
      if (!files.length) return;
      event.preventDefault();
      files.forEach(addPhoto);
    });

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
      if (pendingPhotos > 0) {
        errorBox.textContent = "Подождите: фото ещё обрабатывается.";
        errorBox.hidden = false;
        return;
      }

      try {
        MCStore.addReport(user.id, title, body, photos.slice());
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

  MCStore.subscribe(function () {
    if (user) renderSupport(MCStore.sessionUser());
  });

  document.addEventListener("mcprefs:change", function () {
    if (user) renderSupport(MCStore.sessionUser());
  });

  render();
})();
