(async () => {
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, formatCount, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'any', shell: 'app' });
  if (!v) return;
  async function profileView(v, uname) {
    v.innerHTML = `<div class="loading">${t('loading')}</div>`;
    let user;
    try {
      ({ user } = await api(`users/${encodeURIComponent(uname)}`));
    } catch (e) {
      setTitle(t('profile.notfound'));
      v.innerHTML = `<div class="page-head"><h1>${t('nav.profile')}</h1></div>
        <div class="empty"><b>${t('profile.notfound')}</b>${t('profile.notfoundText')}</div>`;
      return;
    }
    if (user.private) { setTitle(user.name); v.innerHTML=`<div class="page-head"><h1>${esc(user.name)}${BX.badges(user)}</h1></div><section class="private-profile">${avatar(user,'s80')}<h2>${esc(user.name)}</h2><p>@${esc(user.username)}</p><p>Esta conta é privada. Siga para ver o perfil e as publicações.</p><button class="btn" data-act="follow" data-user="${esc(user.username)}" data-profile="1" data-profile-private="1">Seguir</button></section>`; return; }
    if (user.unavailable) { setTitle('Perfil indisponível'); v.innerHTML = `<div class="page-head"><h1>${esc(user.name)}</h1></div><div class="empty"><b>Este perfil está indisponível</b><p>Ocorreu um erro ao carregar esta conta.</p></div>`; return; }
    if (user.username !== uname) history.replaceState({}, '', accountPath(user.username));
    setTitle(`${user.name} (@${user.username})`);
    const joined = new Date(user.created_at).toLocaleDateString(state.lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' });
    let linkHost = '';
    if (user.link) { try { linkHost = new URL(user.link).host.replace(/^www\./, ''); } catch { linkHost = user.link; } }
    const gradient=['none','sunset','ocean','aurora','rose'].includes(user.profile_gradient)?user.profile_gradient:'none';
    const font=['default','serif','mono','rounded'].includes(user.profile_font)?user.profile_font:'default';
    const effect=['none','glow','shimmer','float'].includes(user.profile_effect)?user.profile_effect:'none';
    const c1=/^#[0-9a-fA-F]{6}$/.test(user.profile_color_1||'')?user.profile_color_1:'#252525';
    const c2=/^#[0-9a-fA-F]{6}$/.test(user.profile_color_2||'')?user.profile_color_2:'#565656';
    const banner=user.banner?`<img class="profile-banner ${user.banner_animated?'animated':'static'}" src="${esc(user.banner)}" alt="Banner de ${esc(user.name)}">`:'';
    v.innerHTML = `
      <div class="page-head"><h1>${esc(user.name)}${BX.badges(user)}<small><span id="c-posts">${user.posts}</span> ${t('posts')}</small></h1></div>
      <div class="profile-top profile-gradient-${gradient} profile-font-${font} profile-effect-${effect}">
        <div class="profile-band" style="background:linear-gradient(120deg,${c1},${c2})">${banner}</div>
        <div class="profile-row">
          ${avatar(user, 's120')}
          <div class="btns">
            ${user.is_me
              ? `<a class="btn ghost sm" href="/settings">${t('editProfile')}</a>`
              : `<a class="btn ghost sm" href="/chat.html?u=${encodeURIComponent(user.username)}">${t('message')}</a>
                 <button class="btn sm ${user.is_following ? 'ghost' : ''}" data-act="follow" data-user="${esc(user.username)}" data-profile="1" data-fm="${user.follows_me ? 1 : ''}">${BX.followLabel(user)}</button>`}
          </div>
        </div>
        <h2>${esc(user.name)}${BX.badges(user)}</h2>
        <div class="handle">@${esc(user.username)}</div>
        ${user.bio ? `<div class="bio">${fmt(user.bio)}</div>` : ''}
        <div class="meta">
          ${user.link ? `<span>🔗 <a href="${esc(user.link)}" target="_blank" rel="noopener noreferrer nofollow">${esc(linkHost)}</a></span>` : ''}
          <span>${t('joined', { date: esc(joined) })}</span>
        </div>
        <div class="counts">
          <span><b id="c-followers">${formatCount(user.followers)}</b> ${t('followers')}</span>
          <span><b>${formatCount(user.following)}</b> ${t('followingLbl')}</span>
        </div>
      </div>
      <div id="posts"></div><div id="more"></div>`;
    feed.endpoint = `users/${encodeURIComponent(user.username)}/posts`;
    feed.emptyHTML = `<div class="empty"><b>${t('home.emptyTitle')}</b></div>`;
    loadPosts(true);
  }
  const seg = location.pathname.split('/').filter(Boolean);
  let uname = new URLSearchParams(location.search).get('u') || '';
  if (!uname) { try { uname = decodeURIComponent(seg[1] || ''); } catch { uname = seg[1] || ''; } }
  if (!uname) { if (state.me) return go(accountPath(state.me.username), true); return go('/login', true); }
  setActiveNav(state.me && uname.toLowerCase() === state.me.username ? 'profile' : '');
  profileView(v, uname);
})();
