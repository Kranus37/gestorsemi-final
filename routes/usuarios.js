const express = require('express');
const router = express.Router();
const db = require('../database');
const { hashSenha } = require('../database');
const { requireAdmin } = require('../middleware');

router.use(requireAdmin);

router.get('/', (req, res) => {
  const data = db.load();
  const usuarios = data.usuarios.map(u => ({ id: u.id, nome: u.nome, login: u.login, perfil: u.perfil }));
  res.json(usuarios);
});

router.post('/', (req, res) => {
  const { nome, login, senha, perfil } = req.body;
  if (!nome || !login || !senha || !perfil) return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  const data = db.load();
  if (data.usuarios.find(u => u.login === login)) return res.status(400).json({ erro: 'Este login já está em uso' });
  const novo = { id: data.nextId.usuarios++, nome, login, senha: hashSenha(senha), perfil };
  data.usuarios.push(novo);
  db.save(data);
  res.status(201).json({ id: novo.id, nome: novo.nome, login: novo.login, perfil: novo.perfil });
});

router.put('/:id', (req, res) => {
  const data = db.load();
  const idx = data.usuarios.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Usuário não encontrado' });
  const { nome, login, senha, perfil } = req.body;
  const loginExiste = data.usuarios.find(u => u.login === login && u.id !== parseInt(req.params.id));
  if (loginExiste) return res.status(400).json({ erro: 'Este login já está em uso' });
  data.usuarios[idx].nome = nome || data.usuarios[idx].nome;
  data.usuarios[idx].login = login || data.usuarios[idx].login;
  data.usuarios[idx].perfil = perfil || data.usuarios[idx].perfil;
  if (senha) data.usuarios[idx].senha = hashSenha(senha);
  db.save(data);
  const u = data.usuarios[idx];
  res.json({ id: u.id, nome: u.nome, login: u.login, perfil: u.perfil });
});

router.delete('/:id', (req, res) => {
  if (parseInt(req.params.id) === req.usuario.id) return res.status(400).json({ erro: 'Você não pode excluir sua própria conta' });
  const data = db.load();
  const idx = data.usuarios.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Usuário não encontrado' });
  data.usuarios.splice(idx, 1);
  db.save(data);
  res.json({ mensagem: 'Usuário excluído' });
});

module.exports = router;
