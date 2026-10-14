(async () => {
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'guest', shell: 'public' });
  if (!v) return;

  setTitle(t('signup'));
  v.innerHTML = `
    <div class="auth-layout"><aside class="auth-aside"><span class="auth-mark">b</span><h1>Crie seu espaço no Bloxter.</h1><p>Seu perfil, suas histórias e sua comunidade em um só lugar.</p><div class="auth-benefits"><span>✦ Compartilhe fotos e histórias</span><span>✦ Converse com pessoas</span><span>✦ Ajuste sua privacidade quando quiser</span></div></aside>
    <div class="auth-card"><h2>${t('auth.signupTitle')}</h2><p class="sub">${t('auth.signupSub')} Preencha seus dados para começar.</p>
      <form data-form="signup" novalidate><div class="form-error" role="alert"></div>
        <div class="field"><label for="f-name">${t('auth.name')}</label><input id="f-name" name="name" maxlength="50" autocomplete="name" required placeholder="Como você quer ser chamado?" /></div>
        <div class="field"><label for="f-user">${t('auth.username')}</label><div class="prefix-wrap"><span>@</span><input id="f-user" name="username" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" required placeholder="seunome" /></div><div class="hint" id="user-hint">${t('user.hint')}</div></div>
        <div class="field"><label for="f-email">${t('auth.email')}</label><input id="f-email" name="email" type="email" autocomplete="email" required placeholder="voce@exemplo.com" /></div>
        <div class="field"><label for="f-pass">${t('auth.password')}</label><div class="password-wrap"><input id="f-pass" name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="Mínimo de 8 caracteres"><button type="button" data-reveal="f-pass">Mostrar</button></div><div class="strength-track"><span id="pass-strength"></span></div><div class="hint" id="strength-label">Use uma senha longa e exclusiva.</div></div>
        <div class="field"><label for="f-confirm">Confirme sua senha</label><input id="f-confirm" name="confirm_password" type="password" autocomplete="new-password" minlength="8" required placeholder="Digite a senha novamente"></div>
        <label class="terms-check"><input type="checkbox" name="terms" required> Li e aceito os <a href="/termos" target="_blank">Termos de serviço</a>, a <a href="/privacidade" target="_blank">Política de privacidade</a> e as <a href="/conduta" target="_blank">regras da comunidade</a>.</label>
        <button class="btn block" type="submit">${t('signup')}</button>
      </form><p class="alt">${t('auth.haveAccount')} <a href="/login">${t('login')}</a></p><a class="auth-help" href="/support">Dúvidas? A Blia pode ajudar</a>
    </div></div>`;
  v.querySelector('[data-reveal]').onclick=e=>{const input=$('#f-pass');const show=input.type==='password';input.type=show?'text':'password';e.currentTarget.textContent=show?'Ocultar':'Mostrar';};
  const pass=$('#f-pass');pass.addEventListener('input',()=>{const value=pass.value;const score=[value.length>=8,/[A-Z]/.test(value),/[0-9]/.test(value),/[^a-zA-Z0-9]/.test(value)].filter(Boolean).length,bar=$('#pass-strength');bar.style.width=`${score*25}%`;bar.dataset.score=score;$('#strength-label').textContent=['Muito fraca','Fraca','Razoável','Boa','Forte'][score];});

  usernameChecker($('#f-user'), $('#user-hint'));
  forms.signup = async (f) => {
    const err = $('.form-error', f);
    const btn = $('button[type=submit]', f);
    err.textContent = '';
    if(f.password.value!==f.confirm_password.value){err.textContent='As senhas não são iguais.';return;}
    if(!f.terms.checked){err.textContent='Aceite os termos para criar sua conta.';return;}
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
