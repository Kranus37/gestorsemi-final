const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'dados.json');

function hashSenha(senha) {
  return crypto.createHash('sha256').update(senha + 'gestorsemi_salt_2026').digest('hex');
}

const usuariosPadrao = [
  { id: 1, nome: 'Proprietária', login: 'admin', senha: hashSenha('admin123'), perfil: 'admin' },
  { id: 2, nome: 'Funcionário', login: 'funcionario', senha: hashSenha('func123'), perfil: 'funcionario' }
];

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const inicial = {
      usuarios: usuariosPadrao,
      produtos: [],
      vendas: [],
      nextId: { produtos: 1, vendas: 1, usuarios: 3 }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(inicial, null, 2));
    return inicial;
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  let alterado = false;
  if (!data.usuarios) { data.usuarios = usuariosPadrao; alterado = true; }
  if (!data.nextId) { data.nextId = { produtos: 1, vendas: 1, usuarios: 3 }; alterado = true; }
  if (!data.nextId.usuarios) { data.nextId.usuarios = data.usuarios.length + 1; alterado = true; }
  if (alterado) fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  return data;
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { load, save, hashSenha };
