(async () => {
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'required', shell: 'app', active: 'settings' });
  if (!v) return;
  function settingsView(v) {
    setTitle(t('settings.title'));
    const me = state.me;
    v.innerHTML = `
      <div class="page-head"><h1>${t('settings.title')}</h1></div>
      <div class="settings">
        <h3>${t('settings.profile')}</h3>
        <form data-form="profile" novalidate>
          <div class="avatar-edit">
            <span id="av-prev">${avatar(me, 's64')}</span>
            <div class="btns">
              <button class="btn ghost sm" type="button" data-act="pickphoto">${t('settings.changePhoto')}</button>
              ${me.avatar ? `<button class="btn ghost sm" type="button" data-act="rmphoto">${t('settings.removePhoto')}</button>` : ''}
              <input type="file" id="photo" accept="image/png,image/jpeg,image/webp" hidden />
            </div>
          </div>
          <div class="field"><label for="s-name">${t('auth.name')}</label>
            <input id="s-name" name="name" maxlength="50" value="${esc(me.name)}" /></div>
          <div class="field"><label for="s-user">${t('auth.username')}</label>
            <div class="prefix-wrap"><span>@</span><input id="s-user" name="username" maxlength="20" autocapitalize="none" spellcheck="false" value="${esc(me.username)}" /></div>
            <div class="hint" id="s-hint">${t('user.hint')}</div></div>
          <div class="field"><label for="s-bio">${t('settings.bio')}</label>
            <textarea id="s-bio" name="bio" maxlength="160">${esc(me.bio)}</textarea></div>
          <div class="field"><label for="s-link">${t('settings.link')}</label>
            <input id="s-link" name="link" maxlength="200" placeholder="${esc(t('settings.linkPh'))}" value="${esc(me.link)}" /></div>
          <button class="btn" type="submit">${t('settings.save')}</button>
        </form>

        <h3>${t('settings.appearance')}</h3>
        <div class="setting-row"><div><span>${t('accessibility.title')} · ${t('settings.language')} · ${t('settings.theme')}</span></div>
          <a class="btn ghost sm" href="/accessibility">${t('accessibility.title')}</a></div>
        <h3>Ajuda, privacidade e segurança</h3>
        <div class="setting-row"><div><b>Blia · Assistente virtual</b><div class="small muted">Tire dúvidas sobre como usar o Bloxter.</div></div><a class="btn ghost sm" href="/support">Falar com a Blia</a></div>
        <div class="setting-row"><div><b>Controle parental</b><div class="small muted">Privacidade do perfil, mensagens e horário de descanso.</div></div><a class="btn ghost sm" href="/controle-parental">Abrir configurações</a></div>

        <h3>Personalização Premium</h3>
        ${me.premium ? `<form data-form="premiumProfile" id="premium-profile-form" class="premium-settings" novalidate>
          <div class="field"><label>Cores do perfil</label><div class="color-pickers"><label>Cor inicial <input type="color" name="profile_color_1" value="${esc(me.profile_color_1||'#252525')}"></label><label>Cor final <input type="color" name="profile_color_2" value="${esc(me.profile_color_2||'#565656')}"></label></div></div>
          <div class="field"><label>Escolha a fonte</label><div class="choice-grid font-choices">
            <button type="button" data-font-choice="default" class="choice-card profile-font-default"><strong>Aa</strong><span>Padrão</span></button><button type="button" data-font-choice="serif" class="choice-card profile-font-serif"><strong>Aa</strong><span>Serifada</span></button><button type="button" data-font-choice="mono" class="choice-card profile-font-mono"><strong>Aa</strong><span>Monoespaçada</span></button><button type="button" data-font-choice="rounded" class="choice-card profile-font-rounded"><strong>Aa</strong><span>Arredondada</span></button>
          </div><input type="hidden" name="profile_font" value="${esc(me.profile_font||'default')}"></div>
          <div class="field"><label>Veja os efeitos e escolha um</label><div class="choice-grid effect-choices">
            <button type="button" data-effect-choice="none" class="choice-card"><span class="effect-sample effect-none"></span><span>Sem efeito</span></button><button type="button" data-effect-choice="glow" class="choice-card"><span class="effect-sample effect-glow"></span><span>Brilho</span></button><button type="button" data-effect-choice="shimmer" class="choice-card"><span class="effect-sample effect-shimmer"></span><span>Reflexo</span></button><button type="button" data-effect-choice="float" class="choice-card"><span class="effect-sample effect-float">●</span><span>Flutuação</span></button>
          </div><input type="hidden" name="profile_effect" value="${esc(me.profile_effect||'none')}"></div>
          <div class="profile-style-preview" id="profile-style-preview"><div class="preview-band"></div><div class="preview-person"><div class="preview-avatar">${esc((me.name||'B').slice(0,1).toUpperCase())}</div><div><strong>${esc(me.name)}</strong><small>@${esc(me.username)}</small><p>Prévia do seu perfil</p></div></div></div>
          <div class="field"><label for="profile-banner">Banner do perfil (PNG, JPG, WebP ou GIF; até 2 MB)</label><input id="profile-banner" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><input id="banner-animated" type="checkbox" ${me.banner_animated?'checked':''}><label for="banner-animated">Manter animação quando o arquivo for GIF</label><div id="banner-preview">${me.banner?`<img class="banner-preview" src="${esc(me.banner)}" alt="Prévia do banner"><button class="btn ghost sm" type="button" data-act="removeBanner">Remover banner</button>`:''}</div></div>
          <div class="small muted">As animações respeitam a preferência de movimento reduzido do dispositivo.</div>
          <button class="btn" type="submit">Salvar personalização</button>
        </form>` : `<p class="premium-note">As cores, fontes, efeitos e banners personalizados estão disponíveis para contas Premium.</p>`}

        <h3>${t('settings.account')}</h3>
        <div class="setting-row"><div><span>${esc(t('settings.loggedAs', { email: me.email }))}</span></div>
          <button class="btn ghost sm" data-act="logout">${t('logout')}</button></div>
      </div>`;
    usernameChecker($('#s-user'), $('#s-hint'), { selfName: me.username });
    $('#photo').addEventListener('change', onPhoto);
    if(me.premium){$('#profile-banner').addEventListener('change',onBanner);initPremiumPreview();}
  }

  function initPremiumPreview() {
    const f=$('#premium-profile-form'); if(!f)return;
    const font=f.elements.namedItem('profile_font'), effect=f.elements.namedItem('profile_effect');
    const update=()=>{
      const preview=$('#profile-style-preview');
      preview.className=`profile-style-preview profile-font-${font.value} profile-effect-${effect.value}`;
      const a=f.elements.namedItem('profile_color_1').value, b=f.elements.namedItem('profile_color_2').value;
      $('.preview-band',preview).style.background=`linear-gradient(120deg, ${a}, ${b})`;
      f.querySelectorAll('[data-font-choice]').forEach(x=>x.classList.toggle('selected',x.dataset.fontChoice===font.value));
      f.querySelectorAll('[data-effect-choice]').forEach(x=>x.classList.toggle('selected',x.dataset.effectChoice===effect.value));
    };
    f.addEventListener('input',update); f.addEventListener('change',update);
    f.querySelectorAll('[data-font-choice]').forEach(x=>x.addEventListener('click',()=>{font.value=x.dataset.fontChoice;update();}));
    f.querySelectorAll('[data-effect-choice]').forEach(x=>x.addEventListener('click',()=>{effect.value=x.dataset.effectChoice;update();}));
    update();
  }

  function onBanner(e) {
    const file=e.target.files&&e.target.files[0];if(!file)return;if(file.size>2000000){toast('O banner deve ter até 2 MB.');e.target.value='';return;}
    const f=$('#premium-profile-form'), save=(data)=>{f.dataset.banner=data;$('#banner-preview').innerHTML=`<img class="banner-preview" src="${data}" alt="Prévia do banner"><button class="btn ghost sm" type="button" data-act="removeBanner">Remover banner</button>`;};
    if(file.type==='image/gif'&&!$('#banner-animated').checked){const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);URL.revokeObjectURL(url);save(c.toDataURL('image/png'));};img.onerror=()=>{URL.revokeObjectURL(url);toast('Não foi possível abrir o banner.');};img.src=url;return;}
    const reader=new FileReader();reader.onload=()=>save(reader.result);reader.readAsDataURL(file);
  }

  function onPhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      const data = c.toDataURL('image/jpeg', 0.86);
      URL.revokeObjectURL(url);
      const f = $('form[data-form=profile]');
      f.dataset.avatar = data;
      $('#av-prev').innerHTML = avatar({ ...state.me, avatar: data }, 's64');
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast(t('err.invalid_avatar')); };
    img.src = url;
  }

  forms.profile = async (f) => {
      const btn = $('button[type=submit]', f);
      btn.disabled = true;
      try {
        const body = { name: f.name.value, username: f.username.value, bio: f.bio.value, link: f.link.value };
        if (f.dataset.avatar === 'remove') body.avatar = null;
        else if (f.dataset.avatar) body.avatar = f.dataset.avatar;
        const { user } = await api('me', { method: 'PATCH', body });
        state.me = user;
        delete f.dataset.avatar; delete f.dataset.banner;
        toast(t('settings.saved'));
        appShell();
        refreshShellText();
        settingsView($('#view'));
      } catch (e) { toast(errMsg(e)); btn.disabled = false; }
  };

  forms.premiumProfile = async (f) => {
    const btn=$('button[type=submit]',f);btn.disabled=true;
    try { const body={profile_color_1:f.elements.namedItem('profile_color_1').value,profile_color_2:f.elements.namedItem('profile_color_2').value,profile_font:f.elements.namedItem('profile_font').value,profile_effect:f.elements.namedItem('profile_effect').value,banner_animated:$('#banner-animated').checked};
      if(f.dataset.banner==='remove')body.banner=null;else if(f.dataset.banner)body.banner=f.dataset.banner;
      const {user}=await api('me',{method:'PATCH',body});state.me=user;delete f.dataset.banner;toast('Personalização salva.');appShell();refreshShellText();settingsView($('#view'));
    } catch(e){toast(errMsg(e));btn.disabled=false;}
  };

  actions.removeBanner=()=>{const f=$('#premium-profile-form');f.dataset.banner='remove';$('#banner-preview').innerHTML='';$('#profile-banner').value='';};
  settingsView(v);
})();
