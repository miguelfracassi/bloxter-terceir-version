// Se algum módulo falhar ao carregar, devolvemos o erro em JSON (em vez da página de erro da Vercel).
let bcrypt, getSql, ensureSchema, getUserId, setSession, clearSession, adminPassword, isAdmin, setAdmin, clearAdmin, loadError;
try {
  bcrypt = require('bcryptjs');
  ({ getSql, ensureSchema } = require('../lib/db'));
  ({ getUserId, setSession, clearSession, adminPassword, isAdmin, setAdmin, clearAdmin } = require('../lib/auth'));
} catch (e) {
  loadError = e;
}

// Nomes que não podem ser usados como nome de usuário.
const RESERVED = new Set([
  'admin', 'administrator', 'root', 'system', 'support', 'suporte', 'help', 'ajuda',
  'bloxter', 'staff', 'mod', 'moderator', 'api', 'account', 'login', 'logout', 'signup',
  'home', 'search', 'messages', 'settings', 'null', 'undefined', 'me',
]);

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PAGE = 30;

function readBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch { return {}; }
  }
  return b;
}

function str(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function avatarUrl(id, v) {
  return Number(v) > 0 ? `/api/avatar/${id}?v=${v}` : null;
}

function cleanUsername(u) {
  return String(u || '').trim().replace(/^@/, '').toLowerCase();
}

function usernameProblem(u) {
  if (!USERNAME_RE.test(u)) return 'invalid_username';
  if (RESERVED.has(u) || u.startsWith('banned_user_')) return 'username_taken';
  return null;
}

function normalizeLink(raw) {
  const v = str(raw, 200);
  if (!v) return '';
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (!['http:', 'https:'].includes(u.protocol) || !u.hostname.includes('.')) throw new Error();
    return u.toString();
  } catch {
    throw new HttpError(400, 'invalid_link');
  }
}

function meUser(r) {
  return {
    id: r.id,
    email: r.email,
    username: r.username,
    name: r.name,
    bio: r.bio,
    link: r.link,
    avatar: avatarUrl(r.id, r.avatar_v),
    ...flags(r),
    created_at: r.created_at,
  };
}

function flags(r) {
  return { verified: !!r.verified, is_ai: !!r.is_ai };
}

function isUnique(e) {
  return e && e.code === '23505';
}

module.exports = async (req, res) => {
  if (loadError) {
    console.error(loadError);
    return res.status(500).json({ error: 'server', detail: `load: ${String(loadError.message).slice(0, 180)}` });
  }
  try {
    const url = new URL(req.url, 'http://localhost');
    // O vercel.json reescreve /api/qualquer/coisa para /api/index?__p=qualquer/coisa.
    // Se __p não vier (ex.: rodando local), usamos o próprio caminho da URL.
    let raw = url.searchParams.get('__p');
    if (raw == null && req.query && req.query.__p != null) {
      raw = Array.isArray(req.query.__p) ? req.query.__p.join('/') : String(req.query.__p);
    }
    const parts = (raw != null ? raw : url.pathname.replace(/^\/api\/?/, ''))
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent);
    const method = req.method;
    const [a, b, c] = parts;
    // Diagnóstico: /api/health testa variáveis, módulos e banco de verdade.
    if (a === 'health') return require('./health')(req, res);
    await ensureSchema();
    const sql = getSql();
    await sql`UPDATE users SET username = 'banned_user_' || id, banned_username = COALESCE(banned_username, username) WHERE banned_at IS NOT NULL AND ban_expires_at <= now() AND username = COALESCE(banned_username, username)`;
    const me = getUserId(req);
    if (a !== 'admin' && me && a !== 'appeals') {
      const [state] = await sql`SELECT banned_at, deleted_at FROM users WHERE id = ${me}`;
      if (state && state.deleted_at) { clearSession(res); throw new HttpError(403, 'account_deleted'); }
      if (state && state.banned_at) throw new HttpError(403, 'account_banned');
    }
    const q = new URLSearchParams(url.search);
    q.delete('__p');
    if (req.query) {
      for (const [k, v] of Object.entries(req.query)) {
        if (k !== '__p' && !q.has(k)) q.set(k, Array.isArray(v) ? v[0] : v);
      }
    }

    const need = () => {
      if (!me) throw new HttpError(401, 'unauthorized');
      return me;
    };
    const send = (data, status = 200) => res.status(status).json(data);

    const mapPost = (r) => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      likes: r.likes,
      liked: r.liked,
      mine: me != null && r.uid === me,
      user: {
        id: r.uid,
        username: r.username,
        name: r.name,
        avatar: avatarUrl(r.uid, r.avatar_v),
        ...flags(r),
      },
    });

    // ---------- ADMIN (/verificacao) ----------
    if (a === 'admin') {
      if (b === 'login' && method === 'POST') {
        const pw = typeof readBody(req).password === 'string' ? readBody(req).password : '';
        if (pw !== adminPassword()) {
          await new Promise((r) => setTimeout(r, 600));
          throw new HttpError(401, 'wrong_password');
        }
        setAdmin(res);
        return send({ ok: true });
      }
      if (b === 'logout' && method === 'POST') {
        clearAdmin(res);
        return send({ ok: true });
      }
      if (!isAdmin(req)) throw new HttpError(401, 'unauthorized');
      if (b === 'me' && method === 'GET') return send({ ok: true });
      if (b === 'accounts' && method === 'GET') {
        const term = str(q.get('q'), 50); const like = `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
        const rows = await sql`SELECT id, email, COALESCE(banned_username,username) AS username, name, avatar_v, banned_at, deleted_at, created_at FROM users WHERE (${term} = '' OR username ILIKE ${like} OR COALESCE(banned_username,username) ILIKE ${like} OR name ILIKE ${like} OR email ILIKE ${like}) ORDER BY id DESC LIMIT 100`;
        return send({ users: rows.map(r => ({...r, avatar: avatarUrl(r.id, r.avatar_v), banned: !!r.banned_at, deleted: !!r.deleted_at})) });
      }
      if (b === 'accounts' && c && method === 'POST') {
        const d = readBody(req); const uname = cleanUsername(c); const [u] = await sql`SELECT id, username, banned_username, banned_at FROM users WHERE username = ${uname} OR banned_username = ${uname} LIMIT 1`;
        if (!u) throw new HttpError(404, 'not_found');
        if (d.action === 'ban') await sql`UPDATE users SET banned_at = now(), ban_expires_at = now() + interval '2 years', banned_username = username WHERE id = ${u.id} AND deleted_at IS NULL`;
        else if (d.action === 'unban') { if (u.banned_username && u.username !== u.banned_username) { const [taken] = await sql`SELECT id FROM users WHERE username = ${u.banned_username} AND id <> ${u.id}`; if (taken) throw new HttpError(409,'username_taken'); await sql`UPDATE users SET username = banned_username, banned_username = NULL, ban_expires_at = NULL, banned_at = NULL WHERE id = ${u.id}`; } else await sql`UPDATE users SET banned_at = NULL, banned_username = NULL, ban_expires_at = NULL WHERE id = ${u.id}`; }
        else if (d.action === 'delete') await sql`UPDATE users SET deleted_at = now() WHERE id = ${u.id}`;
        else if (d.action === 'restore') await sql`UPDATE users SET deleted_at = NULL WHERE id = ${u.id}`;
        else throw new HttpError(400, 'invalid_action');
        return send({ ok: true });
      }
      if (b === 'appeals' && method === 'GET') {
        const rows = await sql`SELECT a.id,a.email,a.phone,a.instagram,a.details,a.status,a.created_at,u.username,u.name FROM appeals a JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 200`;
        return send({ appeals: rows });
      }
      if (b === 'appeals' && c && method === 'PATCH') {
        const d = readBody(req); if (!['approved','rejected'].includes(d.status)) throw new HttpError(400,'invalid_status');
        const [ap] = await sql`UPDATE appeals SET status=${d.status}, resolved_at=now() WHERE id=${Number(c)} RETURNING user_id`;
        if (!ap) throw new HttpError(404,'not_found');
        if (d.status === 'approved') await sql`UPDATE users SET username=CASE WHEN banned_username IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users x WHERE x.username=users.banned_username AND x.id<>users.id) THEN banned_username ELSE username END, banned_at=NULL, banned_username=NULL, ban_expires_at=NULL WHERE id=${ap.user_id}`;
        return send({ok:true});
      }


      const adminUser = (r) => ({
        id: r.id, username: r.username, name: r.name, avatar: avatarUrl(r.id, r.avatar_v),
        ...flags(r), bonus: Number(r.bonus_followers), real: Number(r.real_count), followers: Number(r.real_count) + Number(r.bonus_followers),
      });
      if (b === 'users' && !c && method === 'GET') {
        const term = cleanUsername(q.get('q')).slice(0, 50);
        const like = `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
        const rows = await sql`
          SELECT u.id, u.username, u.name, u.avatar_v, u.verified, u.is_ai, u.bonus_followers,
            (SELECT count(*) FROM follows WHERE followee_id = u.id)::int AS real_count
          FROM users u
          WHERE ${term} = '' OR u.username ILIKE ${like} OR u.name ILIKE ${like}
          ORDER BY u.id DESC LIMIT 40`;
        return send({ users: rows.map(adminUser) });
      }
      if (b === 'users' && c && method === 'PATCH') {
        const d = readBody(req);
        const uname = cleanUsername(c);
        const [cur] = await sql`SELECT * FROM users WHERE username = ${uname}`;
        if (!cur) throw new HttpError(404, 'not_found');
        let verified = cur.verified;
        let isAi = cur.is_ai;
        let bonus = Number(cur.bonus_followers);
        if (typeof d.verified === 'boolean') verified = d.verified;
        if (typeof d.is_ai === 'boolean') isAi = d.is_ai;
        const clamp = (n) => Math.max(0, Math.min(1e12, n));
        if (d.set_bonus !== undefined) {
          const n = Math.floor(Number(d.set_bonus));
          if (!Number.isFinite(n)) throw new HttpError(400, 'invalid_number');
          bonus = clamp(n);
        }
        if (d.add_followers !== undefined) {
          const n = Math.floor(Number(d.add_followers));
          if (!Number.isFinite(n)) throw new HttpError(400, 'invalid_number');
          bonus = clamp(bonus + n);
        }
        const [row] = await sql`
          UPDATE users SET verified = ${verified}, is_ai = ${isAi}, bonus_followers = ${bonus}
          WHERE id = ${cur.id}
          RETURNING id, username, name, avatar_v, verified, is_ai, bonus_followers,
            (SELECT count(*) FROM follows WHERE followee_id = users.id)::int AS real_count`;
        return send({ user: adminUser(row) });
      }
      throw new HttpError(404, 'not_found');
    }

    if (a === 'appeals' && !b && method === 'POST') {
      const d=readBody(req), email=str(d.email,254).toLowerCase(), phone=str(d.phone,40), instagram=str(d.instagram,100), details=str(d.details,2000);
      if (!EMAIL_RE.test(email) || !phone || !details) throw new HttpError(400,'appeal_fields_required');
      const uname=cleanUsername(d.username); const [u]=await sql`SELECT id,banned_at FROM users WHERE (username=${uname} OR banned_username=${uname}) AND deleted_at IS NULL`;
      if (!u || !u.banned_at) throw new HttpError(404,'not_found');
      await sql`INSERT INTO appeals(user_id,email,phone,instagram,details) VALUES(${u.id},${email},${phone},${instagram},${details})`;
      return send({ok:true},201);
    }

    // ---------- AUTH ----------
    if (a === 'auth' && b === 'register' && method === 'POST') {
      const d = readBody(req);
      const email = str(d.email, 254).toLowerCase();
      const username = cleanUsername(d.username);
      const name = str(d.name, 50);
      const password = typeof d.password === 'string' ? d.password : '';
      if (!name) throw new HttpError(400, 'name_required');
      if (!EMAIL_RE.test(email)) throw new HttpError(400, 'invalid_email');
      const up = usernameProblem(username);
      if (up) throw new HttpError(up === 'username_taken' ? 409 : 400, up);
      if (password.length < 8 || password.length > 100) throw new HttpError(400, 'weak_password');

      const dup = await sql`SELECT username, email FROM users WHERE (username = ${username} OR (banned_username = ${username} AND ban_expires_at > now())) OR email = ${email}`;
      if (dup.some((r) => r.username === username)) throw new HttpError(409, 'username_taken');
      if (dup.length) throw new HttpError(409, 'email_taken');

      const hash = await bcrypt.hash(password, 10);
      let row;
      try {
        [row] = await sql`
          INSERT INTO users (email, username, name, password_hash)
          VALUES (${email}, ${username}, ${name}, ${hash})
          RETURNING *`;
      } catch (e) {
        if (isUnique(e)) {
          throw new HttpError(409, /email/.test(`${e.constraint}${e.message}`) ? 'email_taken' : 'username_taken');
        }
        throw e;
      }
      setSession(res, row.id);
      return send({ user: meUser(row) }, 201);
    }

    if (a === 'auth' && b === 'login' && method === 'POST') {
      const d = readBody(req);
      const id = cleanUsername(d.identifier || d.email);
      const password = typeof d.password === 'string' ? d.password : '';
      if (!id || !password) throw new HttpError(400, 'invalid_credentials');
      const [row] = await sql`SELECT * FROM users WHERE email = ${id} OR username = ${id} LIMIT 1`;
      const ok = row && (await bcrypt.compare(password, row.password_hash));
      if (!ok) throw new HttpError(401, 'invalid_credentials');
      if (row.deleted_at) throw new HttpError(403, 'account_deleted');
      if (row.banned_at) throw new HttpError(403, 'account_banned');
      setSession(res, row.id);
      return send({ user: meUser(row) });
    }

    if (a === 'auth' && b === 'logout' && method === 'POST') {
      clearSession(res);
      return send({ ok: true });
    }

    // ---------- USERNAME DISPONÍVEL ----------
    if (a === 'username-available' && method === 'GET') {
      const u = cleanUsername(q.get('u'));
      const problem = usernameProblem(u);
      if (problem === 'invalid_username') return send({ available: false, reason: 'invalid_username' });
      if (problem) return send({ available: false, reason: 'username_taken' });
      const [row] = await sql`SELECT id FROM users WHERE username = ${u} OR (banned_username = ${u} AND ban_expires_at > now())`;
      if (row && row.id !== me) return send({ available: false, reason: 'username_taken' });
      return send({ available: true });
    }

    // ---------- PERFIL PRÓPRIO ----------
    if (a === 'me' && method === 'GET') {
      if (!me) return send({ user: null });
      const [row] = await sql`SELECT * FROM users WHERE id = ${me}`;
      if (!row) {
        clearSession(res);
        return send({ user: null });
      }
      return send({ user: meUser(row) });
    }

    if (a === 'me' && method === 'PATCH') {
      need();
      const d = readBody(req);
      const [cur] = await sql`SELECT * FROM users WHERE id = ${me}`;
      if (!cur) throw new HttpError(401, 'unauthorized');

      let name = cur.name;
      let username = cur.username;
      let bio = cur.bio;
      let link = cur.link;
      let avatar = cur.avatar;
      let avatarV = cur.avatar_v;

      if (d.name !== undefined) {
        name = str(d.name, 50);
        if (!name) throw new HttpError(400, 'name_required');
      }
      if (d.username !== undefined) {
        const u = cleanUsername(d.username);
        if (u !== cur.username) {
          const up = usernameProblem(u);
          if (up) throw new HttpError(up === 'username_taken' ? 409 : 400, up);
          const [taken] = await sql`SELECT id FROM users WHERE username = ${u} AND id <> ${me}`;
          if (taken) throw new HttpError(409, 'username_taken');
          username = u;
        }
      }
      if (d.bio !== undefined) bio = str(d.bio, 160);
      if (d.link !== undefined) link = normalizeLink(d.link);
      if (d.avatar === null) {
        avatar = null;
        avatarV = 0;
      } else if (typeof d.avatar === 'string') {
        if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d.avatar) || d.avatar.length > 300000) {
          throw new HttpError(400, 'invalid_avatar');
        }
        avatar = d.avatar;
        avatarV = Date.now();
      }

      let row;
      try {
        [row] = await sql`
          UPDATE users
          SET name = ${name}, username = ${username}, bio = ${bio}, link = ${link},
              avatar = ${avatar}, avatar_v = ${avatarV}
          WHERE id = ${me}
          RETURNING *`;
      } catch (e) {
        if (isUnique(e)) throw new HttpError(409, 'username_taken');
        throw e;
      }
      return send({ user: meUser(row) });
    }

    // ---------- AVATAR (imagem) ----------
    if (a === 'avatar' && b && method === 'GET') {
      const id = parseInt(b, 10);
      if (!Number.isInteger(id)) throw new HttpError(404, 'not_found');
      const [row] = await sql`SELECT avatar FROM users WHERE id = ${id}`;
      const m = row && row.avatar && row.avatar.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!m) throw new HttpError(404, 'not_found');
      res.setHeader('Content-Type', m[1]);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).send(Buffer.from(m[2], 'base64'));
    }

    // ---------- FEED ----------
    if (a === 'feed' && method === 'GET') {
      need();
      const tab = q.get('tab') === 'following' ? 'following' : 'all';
      const before = parseInt(q.get('before'), 10) || null;
      const rows = await sql`
        SELECT p.id, p.body, p.created_at, u.id AS uid, u.username, u.name, u.avatar_v, u.verified, u.is_ai,
          (SELECT count(*) FROM likes l WHERE l.post_id = p.id)::int AS likes,
          EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${me}) AS liked
        FROM posts p JOIN users u ON u.id = p.user_id
        WHERE (${tab} = 'all' OR p.user_id = ${me}
               OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ${me}))
          AND u.banned_at IS NULL AND u.deleted_at IS NULL
          AND (${before}::int IS NULL OR p.id < ${before}::int)
        ORDER BY p.id DESC LIMIT ${PAGE}`;
      return send({ posts: rows.map(mapPost), more: rows.length === PAGE });
    }

    // ---------- POSTS ----------
    if (a === 'posts' && !b && method === 'POST') {
      need();
      const body = str(readBody(req).body, 500);
      if (!body) throw new HttpError(400, 'post_empty');
      const [row] = await sql`INSERT INTO posts (user_id, body) VALUES (${me}, ${body}) RETURNING id`;
      const [r] = await sql`
        SELECT p.id, p.body, p.created_at, u.id AS uid, u.username, u.name, u.avatar_v, u.verified, u.is_ai,
          0 AS likes, false AS liked
        FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ${row.id}`;
      return send({ post: mapPost(r) }, 201);
    }

    if (a === 'posts' && b && !c && method === 'DELETE') {
      need();
      const id = parseInt(b, 10);
      const del = await sql`DELETE FROM posts WHERE id = ${id} AND user_id = ${me} RETURNING id`;
      if (!del.length) throw new HttpError(404, 'not_found');
      return send({ ok: true });
    }

    if (a === 'posts' && b && c === 'like' && method === 'POST') {
      need();
      const id = parseInt(b, 10);
      const [post] = await sql`SELECT id FROM posts WHERE id = ${id}`;
      if (!post) throw new HttpError(404, 'not_found');
      const del = await sql`DELETE FROM likes WHERE user_id = ${me} AND post_id = ${id} RETURNING post_id`;
      if (!del.length) await sql`INSERT INTO likes (user_id, post_id) VALUES (${me}, ${id}) ON CONFLICT DO NOTHING`;
      const [n] = await sql`SELECT count(*)::int AS n FROM likes WHERE post_id = ${id}`;
      return send({ liked: !del.length, likes: n.n });
    }

    // ---------- USUÁRIOS ----------
    if (a === 'users' && b && !c && method === 'GET') {
      const uname = cleanUsername(b);
      const [r] = await sql`
        SELECT u.id, COALESCE(u.banned_username,u.username) AS username, u.name, u.bio, u.link, u.avatar_v, u.verified, u.is_ai, u.created_at, u.banned_at, u.deleted_at,
          ((SELECT count(*) FROM follows WHERE followee_id = u.id) + u.bonus_followers)::bigint AS followers,
          (SELECT count(*) FROM follows WHERE follower_id = u.id)::int AS following,
          (SELECT count(*) FROM posts WHERE user_id = u.id)::int AS posts,
          EXISTS (SELECT 1 FROM follows WHERE follower_id = ${me} AND followee_id = u.id) AS is_following,
          EXISTS (SELECT 1 FROM follows WHERE follower_id = u.id AND followee_id = ${me}) AS follows_me
        FROM users u WHERE u.username = ${uname} OR u.banned_username = ${uname} LIMIT 1`;
      if (!r) throw new HttpError(404, 'not_found');
      if (r.banned_at) return send({ user: { username: r.username, name: r.name, unavailable: true } });
      if (r.deleted_at) throw new HttpError(404, 'not_found');
      return send({
        user: {
          id: r.id,
          username: r.username,
          name: r.name,
          bio: r.bio,
          link: r.link,
          avatar: avatarUrl(r.id, r.avatar_v),
          created_at: r.created_at,
          followers: Number(r.followers),
          ...flags(r),
          follows_me: r.follows_me,
          following: r.following,
          posts: r.posts,
          is_following: r.is_following,
          is_me: me === r.id,
        },
      });
    }

    if (a === 'users' && b && c === 'posts' && method === 'GET') {
      const uname = cleanUsername(b);
      const before = parseInt(q.get('before'), 10) || null;
      const rows = await sql`
        SELECT p.id, p.body, p.created_at, u.id AS uid, u.username, u.name, u.avatar_v, u.verified, u.is_ai,
          (SELECT count(*) FROM likes l WHERE l.post_id = p.id)::int AS likes,
          EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${me}) AS liked
        FROM posts p JOIN users u ON u.id = p.user_id
        WHERE u.username = ${uname} AND u.banned_at IS NULL AND u.deleted_at IS NULL AND (${before}::int IS NULL OR p.id < ${before}::int)
        ORDER BY p.id DESC LIMIT ${PAGE}`;
      return send({ posts: rows.map(mapPost), more: rows.length === PAGE });
    }

    if (a === 'users' && b && c === 'follow' && method === 'POST') {
      need();
      const uname = cleanUsername(b);
      const [target] = await sql`SELECT id FROM users WHERE username = ${uname}`;
      if (!target) throw new HttpError(404, 'not_found');
      if (target.id === me) throw new HttpError(400, 'cannot_follow_self');
      const del = await sql`DELETE FROM follows WHERE follower_id = ${me} AND followee_id = ${target.id} RETURNING follower_id`;
      if (!del.length) {
        await sql`INSERT INTO follows (follower_id, followee_id) VALUES (${me}, ${target.id}) ON CONFLICT DO NOTHING`;
      }
      const [n] = await sql`SELECT ((SELECT count(*) FROM follows WHERE followee_id = ${target.id}) + (SELECT bonus_followers FROM users WHERE id = ${target.id}))::bigint AS n`;
      return send({ following: !del.length, followers: Number(n.n) });
    }

    // ---------- BUSCA / SUGESTÕES ----------
    if (a === 'search' && method === 'GET') {
      need();
      const term = cleanUsername(q.get('q')).slice(0, 50);
      if (!term) return send({ users: [] });
      const like = `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
      const rows = await sql`
        SELECT u.id, u.username, u.name, u.bio, u.avatar_v, u.verified, u.is_ai,
          EXISTS (SELECT 1 FROM follows WHERE follower_id = ${me} AND followee_id = u.id) AS is_following,
          EXISTS (SELECT 1 FROM follows WHERE follower_id = u.id AND followee_id = ${me}) AS follows_me
        FROM users u
        WHERE u.username ILIKE ${like} OR u.name ILIKE ${like}
        ORDER BY (u.username = ${term}) DESC, u.username ASC LIMIT 20`;
      return send({
        users: rows.map((r) => ({
          id: r.id, username: r.username, name: r.name, bio: r.bio,
          avatar: avatarUrl(r.id, r.avatar_v), is_following: r.is_following, follows_me: r.follows_me, is_me: r.id === me, ...flags(r),
        })),
      });
    }

    if (a === 'suggestions' && method === 'GET') {
      need();
      const rows = await sql`
        SELECT u.id, u.username, u.name, u.avatar_v, u.verified, u.is_ai,
          ((SELECT count(*) FROM follows WHERE followee_id = u.id) + u.bonus_followers)::bigint AS followers,
          EXISTS (SELECT 1 FROM follows WHERE follower_id = u.id AND followee_id = ${me}) AS follows_me
        FROM users u
        WHERE u.id <> ${me} AND u.id NOT IN (SELECT followee_id FROM follows WHERE follower_id = ${me})
        ORDER BY followers DESC, u.id DESC LIMIT 5`;
      return send({
        users: rows.map((r) => ({
          id: r.id, username: r.username, name: r.name, avatar: avatarUrl(r.id, r.avatar_v), is_following: false, follows_me: r.follows_me, ...flags(r),
        })),
      });
    }

    // ---------- MENSAGENS ----------
    if (a === 'unread' && method === 'GET') {
      if (!me) return send({ count: 0 });
      const [n] = await sql`SELECT count(*)::int AS n FROM messages WHERE receiver_id = ${me} AND read_at IS NULL`;
      return send({ count: n.n });
    }

    if (a === 'conversations' && method === 'GET') {
      need();
      const rows = await sql`
        WITH m AS (
          SELECT *, CASE WHEN sender_id = ${me} THEN receiver_id ELSE sender_id END AS other
          FROM messages WHERE sender_id = ${me} OR receiver_id = ${me}
        )
        SELECT DISTINCT ON (m.other) m.other, m.body, m.created_at, m.sender_id,
          u.username, u.name, u.avatar_v, u.verified, u.is_ai,
          (SELECT count(*) FROM messages x WHERE x.sender_id = m.other AND x.receiver_id = ${me} AND x.read_at IS NULL)::int AS unread
        FROM m JOIN users u ON u.id = m.other
        ORDER BY m.other, m.id DESC`;
      rows.sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
      return send({
        conversations: rows.map((r) => ({
          user: { id: r.other, username: r.username, name: r.name, avatar: avatarUrl(r.other, r.avatar_v), ...flags(r) },
          last: r.body,
          mine: r.sender_id === me,
          created_at: r.created_at,
          unread: r.unread,
        })),
      });
    }

    if (a === 'messages' && b && method === 'GET') {
      need();
      const [other] = await sql`SELECT id, username, name, avatar_v, verified, is_ai FROM users WHERE username = ${cleanUsername(b)}`;
      if (!other) throw new HttpError(404, 'not_found');
      const after = parseInt(q.get('after'), 10) || 0;
      let rows;
      if (after > 0) {
        rows = await sql`
          SELECT id, sender_id, body, created_at FROM messages
          WHERE ((sender_id = ${me} AND receiver_id = ${other.id}) OR (sender_id = ${other.id} AND receiver_id = ${me}))
            AND id > ${after}
          ORDER BY id ASC LIMIT 200`;
      } else {
        rows = await sql`
          SELECT id, sender_id, body, created_at FROM messages
          WHERE (sender_id = ${me} AND receiver_id = ${other.id}) OR (sender_id = ${other.id} AND receiver_id = ${me})
          ORDER BY id DESC LIMIT 100`;
        rows.reverse();
      }
      await sql`UPDATE messages SET read_at = now() WHERE sender_id = ${other.id} AND receiver_id = ${me} AND read_at IS NULL`;
      return send({
        user: { id: other.id, username: other.username, name: other.name, avatar: avatarUrl(other.id, other.avatar_v), ...flags(other) },
        messages: rows.map((r) => ({ id: r.id, mine: r.sender_id === me, body: r.body, created_at: r.created_at })),
      });
    }

    if (a === 'messages' && b && method === 'POST') {
      need();
      const [other] = await sql`SELECT id FROM users WHERE username = ${cleanUsername(b)}`;
      if (!other) throw new HttpError(404, 'not_found');
      if (other.id === me) throw new HttpError(400, 'cannot_message_self');
      const body = str(readBody(req).body, 1000);
      if (!body) throw new HttpError(400, 'message_empty');
      const [row] = await sql`
        INSERT INTO messages (sender_id, receiver_id, body) VALUES (${me}, ${other.id}, ${body})
        RETURNING id, body, created_at`;
      return send({ message: { id: row.id, mine: true, body: row.body, created_at: row.created_at } }, 201);
    }

    throw new HttpError(404, 'not_found');
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ error: e.code });
    console.error(e);
    const msg = String((e && e.message) || '');
    if (msg.includes('DATABASE_URL')) return res.status(500).json({ error: 'config_db' });
    if (msg.includes('JWT_SECRET')) return res.status(500).json({ error: 'config_jwt' });
    if (/ENOTFOUND|ECONNREFUSED|fetch failed|password authentication|Error connecting/i.test(msg)) {
      return res.status(500).json({ error: 'db_unreachable' });
    }
    const detail = msg.replace(/postgres(ql)?:\/\/\S+/gi, '[url]').slice(0, 200);
    return res.status(500).json({ error: 'server', detail });
  }
};
