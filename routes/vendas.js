const express = require('express');
const router = express.Router();
const { db, transaction } = require('../database');

router.get('/', (req, res) => {
  const vendas = db.prepare(`
    SELECT v.*,
           COALESCE(p.nome, 'Produto removido') AS produto_nome,
           COALESCE(p.categoria, '-') AS produto_categoria
    FROM vendas v
    LEFT JOIN produtos p ON p.id = v.produto_id
    ORDER BY v.criado_em DESC
  `).all();
  res.json(vendas);
});

router.post('/', (req, res) => {
  const { produto_id, quantidade, feira, data: dataVenda } = req.body;
  if (!produto_id || !quantidade || !feira || !dataVenda) return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(parseInt(produto_id));
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  if (produto.quantidade < parseInt(quantidade)) {
    return res.status(400).json({ erro: 'Estoque insuficiente. Disponível: ' + produto.quantidade + ' unidade(s)' });
  }

  const valor_total = produto.preco_venda * parseInt(quantidade);
  const criado_em = new Date().toISOString();

  const registrarVenda = transaction(() => {
    const info = db.prepare(
      'INSERT INTO vendas (produto_id, quantidade, valor_total, feira, data, registrado_por, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(parseInt(produto_id), parseInt(quantidade), valor_total, feira, dataVenda, req.usuario.nome, criado_em);
    db.prepare('UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?').run(parseInt(quantidade), produto.id);
    return info.lastInsertRowid;
  });

  registrarVenda();
  res.status(201).json({ mensagem: 'Venda registrada com sucesso', valor_total });
});

router.delete('/:id', (req, res) => {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

  const cancelarVenda = transaction(() => {
    if (venda.produto_id) {
      db.prepare('UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?').run(venda.quantidade, venda.produto_id);
    }
    db.prepare('DELETE FROM vendas WHERE id = ?').run(req.params.id);
  });

  cancelarVenda();
  res.json({ mensagem: 'Venda cancelada e estoque restaurado' });
});

module.exports = router;
