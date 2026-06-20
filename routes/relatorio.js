const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { inicio, fim, feira, categoria } = req.query;

  let sql = `
    SELECT v.*,
           COALESCE(p.nome, 'Produto removido') AS produto_nome,
           COALESCE(p.categoria, '-') AS produto_categoria
    FROM vendas v
    LEFT JOIN produtos p ON p.id = v.produto_id
    WHERE 1 = 1
  `;
  const params = [];

  if (inicio) { sql += ' AND v.data >= ?'; params.push(inicio); }
  if (fim) { sql += ' AND v.data <= ?'; params.push(fim); }
  if (feira && feira !== 'todas') { sql += ' AND v.feira = ?'; params.push(feira); }
  if (categoria && categoria !== 'todas') { sql += ' AND COALESCE(p.categoria, \'-\') = ?'; params.push(categoria); }

  sql += ' ORDER BY v.data DESC';

  const vendas = db.prepare(sql).all(...params);

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
