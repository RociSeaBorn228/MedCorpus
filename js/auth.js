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

  function safePhoto(url) {
    var value = String(url || "").trim();
    if (/^https?:\/\//i.test(value)) return value;
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(value)) return value;
    return "";
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
    var photo = safePhoto(user && user.photo);
    if (photo) {
      return '<span class="' + cls + ' avatar--photo"' + style + ' data-fallback="' + esc(initials(user)) + '">' +
        '<img src="' + esc(photo) + '" alt="" data-avatar-img></span>';
    }
    return '<span class="' + cls + '"' + style + ' aria-hidden="true">' + esc(initials(user)) + "</span>";
  }

  function bindAvatars(root) {
    (root || document).querySelectorAll("[data-avatar-img]").forEach(function (img) {
      if (img.dataset.bound) return;
      img.dataset.bound = "1";
      img.addEventListener("error", function () {
        var holder = img.closest(".avatar");
        if (!holder) return;
        holder.textContent = holder.dataset.fallback || "?";
        holder.classList.remove("avatar--photo");
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
    if (MCStore.userByEmail(email)) throw new Error("Пользователь с таким email уже существует.");

    var hash = await hashPassword(password);
    var user = MCStore.createUser({
      firstName: firstName,
      lastName: lastName,
      email: email,
      passHash: hash,
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
    document.addEventListener("DOMContentLoaded", renderHeader);
  } else {
    renderHeader();
  }

  MCStore.subscribe(function () { renderHeader(); });

  window.MCAuth = {
    esc: esc,
    safePhoto: safePhoto,
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
    logout: logout,
    renderHeader: renderHeader
  };
})();
