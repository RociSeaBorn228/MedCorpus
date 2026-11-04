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
  var confirmForm = document.getElementById("confirmForm");
  var confirmEmail = document.getElementById("confirmEmail");
  var resendCode = document.getElementById("resendCode");
  var changeEmail = document.getElementById("changeEmail");
  var panel = document.querySelector(".auth-panel");

  function setTab(mode) {
    var isLogin = mode !== "register" && mode !== "confirm";
    if (tabLogin) {
      tabLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
      tabLogin.tabIndex = isLogin ? 0 : -1;
    }
    if (tabRegister) {
      tabRegister.setAttribute("aria-selected", isLogin ? "false" : "true");
      tabRegister.tabIndex = isLogin ? -1 : 0;
    }
    if (loginForm) loginForm.classList.toggle("is-active", isLogin);
    if (registerForm) registerForm.classList.toggle("is-active", mode === "register");
    if (confirmForm) confirmForm.classList.toggle("is-active", mode === "confirm");

    var focusTarget = mode === "confirm" ? confirmForm : (isLogin ? loginForm : registerForm);
    if (focusTarget) {
      var first = focusTarget.querySelector("input");
      if (first) first.focus({ preventScroll: true });
    }
  }

  function showConfirm(email) {
    if (!confirmForm) return;
    if (confirmEmail) confirmEmail.textContent = email;
    showError(confirmForm, "");
    setTab("confirm");
    var input = confirmForm.elements.code;
    if (input) {
      input.value = "";
      input.focus({ preventScroll: true });
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

  if (!already && MCAuth.emailConfirmEnabled && MCAuth.pendingEmail && MCAuth.pendingEmail()) {
    showConfirm(MCAuth.pendingEmail());
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

      setBusy(registerForm, true, "Отправляем код…");
      try {
        var result = await MCAuth.register(data);
        setBusy(registerForm, false);
        if (result && result.pending) {
          showConfirm(result.email);
          MCAuth.toast("Код отправлен на " + result.email, "ok");
        } else {
          window.location.replace(MCAuth.nextTarget());
        }
      } catch (error) {
        showError(registerForm, error.message || "Не удалось создать аккаунт.");
        setBusy(registerForm, false);
      }
    });
  }

  if (confirmForm) {
    confirmForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      showError(confirmForm, "");

      var code = confirmForm.elements.code.value.trim();
      if (!/^\d{4,10}$/.test(code)) {
        showError(confirmForm, "Введите код из письма (обычно 6 цифр).");
        return;
      }

      setBusy(confirmForm, true, "Проверяем…");
      try {
        await MCAuth.confirmEmailRegistration(code);
        window.location.replace(MCAuth.nextTarget());
      } catch (error) {
        showError(confirmForm, error.message || "Не удалось подтвердить почту.");
        setBusy(confirmForm, false);
      }
    });
  }

  if (resendCode) {
    resendCode.addEventListener("click", async function () {
      if (!confirmForm) return;
      showError(confirmForm, "");
      resendCode.disabled = true;
      var label = resendCode.textContent;
      resendCode.textContent = "Отправляем…";
      try {
        var email = await MCAuth.resendEmailCode();
        MCAuth.toast("Письмо отправлено повторно на " + email, "ok");
      } catch (error) {
        showError(confirmForm, error.message || "Не удалось отправить письмо.");
      }
      resendCode.disabled = false;
      resendCode.textContent = label;
    });
  }

  if (changeEmail) {
    changeEmail.addEventListener("click", function () {
      MCAuth.cancelEmailRegistration();
      setTab("register");
    });
  }
})();
