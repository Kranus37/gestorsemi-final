async function verificarAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) { window.location.href = '/login.html'; return null; }
    return await res.json();
  } catch (e) { window.location.href = '/login.html'; return null; }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

function configurarNavbar(usuario) {
  const info = document.getElementById('navUsuario');
  if (!info) return;
  info.innerHTML =
    '<button onclick="abrirModalSenha()" style="background:transparent;border:none;cursor:pointer;color:#aaa;font-size:0.82rem;padding:0 8px;transition:color 0.2s" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'#aaa\'">' +
    usuario.nome + ' <span style="color:' + (usuario.perfil === 'admin' ? '#c9a84c' : '#888') + '">(' + (usuario.perfil === 'admin' ? 'Admin' : 'Funcionário') + ')</span>' +
    '</button>' +
    '<button onclick="logout()" style="margin-left:8px;background:transparent;border:1px solid #555;color:#aaa;padding:4px 12px;border-radius:5px;cursor:pointer;font-size:0.8rem;transition:all 0.2s" onmouseover="this.style.borderColor=\'#c0392b\';this.style.color=\'#c0392b\'" onmouseout="this.style.borderColor=\'#555\';this.style.color=\'#aaa\'">Sair</button>';

  if (usuario.perfil === 'admin') {
    const link = document.getElementById('linkUsuarios');
    if (link) link.style.display = 'flex';
  }

  injetarModalSenha();
}

function injetarModalSenha() {
  if (document.getElementById('modalSenhaOverlay')) return;
  const html =
    '<div class="modal-overlay" id="modalSenhaOverlay">' +
    '<div class="modal" style="max-width:400px">' +
    '<h2>Alterar minha senha</h2>' +
    '<div class="form-group"><label>Senha atual</label><input type="password" id="senhaAtual" placeholder="Digite sua senha atual"></div>' +
    '<div class="form-group"><label>Nova senha</label><input type="password" id="novaSenha" placeholder="Mínimo 4 caracteres"></div>' +
    '<div class="form-group"><label>Confirmar nova senha</label><input type="password" id="confirmarSenha" placeholder="Repita a nova senha"></div>' +
    '<div class="modal-acoes">' +
    '<button class="btn btn-secundario" onclick="fecharModalSenha()">Cancelar</button>' +
    '<button class="btn btn-primario" onclick="salvarSenha()">Salvar senha</button>' +
    '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('modalSenhaOverlay').addEventListener('click', function(e) {
    if (e.target === this) fecharModalSenha();
  });
}

function abrirModalSenha() {
  ['senhaAtual','novaSenha','confirmarSenha'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('modalSenhaOverlay').classList.add('aberto');
}

function fecharModalSenha() {
  document.getElementById('modalSenhaOverlay').classList.remove('aberto');
}

async function salvarSenha() {
  const senhaAtual = document.getElementById('senhaAtual').value;
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmar = document.getElementById('confirmarSenha').value;
  if (!senhaAtual || !novaSenha || !confirmar) return toast('Preencha todos os campos', 'erro');
  if (novaSenha !== confirmar) return toast('A nova senha e a confirmação não coincidem', 'erro');
  if (novaSenha.length < 4) return toast('A nova senha deve ter pelo menos 4 caracteres', 'erro');
  const res = await fetch('/api/auth/senha', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ senhaAtual, novaSenha }) });
  const data = await res.json();
  if (!res.ok) return toast(data.erro, 'erro');
  fecharModalSenha();
  toast('Senha alterada com sucesso!', 'sucesso');
}

const fmt = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function toast(msg, tipo) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + tipo + ' visivel';
  setTimeout(() => { t.className = 'toast'; }, 3500);
}
