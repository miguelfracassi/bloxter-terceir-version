(async () => {
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'required', shell: 'app', active: 'home' });
  if (!v) return;
  const faces = [
    ['😀','M7 13c1.2 2 2.8 3 5 3s3.8-1 5-3','M8 9h.01M16 9h.01'],
    ['😂','M7 13c1.2 2 2.8 3 5 3s3.8-1 5-3','M8 9h.01M16 9h.01'],
    ['😍','M7 10l2-2 2 2-2 2zM13 10l2-2 2 2-2 2z','M8 14c1 2 2.5 3 4 3s3-1 4-3'],
    ['😎','M6 9h5v4H6zM13 9h5v4h-5zM11 10h2','M9 16c1.8 1 4.2 1 6 0'],
    ['🥳','M7 12c1 3 3 4 5 4s4-1 5-4','M8 9h.01M16 9h.01'],
    ['😢','M8 10h.01M16 10h.01','M8 16c2-2 6-2 8 0'],
    ['😡','M8 10l2 1M16 10l-2 1','M8 17c2-2 6-2 8 0'],
    ['🤔','M8 10h.01M15 10h.01','M10 16c1-1 2-1 4 0'],
  ];
  const faceSVG = (face) => `<svg viewBox="0 0 24 24" role="img" aria-label="${face[0]}"><circle cx="12" cy="12" r="10" fill="#ffd54f" stroke="#e0a800" stroke-width="1"/><path d="${face[1]}" fill="none" stroke="#5d4037" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="${face[2]}" fill="none" stroke="#5d4037" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  async function homeView(v) {
    setTitle(t('nav.home'));
    v.innerHTML = `
      <div class="page-head"><h1>${t('nav.home')}</h1></div>
      <form class="composer" data-form="post">
        ${avatar(state.me)}
        <div class="box">
          <textarea name="body" maxlength="500" rows="2" placeholder="${esc(t('home.placeholder'))}"></textarea>
          <div class="composer-tools"><button class="composer-tool" type="button" data-act="attachImage" aria-label="${esc(t('image'))}" title="${esc(t('image'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></button><button class="composer-tool" type="button" data-act="emoji" aria-label="${esc(t('emoji'))}" title="${esc(t('emoji'))}">${faceSVG(faces[0])}</button>
            <input id="post-image-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden><div class="emoji-picker" hidden>${faces.map(f=>`<button type="button" data-act="insertEmoji" data-emoji="${f[0]}" aria-label="${f[0]}">${faceSVG(f)}</button>`).join('')}</div><div id="post-image-preview" class="post-image-preview"></div></div>
          <div class="row"><span class="counter">500</span><button class="btn sm" type="submit">${t('post')}</button></div>
        </div>
      </form>
      <div class="tabs">
        <button data-act="tab" data-val="all" class="${state.feedTab === 'all' ? 'on' : ''}">${t('home.forYou')}</button>
        <button data-act="tab" data-val="following" class="${state.feedTab === 'following' ? 'on' : ''}">${t('home.following')}</button>
      </div>
      <div id="posts"></div><div id="more"></div>`;
    const imageInput=$('#post-image-input');
    imageInput.addEventListener('change',()=>{const file=imageInput.files&&imageInput.files[0];if(!file)return;if(file.size>1500000){toast('A imagem deve ter até 1,5 MB.');imageInput.value='';return;}const reader=new FileReader();reader.onload=()=>{const form=document.querySelector('.composer');form.dataset.image=reader.result;$('#post-image-preview').innerHTML=`<img src="${reader.result}" alt="Prévia da imagem"><button type="button" data-act="removePostImage" aria-label="Remover imagem">×</button>`;};reader.readAsDataURL(file);});
    setFeed();
    loadPosts(true);
  }

  forms.post = async (f) => {
      const ta = f.body;
      const body = ta.value.trim(), image=f.dataset.image||null;
      if (!body && !image) return toast(t('err.post_empty'));
      const btn = $('button[type=submit]', f);
      btn.disabled = true;
      try {
        const { post } = await api('posts', { method: 'POST', body: { body, image } });
        ta.value = ''; delete f.dataset.image; $('#post-image-input').value=''; $('#post-image-preview').innerHTML='';
        $('.counter', f).textContent = '500';
        const list = $('#posts');
        if (list) {
          const empty = $('.empty', list);
          if (empty) empty.remove();
          list.insertAdjacentHTML('afterbegin', postHTML(post));
        }
      } catch (e) { toast(errMsg(e)); }
      btn.disabled = false;
  };

  actions.removePostImage = (el) => { const f=el.closest('.composer'); delete f.dataset.image; $('#post-image-input').value=''; $('#post-image-preview').innerHTML=''; };
  homeView(v);
})();
