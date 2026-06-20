const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { requireAdmin } = require('../middleware');

router.get('/', (req, res) => {
  const produtos = db.prepare('SELECT * FROM produtos ORDER BY nome COLLATE NOCASE').all();
  res.json(produtos);
});

router.get('/:id', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(produto);
});

router.post('/', requireAdmin, (req, res) => {
  const { nome, categoria, preco_custo, preco_venda, quantidade } = req.body;
  if (!nome || !categoria || preco_venda === undefined) return res.status(400).json({ erro: 'Nome, categoria e preço de venda são obrigatórios' });
  const criado_em = new Date().toISOString();
  const info = db.prepare(
    'INSERT INTO produtos (nome, categoria, preco_custo, preco_venda, quantidade, criado_em) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(nome, categoria, parseFloat(preco_custo) || 0, parseFloat(preco_venda), parseInt(quantidade) || 0, criado_em);
  const novo = db.prepare('SELECT * FROM produtos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(novo);
});

router.put('/:id', requireAdmin, (req, res) => {
  const existente = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });
  const { nome, categoria, preco_custo, preco_venda, quantidade } = req.body;
  db.prepare(
    'UPDATE produtos SET nome = ?, categoria = ?, preco_custo = ?, preco_venda = ?, quantidade = ? WHERE id = ?'
  ).run(
    nome ?? existente.nome,
    categoria ?? existente.categoria,
    parseFloat(preco_custo) || 0,
    parseFloat(preco_venda),
    parseInt(quantidade) || 0,
    req.params.id
  );
  const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  res.json(atualizado);
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existente = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });
  db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  res.json({ mensagem: 'Produto excluído com sucesso' });
});

module.exports = router;
