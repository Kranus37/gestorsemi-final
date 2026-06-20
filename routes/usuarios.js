const express = require('express');
const router = express.Router();
const { db, hashSenha } = require('../database');
const { requireAdmin } = require('../middleware');

router.use(requireAdmin);

router.get('/', (req, res) => {
  const usuarios = db.prepare('SELECT id, nome, login, perfil FROM usuarios ORDER BY nome COLLATE NOCASE').all();
  res.json(usuarios);
});

router.post('/', (req, res) => {
  const { nome, login, senha, perfil } = req.body;
  if (!nome || !login || !senha || !perfil) return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  const existente = db.prepare('SELECT id FROM usuarios WHERE login = ?').get(login);
  if (existente) return res.status(400).json({ erro: 'Este login já está em uso' });
  const info = db.prepare(
    'INSERT INTO usuarios (nome, login, senha, perfil) VALUES (?, ?, ?, ?)'
  ).run(nome, login, hashSenha(senha), perfil);
  const novo = db.prepare('SELECT id, nome, login, perfil FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(novo);
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Usuário não encontrado' });
  const { nome, login, senha, perfil } = req.body;
  const loginExiste = db.prepare('SELECT id FROM usuarios WHERE login = ? AND id != ?').get(login, req.params.id);
  if (loginExiste) return res.status(400).json({ erro: 'Este login já está em uso' });
  db.prepare(
    'UPDATE usuarios SET nome = ?, login = ?, perfil = ?, senha = ? WHERE id = ?'
  ).run(
    nome || existente.nome,
    login || existente.login,
    perfil || existente.perfil,
    senha ? hashSenha(senha) : existente.senha,
    req.params.id
  );
  const atualizado = db.prepare('SELECT id, nome, login, perfil FROM usuarios WHERE id = ?').get(req.params.id);
  res.json(atualizado);
});

router.delete('/:id', (req, res) => {
  if (parseInt(req.params.id) === req.usuario.id) return res.status(400).json({ erro: 'Você não pode excluir sua própria conta' });
  const existente = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Usuário não encontrado' });
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  res.json({ mensagem: 'Usuário excluído' });
});

module.exports = router;
