(async () => {
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'guest', shell: 'public' });
  if (!v) return;

  setTitle(t('signup'));
  v.innerHTML = `
    <div class="auth-card">
      <h2>${t('auth.signupTitle')}</h2>
      <p class="sub">${t('auth.signupSub')}</p>
      <form data-form="signup" novalidate>
        <div class="form-error" role="alert"></div>
        <div class="field"><label for="f-name">${t('auth.name')}</label>
          <input id="f-name" name="name" maxlength="50" autocomplete="name" required /></div>
        <div class="field"><label for="f-user">${t('auth.username')}</label>
          <div class="prefix-wrap"><span>@</span><input id="f-user" name="username" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" required /></div>
          <div class="hint" id="user-hint">${t('user.hint')}</div></div>
        <div class="field"><label for="f-email">${t('auth.email')}</label>
          <input id="f-email" name="email" type="email" autocomplete="email" required />
          <button class="btn ghost sm" type="button" id="check-email" style="margin-top:8px">${t('auth.checkEmail')}</button>
          <div class="hint" id="email-verify-status" role="status"></div></div>
        <div class="field"><label for="f-pass">${t('auth.password')}</label>
          <input id="f-pass" name="password" type="password" autocomplete="new-password" minlength="8" required />
          <div class="hint">${t('auth.passwordHint')}</div></div>
        <button class="btn block" type="submit" disabled>${t('signup')}</button>
      </form>
      <p class="alt">${t('auth.haveAccount')} <a href="/login">${t('login')}</a></p>
    </div>`;

  usernameChecker($('#f-user'), $('#user-hint'));
  let checkedEmail = '';
  const emailInput = $('#f-email');
  const submitButton = $('button[type=submit]', emailInput.form);
  const verifyStatus = $('#email-verify-status');
  emailInput.addEventListener('input', () => {
    if (emailInput.value.trim().toLowerCase() === checkedEmail) return;
    checkedEmail = '';
    submitButton.disabled = true;
    verifyStatus.textContent = '';
  });
  $('#check-email').addEventListener('click', async () => {
    const btn = $('#check-email');
    verifyStatus.textContent = '';
    btn.disabled = true;
    try {
      const value = emailInput.value.trim().toLowerCase();
      await api('auth/email-check', { method: 'POST', body: { email: value } });
      checkedEmail = value;
      verifyStatus.textContent = t('auth.emailAvailable');
      submitButton.disabled = false;
    } catch (e) { verifyStatus.textContent = errMsg(e); }
    finally { btn.disabled = false; }
  });
  forms.signup = async (f) => {
    const err = $('.form-error', f);
    const btn = $('button[type=submit]', f);
    err.textContent = '';
    if (f.email.value.trim().toLowerCase() !== checkedEmail) {
      err.textContent = t('auth.checkEmailFirst');
      return;
    }
    btn.disabled = true;
    try {
      await api('auth/register', {
        method: 'POST',
        body: { name: f.name.value, username: f.username.value, email: f.email.value, password: f.password.value },
      });
      go(safeNext() || '/home', true);
    } catch (e) { err.textContent = errMsg(e); btn.disabled = false; }
  };
  setTimeout(() => $('#f-name')?.focus(), 30);


})();
