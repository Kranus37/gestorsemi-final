const crypto = require('crypto');

const sessoes = {};

function gerarToken() {
  return crypto.randomBytes(32).toString('hex');
}

function criarSessao(usuario) {
  const token = gerarToken();
  sessoes[token] = {
    id: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    perfil: usuario.perfil,
    criado: Date.now()
  };
  return token;
}

function verificarToken(token) {
  if (!token || !sessoes[token]) return null;
  const sessao = sessoes[token];
  if (Date.now() - sessao.criado > 24 * 60 * 60 * 1000) {
    delete sessoes[token];
    return null;
  }
  return sessao;
}

function encerrarSessao(token) {
  if (token && sessoes[token]) delete sessoes[token];
}

module.exports = { criarSessao, verificarToken, encerrarSessao };
