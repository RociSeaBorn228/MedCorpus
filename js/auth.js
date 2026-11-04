/* ==========================================================================
   Медкорпус Конохи — авторизация и общие UI-хелперы
   ========================================================================== */
(function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isDirectPhoto(url) {
    var value = String(url || "").trim();
    if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i.test(value)) return true;
    var clean = value.split("#")[0].split("?")[0];
    if (/^https?:\/\/(?:i\.)?imgur\.com\/[a-z0-9]+\.(?:png|jpe?g|gif|webp|avif)$/i.test(clean)) return true;
    return /^https?:\/\/[^\s\/]+\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(clean);
  }

  function safePhoto(url) {
    var value = String(url || "").trim();
    return isDirectPhoto(value) ? value : "";
  }

  var photoResolveCache = {};

  function imgurPostId(url) {
    var value = String(url || "").trim();
    var match = value.match(/^https?:\/\/(?:www\.|m\.)?imgur\.com\/(?:gallery|a)\/(?:.*-)?([a-z0-9]{5,12})(?:[\/?#]|$)/i);
    if (match) return match[1];
    match = value.match(/^https?:\/\/(?:www\.|m\.)?imgur\.com\/([a-z0-9]{5,12})(?:[\/?#]|$)/i);
    return match ? match[1] : "";
  }

  function parseImgurEmbed(text) {
    var album = text.match(/var\s+images\s*=\s*(\{[\s\S]*?\})\s*,\s*albumHash/);
    if (album) {
      try {
        var data = JSON.parse(album[1]);
        if (data && data.images && data.images.length) {
          var image = data.images[0];
          if (image.hash && image.ext) return "https://i.imgur.com/" + image.hash + image.ext;
        }
      } catch (e) { /* ignore */ }
    }

    var main = text.match(/id="image-element"[\s\S]{0,200}?src="(?:https?:)?\/\/(i\.imgur\.com\/[A-Za-z0-9]+(?:l|h|m|b|t|s)?\.(?:png|jpe?g|gif|webp))/i);
    if (main) return "https://" + main[1];

    var all = text.match(/i\.imgur\.com\/[A-Za-z0-9]+(?:l|h|m|b|t|s)?\.(?:png|jpe?g|gif|webp)/gi) || [];
    for (var i = 0; i < all.length; i += 1) {
      if (!/\/lumbar\.gif$/i.test(all[i])) return "https://" + all[i];
    }

    return "";
  }

  function fetchEmbedText(url) {
    return fetch(url, { credentials: "omit", mode: "cors" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    });
  }

  function resolveImgurPost(id) {
    return fetchEmbedText("https://imgur.com/a/" + id + "/embed?pub=true")
      .then(parseImgurEmbed)
      .catch(function () {
        return fetchEmbedText("https://imgur.com/" + id + "/embed?pub=true").then(parseImgurEmbed);
      })
      .catch(function () { return ""; });
  }

  function resolvePhotoUrl(url) {
    var value = String(url || "").trim();
    if (!value) return Promise.resolve("");
    if (isDirectPhoto(value)) return Promise.resolve(value.replace(/^http:\/\//i, "https://"));

    var id = imgurPostId(value);
    if (!id) return Promise.resolve("");
    if (photoResolveCache[value]) return Promise.resolve(photoResolveCache[value]);

    return resolveImgurPost(id).then(function (direct) {
      if (direct) photoResolveCache[value] = direct;
      return direct || "";
    });
  }

  function initials(user) {
    if (!user) return "?";
    var a = (user.firstName || "").trim().charAt(0);
    var b = (user.lastName || "").trim().charAt(0);
    var result = (a + b).toUpperCase();
    return result || "?";
  }

  function hue(user) {
    var text = (user && (user.firstName + user.lastName)) || "med";
    var h = 0;
    for (var i = 0; i < text.length; i += 1) {
      h = (h * 31 + text.charCodeAt(i)) % 360;
    }
    return h;
  }

  function avatar(user, extra) {
    var cls = "avatar" + (extra ? " " + extra : "");
    var style = ' style="--avatar-hue:' + hue(user) + '"';
    var raw = String((user && user.photo) || "").trim();
    var photo = safePhoto(raw);
    if (photo) {
      return '<span class="' + cls + ' avatar--photo"' + style + ' data-fallback="' + esc(initials(user)) + '">' +
        '<img src="' + esc(photo) + '" alt="" data-avatar-img></span>';
    }
    if (raw && /^https?:\/\//i.test(raw)) {
      return '<span class="' + cls + ' avatar--pending"' + style + ' data-photo-page="' + esc(raw) + '" data-fallback="' + esc(initials(user)) + '">' +
        esc(initials(user)) + "</span>";
    }
    return '<span class="' + cls + '"' + style + ' aria-hidden="true">' + esc(initials(user)) + "</span>";
  }

  function bindAvatars(root) {
    var scope = root || document;

    scope.querySelectorAll("[data-avatar-img]").forEach(function (img) {
      if (img.dataset.bound) return;
      img.dataset.bound = "1";
      img.addEventListener("error", function () {
        var holder = img.closest(".avatar");
        if (!holder) return;
        holder.textContent = holder.dataset.fallback || "?";
        holder.classList.remove("avatar--photo");
      });
    });

    scope.querySelectorAll("[data-photo-page]").forEach(function (holder) {
      if (holder.dataset.photoBound) return;
      holder.dataset.photoBound = "1";
      resolvePhotoUrl(holder.dataset.photoPage).then(function (direct) {
        if (!direct || !holder.isConnected) return;
        var img = document.createElement("img");
        img.alt = "";
        img.dataset.avatarImg = "";
        img.addEventListener("error", function () {
          holder.textContent = holder.dataset.fallback || "?";
          holder.classList.remove("avatar--photo");
        }, { once: true });
        img.src = direct;
        holder.textContent = "";
        holder.classList.remove("avatar--pending");
        holder.classList.add("avatar--photo");
        holder.appendChild(img);
      });
    });
  }

  function formatDate(value) {
    if (!value) return "—";
    var date = new Date(value);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  function toast(message, kind) {
    var el = document.createElement("div");
    el.className = "toast" + (kind ? " toast--" + kind : "");
    el.setAttribute("role", "status");
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("is-visible"); });
    setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () { el.remove(); }, 250);
    }, 3400);
  }

  function bindPhotoPreview(input, preview) {
    if (!input || !preview) return;
    var token = 0;
    var timer = 0;

    function update() {
      var value = input.value.trim();
      token += 1;
      var current = token;

      if (!value) {
        preview.hidden = true;
        preview.className = "photo-preview";
        preview.innerHTML = "";
        return;
      }

      preview.hidden = false;
      preview.className = "photo-preview is-loading";
      preview.innerHTML = '<span class="photo-preview__text">Проверяем изображение…</span>';

      resolvePhotoUrl(value).then(function (direct) {
        if (current !== token) return;
        if (!direct) {
          preview.className = "photo-preview is-error";
          preview.innerHTML = '<span class="photo-preview__text">Не удалось найти изображение. Укажите прямую ссылку на картинку или ссылку на пост/галерею Imgur.</span>';
          return;
        }
        preview.className = "photo-preview is-ok";
        preview.innerHTML = '<img src="' + esc(direct) + '" alt="Предпросмотр фото" data-preview-img>' +
          '<span class="photo-preview__text">Изображение найдено. При сохранении будет использована прямая ссылка.</span>';
        var img = preview.querySelector("[data-preview-img]");
        if (img) {
          img.addEventListener("error", function () {
            if (current !== token) return;
            preview.className = "photo-preview is-error";
            preview.innerHTML = '<span class="photo-preview__text">Ссылка открывается, но браузер не может показать изображение. Проверьте адрес.</span>';
          }, { once: true });
        }
      });
    }

    function schedule() {
      clearTimeout(timer);
      if (!input.value.trim()) {
        update();
        return;
      }
      timer = setTimeout(update, 400);
    }

    input.addEventListener("input", schedule);
    input.addEventListener("change", schedule);
    update();
  }

  function positionsEditor(selected) {
    var chosen = Array.isArray(selected) ? selected : [];

    function group(title, list, lead) {
      var items = list.map(function (position) {
        var checked = chosen.indexOf(position) !== -1;
        return '<label class="check check--position">' +
          '<input type="checkbox" name="position" value="' + esc(position) + '"' + (checked ? " checked" : "") + '>' +
          '<span class="check__mark" aria-hidden="true"></span>' +
          '<span class="check__text">' + esc(position) + '</span>' +
          (lead ? '<span class="check__star" aria-hidden="true" title="Руководящая должность">★</span>' : "") +
        '</label>';
      }).join("");

      return '<div class="position-group">' +
        '<span class="position-group__label">' + esc(title) + '</span>' +
        '<div class="checks">' + items + '</div>' +
      '</div>';
    }

    return '<div class="position-picker" data-position-picker>' +
      group("Руководящие должности", MCStore.LEAD_POSITIONS, true) +
      group("Должности корпуса", MCStore.STAFF_POSITIONS, false) +
      '<div class="position-picker__foot">' +
        '<span class="field__hint">Можно выбрать несколько должностей. ★ — руководящая: участник автоматически попадает в «Руководство».</span>' +
        '<span class="position-picker__count" data-position-count>Должность не выбрана</span>' +
      '</div>' +
    '</div>';
  }

  function eachMatch(root, selector, callback) {
    var scope = root || document;
    var nodes = [];
    if (scope.nodeType === 1 && scope.matches && scope.matches(selector)) nodes.push(scope);
    Array.prototype.push.apply(nodes, scope.querySelectorAll(selector));
    nodes.forEach(callback);
  }

  function syncPositions(root) {
    eachMatch(root, "[data-position-picker]", function (picker) {
      var count = picker.querySelectorAll('input[name="position"]:checked').length;
      var out = picker.querySelector("[data-position-count]");
      if (out) out.textContent = count ? "Выбрано: " + count : "Должность не выбрана";
    });
  }

  function warningsEditor(user) {
    var warnings = MCStore.normalizeWarnings(user && user.warnings);

    function row(kind, label, max) {
      var boxes = "";
      var dots = "";
      var checked = 0;
      var word = kind === "oral" ? "устный" : "письменный";

      for (var i = 0; i < max; i += 1) {
        var on = warnings[kind][i];
        if (on) checked += 1;
        boxes += '<input type="checkbox" name="' + kind + i + '" data-warn-box="' + kind + '"' + (on ? " checked" : "") + ' tabindex="-1" aria-hidden="true">';
        dots += '<i class="warning-editor__dot' + (on ? " is-on" : "") + '"></i>';
      }

      return '<div class="warning-editor__row">' +
        '<div class="warning-editor__label"><b>' + esc(label) + '</b><span>максимум ' + max + '</span></div>' +
        '<div class="warning-editor__dots" data-warn-dots="' + kind + '">' + dots + '</div>' +
        '<div class="warning-editor__control">' +
          '<button type="button" class="warn-step" data-warn-step="-1" data-warn-kind="' + kind + '" aria-label="Снять ' + word + ' выговор">−</button>' +
          '<span class="warning-editor__count" data-warn-count="' + kind + '">' + checked + ' / ' + max + '</span>' +
          '<button type="button" class="warn-step" data-warn-step="1" data-warn-kind="' + kind + '" aria-label="Выдать ' + word + ' выговор">+</button>' +
        '</div>' +
        boxes +
      '</div>';
    }

    return '<div class="warning-editor" data-warning-editor>' +
      row("oral", "Устные выговоры", 3) +
      row("written", "Письменные выговоры", 2) +
    '</div>';
  }

  function syncWarnings(root) {
    eachMatch(root, "[data-warning-editor]", function (editor) {
      ["oral", "written"].forEach(function (kind) {
        var boxes = Array.prototype.slice.call(editor.querySelectorAll('input[data-warn-box="' + kind + '"]'));
        var count = boxes.filter(function (box) { return box.checked; }).length;
        var counter = editor.querySelector('[data-warn-count="' + kind + '"]');
        if (counter) counter.textContent = count + " / " + boxes.length;

        var dots = editor.querySelector('[data-warn-dots="' + kind + '"]');
        if (dots) {
          Array.prototype.forEach.call(dots.children, function (dot, index) {
            dot.classList.toggle("is-on", !!boxes[index] && boxes[index].checked);
          });
        }

        var dec = editor.querySelector('[data-warn-step="-1"][data-warn-kind="' + kind + '"]');
        var inc = editor.querySelector('[data-warn-step="1"][data-warn-kind="' + kind + '"]');
        if (dec) dec.disabled = count === 0;
        if (inc) inc.disabled = count >= boxes.length;
      });
    });
  }

  document.addEventListener("click", function (event) {
    var step = event.target.closest ? event.target.closest("[data-warn-step]") : null;
    if (!step) return;
    var editor = step.closest("[data-warning-editor]");
    if (!editor) return;
    event.preventDefault();

    var kind = step.dataset.warnKind;
    var direction = parseInt(step.dataset.warnStep, 10);
    var boxes = Array.prototype.slice.call(editor.querySelectorAll('input[data-warn-box="' + kind + '"]'));
    var count = boxes.filter(function (box) { return box.checked; }).length;
    if (direction > 0 && count < boxes.length) boxes[count].checked = true;
    if (direction < 0 && count > 0) boxes[count - 1].checked = false;
    syncWarnings(editor);
  });

  document.addEventListener("change", function (event) {
    if (event.target && event.target.name === "position") {
      var picker = event.target.closest("[data-position-picker]");
      if (picker) syncPositions(picker);
    }
  });

  async function hashPassword(password) {
    if (!(window.crypto && window.crypto.subtle && window.TextEncoder)) {
      throw new Error("Браузер не поддерживает безопасный вход. Откройте сайт в современном браузере.");
    }
    var bytes = new TextEncoder().encode(String(password));
    var digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function currentPage() {
    var page = window.location.pathname.split("/").pop();
    return page || "index.html";
  }

  function nextTarget() {
    var next = new URLSearchParams(window.location.search).get("next");
    if (next && /^[a-z0-9_-]+\.html$/i.test(next)) return next;
    return "account.html";
  }

  function requireLogin() {
    var user = MCStore.sessionUser();
    if (user) return user;
    var next = currentPage();
    window.location.replace("login.html?next=" + encodeURIComponent(next));
    return null;
  }

  /* ---------- Подтверждение email через Supabase Auth ---------- */

  var CONFIG = window.MC_CONFIG || {};
  var EMAIL_CONFIRM = CONFIG.emailConfirm !== false && !!CONFIG.supabaseUrl && !!CONFIG.supabaseKey;
  var AUTH_BASE = String(CONFIG.supabaseUrl || "").replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  var PENDING_KEY = "medcorpus.pendingReg.v1";
  var RESEND_COOLDOWN = 45;
  var pendingRegistration = loadPending();

  function loadPending() {
    try {
      var raw = window.sessionStorage.getItem(PENDING_KEY);
      var data = raw ? JSON.parse(raw) : null;
      if (data && data.email && data.passHash) return data;
    } catch (e) { /* ignore */ }
    return null;
  }

  function savePending(data) {
    pendingRegistration = data;
    try { window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function clearPending() {
    pendingRegistration = null;
    try { window.sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* ignore */ }
  }

  function pendingEmail() {
    return pendingRegistration ? pendingRegistration.email : "";
  }

  function authHeaders(token) {
    var headers = {
      "apikey": CONFIG.supabaseKey,
      "Content-Type": "application/json"
    };
    if (token) headers.Authorization = "Bearer " + token;
    return headers;
  }

  function authErrorMessage(data, status) {
    var code = String(data.error_code || data.code || "");
    var msg = String(data.msg || data.message || data.error_description || data.error || "");
    var haystack = code + " " + msg;

    if (/email_address_invalid|validation_failed/i.test(code)) return "Этот email не подходит. Укажите корректный адрес.";
    if (/email_exists|user_already_exists/i.test(code)) return "Этот email уже зарегистрирован. Войдите в аккаунт.";
    if (/over_email_send_rate_limit|over_request_rate_limit|rate_limit/i.test(code) || status === 429) {
      return "Слишком много писем за короткое время. Подождите минуту и попробуйте снова.";
    }
    if (/otp_expired|token_has_expired|expired|invalid.*token|token.*invalid/i.test(haystack)) {
      return "Код неверный или устарел. Запросите новое письмо.";
    }
    if (/signup_disabled|email_provider_disabled/i.test(code)) return "Регистрация по email временно закрыта.";
    if (/email_send_failed|smtp|send.*email|email.*send/i.test(haystack) || status >= 500) {
      return "Не удалось отправить письмо. Попробуйте позже или сообщите разработчику.";
    }
    return msg || "Не удалось выполнить запрос. Попробуйте позже.";
  }

  function authRequest(path, options) {
    var opts = options || {};
    return fetch(AUTH_BASE + "/auth/v1" + path, {
      method: opts.method || "GET",
      headers: authHeaders(opts.token),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store"
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = {};
        if (text) {
          try { data = JSON.parse(text); } catch (e) { data = { msg: text }; }
        }
        if (!response.ok) {
          console.warn("Supabase Auth", path, response.status, data);
          var error = new Error(authErrorMessage(data, response.status));
          error.code = data.error_code || data.code || "";
          error.status = response.status;
          throw error;
        }
        return data;
      });
    });
  }

  function siteFile(name) {
    var folder = window.location.pathname.replace(/[^\/]*$/, "");
    return folder + name;
  }

  function authRedirectUrl() {
    if (!/^https?:$/.test(window.location.protocol)) return "";
    return window.location.origin + siteFile("login.html") + "?confirmed=1";
  }

  function sendEmailCode(state) {
    var payload = {
      email: state.email,
      create_user: true,
      data: {
        mc_first_name: state.firstName,
        mc_last_name: state.lastName,
        mc_discord: state.discord || "",
        mc_pass_hash: state.passHash
      }
    };
    var redirect = authRedirectUrl();
    var path = "/otp" + (redirect ? "?redirect_to=" + encodeURIComponent(redirect) : "");
    return authRequest(path, { method: "POST", body: payload });
  }

  function registrationFields(data) {
    var firstName = String(data.firstName || "").trim();
    var lastName = String(data.lastName || "").trim();
    var email = String(data.email || "").trim().toLowerCase();
    var password = String(data.password || "");
    var password2 = String(data.password2 || "");

    if (!firstName) throw new Error("Укажите имя.");
    if (lastName.length > 60) throw new Error("Слишком длинная фамилия.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Укажите корректный email.");
    if (password.length < 6) throw new Error("Пароль должен быть не короче 6 символов.");
    if (password !== password2) throw new Error("Пароли не совпадают.");

    return {
      firstName: firstName,
      lastName: lastName,
      email: email,
      discord: data.discord,
      password: password
    };
  }

  function createRosterUser(data) {
    var user = MCStore.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passHash: data.passHash,
      discord: data.discord,
      positions: ["Интерн"],
      rank: "Интерн",
      clan: "Нет клана",
      status: "active"
    });
    MCStore.loginSession(user.id);
    renderHeader();
    return user;
  }

  async function startEmailRegistration(data) {
    var fields = registrationFields(data);
    if (MCStore.userByEmail(fields.email)) throw new Error("Пользователь с таким email уже существует.");

    if (pendingRegistration && pendingRegistration.email === fields.email && pendingRegistration.lastSentAt) {
      var wait = RESEND_COOLDOWN - Math.floor((Date.now() - pendingRegistration.lastSentAt) / 1000);
      if (wait > 0) throw new Error("Код уже отправлен. Подождите " + wait + " с.");
    }

    var state = {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      discord: String(fields.discord || "").trim(),
      passHash: await hashPassword(fields.password),
      lastSentAt: Date.now()
    };

    await sendEmailCode(state);
    savePending(state);
    return { pending: true, email: state.email };
  }

  async function resendEmailCode() {
    if (!pendingRegistration) throw new Error("Сначала заполните форму регистрации.");
    var wait = RESEND_COOLDOWN - Math.floor((Date.now() - (pendingRegistration.lastSentAt || 0)) / 1000);
    if (wait > 0) throw new Error("Новое письмо можно отправить через " + wait + " с.");

    var state = Object.assign({}, pendingRegistration, { lastSentAt: Date.now() });
    await sendEmailCode(state);
    savePending(state);
    return state.email;
  }

  async function confirmEmailRegistration(code) {
    if (!pendingRegistration) throw new Error("Сначала запросите код подтверждения.");

    var token = String(code || "").replace(/\s+/g, "");
    if (!/^\d{4,10}$/.test(token)) throw new Error("Введите код из письма (обычно 6 цифр).");

    await authRequest("/verify", {
      method: "POST",
      body: { type: "email", email: pendingRegistration.email, token: token }
    });

    var pending = pendingRegistration;
    clearPending();

    var existing = MCStore.userByEmail(pending.email);
    if (existing) {
      MCStore.loginSession(existing.id);
      renderHeader();
      if (MCStore.pushNow) { try { await MCStore.pushNow(); } catch (e) { /* ignore */ } }
      return existing;
    }

    var user = createRosterUser(pending);
    if (MCStore.pushNow) { try { await MCStore.pushNow(); } catch (e) { /* ignore */ } }
    return user;
  }

  function cancelEmailRegistration() {
    clearPending();
  }

  /* Если человек открыл ссылку из письма, Supabase возвращает токены в #hash.
     Создаём профиль по данным, сохранённым при отправке письма. */
  async function handleEmailLink() {
    if (!EMAIL_CONFIRM) return;
    var raw = String(window.location.hash || "").replace(/^#/, "");
    if (!raw) return;

    var params = new URLSearchParams(raw);
    var access = params.get("access_token");
    var type = params.get("type") || "";
    if (!access || !/signup|magiclink|email/i.test(type)) return;

    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (e) { /* ignore */ }

    try {
      var data = await authRequest("/user", { token: access });
      var meta = data.user_metadata || {};
      var email = String(data.email || "").toLowerCase();
      if (!email) throw new Error("В ссылке нет email.");

      var user = MCStore.userByEmail(email);
      if (!user && meta.mc_pass_hash && meta.mc_first_name) {
        user = createRosterUser({
          firstName: meta.mc_first_name,
          lastName: meta.mc_last_name,
          email: email,
          passHash: meta.mc_pass_hash,
          discord: meta.mc_discord
        });
      }

      if (user) {
        clearPending();
        if (MCStore.pushNow) { try { await MCStore.pushNow(); } catch (e) { /* ignore */ } }
        toast("Почта подтверждена. Добро пожаловать!", "ok");
        window.location.replace(siteFile("account.html"));
      } else {
        toast("Почта подтверждена. Войдите или зарегистрируйтесь ещё раз.", "ok");
      }
    } catch (error) {
      console.warn("Не удалось подтвердить почту по ссылке:", error);
      toast("Ссылка подтверждения устарела. Запросите новое письмо.", "error");
    }
  }

  async function login(email, password) {
    var user = MCStore.userByEmail(email);
    if (!user) throw new Error("Аккаунт с таким email не найден.");
    var hash = await hashPassword(password);
    if (hash !== user.passHash) throw new Error("Неверный пароль.");
    MCStore.loginSession(user.id);
    renderHeader();
    return user;
  }

  async function register(data) {
    /* С подтверждением почты профиль создаётся только после ввода кода. */
    if (EMAIL_CONFIRM) return startEmailRegistration(data);

    var fields = registrationFields(data);
    if (MCStore.userByEmail(fields.email)) throw new Error("Пользователь с таким email уже существует.");

    var user = createRosterUser({
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      passHash: await hashPassword(fields.password),
      discord: fields.discord
    });
    if (MCStore.pushNow) { try { await MCStore.pushNow(); } catch (e) { /* ignore */ } }
    return user;
  }

  function logout() {
    MCStore.logout();
    renderHeader();
  }

  function renderHeader() {
    var actions = document.querySelector(".header-actions");
    if (!actions) return;

    var slot = document.getElementById("authSlot");
    if (!slot) {
      slot = document.createElement("div");
      slot.id = "authSlot";
      slot.className = "auth-slot";
      actions.insertBefore(slot, actions.firstChild);
    }

    var user = MCStore.sessionUser();
    if (user) {
      var isDev = user.role === "developer";
      slot.innerHTML = '<a class="user-chip" href="account.html" title="Личный кабинет">' +
        avatar(user, "avatar--sm") +
        '<span class="user-chip__name">' + esc(user.firstName || "Аккаунт") + "</span>" +
        (isDev ? '<span class="user-chip__dev" title="Разработчик">DEV</span>' : "") +
        "</a>";
    } else {
      slot.innerHTML = '<a class="btn btn--ghost btn--small auth-login" href="login.html">Войти</a>';
    }
    bindAvatars(slot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      handleEmailLink();
      renderHeader();
    });
  } else {
    handleEmailLink();
    renderHeader();
  }

  MCStore.subscribe(function () { renderHeader(); });

  window.MCAuth = {
    esc: esc,
    safePhoto: safePhoto,
    isDirectPhoto: isDirectPhoto,
    resolvePhotoUrl: resolvePhotoUrl,
    bindPhotoPreview: bindPhotoPreview,
    positionsEditor: positionsEditor,
    syncPositions: syncPositions,
    warningsEditor: warningsEditor,
    syncWarnings: syncWarnings,
    initials: initials,
    avatar: avatar,
    bindAvatars: bindAvatars,
    formatDate: formatDate,
    toast: toast,
    hashPassword: hashPassword,
    currentPage: currentPage,
    nextTarget: nextTarget,
    requireLogin: requireLogin,
    login: login,
    register: register,
    emailConfirmEnabled: EMAIL_CONFIRM,
    pendingEmail: pendingEmail,
    confirmEmailRegistration: confirmEmailRegistration,
    resendEmailCode: resendEmailCode,
    cancelEmailRegistration: cancelEmailRegistration,
    logout: logout,
    renderHeader: renderHeader
  };
})();
