const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const data = db.load();
  const vendas = data.vendas.map(v => {
    const produto = data.produtos.find(p => p.id === v.produto_id);
    return { ...v, produto_nome: produto ? produto.nome : 'Produto removido', produto_categoria: produto ? produto.categoria : '-' };
  }).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  res.json(vendas);
});

router.post('/', (req, res) => {
  const { produto_id, quantidade, feira, data: dataVenda } = req.body;
  if (!produto_id || !quantidade || !feira || !dataVenda) return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  const data = db.load();
  const produto = data.produtos.find(p => p.id === parseInt(produto_id));
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  if (produto.quantidade < parseInt(quantidade)) return res.status(400).json({ erro: 'Estoque insuficiente. Disponível: ' + produto.quantidade + ' unidade(s)' });
  const valor_total = produto.preco_venda * parseInt(quantidade);
  const venda = {
    id: data.nextId.vendas++,
    produto_id: parseInt(produto_id),
    quantidade: parseInt(quantidade),
    valor_total,
    feira,
    data: dataVenda,
    registrado_por: req.usuario.nome,
    criado_em: new Date().toISOString()
  };
  data.vendas.push(venda);
  produto.quantidade -= parseInt(quantidade);
  db.save(data);
  res.status(201).json({ mensagem: 'Venda registrada com sucesso', valor_total });
});

router.delete('/:id', (req, res) => {
  const data = db.load();
  const idx = data.vendas.findIndex(v => v.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Venda não encontrada' });
  const venda = data.vendas[idx];
  const produto = data.produtos.find(p => p.id === venda.produto_id);
  if (produto) produto.quantidade += venda.quantidade;
  data.vendas.splice(idx, 1);
  db.save(data);
  res.json({ mensagem: 'Venda cancelada e estoque restaurado' });
});

module.exports = router;
