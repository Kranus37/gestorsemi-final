const express = require('express');
const path = require('path');
const { requireAuth } = require('./middleware');

const app = express();

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/produtos', requireAuth, require('./routes/produtos'));
app.use('/api/vendas', requireAuth, require('./routes/vendas'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboard'));
app.use('/api/usuarios', requireAuth, require('./routes/usuarios'));
app.use('/api/relatorio', requireAuth, require('./routes/relatorio'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('GestorSemi rodando em http://localhost:3000');
});
