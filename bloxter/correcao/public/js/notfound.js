// Se a Vercel não aplicou o rewrite de /account/usuario ou /messages/usuario,
// carrega o script certo aqui mesmo em vez de mostrar o 404.
(() => {
  const seg = location.pathname.split('/').filter(Boolean);
  const map = { account: '/js/profile.js', messages: '/js/chat.js' };
  if (seg.length === 2 && map[seg[0]]) {
    window.__bxFallback = true;
    document.title = 'Bloxter';
    const s = document.createElement('script');
    s.src = map[seg[0]];
    document.body.appendChild(s);
  }
})();
(async () => {
  if (window.__bxFallback) return;
  const { $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt, accountPath, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText, setActiveNav, updateBadge, pollUnread, userRow, usernameChecker, postHTML, loadMoreBtn, feed, loadPosts, setFeed, forms, actions, applyLang, applyTheme } = window.BX;
  const v = await BX.init({ auth: 'any', shell: 'public' });
  if (!v) return;

  setTitle(t('notfound.title'));
  v.innerHTML = `<div class="hero"><h1>404</h1><p>${t('notfound.text')}</p>
    <div class="cta"><a class="btn" href="${state.me ? '/home' : '/'}">${t('notfound.back')}</a></div></div>`;


})();
