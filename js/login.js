/* ==========================================================================
   Медкорпус Конохи — страница входа и регистрации
   ========================================================================== */
(function () {
  "use strict";

  if (!window.MCAuth || !window.MCStore) return;

  var tabLogin = document.getElementById("tabLogin");
  var tabRegister = document.getElementById("tabRegister");
  var loginForm = document.getElementById("loginForm");
  var registerForm = document.getElementById("registerForm");
  var panel = document.querySelector(".auth-panel");

  function setTab(mode) {
    var isLogin = mode !== "register";
    if (tabLogin) {
      tabLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
      tabLogin.tabIndex = isLogin ? 0 : -1;
    }
    if (tabRegister) {
      tabRegister.setAttribute("aria-selected", isLogin ? "false" : "true");
      tabRegister.tabIndex = isLogin ? -1 : 0;
    }
    if (loginForm) loginForm.classList.toggle("is-active", isLogin);
    if (registerForm) registerForm.classList.toggle("is-active", !isLogin);
    var focusTarget = isLogin ? loginForm : registerForm;
    if (focusTarget) {
      var first = focusTarget.querySelector("input");
      if (first) first.focus({ preventScroll: true });
    }
  }

  function showError(form, message) {
    var box = form.querySelector(".form-error");
    if (!box) return;
    box.textContent = message;
    box.hidden = !message;
  }

  function setBusy(form, busy, label) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? (label || "Подождите…") : button.dataset.label;
  }

  if (tabLogin) tabLogin.addEventListener("click", function () { setTab("login"); });
  if (tabRegister) tabRegister.addEventListener("click", function () { setTab("register"); });

  var params = new URLSearchParams(window.location.search);
  setTab(params.get("mode") === "register" || window.location.hash === "#register" ? "register" : "login");

  var already = MCStore.sessionUser();
  if (already && panel) {
    var notice = document.createElement("div");
    notice.className = "notice";
    notice.innerHTML = "Вы уже вошли как <strong>" + MCAuth.esc(MCStore.displayName(already)) +
      "</strong>. <a href=\"account.html\">Личный кабинет</a> · " +
      "<a href=\"#\" data-logout>Выйти</a>";
    panel.insertBefore(notice, panel.firstChild);
    notice.addEventListener("click", function (event) {
      if (event.target.closest("[data-logout]")) {
        event.preventDefault();
        MCAuth.logout();
        MCAuth.toast("Вы вышли из аккаунта", "ok");
        notice.remove();
        setTab("login");
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      showError(loginForm, "");

      var email = loginForm.elements.email.value.trim();
      var password = loginForm.elements.password.value;

      if (!email || !password) {
        showError(loginForm, "Введите email и пароль.");
        return;
      }

      setBusy(loginForm, true, "Проверяем…");
      try {
        await MCAuth.login(email, password);
        window.location.replace(MCAuth.nextTarget());
      } catch (error) {
        showError(loginForm, error.message || "Не удалось войти.");
        setBusy(loginForm, false);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      showError(registerForm, "");

      var data = {
        firstName: registerForm.elements.firstName.value,
        lastName: registerForm.elements.lastName.value,
        email: registerForm.elements.email.value,
        discord: registerForm.elements.discord.value,
        password: registerForm.elements.password.value,
        password2: registerForm.elements.password2.value
      };

      setBusy(registerForm, true, "Создаём…");
      try {
        await MCAuth.register(data);
        window.location.replace("account.html");
      } catch (error) {
        showError(registerForm, error.message || "Не удалось создать аккаунт.");
        setBusy(registerForm, false);
      }
    });
  }
})();
