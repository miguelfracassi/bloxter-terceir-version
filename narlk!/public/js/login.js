(async () => {
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'guest', shell: 'public' });
  if (!v) return;

  setTitle(t('login'));
  v.innerHTML = `
    <div class="auth-layout"><aside class="auth-aside"><span class="auth-mark">b</span><h1>Seu universo começa aqui.</h1><p>Entre para conversar, compartilhar publicações, acompanhar stories e personalizar seu perfil no Bloxter.</p><div class="auth-benefits"><span>✦ Comunidade de roleplay</span><span>✦ Perfis e temas personalizados</span><span>✦ Mensagens e stories</span></div></aside>
    <div class="auth-card"><h2>${t('auth.loginTitle')}</h2><p class="sub">${t('auth.loginSub')} Acesse com seu e-mail ou @usuário.</p>
      <form data-form="login" novalidate><div class="form-error" role="alert"></div>
        <div class="field"><label for="f-id">${t('auth.identifier')}</label><input id="f-id" name="identifier" autocomplete="username" autocapitalize="none" required placeholder="voce@exemplo.com ou @usuario" /></div>
        <div class="field"><label for="f-pass">${t('auth.password')}</label><div class="password-wrap"><input id="f-pass" name="password" type="password" autocomplete="current-password" required placeholder="Sua senha"><button type="button" data-reveal="f-pass">Mostrar</button></div></div>
        <button class="btn block" type="submit">${t('login')}</button>
      </form><p class="alt">${t('auth.noAccount')} <a href="/signup">${t('signup')}</a></p><a class="auth-help" href="/support">Precisa de ajuda? Fale com a Blia</a>
    </div></div>`;
  v.querySelector('[data-reveal]').onclick=e=>{const input=$('#f-pass');const show=input.type==='password';input.type=show?'text':'password';e.currentTarget.textContent=show?'Ocultar':'Mostrar';};

  forms.login = async (f) => {
    const err = $('.form-error', f);
    const btn = $('button[type=submit]', f);
    err.textContent = '';
    btn.disabled = true;
    try {
      await api('auth/login', { method: 'POST', body: { identifier: f.identifier.value, password: f.password.value } });
      go(safeNext() || '/home', true);
    } catch (e) { if (e.code === 'account_banned') { err.innerHTML = 'Esta conta foi banida. <a href="/apelacao">Enviar apelação</a>.'; } else if (e.code === 'account_deleted') err.textContent = 'Esta conta foi excluída. Entre em contato com a administração para solicitar a restauração.'; else err.textContent = errMsg(e); btn.disabled = false; }
  };
  setTimeout(() => $('#f-id')?.focus(), 30);


})();
