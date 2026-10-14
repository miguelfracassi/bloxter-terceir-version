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

        <h3>Personalização Premium</h3>
        ${me.premium ? `<div class="premium-settings">
          <div class="field"><label for="profile-gradient">Gradiente do perfil</label><select id="profile-gradient" name="profile_gradient"><option value="none">Padrão</option><option value="sunset">Pôr do sol</option><option value="ocean">Oceano</option><option value="aurora">Aurora</option><option value="rose">Rosa</option></select></div>
          <div class="field"><label for="profile-font">Fonte do perfil</label><select id="profile-font" name="profile_font"><option value="default">Padrão</option><option value="serif">Serifada</option><option value="mono">Monoespaçada</option><option value="rounded">Arredondada</option></select></div>
          <div class="field"><label for="profile-effect">Efeito</label><select id="profile-effect" name="profile_effect"><option value="none">Sem efeito</option><option value="glow">Brilho</option><option value="shimmer">Reflexo animado</option><option value="float">Flutuação</option></select></div>
          <div class="field"><label for="profile-banner">Banner do perfil (PNG, JPG, WebP ou GIF; até 2 MB)</label><input id="profile-banner" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><input id="banner-animated" type="checkbox" ${me.banner_animated?'checked':''}><label for="banner-animated">Manter animação quando o arquivo for GIF</label><div id="banner-preview">${me.banner?`<img class="banner-preview" src="${esc(me.banner)}" alt="Prévia do banner"><button class="btn ghost sm" type="button" data-act="removeBanner">Remover banner</button>`:''}</div></div>
          <div class="small muted">As animações respeitam a preferência de movimento reduzido do dispositivo.</div>
        </div>` : `<p class="premium-note">Os gradientes, fontes, efeitos e banners personalizados estão disponíveis para contas Premium.</p>`}

        <h3>${t('settings.account')}</h3>
        <div class="setting-row"><div><span>${esc(t('settings.loggedAs', { email: me.email }))}</span></div>
          <button class="btn ghost sm" data-act="logout">${t('logout')}</button></div>
      </div>`;
    usernameChecker($('#s-user'), $('#s-hint'), { selfName: me.username });
    $('#photo').addEventListener('change', onPhoto);
    if(me.premium){$('#profile-gradient').value=me.profile_gradient||'none';$('#profile-font').value=me.profile_font||'default';$('#profile-effect').value=me.profile_effect||'none';$('#profile-banner').addEventListener('change',onBanner);}
  }

  function onBanner(e) {
    const file=e.target.files&&e.target.files[0];if(!file)return;if(file.size>2000000){toast('O banner deve ter até 2 MB.');e.target.value='';return;}
    const f=$('form[data-form=profile]'), save=(data)=>{f.dataset.banner=data;$('#banner-preview').innerHTML=`<img class="banner-preview" src="${data}" alt="Prévia do banner"><button class="btn ghost sm" type="button" data-act="removeBanner">Remover banner</button>`;};
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
        if(state.me.premium){body.profile_gradient=f.profile_gradient.value;body.profile_font=f.profile_font.value;body.profile_effect=f.profile_effect.value;body.banner_animated=$('#banner-animated').checked;if(f.dataset.banner==='remove')body.banner=null;else if(f.dataset.banner)body.banner=f.dataset.banner;}
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

  actions.removeBanner=()=>{const f=$('form[data-form=profile]');f.dataset.banner='remove';$('#banner-preview').innerHTML='';$('#profile-banner').value='';};
  settingsView(v);
})();
