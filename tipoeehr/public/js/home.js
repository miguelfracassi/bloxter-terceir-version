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
      <section class="story-section"><div class="story-head"><h2>Stories</h2><button class="btn ghost sm" type="button" id="story-create-toggle">Seu story +</button></div><div class="story-strip" id="story-strip"><span class="small muted">Carregando stories…</span></div><form id="story-form" class="story-create" hidden><textarea name="body" maxlength="500" placeholder="Escreva seu story…"></textarea><input name="link" type="url" placeholder="Link opcional (https://…)"/><label class="story-upload">Adicionar imagem ou GIF <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label><div id="story-image-preview"></div><div class="row"><span class="small muted">Os stories ficam disponíveis por 24 horas.</span><button class="btn sm" type="submit">Publicar story</button></div></form></section>
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
    initStories();
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
  async function initStories(){
    const strip=$('#story-strip'),form=$('#story-form');if(!strip||!form)return;
    const render=async()=>{try{const {stories}=await api('stories');strip.innerHTML=stories.length?stories.map(s=>`<button class="story-item ${s.viewed?'viewed':''}" data-story="${s.id}"><span class="story-ring">${avatar(s.user,'s48')}</span><small>${esc(s.mine?'Seu story':s.user.name)}</small>${s.mine?`<em>${s.viewers} visualizações</em>`:''}</button>`).join(''):'<span class="small muted">Ainda não há stories ativos.</span>';strip.querySelectorAll('[data-story]').forEach(btn=>btn.onclick=()=>showStory(stories,Number(btn.dataset.story),render));}catch(e){strip.innerHTML='<span class="small muted">Stories indisponíveis.</span>';}};
    $('#story-create-toggle').onclick=()=>{form.hidden=!form.hidden;};
    const file=form.elements.image;file.onchange=()=>{const f=file.files&&file.files[0];if(!f)return;if(f.size>(f.type==='image/gif'?1400000:4000000)){toast(f.type==='image/gif'?'GIF precisa ter até 1,4 MB.':'A imagem precisa ter até 4 MB.');file.value='';return;}const img=new Image(),url=URL.createObjectURL(f);img.onload=()=>{const c=document.createElement('canvas'),scale=Math.min(1,1200/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const data=f.type==='image/gif'?readFile(f):c.toDataURL('image/jpeg',.82);Promise.resolve(data).then(d=>{if(d.length>2000000){toast('A imagem ficou grande demais; escolha uma menor.');file.value='';URL.revokeObjectURL(url);return;}form.dataset.image=d;$('#story-image-preview').innerHTML=`<img class="story-preview" src="${d}" alt="Prévia do story"><button type="button" id="story-image-remove">Remover</button>`;$('#story-image-remove').onclick=()=>{delete form.dataset.image;file.value='';$('#story-image-preview').innerHTML='';};URL.revokeObjectURL(url);});};img.onerror=()=>{URL.revokeObjectURL(url);toast('Não foi possível abrir a imagem.');};img.src=url;};
    function readFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
    form.onsubmit=async e=>{e.preventDefault();const btn=$('button[type=submit]',form);btn.disabled=true;try{await api('stories',{method:'POST',body:{body:form.elements.body.value,link:form.elements.link.value,image:form.dataset.image||null}});form.reset();delete form.dataset.image;$('#story-image-preview').innerHTML='';toast('Story publicado.');await render();}catch(err){toast(errMsg(err));}finally{btn.disabled=false;}};
    await render();
  }
  function confirmStoryDelete(){return new Promise(resolve=>{const modal=document.createElement('div');modal.className='site-confirm-back';modal.innerHTML='<section class="site-confirm" role="dialog" aria-modal="true"><h2>Apagar story?</h2><p>Esta ação não pode ser desfeita.</p><div><button type="button" data-no>Cancelar</button><button type="button" data-yes>Apagar</button></div></section>';document.body.append(modal);modal.querySelector('[data-no]').onclick=()=>{modal.remove();resolve(false);};modal.querySelector('[data-yes]').onclick=()=>{modal.remove();resolve(true);};});}
  async function showStory(stories,id,refresh){let index=stories.findIndex(s=>s.id===id);if(index<0)return;const old=$('#story-viewer');old?.remove();const modal=document.createElement('div');modal.id='story-viewer';modal.className='story-viewer';document.body.append(modal);const draw=async()=>{let s=stories[index];if(!s)return modal.remove();if(!s.mine)await api(`stories/${s.id}/view`,{method:'POST',body:{}}).catch(()=>{});try{const d=await api(`stories/${s.id}`);s={...s,...d.story};}catch{}modal.innerHTML=`<div class="story-modal"><button class="story-close" aria-label="Fechar">×</button><header>${avatar(s.user,'s32')}<b>${esc(s.user.name)}</b><time>${ago(s.created_at)}</time></header>${s.image?`<img class="story-media" src="${esc(s.image)}" alt="Story">`:''}<p>${esc(s.body)}</p>${s.link?`<a href="${esc(s.link)}" target="_blank" rel="noopener noreferrer">Abrir link ↗</a>`:''}<div class="story-controls">${index?'<button data-prev>Anterior</button>':''}${index<stories.length-1?'<button data-next>Próximo</button>':''}${s.mine?`<button data-viewers>Quem viu (${s.viewers})</button><button data-delete>Apagar</button>`:''}</div><div class="story-viewers"></div></div>`;modal.querySelector('.story-close').onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove();};modal.querySelector('[data-prev]')?.addEventListener('click',()=>{index--;draw();});modal.querySelector('[data-next]')?.addEventListener('click',()=>{index++;draw();});modal.querySelector('[data-viewers]')?.addEventListener('click',async()=>{try{const {viewers}=await api(`stories/${s.id}/viewers`);modal.querySelector('.story-viewers').innerHTML=viewers.length?viewers.map(x=>`<div>${avatar(x,'s32')}<b>${esc(x.name)}</b> <small>${ago(x.viewed_at)}</small></div>`).join(''):'<p>Ninguém viu ainda.</p>';}catch{toast('Não foi possível ver a lista.');}});modal.querySelector('[data-delete]')?.addEventListener('click',async()=>{if(!await confirmStoryDelete())return;try{await api(`stories/${s.id}`,{method:'DELETE'});modal.remove();toast('Story apagado.');refresh();}catch{toast('Não foi possível apagar o story.');}});};await draw();}

  homeView(v);
})();
