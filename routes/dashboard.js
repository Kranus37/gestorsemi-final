const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const data = db.load();
  const mesAtual = new Date().toISOString().slice(0, 7);
  const vendasMes = data.vendas.filter(v => v.data.startsWith(mesAtual));
  const totalMes = { receita: vendasMes.reduce((s, v) => s + v.valor_total, 0), quantidade: vendasMes.length };

  const porProduto = {};
  data.vendas.forEach(v => {
    if (!porProduto[v.produto_id]) porProduto[v.produto_id] = { total_vendido: 0, receita: 0 };
    porProduto[v.produto_id].total_vendido += v.quantidade;
    porProduto[v.produto_id].receita += v.valor_total;
  });
  const maisPedidos = Object.entries(porProduto).map(function(e) {
    var p = data.produtos.find(function(x) { return x.id === parseInt(e[0]); });
    return { nome: p ? p.nome : '-', categoria: p ? p.categoria : '-', total_vendido: e[1].total_vendido, receita: e[1].receita };
  }).sort((a, b) => b.total_vendido - a.total_vendido).slice(0, 5);

  const porFeiraMap = {};
  data.vendas.forEach(v => {
    if (!porFeiraMap[v.feira]) porFeiraMap[v.feira] = { receita: 0, pecas_vendidas: 0 };
    porFeiraMap[v.feira].receita += v.valor_total;
    porFeiraMap[v.feira].pecas_vendidas += v.quantidade;
  });
  const porFeira = Object.entries(porFeiraMap).map(function(e) {
    return { feira: e[0], receita: e[1].receita, pecas_vendidas: e[1].pecas_vendidas };
  }).sort((a, b) => b.receita - a.receita);

  const estoqueBaixo = data.produtos.filter(p => p.quantidade <= 5).sort((a, b) => a.quantidade - b.quantidade);
  const totalVendas = data.vendas.reduce((s, v) => s + v.valor_total, 0);

  res.json({ totalMes, maisPedidos, porFeira, estoqueBaixo, totalProdutos: data.produtos.length, totalVendas });
});

module.exports = router;
