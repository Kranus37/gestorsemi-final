const { verificarToken } = require('./auth');

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;
  if (!header) return cookies;
  header.split(';').forEach(c => {
    const parts = c.trim().split('=');
    const key = parts[0].trim();
    const value = parts.slice(1).join('=');
    cookies[key] = decodeURIComponent(value || '');
  });
  return cookies;
}

function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  const sessao = verificarToken(cookies.token);
  if (!sessao) return res.status(401).json({ erro: 'Não autenticado' });
  req.usuario = sessao;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, parseCookies };
