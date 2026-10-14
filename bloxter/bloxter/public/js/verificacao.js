(() => {
  'use strict';
  const app = document.getElementById('app');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtN = (n) => Number(n).toLocaleString('pt-BR');
  const VERIFIED = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M22.5 12.5l-2.3-2.6.3-3.5-3.4-.8-1.8-3-3.3 1.4-3.3-1.4-1.8 3-3.4.8.3 3.5L1.5 12.5l2.3 2.6-.3 3.5 3.4.8 1.8 3 3.3-1.4 3.3 1.4 1.8-3 3.4-.8-.3-3.5z"/><path fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M7.8 12.4l3 3 5.6-6"/></svg>';

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function api(path, method = 'GET', body) {
    const res = await fetch(`/api/${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    let data = {};
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
      const e = new Error(data.error || 'server');
      e.status = res.status;
      throw e;
    }
    return data;
  }

  function loginView() {
    app.innerHTML = `
      <form class="login box" id="lf">
        <h1>Verificação</h1>
        <div class="sub">Área restrita. Digite a senha.</div>
        <input type="password" name="pw" placeholder="Senha" autocomplete="off" inputmode="numeric" autofocus />
        <div class="err" id="err"></div>
        <button class="btn" type="submit">Entrar</button>
      </form>`;
    document.getElementById('lf').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('err');
      err.textContent = '';
      try {
        await api('admin/login', 'POST', { password: e.target.pw.value });
        panelView();
      } catch (x) {
        err.textContent = x.status === 401 ? 'Senha incorreta.' : 'Erro de conexão. Tente de novo.';
        e.target.pw.select();
      }
    });
  }

  function userHTML(u) {
    return `<div class="u" data-u="${esc(u.username)}">
      <div class="uh">
        <span class="av">${u.avatar ? `<img src="${esc(u.avatar)}" alt="" />` : esc((u.name || u.username || '?').trim().charAt(0))}</span>
        <div class="info">
          <b>${esc(u.name)}${u.verified ? `<span class="vbadge">${VERIFIED}</span>` : ''}${u.is_ai ? '<span class="aitag">IA</span>' : ''}</b>
          <span class="h">@${esc(u.username)} · <span data-f>${fmtN(u.followers)}</span> seguidores
            <span class="count">(${fmtN(u.real)} reais + ${fmtN(u.bonus)} extras)</span></span>
        </div>
        <a class="btn ghost sm" href="/account/${encodeURIComponent(u.username)}" target="_blank" rel="noopener">Ver perfil</a>
      </div>
      <div class="row">
        <label class="chk"><input type="checkbox" data-k="verified" ${u.verified ? 'checked' : ''} /> Verificado</label>
        <label class="chk"><input type="checkbox" data-k="is_ai" ${u.is_ai ? 'checked' : ''} /> Tag de IA</label>
      </div>
      <div class="row">
        <input class="num" type="number" min="0" step="1" placeholder="Quantidade" data-n />
        <button class="btn sm" data-a="add">Adicionar</button>
        <button class="btn sm ghost" data-a="remove">Remover</button>
        <button class="btn sm ghost" data-a="set">Definir extras</button>
      </div>
    </div>`;
  }

  function panelView() {
    app.innerHTML = `
      <div class="top"><div><h1>Verificação</h1><div class="sub" style="margin:0">Verificado, tag de IA e seguidores.</div></div>
        <button class="btn ghost sm" id="out">Sair</button></div>
      <div class="box">
        <input type="search" id="q" placeholder="Buscar usuário por @ ou nome (vazio = mais recentes)" autocomplete="off" />
        <div id="list"></div>
      </div>`;
    const list = document.getElementById('list');
    const q = document.getElementById('q');
    let seq = 0;
    let t;

    const load = async () => {
      const my = ++seq;
      try {
        const { users } = await api(`admin/users?q=${encodeURIComponent(q.value.trim())}`);
        if (my !== seq) return;
        list.innerHTML = users.length ? users.map(userHTML).join('') : '<div class="empty">Nenhum usuário encontrado.</div>';
      } catch (e) {
        if (e.status === 401) return loginView();
        list.innerHTML = '<div class="empty">Erro ao carregar.</div>';
      }
    };
    q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(load, 300); });
    document.getElementById('out').addEventListener('click', async () => {
      try { await api('admin/logout', 'POST'); } catch { /* ignore */ }
      loginView();
    });

    const patch = async (card, body) => {
      try {
        const { user } = await api(`admin/users/${encodeURIComponent(card.dataset.u)}`, 'PATCH', body);
        card.outerHTML = userHTML(user);
        toast('Salvo!');
      } catch (e) {
        if (e.status === 401) return loginView();
        toast('Não foi possível salvar.');
      }
    };

    list.addEventListener('change', (e) => {
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      patch(e.target.closest('.u'), { [k]: e.target.checked });
    });
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-a]');
      if (!btn) return;
      const card = btn.closest('.u');
      const raw = card.querySelector('[data-n]').value.trim();
      const n = Math.floor(Number(raw));
      if (raw === '' || !Number.isFinite(n) || n < 0) return toast('Digite uma quantidade válida.');
      const a = btn.dataset.a;
      patch(card, a === 'add' ? { add_followers: n } : a === 'remove' ? { add_followers: -n } : { set_bonus: n });
    });
    load();
  }

  (async () => {
    try { await api('admin/me'); panelView(); } catch { loginView(); }
  })();
})();
