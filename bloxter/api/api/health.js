// Diagnóstico: abra /api/health no navegador. Não usa nenhuma dependência.
module.exports = (req, res) => {
  const out = {
    ok: true,
    node: process.version,
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_SECRET_len_ok: (process.env.JWT_SECRET || '').length >= 16,
    },
    modules: {},
  };
  for (const m of ['bcryptjs', 'jsonwebtoken', '@neondatabase/serverless', '../lib/db', '../lib/auth']) {
    try { require(m); out.modules[m] = 'ok'; }
    catch (e) { out.ok = false; out.modules[m] = String(e && e.message).slice(0, 200); }
  }
  res.status(200).json(out);
};
