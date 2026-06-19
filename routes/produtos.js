const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAdmin } = require('../middleware');

router.get('/', (req, res) => {
  const data = db.load();
  res.json([...data.produtos].sort((a, b) => a.nome.localeCompare(b.nome)));
});

router.get('/:id', (req, res) => {
  const data = db.load();
  const produto = data.produtos.find(p => p.id === parseInt(req.params.id));
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(produto);
});

router.post('/', requireAdmin, (req, res) => {
  const { nome, categoria, preco_custo, preco_venda, quantidade } = req.body;
  if (!nome || !categoria || preco_venda === undefined) return res.status(400).json({ erro: 'Nome, categoria e preço de venda são obrigatórios' });
  const data = db.load();
  const novo = {
    id: data.nextId.produtos++,
    nome, categoria,
    preco_custo: parseFloat(preco_custo) || 0,
    preco_venda: parseFloat(preco_venda),
    quantidade: parseInt(quantidade) || 0,
    criado_em: new Date().toISOString()
  };
  data.produtos.push(novo);
  db.save(data);
  res.status(201).json(novo);
});

router.put('/:id', requireAdmin, (req, res) => {
  const data = db.load();
  const idx = data.produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Produto não encontrado' });
  const { nome, categoria, preco_custo, preco_venda, quantidade } = req.body;
  data.produtos[idx] = {
    ...data.produtos[idx], nome, categoria,
    preco_custo: parseFloat(preco_custo) || 0,
    preco_venda: parseFloat(preco_venda),
    quantidade: parseInt(quantidade) || 0
  };
  db.save(data);
  res.json(data.produtos[idx]);
});

router.delete('/:id', requireAdmin, (req, res) => {
  const data = db.load();
  const idx = data.produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Produto não encontrado' });
  data.produtos.splice(idx, 1);
  db.save(data);
  res.json({ mensagem: 'Produto excluído com sucesso' });
});

module.exports = router;
