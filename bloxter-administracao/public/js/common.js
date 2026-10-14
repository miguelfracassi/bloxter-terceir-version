/* Bloxter — código compartilhado por todas as páginas.
   Cada página carrega este arquivo e depois o seu próprio script (/js/<página>.js). */
(() => {
  'use strict';

  /* =====================================================
     Utilitários
  ===================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const root = $('#root');
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const debounce = (fn, ms) => {
    let id;
    return (...a) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...a), ms);
    };
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  const state = {
    me: null,
    ready: false,
    lang: 'pt',
    theme: 'dark',
    shell: null, // 'app' | 'public'
    next: null,
    timers: [],
    feedTab: 'all',
    unread: 0,
  };

  /* =====================================================
     Idioma (PT / EN)
  ===================================================== */
  const I18N = {
    pt: {
      slogan: 'A rede social feita<br>para quem vive o roleplay',
      sloganText: 'A rede social feita para quem vive o roleplay',
      heroSub: 'Crie seu perfil, publique suas histórias e encontre quem vive o mesmo universo que você.',
      signup: 'Criar conta',
      login: 'Entrar',
      logout: 'Sair',
      or: 'ou',
      'nav.home': 'Início',
      'nav.search': 'Buscar',
      'nav.messages': 'Mensagens',
      'nav.profile': 'Perfil',
      'nav.settings': 'Configurações',
      post: 'Postar',
      'auth.loginTitle': 'Entrar no Bloxter',
      'auth.loginSub': 'Bem-vindo de volta.',
      'auth.signupTitle': 'Criar sua conta',
      'auth.signupSub': 'Leva menos de um minuto.',
      'auth.identifier': 'E-mail ou nome de usuário',
      'auth.email': 'E-mail',
      'auth.password': 'Senha',
      'auth.passwordHint': 'Mínimo de 8 caracteres.',
      'auth.name': 'Nome',
      'auth.username': 'Nome de usuário',
      'auth.noAccount': 'Ainda não tem conta?',
      'auth.haveAccount': 'Já tem conta?',
      'user.checking': 'Verificando...',
      'user.available': 'Disponível!',
      'user.taken': 'Esse nome de usuário já está em uso.',
      'user.invalid': 'Use de 3 a 20 caracteres: letras, números e _.',
      'user.hint': 'Letras, números e _ (3 a 20). Seu perfil: /account/seunome',
      'home.placeholder': 'O que está acontecendo no seu roleplay?',
      'home.forYou': 'Para você',
      'home.following': 'Seguindo',
      'home.emptyTitle': 'Nada por aqui ainda',
      'home.emptyText': 'Publique algo ou siga pessoas para ver posts no seu feed.',
      'home.emptyFollowing': 'Siga pessoas para ver os posts delas aqui.',
      loadMore: 'Carregar mais',
      loading: 'Carregando...',
      'time.now': 'agora',
      like: 'Curtir',
      delete: 'Excluir',
      'post.deleted': 'Post excluído.',
      'post.confirmDelete': 'Excluir este post?',
      follow: 'Seguir',
      followBack: 'Seguir de volta',
      verifiedLbl: 'Verificado',
      unfollow: 'Seguindo',
      followers: 'seguidores',
      followingLbl: 'seguindo',
      posts: 'posts',
      message: 'Mensagem',
      editProfile: 'Editar perfil',
      joined: 'Entrou em {date}',
      'search.title': 'Buscar',
      'search.placeholder': 'Buscar pessoas',
      'search.empty': 'Nenhuma pessoa encontrada.',
      'search.hint': 'Digite um nome ou @usuário para encontrar pessoas.',
      'who.title': 'Quem seguir',
      'msg.title': 'Mensagens',
      'msg.empty': 'Nenhuma conversa ainda. Entre no perfil de alguém e toque em "Mensagem".',
      'msg.placeholder': 'Escreva uma mensagem',
      'msg.send': 'Enviar',
      'msg.you': 'Você: ',
      'msg.start': 'Diga oi para começar a conversa.',
      'settings.title': 'Configurações',
      'settings.profile': 'Perfil',
      'settings.photo': 'Foto de perfil',
      'settings.changePhoto': 'Trocar foto',
      'settings.removePhoto': 'Remover',
      'settings.bio': 'Bio',
      'settings.link': 'Link da bio',
      'settings.linkPh': 'seusite.com',
      'settings.save': 'Salvar alterações',
      'settings.saved': 'Perfil atualizado!',
      'settings.appearance': 'Aparência',
      'settings.language': 'Idioma',
      'settings.theme': 'Tema',
      'settings.themeDark': 'Escuro',
      'settings.themeLight': 'Claro',
      'settings.account': 'Conta',
      'settings.loggedAs': 'Conectado como {email}',
      'notfound.title': 'Página não encontrada',
      'notfound.text': 'Essa página não existe ou foi movida.',
      'notfound.back': 'Voltar ao início',
      'profile.notfound': 'Esta conta não existe',
      'profile.notfoundText': 'Tente buscar por outro nome de usuário.',
      'footer': '© {year} Bloxter',
      'toggle.theme': 'Alternar tema',
      back: 'Voltar',
      'err.server': 'Algo deu errado. Tente novamente em instantes.',
      'err.network': 'Sem conexão. Verifique sua internet.',
      'err.api_down': 'Servidor indisponível: a API não respondeu. Verifique se o deploy da pasta api/ funcionou na Vercel.',
      'err.config_db': 'Banco de dados não configurado: falta a variável DATABASE_URL na Vercel (Storage → Neon → conectar ao projeto) e um novo deploy.',
      'err.config_jwt': 'Falta a variável JWT_SECRET na Vercel (Settings → Environment Variables) e um novo deploy.',
      'err.db_unreachable': 'Não foi possível conectar ao banco de dados. Confira a DATABASE_URL.',
      'err.unauthorized': 'Faça login para continuar.',
      'err.invalid_credentials': 'E-mail/usuário ou senha incorretos.',
      'err.invalid_email': 'Digite um e-mail válido.',
      'err.weak_password': 'A senha precisa ter pelo menos 8 caracteres.',
      'err.invalid_username': 'Nome de usuário inválido. Use 3 a 20 caracteres: letras, números e _.',
      'err.username_taken': 'Esse nome de usuário já está em uso.',
      'err.email_taken': 'Já existe uma conta com esse e-mail.',
      'err.name_required': 'Digite seu nome.',
      'err.post_empty': 'Escreva algo antes de postar.',
      'err.message_empty': 'Escreva uma mensagem.',
      'err.invalid_link': 'Link inválido. Use algo como https://seusite.com',
      'err.invalid_avatar': 'Imagem inválida ou muito grande.',
      'err.not_found': 'Não encontrado.',
      'err.cannot_follow_self': 'Você não pode seguir a si mesmo.',
      'err.cannot_message_self': 'Você não pode enviar mensagem para si mesmo.',
    },
    en: {
      slogan: 'The social network made<br>for those who live roleplay',
      sloganText: 'The social network made for those who live roleplay',
      heroSub: 'Build your profile, share your stories and find people who live in the same universe as you.',
      signup: 'Create account',
      login: 'Log in',
      logout: 'Log out',
      or: 'or',
      'nav.home': 'Home',
      'nav.search': 'Search',
      'nav.messages': 'Messages',
      'nav.profile': 'Profile',
      'nav.settings': 'Settings',
      post: 'Post',
      'auth.loginTitle': 'Log in to Bloxter',
      'auth.loginSub': 'Welcome back.',
      'auth.signupTitle': 'Create your account',
      'auth.signupSub': 'It takes less than a minute.',
      'auth.identifier': 'Email or username',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.passwordHint': 'At least 8 characters.',
      'auth.name': 'Name',
      'auth.username': 'Username',
      'auth.noAccount': "Don't have an account?",
      'auth.haveAccount': 'Already have an account?',
      'user.checking': 'Checking...',
      'user.available': 'Available!',
      'user.taken': 'That username is already taken.',
      'user.invalid': 'Use 3 to 20 characters: letters, numbers and _.',
      'user.hint': 'Letters, numbers and _ (3 to 20). Your profile: /account/yourname',
      'home.placeholder': "What's happening in your roleplay?",
      'home.forYou': 'For you',
      'home.following': 'Following',
      'home.emptyTitle': 'Nothing here yet',
      'home.emptyText': 'Post something or follow people to fill your feed.',
      'home.emptyFollowing': "Follow people to see their posts here.",
      loadMore: 'Load more',
      loading: 'Loading...',
      'time.now': 'now',
      like: 'Like',
      delete: 'Delete',
      'post.deleted': 'Post deleted.',
      'post.confirmDelete': 'Delete this post?',
      follow: 'Follow',
      followBack: 'Follow back',
      verifiedLbl: 'Verified',
      unfollow: 'Following',
      followers: 'followers',
      followingLbl: 'following',
      posts: 'posts',
      message: 'Message',
      editProfile: 'Edit profile',
      joined: 'Joined {date}',
      'search.title': 'Search',
      'search.placeholder': 'Search people',
      'search.empty': 'No people found.',
      'search.hint': 'Type a name or @username to find people.',
      'who.title': 'Who to follow',
      'msg.title': 'Messages',
      'msg.empty': 'No conversations yet. Visit someone\'s profile and tap "Message".',
      'msg.placeholder': 'Write a message',
      'msg.send': 'Send',
      'msg.you': 'You: ',
      'msg.start': 'Say hi to start the conversation.',
      'settings.title': 'Settings',
      'settings.profile': 'Profile',
      'settings.photo': 'Profile photo',
      'settings.changePhoto': 'Change photo',
      'settings.removePhoto': 'Remove',
      'settings.bio': 'Bio',
      'settings.link': 'Bio link',
      'settings.linkPh': 'yoursite.com',
      'settings.save': 'Save changes',
      'settings.saved': 'Profile updated!',
      'settings.appearance': 'Appearance',
      'settings.language': 'Language',
      'settings.theme': 'Theme',
      'settings.themeDark': 'Dark',
      'settings.themeLight': 'Light',
      'settings.account': 'Account',
      'settings.loggedAs': 'Signed in as {email}',
      'notfound.title': 'Page not found',
      'notfound.text': 'This page does not exist or was moved.',
      'notfound.back': 'Back to home',
      'profile.notfound': "This account doesn't exist",
      'profile.notfoundText': 'Try searching for another username.',
      'footer': '© {year} Bloxter',
      'toggle.theme': 'Toggle theme',
      back: 'Back',
      'err.server': 'Something went wrong. Please try again in a moment.',
      'err.network': 'No connection. Check your internet.',
      'err.api_down': 'Server unavailable: the API did not respond. Check that the api/ folder deployed on Vercel.',
      'err.config_db': 'Database not configured: the DATABASE_URL variable is missing on Vercel, then redeploy.',
      'err.config_jwt': 'The JWT_SECRET variable is missing on Vercel, then redeploy.',
      'err.db_unreachable': 'Could not connect to the database. Check DATABASE_URL.',
      'err.unauthorized': 'Log in to continue.',
      'err.invalid_credentials': 'Incorrect email/username or password.',
      'err.invalid_email': 'Enter a valid email.',
      'err.weak_password': 'Password must have at least 8 characters.',
      'err.invalid_username': 'Invalid username. Use 3 to 20 characters: letters, numbers and _.',
      'err.username_taken': 'That username is already taken.',
      'err.email_taken': 'An account with that email already exists.',
      'err.name_required': 'Enter your name.',
      'err.post_empty': 'Write something before posting.',
      'err.message_empty': 'Write a message.',
      'err.invalid_link': 'Invalid link. Use something like https://yoursite.com',
      'err.invalid_avatar': 'Invalid or too large image.',
      'err.not_found': 'Not found.',
      'err.cannot_follow_self': "You can't follow yourself.",
      'err.cannot_message_self': "You can't message yourself.",
    },
  };

  function t(key, vars) {
    let s = (I18N[state.lang] && I18N[state.lang][key]) ?? I18N.en[key] ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, vars[k]);
    return s;
  }
  const errMsg = (e) => {
    const base = t(`err.${e && e.code ? e.code : 'server'}`) + (e && e.code === 'api_down' && e.status ? ` (HTTP ${e.status})` : '');
    return e && e.detail ? `${base} [${e.detail}]` : base;
  };

  function applyLang(lang, rerender = true) {
    state.lang = lang === 'en' ? 'en' : 'pt';
    store.set('bx_lang', state.lang);
    document.documentElement.lang = state.lang === 'pt' ? 'pt-BR' : 'en';
    if (rerender) location.reload();
  }
  function applyTheme(theme) {
    state.theme = theme === 'light' ? 'light' : 'dark';
    store.set('bx_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'light' ? '#ffffff' : '#000000');
    document.querySelectorAll('[data-act="theme"]').forEach((b) => b.setAttribute('aria-label', t('toggle.theme')));
    document.querySelectorAll('.seg-theme button').forEach((b) => b.classList.toggle('on', b.dataset.val === state.theme));
  }

  /* =====================================================
     API
  ===================================================== */
  async function api(path, { method = 'GET', body } = {}) {
    let res;
    try {
      res = await fetch(`/api/${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',
      });
    } catch {
      const e = new Error('network');
      e.code = 'network';
      throw e;
    }
    let data = {};
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
      const e = new Error(data.error || 'server');
      // resposta que não é JSON = a função da API não está rodando (deploy/rota)
      e.code = data.error || (res.status === 404 || res.status >= 500 ? 'api_down' : 'server');
      e.status = res.status;
      if (data.detail) e.detail = data.detail;
      throw e;
    }
    return data;
  }

  /* =====================================================
     Helpers de UI
  ===================================================== */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  const ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
  };

  function avatar(u, cls = '') {
    const initial = esc((u.name || u.username || '?').trim().charAt(0));
    return `<span class="av ${cls}">${u.avatar ? `<img src="${esc(u.avatar)}" alt="" loading="lazy" />` : initial}</span>`;
  }

  function ago(d) {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return t('time.now');
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 604800) return `${Math.floor(s / 86400)}d`;
    return new Date(d).toLocaleDateString(state.lang === 'pt' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'short' });
  }
  const hhmm = (d) =>
    new Date(d).toLocaleTimeString(state.lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  function fmt(text) {
    let s = esc(text);
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
    s = s.replace(/(^|[\s(])@([a-zA-Z0-9_]{3,20})\b/g, (m, p, u) => `${p}<a href="/account/${u.toLowerCase()}">@${u}</a>`);
    return s.replace(/\n/g, '<br>');
  }

  const accountPath = (u) => `/account/${encodeURIComponent(u)}`;

  function langToggle() {
    return `<div class="pill-toggle" role="group" aria-label="Language">
      <button data-act="lang" data-val="pt" class="${state.lang === 'pt' ? 'on' : ''}">PT</button>
      <button data-act="lang" data-val="en" class="${state.lang === 'en' ? 'on' : ''}">EN</button>
    </div>`;
  }
  function themeToggle() {
    return `<button class="icon-btn" data-act="theme" aria-label="${esc(t('toggle.theme'))}" title="${esc(t('toggle.theme'))}">${state.theme === 'dark' ? ICON.sun : ICON.moon}</button>`;
  }
  const toggles = () => `<div class="toggles">${langToggle()}${themeToggle()}</div>`;

  function setTitle(s) {
    document.title = s ? `${s} · Bloxter` : 'Bloxter';
  }
  function clearTimers() {
    state.timers.forEach(clearInterval);
    state.timers = [];
  }

  /* =====================================================
     Navegação (cada página é um arquivo HTML de verdade)
  ===================================================== */
  function go(path, replace = false) {
    if (replace) location.replace(path);
    else location.href = path;
  }

  // Destino depois do login (?next=/rota). Só aceita caminhos internos.
  function safeNext() {
    const n = new URLSearchParams(location.search).get('next');
    if (!n || n[0] !== '/' || n.startsWith('//') || /^\/(login|signup)(\/|\?|$)/.test(n)) return null;
    return n;
  }

  /* =====================================================
     Shells
  ===================================================== */
  function publicShell() {
    state.shell = 'public';
    root.innerHTML = `
      <div class="pub">
        <header class="pub-head">
          <a href="/" aria-label="Bloxter"><img class="logo-img" src="/logo.png" alt="Bloxter" /></a>
          <div class="pub-actions">
            ${toggles()}
            ${state.me ? '' : `<a class="btn ghost sm" href="/login">${t('login')}</a>`}
          </div>
        </header>
        <main class="pub-main" id="view"></main>
        <footer class="pub-foot">${t('footer', { year: new Date().getFullYear() })}</footer>
      </div>`;
    return $('#view');
  }

  function appShell() {
    const mine = accountPath(state.me.username);
    if (state.shell === 'app' && $('#view') && $('.side')) {
      $('.side .me-card').setAttribute('href', mine);
      $('.side [data-nav="profile"]').setAttribute('href', mine);
      $('.tabbar [data-nav="profile"]').setAttribute('href', mine);
      refreshShellText();
      return;
    }
    state.shell = 'app';
    root.innerHTML = `
      <div class="topbar">
        <a href="/home" aria-label="Bloxter">${`<img class="symbol-img" src="/symbol.png" alt="Bloxter" />`}</a>
        ${toggles()}
      </div>
      <div class="shell">
        <aside class="side">
          <a class="brand" href="/home" aria-label="Bloxter"><img class="symbol-img" src="/symbol.png" alt="Bloxter" /></a>
          <nav class="nav">
            <a href="/home" data-nav="home">${ICON.home}<span class="lbl" data-t="nav.home"></span></a>
            <a href="/search" data-nav="search">${ICON.search}<span class="lbl" data-t="nav.search"></span></a>
            <a href="/messages" data-nav="messages">${ICON.msg}<span class="lbl" data-t="nav.messages"></span><span class="badge" data-badge></span></a>
            <a href="${esc(mine)}" data-nav="profile">${ICON.user}<span class="lbl" data-t="nav.profile"></span></a>
            <a href="/settings" data-nav="settings">${ICON.cog}<span class="lbl" data-t="nav.settings"></span></a>
          </nav>
          <a class="btn lg block post-btn" href="/home" data-act="postnow"><span class="lbl" data-t="post"></span></a>
          <a class="me-card" href="${esc(mine)}">
            <span data-me-avatar></span>
            <span class="meta"><b data-me-name></b><span data-me-user></span></span>
          </a>
        </aside>
        <main class="main" id="view"></main>
        <aside class="right">
          <form class="search-form" data-form="sidesearch" role="search">
            <input type="search" name="q" data-ph="search.placeholder" autocomplete="off" />
          </form>
          <div class="box"><h3 data-t="who.title"></h3><div id="suggest"></div></div>
          <div class="foot">
            ${toggles()}
            <button class="btn ghost sm" data-act="logout">${ICON.out}<span data-t="logout"></span></button>
            <span class="small" data-footer></span>
          </div>
        </aside>
      </div>
      <nav class="tabbar">
        <a href="/home" data-nav="home" aria-label="Home">${ICON.home}</a>
        <a href="/search" data-nav="search" aria-label="Search">${ICON.search}</a>
        <a href="/messages" data-nav="messages" aria-label="Messages">${ICON.msg}<span class="badge" data-badge></span></a>
        <a href="${esc(mine)}" data-nav="profile" aria-label="Profile">${ICON.user}</a>
        <a href="/settings" data-nav="settings" aria-label="Settings">${ICON.cog}</a>
      </nav>`;
    refreshShellText();
    loadSuggestions();
    updateBadge();
  }

  function refreshShellText() {
    root.querySelectorAll('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t)));
    root.querySelectorAll('[data-ph]').forEach((el) => el.setAttribute('placeholder', t(el.dataset.ph)));
    const f = $('[data-footer]');
    if (f) f.textContent = t('footer', { year: new Date().getFullYear() });
    const av = $('[data-me-avatar]');
    if (av) av.innerHTML = avatar(state.me);
    const n = $('[data-me-name]');
    if (n) n.textContent = state.me.name;
    const u = $('[data-me-user]');
    if (u) u.textContent = `@${state.me.username}`;
    document.querySelectorAll('.toggles').forEach((el) => (el.outerHTML = toggles()));
  }

  function setActiveNav(name) {
    root.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === name));
  }

  function updateBadge() {
    document.querySelectorAll('[data-badge]').forEach((b) => {
      b.textContent = state.unread > 99 ? '99+' : String(state.unread);
      b.classList.toggle('show', state.unread > 0);
    });
  }
  async function pollUnread() {
    if (!state.me) return;
    try {
      const { count } = await api('unread');
      state.unread = count;
      updateBadge();
    } catch { /* ignore */ }
  }
  setInterval(pollUnread, 20000);

  async function loadSuggestions() {
    const box = $('#suggest');
    if (!box) return;
    try {
      const { users } = await api('suggestions');
      box.innerHTML = users.length
        ? users.map((u) => userRow(u, { compact: true })).join('')
        : `<p class="small" style="color:var(--fg2)">—</p>`;
    } catch { /* ignore */ }
  }

  const VERIFIED_SVG = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M22.5 12.5l-2.3-2.6.3-3.5-3.4-.8-1.8-3-3.3 1.4-3.3-1.4-1.8 3-3.4.8.3 3.5L1.5 12.5l2.3 2.6-.3 3.5 3.4.8 1.8 3 3.3-1.4 3.3 1.4 1.8-3 3.4-.8-.3-3.5z"/><path fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M7.8 12.4l3 3 5.6-6"/></svg>';
  function badges(u) {
    if (!u) return '';
    return (u.verified ? `<span class="vbadge" title="${esc(t('verifiedLbl'))}" aria-label="${esc(t('verifiedLbl'))}">${VERIFIED_SVG}</span>` : '')
      + (u.is_ai ? '<span class="aitag" title="IA">IA</span>' : '');
  }
  function followLabel(u) {
    return u.is_following ? t('unfollow') : (u.follows_me ? t('followBack') : t('follow'));
  }

  function userRow(u, { compact = false } = {}) {
    return `<div class="urow">
      <a href="${accountPath(u.username)}">${avatar(u)}</a>
      <div class="info"><a href="${accountPath(u.username)}"><b>${esc(u.name)}${badges(u)}</b><span>@${esc(u.username)}</span></a></div>
      ${u.is_me ? '' : `<button class="btn sm ${u.is_following ? 'ghost' : ''}" data-act="follow" data-user="${esc(u.username)}" data-fm="${u.follows_me ? 1 : ''}">${followLabel(u)}</button>`}
    </div>`;
  }


  function usernameChecker(input, hint, { selfName } = {}) {
    let seq = 0;
    const run = debounce(async () => {
      const val = input.value.trim().replace(/^@/, '').toLowerCase();
      const my = ++seq;
      if (!val) { hint.className = 'hint'; hint.textContent = t('user.hint'); return; }
      if (selfName && val === selfName) { hint.className = 'hint ok'; hint.textContent = ''; return; }
      if (!/^[a-z0-9_]{3,20}$/.test(val)) { hint.className = 'hint bad'; hint.textContent = t('user.invalid'); return; }
      hint.className = 'hint'; hint.textContent = t('user.checking');
      try {
        const r = await api(`username-available?u=${encodeURIComponent(val)}`);
        if (my !== seq) return;
        if (r.available) { hint.className = 'hint ok'; hint.textContent = `✓ ${t('user.available')}`; }
        else { hint.className = 'hint bad'; hint.textContent = r.reason === 'invalid_username' ? t('user.invalid') : t('user.taken'); }
      } catch { if (my === seq) { hint.className = 'hint'; hint.textContent = ''; } }
    }, 350);
    input.addEventListener('input', run);
  }

  const forms = {
    sidesearch(f) {
      const q = f.q.value.trim();
      go(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    },
  };

  function postHTML(p) {
    return `<article class="post" data-post="${p.id}">
      <a href="${accountPath(p.user.username)}">${avatar(p.user)}</a>
      <div class="body">
        <div class="top">
          <a href="${accountPath(p.user.username)}"><b>${esc(p.user.name)}</b>${badges(p.user)}</a>
          <a class="u" href="${accountPath(p.user.username)}">@${esc(p.user.username)}</a>
          <span class="t">· ${ago(p.created_at)}</span>
        </div>
        <div class="text">${fmt(p.body)}</div>
        <div class="acts">
          <button class="act ${p.liked ? 'liked' : ''}" data-act="like" data-id="${p.id}" aria-label="${esc(t('like'))}">${ICON.heart}<span>${p.likes || ''}</span></button>
          ${p.mine ? `<button class="act" data-act="del" data-id="${p.id}" aria-label="${esc(t('delete'))}">${ICON.trash}</button>` : ''}
        </div>
      </div>
    </article>`;
  }

  function loadMoreBtn(show) {
    return show ? `<div class="more"><button class="btn ghost" data-act="more">${t('loadMore')}</button></div>` : '';
  }

  const feed = { endpoint: '', cursor: null, emptyHTML: '' };

  async function loadPosts(reset) {
    const list = $('#posts');
    const more = $('#more');
    if (!list) return;
    if (reset) { feed.cursor = null; list.innerHTML = `<div class="loading">${t('loading')}</div>`; more.innerHTML = ''; }
    try {
      const sep = feed.endpoint.includes('?') ? '&' : '?';
      const data = await api(`${feed.endpoint}${feed.cursor ? `${sep}before=${feed.cursor}` : ''}`);
      if (reset) list.innerHTML = '';
      if (reset && !data.posts.length) list.innerHTML = feed.emptyHTML;
      list.insertAdjacentHTML('beforeend', data.posts.map(postHTML).join(''));
      if (data.posts.length) feed.cursor = data.posts[data.posts.length - 1].id;
      more.innerHTML = loadMoreBtn(data.more);
    } catch (e) {
      if (reset) list.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`;
      else toast(errMsg(e));
    }
  }

  function setFeed() {
    feed.endpoint = `feed?tab=${state.feedTab}`;
    feed.emptyHTML = `<div class="empty"><b>${t('home.emptyTitle')}</b>${state.feedTab === 'following' ? t('home.emptyFollowing') : t('home.emptyText')}</div>`;
  }

  const actions = {
    lang(el) { applyLang(el.dataset.val); },
    theme() { applyTheme(state.theme === 'dark' ? 'light' : 'dark'); document.querySelectorAll('.toggles').forEach((x) => (x.outerHTML = toggles())); },
    themeset(el) { applyTheme(el.dataset.val); document.querySelectorAll('.toggles').forEach((x) => (x.outerHTML = toggles())); },
    async logout() {
      try { await api('auth/logout', { method: 'POST' }); } catch { /* ignore */ }
      state.me = null; state.unread = 0; state.shell = null;
      go('/', true);
    },
    postnow() { setTimeout(() => $('.composer textarea')?.focus(), 80); },
    async like(el) {
      try {
        const r = await api(`posts/${el.dataset.id}/like`, { method: 'POST' });
        el.classList.toggle('liked', r.liked);
        $('span', el).textContent = r.likes || '';
      } catch (e) { toast(errMsg(e)); }
    },
    async del(el) {
      if (!confirm(t('post.confirmDelete'))) return;
      try {
        await api(`posts/${el.dataset.id}`, { method: 'DELETE' });
        const card = el.closest('.post');
        if (card) card.remove();
        const c = $('#c-posts');
        if (c) c.textContent = Math.max(0, parseInt(c.textContent, 10) - 1);
        toast(t('post.deleted'));
      } catch (e) { toast(errMsg(e)); }
    },
    async follow(el) {
      try {
        const r = await api(`users/${encodeURIComponent(el.dataset.user)}/follow`, { method: 'POST' });
        el.textContent = r.following ? t('unfollow') : (el.dataset.fm ? t('followBack') : t('follow'));
        el.classList.toggle('ghost', r.following);
        if (el.dataset.profile) { const c = $('#c-followers'); if (c) c.textContent = Number(r.followers).toLocaleString(state.lang === 'pt' ? 'pt-BR' : 'en-US'); }
      } catch (e) { toast(errMsg(e)); }
    },
    more() { loadPosts(false); },
    tab(el) {
      state.feedTab = el.dataset.val;
      document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b === el));
      setFeed();
      loadPosts(true);
    },
    pickphoto() { $('#photo').click(); },
    rmphoto() {
      const f = $('form[data-form=profile]');
      f.dataset.avatar = 'remove';
      $('#av-prev').innerHTML = avatar({ ...state.me, avatar: null }, 's64');
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !actions[el.dataset.act]) return;
    if (el.dataset.act === 'postnow') {
      // Na /home só foca o campo; nas outras páginas o link leva para /home.
      if (location.pathname === '/home') { e.preventDefault(); actions.postnow(); }
      return;
    }
    e.preventDefault();
    actions[el.dataset.act](el, e);
  });

  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (f && forms[f.dataset.form]) {
      e.preventDefault();
      forms[f.dataset.form](f);
    }
  });

  document.addEventListener('input', (e) => {
    const ta = e.target;
    if (ta.matches && ta.matches('.composer textarea')) {
      const left = 500 - ta.value.length;
      const c = $('.counter', ta.closest('.composer'));
      c.textContent = left;
      c.classList.toggle('warn', left < 40);
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 260)}px`;
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && e.target.matches && e.target.matches('.composer textarea')) {
      e.target.closest('form').requestSubmit();
    }
  });

  /* =====================================================
     Início de cada página
     auth: 'required' (precisa estar logado) | 'guest' (só visitante) | 'any'
     shell: 'app' (menu lateral) | 'public' (topo simples)
  ===================================================== */
  async function init({ auth = 'any', shell = 'public', active = '' } = {}) {
    const lg = store.get('bx_lang');
    applyLang(lg === 'en' || lg === 'pt' ? lg : (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en', false);
    applyTheme(store.get('bx_theme') === 'light' ? 'light' : 'dark');
    try {
      const { user } = await api('me');
      state.me = user;
    } catch { state.me = null; }
    state.ready = true;

    if (auth === 'required' && !state.me) {
      go(`/login?next=${encodeURIComponent(location.pathname + location.search)}`, true);
      return null;
    }
    if (auth === 'guest' && state.me) {
      go(safeNext() || '/home', true);
      return null;
    }
    if (state.me) pollUnread();
    if (shell === 'app') {
      if (!state.me) return publicShell();
      appShell();
      setActiveNav(active);
      return $('#view');
    }
    return publicShell();
  }

  window.BX = {
    $, root, esc, debounce, store, state, t, errMsg, api, toast, ICON, avatar, ago, hhmm, fmt,
    accountPath, toggles, langToggle, setTitle, go, safeNext, appShell, publicShell, refreshShellText,
    setActiveNav, updateBadge, pollUnread, badges, followLabel, userRow, usernameChecker, postHTML, loadMoreBtn, feed,
    loadPosts, setFeed, forms, actions, applyLang, applyTheme, init,
  };

})();
