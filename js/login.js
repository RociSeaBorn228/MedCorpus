/* ==========================================================================
   Медкорпус Конохи — страница входа
   Регистрация закрыта: аккаунты создаёт разработчик в admin.html.
   ========================================================================== */
(function () {
  "use strict";

  if (!window.MCAuth || !window.MCStore) return;

  var loginForm = document.getElementById("loginForm");
  var panel = document.querySelector(".auth-panel");

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
})();
