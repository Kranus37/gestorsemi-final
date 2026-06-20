const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const mesAtual = new Date().toISOString().slice(0, 7);

  const totalMes = db.prepare(
    "SELECT COALESCE(SUM(valor_total), 0) AS receita, COUNT(*) AS quantidade FROM vendas WHERE data LIKE ?"
  ).get(mesAtual + '%');

  const maisPedidos = db.prepare(`
    SELECT p.nome AS nome, p.categoria AS categoria,
           SUM(v.quantidade) AS total_vendido, SUM(v.valor_total) AS receita
    FROM vendas v
    JOIN produtos p ON p.id = v.produto_id
    GROUP BY v.produto_id
    ORDER BY total_vendido DESC
    LIMIT 5
  `).all();

  const porFeira = db.prepare(`
    SELECT feira, SUM(valor_total) AS receita, SUM(quantidade) AS pecas_vendidas
    FROM vendas
    GROUP BY feira
    ORDER BY receita DESC
  `).all();

  const estoqueBaixo = db.prepare(
    'SELECT * FROM produtos WHERE quantidade <= 5 ORDER BY quantidade ASC'
  ).all();

  const totalProdutos = db.prepare('SELECT COUNT(*) AS total FROM produtos').get().total;
  const totalVendas = db.prepare('SELECT COALESCE(SUM(valor_total), 0) AS total FROM vendas').get().total;

  res.json({
    totalMes: { receita: totalMes.receita, quantidade: totalMes.quantidade },
    maisPedidos,
    porFeira,
    estoqueBaixo,
    totalProdutos,
    totalVendas
  });
});

module.exports = router;
