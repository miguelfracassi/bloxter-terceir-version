(async () => {
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, verifiedBadge, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'required', shell: 'app', active: 'messages' });
  if (!v) return;
  async function threadView(v, uname) {
    v.innerHTML = `<div class="loading">${t('loading')}</div>`;
    let data;
    try { data = await api(`messages/${encodeURIComponent(uname)}`); }
    catch (e) {
      v.innerHTML = `<div class="page-head"><h1>${t('msg.title')}</h1></div><div class="empty"><b>${t('profile.notfound')}</b></div>`;
      return;
    }
    const other = data.user;
    setTitle(other.name);
    let lastId = 0;
    const bubble = (m) => `<div class="bubble ${m.mine ? 'me' : 'them'}" data-mid="${m.id}">${m.image?`<img class="message-image" src="${esc(m.image)}" alt="Foto enviada na conversa">`:''}${m.body?`<div>${esc(m.body)}</div>`:''}<small>${hhmm(m.created_at)}</small></div>`;
    v.innerHTML = `
      <div class="page-head">
        <a class="icon-btn" href="/messages" aria-label="${esc(t('back'))}">${ICON.arrow}</a>
        <a href="${accountPath(other.username)}" style="display:flex;align-items:center;gap:10px">${avatar(other, 's32')}
          <h1>${esc(other.name)}${verifiedBadge(other)}<small>@${esc(other.username)}</small></h1></a>
      </div>
      <div class="thread">
        <div class="thread-body" id="tbody"></div>
        <form class="thread-form" data-form="message" data-user="${esc(other.username)}">
          <label class="chat-photo" title="Enviar foto"><input type="file" accept="image/png,image/jpeg,image/webp" hidden><span aria-hidden="true">＋</span></label>
          <input name="body" maxlength="1000" autocomplete="off" placeholder="${esc(t('msg.placeholder'))}" />
          <button class="btn" type="submit">${t('msg.send')}</button>
        </form><div id="chat-image-preview" class="chat-image-preview"></div>
      </div>`;
    const body = $('#tbody');
    const photo=$('.chat-photo input',v);photo.addEventListener('change',()=>{const file=photo.files&&photo.files[0];if(!file)return;if(file.size>4000000){toast('A foto precisa ter até 4 MB.');photo.value='';return;}const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const c=document.createElement('canvas'),scale=Math.min(1,1000/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);v.querySelector('form[data-form=message]').dataset.image=c.toDataURL('image/jpeg',.72);URL.revokeObjectURL(url);if(v.querySelector('form[data-form=message]').dataset.image.length>2000000){delete v.querySelector('form[data-form=message]').dataset.image;photo.value='';toast('A imagem ficou grande demais. Escolha uma foto menor.');return;}$('#chat-image-preview').innerHTML=`<img src="${v.querySelector('form[data-form=message]').dataset.image}" alt="Prévia da foto"><button type="button" aria-label="Remover foto">×</button>`;$('#chat-image-preview button').onclick=()=>{delete v.querySelector('form[data-form=message]').dataset.image;photo.value='';$('#chat-image-preview').innerHTML='';};};img.onerror=()=>{URL.revokeObjectURL(url);toast('Não foi possível abrir a foto.');};img.src=url;});
    const add = (msgs, scroll = true) => {
      if (!msgs.length) return;
      const empty = $('.empty', body);
      if (empty) empty.remove();
      body.insertAdjacentHTML('beforeend', msgs.filter((m) => !$(`[data-mid="${m.id}"]`, body)).map(bubble).join(''));
      lastId = Math.max(lastId, ...msgs.map((m) => m.id));
      if (scroll) body.scrollTop = body.scrollHeight;
    };
    if (data.messages.length) add(data.messages);
    else body.innerHTML = `<div class="empty">${t('msg.start')}</div>`;
    v.__thread = { add, getLast: () => lastId };
    state.thread = { add, getLast: () => lastId, user: other.username };
    pollUnread();
    state.timers.push(setInterval(async () => {
      try {
        const r = await api(`messages/${encodeURIComponent(other.username)}?after=${lastId}`);
        const near = body.scrollHeight - body.scrollTop - body.clientHeight < 120;
        add(r.messages, near);
        if (r.messages.length) pollUnread();
      } catch { /* ignore */ }
    }, 4000));
    $('input[name=body]', v).focus();
  }
  forms.message = async (f) => {
    const input = f.body;
    const text = input.value.trim(), image=f.dataset.image||null;
    if (!text&&!image) return;
    input.value = '';
    try {
      const { message } = await api(`messages/${encodeURIComponent(f.dataset.user)}`, { method: 'POST', body: { body: text, image } });
      state.thread && state.thread.add([message]);delete f.dataset.image;$('.chat-photo input',f).value='';$('#chat-image-preview').innerHTML='';
    } catch (e) { input.value = text; toast(errMsg(e)); }
  };

  const seg = location.pathname.split('/').filter(Boolean);
  let uname = '';
  try { uname = decodeURIComponent(seg[1] || ''); } catch { uname = seg[1] || ''; }
  if (!uname) return go('/messages', true);
  threadView(v, uname);
})();
