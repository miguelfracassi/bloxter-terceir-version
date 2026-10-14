(async () => {
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'required', shell: 'app' });
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
    if (user.username !== uname) history.replaceState({}, '', accountPath(user.username));
    setTitle(`${user.name} (@${user.username})`);
    const joined = new Date(user.created_at).toLocaleDateString(state.lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' });
    let linkHost = '';
    if (user.link) { try { linkHost = new URL(user.link).host.replace(/^www\./, ''); } catch { linkHost = user.link; } }
    v.innerHTML = `
      <div class="page-head"><h1>${esc(user.name)}<small><span id="c-posts">${user.posts}</span> ${t('posts')}</small></h1></div>
      <div class="profile-top">
        <div class="profile-band"></div>
        <div class="profile-row">
          ${avatar(user, 's120')}
          <div class="btns">
            ${user.is_me
              ? `<a class="btn ghost sm" href="/settings">${t('editProfile')}</a>`
              : `<a class="btn ghost sm" href="/messages/${encodeURIComponent(user.username)}">${t('message')}</a>
                 <button class="btn sm ${user.is_following ? 'ghost' : ''}" data-act="follow" data-user="${esc(user.username)}" data-profile="1">${user.is_following ? t('unfollow') : t('follow')}</button>`}
          </div>
        </div>
        <h2>${esc(user.name)}</h2>
        <div class="handle">@${esc(user.username)}</div>
        ${user.bio ? `<div class="bio">${fmt(user.bio)}</div>` : ''}
        <div class="meta">
          ${user.link ? `<span>🔗 <a href="${esc(user.link)}" target="_blank" rel="noopener noreferrer nofollow">${esc(linkHost)}</a></span>` : ''}
          <span>${t('joined', { date: esc(joined) })}</span>
        </div>
        <div class="counts">
          <span><b id="c-followers">${user.followers}</b> ${t('followers')}</span>
          <span><b>${user.following}</b> ${t('followingLbl')}</span>
        </div>
      </div>
      <div id="posts"></div><div id="more"></div>`;
    feed.endpoint = `users/${encodeURIComponent(user.username)}/posts`;
    feed.emptyHTML = `<div class="empty"><b>${t('home.emptyTitle')}</b></div>`;
    loadPosts(true);
  }
  const seg = location.pathname.split('/').filter(Boolean);
  let uname = '';
  try { uname = decodeURIComponent(seg[1] || ''); } catch { uname = seg[1] || ''; }
  if (!uname) return go(accountPath(state.me.username), true);
  setActiveNav(uname.toLowerCase() === state.me.username ? 'profile' : '');
  profileView(v, uname);
})();
