const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { inicio, fim, feira, categoria } = req.query;
  const data = db.load();

  let vendas = data.vendas.map(v => {
    const produto = data.produtos.find(p => p.id === v.produto_id);
    return {
      ...v,
      produto_nome: produto ? produto.nome : 'Produto removido',
      produto_categoria: produto ? produto.categoria : '-'
    };
  });

  if (inicio) vendas = vendas.filter(v => v.data >= inicio);
  if (fim) vendas = vendas.filter(v => v.data <= fim);
  if (feira && feira !== 'todas') vendas = vendas.filter(v => v.feira === feira);
  if (categoria && categoria !== 'todas') vendas = vendas.filter(v => v.produto_categoria === categoria);

  vendas.sort((a, b) => new Date(b.data) - new Date(a.data));

  const totalReceita = vendas.reduce((s, v) => s + v.valor_total, 0);
  const totalPecas = vendas.reduce((s, v) => s + v.quantidade, 0);

  const porProdutoMap = {};
  vendas.forEach(v => {
    const key = v.produto_nome;
    if (!porProdutoMap[key]) porProdutoMap[key] = { nome: v.produto_nome, categoria: v.produto_categoria, quantidade: 0, receita: 0 };
    porProdutoMap[key].quantidade += v.quantidade;
    porProdutoMap[key].receita += v.valor_total;
  });

  const porFeiraMap = {};
  vendas.forEach(v => {
    if (!porFeiraMap[v.feira]) porFeiraMap[v.feira] = { feira: v.feira, quantidade: 0, receita: 0 };
    porFeiraMap[v.feira].quantidade += v.quantidade;
    porFeiraMap[v.feira].receita += v.valor_total;
  });

  res.json({
    vendas,
    totalReceita,
    totalPecas,
    totalVendas: vendas.length,
    porProduto: Object.values(porProdutoMap).sort((a, b) => b.receita - a.receita),
    porFeira: Object.values(porFeiraMap).sort((a, b) => b.receita - a.receita)
  });
});

module.exports = router;
