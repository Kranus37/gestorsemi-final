const express = require('express');
const router = express.Router();
const db = require('../database');
const { criarSessao, encerrarSessao } = require('../auth');
const { parseCookies, requireAuth } = require('../middleware');
const { hashSenha } = require('../database');

router.post('/login', (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) return res.status(400).json({ erro: 'Login e senha são obrigatórios' });
  const data = db.load();
  const hash = hashSenha(senha);
  const usuario = data.usuarios.find(u => u.login === login && u.senha === hash);
  if (!usuario) return res.status(401).json({ erro: 'Login ou senha incorretos' });
  const token = criarSessao(usuario);
  res.setHeader('Set-Cookie', 'token=' + token + '; Path=/; HttpOnly; Max-Age=86400');
  res.json({ mensagem: 'Login realizado', usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil } });
});

router.post('/logout', (req, res) => {
  const cookies = parseCookies(req);
  encerrarSessao(cookies.token);
  res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; Max-Age=0');
  res.json({ mensagem: 'Logout realizado' });
});

router.get('/me', (req, res) => {
  const cookies = parseCookies(req);
  const { verificarToken } = require('../auth');
  const sessao = verificarToken(cookies.token);
  if (!sessao) return res.status(401).json({ erro: 'Não autenticado' });
  res.json({ id: sessao.id, nome: sessao.nome, perfil: sessao.perfil, login: sessao.login });
});

router.put('/senha', requireAuth, (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha) return res.status(400).json({ erro: 'Informe a senha atual e a nova senha' });
  if (novaSenha.length < 4) return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 4 caracteres' });
  const data = db.load();
  const idx = data.usuarios.findIndex(u => u.id === req.usuario.id);
  if (idx === -1) return res.status(404).json({ erro: 'Usuário não encontrado' });
  if (data.usuarios[idx].senha !== hashSenha(senhaAtual)) return res.status(401).json({ erro: 'Senha atual incorreta' });
  data.usuarios[idx].senha = hashSenha(novaSenha);
  db.save(data);
  res.json({ mensagem: 'Senha alterada com sucesso' });
});

module.exports = router;
