// ============================================================
// MOSTRUÁRIO DE PERSONAGENS DE LUTA — Firebase Auth + Firestore
// ============================================================

const fields = [
  'nome', 'sexo', 'idade', 'estilo', 'poderes', 'foto',
  'apelido', 'origem', 'altura', 'peso',
  'aparencia', 'personalidade', 'historico', 'motivacao',
  'armas', 'tecnicas', 'fraquezas', 'frase'
];

let currentUser = null;
let editingId = null;

const auth = window.auth;
const db = window.db;

// --- Elementos DOM ---
const authOverlay = document.getElementById('authOverlay');
const loading = document.getElementById('loading');
const toolbar = document.getElementById('toolbar');
const rosterEl = document.getElementById('roster');
const emptyEl = document.getElementById('emptyState');
const headerSubtitle = document.getElementById('headerSubtitle');
const userBar = document.getElementById('userBar');
const userNameEl = document.getElementById('userName');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const charId = document.getElementById('charId');

const modalEls = {};
fields.forEach(f => {
  if (f !== 'foto') modalEls[f] = document.getElementById('m' + f.charAt(0).toUpperCase() + f.slice(1));
});

const mFoto = document.getElementById('mFoto');
const mPhotoWrap = document.getElementById('mPhotoWrap');
const mPhotoPreview = document.getElementById('mPhotoPreview');
const mPhotoLabel = document.getElementById('mPhotoLabel');
const mPhotoRemove = document.getElementById('mPhotoRemove');

// --- Auth UI ---
const authEmail = document.getElementById('authEmail');
const authSenha = document.getElementById('authSenha');
const authMsg = document.getElementById('authMsg');
const authAction = document.getElementById('authAction');
const authFechar = document.getElementById('authFechar');

// ============================================================
// AUTENTICAÇÃO (apenas login)
// ============================================================

function mostrarMensagemAuth(texto) {
  authMsg.textContent = texto;
}

function limparMensagemAuth() {
  authMsg.textContent = '';
}

authFechar.addEventListener('click', () => {
  authOverlay.classList.remove('open');
  limparMensagemAuth();
});

authAction.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const senha = authSenha.value;
  limparMensagemAuth();

  if (!email || !senha) {
    mostrarMensagemAuth('Preencha e-mail e senha.');
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, senha);
    // O auth state observer fecha o overlay automaticamente
  } catch (err) {
    let msg = 'Erro ao autenticar.';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'E-mail ou senha incorretos.';
    if (err.code === 'auth/invalid-email') msg = 'E-mail inválido.';
    mostrarMensagemAuth(msg);
  }
});

document.getElementById('btnLogout').addEventListener('click', () => {
  auth.signOut();
});

// ============================================================
// FIRESTORE — PERSONAGENS
// ============================================================

function colecaoPersonagens() {
  return db.collection('personagens');
}

function render() {
  rosterEl.innerHTML = '';
  if (!currentUser) {
    emptyEl.style.display = 'none';
    rosterEl.style.display = 'none';
    return;
  }

  const col = colecaoPersonagens();
  col.onSnapshot((snapshot) => {
    rosterEl.innerHTML = '';
    if (snapshot.empty) {
      emptyEl.style.display = 'block';
      rosterEl.style.display = 'none';
      return;
    }
    emptyEl.style.display = 'none';
    rosterEl.style.display = 'grid';

    snapshot.forEach(doc => {
      const c = doc.data();
      const id = doc.id;
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-photo">
          ${c.foto ? `<img src="${c.foto}" alt="${c.nome}">` : `<div class="card-photo-empty"><i data-lucide="user"></i></div>`}
        </div>
        <div class="card-body">
          <h3 class="card-name">${escapeHtml(c.nome || 'Sem nome')}</h3>
          <p class="card-style">${escapeHtml(c.estilo || '')}</p>
          <p class="card-meta">
            ${c.idade ? c.idade + ' anos' : ''}
            ${c.sexo ? ' · ' + c.sexo : ''}
            ${c.origem ? ' · ' + c.origem : ''}
          </p>
        </div>
        <div class="card-actions">
          <button class="btn" data-action="edit" data-id="${id}" title="Editar"><i data-lucide="edit-3"></i></button>
          <button class="btn danger" data-action="delete" data-id="${id}" title="Excluir"><i data-lucide="trash-2"></i></button>
        </div>
      `;
      rosterEl.appendChild(card);
    });
    lucide.createIcons();
    cardActionEvents();
  });
}

function cardActionEvents() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') openEdit(id);
      if (action === 'delete') deleteChar(id);
    });
  });
}

function escapeHtml(t) {
  if (!t) return '';
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

// ============================================================
// MODAL DE EDIÇÃO / CRIAÇÃO
// ============================================================

function openEdit(id = null) {
  editingId = id;
  modalTitle.textContent = id ? 'Editar personagem' : 'Novo personagem';
  charId.value = id || '';

  if (id) {
    const col = colecaoPersonagens();
    col.doc(id).get().then(doc => {
      if (doc.exists) {
        const c = doc.data();
        preencherFormulario(c);
      }
    });
  } else {
    limparFormulario();
    applyPhoto('');
  }

  modal.classList.add('open');
}

function limparFormulario() {
  fields.forEach(f => {
    if (f === 'foto') return;
    const el = modalEls[f];
    if (el) el.value = '';
  });
}

function preencherFormulario(c) {
  fields.forEach(f => {
    if (f === 'foto') return;
    const el = modalEls[f];
    if (el) el.value = c[f] !== undefined ? c[f] : '';
  });
  if (c.foto) {
    applyPhoto(c.foto);
  } else {
    applyPhoto('');
  }
}

function closeModal() {
  modal.classList.remove('open');
  editingId = null;
  charId.value = '';
  mFoto.value = '';
  applyPhoto('');
}

function applyPhoto(dataUrl) {
  if (dataUrl) {
    mPhotoPreview.src = dataUrl;
    mPhotoPreview.style.display = 'block';
    mPhotoLabel.textContent = 'Trocar imagem';
    mPhotoRemove.style.display = 'inline-flex';
    mPhotoWrap.classList.add('has-photo');
  } else {
    mPhotoPreview.src = '';
    mPhotoPreview.style.display = 'none';
    mPhotoLabel.textContent = 'Escolher imagem';
    mPhotoRemove.style.display = 'none';
    mPhotoWrap.classList.remove('has-photo');
  }
}

function getFormData() {
  const data = {};
  fields.forEach(f => {
    if (f === 'foto') {
      data[f] = mPhotoPreview.src && mPhotoPreview.style.display !== 'none' ? mPhotoPreview.src : '';
    } else {
      data[f] = modalEls[f] ? modalEls[f].value.trim() : '';
    }
  });
  return data;
}

async function saveChar() {
  const data = getFormData();
  if (!data.nome) {
    alert('Preencha pelo menos o nome.');
    return;
  }

  try {
    const col = colecaoPersonagens();
    if (editingId) {
      await col.doc(editingId).set(data, { merge: true });
    } else {
      await col.add(data);
    }
    closeModal();
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
}

async function deleteChar(id) {
  if (!confirm('Excluir este personagem?')) return;
  try {
    await colecaoPersonagens().doc(id).delete();
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}

function exportJSON() {
  // Exporta localmente os personagens do usuário logado (snapshot atual não é síncrono,
  // então buscamos uma vez)
  colecaoPersonagens().get().then(snapshot => {
    const dados = [];
    snapshot.forEach(doc => dados.push({ id: doc.id, ...doc.data() }));
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mostruario_lutadores.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!Array.isArray(dados)) throw new Error('Não é um array');
      const col = colecaoPersonagens();
      const batch = db.batch();
      dados.forEach(item => {
        const ref = item.id ? col.doc(item.id) : col.doc();
        const { id, ...rest } = item;
        batch.set(ref, rest, { merge: true });
      });
      batch.commit().then(() => {
        alert('Importação concluída.');
      });
    } catch (err) {
      alert('Arquivo JSON inválido.');
    }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!confirm('Limpar todo o mostruário? Essa ação não pode ser desfeita.')) return;
  colecaoPersonagens().get().then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  }).catch(err => alert('Erro ao limpar: ' + err.message));
}

// ============================================================
// EVENTOS
// ============================================================

document.getElementById('btnAdd').addEventListener('click', () => openEdit(null));
document.getElementById('btnExport').addEventListener('click', exportJSON);
document.getElementById('btnClearAll').addEventListener('click', clearAll);

// Import via input oculto
const inputImport = document.createElement('input');
inputImport.type = 'file';
inputImport.accept = '.json';
inputImport.style.display = 'none';
document.body.appendChild(inputImport);

document.getElementById('btnImportFile')?.addEventListener('click', () => inputImport.click());
inputImport.addEventListener('change', (e) => {
  if (e.target.files.length) importJSON(e.target.files[0]);
  e.target.value = '';
});

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modalSave').addEventListener('click', saveChar);

// Foto
mFoto.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => applyPhoto(ev.target.result);
  reader.readAsDataURL(file);
});

mPhotoWrap.addEventListener('click', () => {
  mFoto.click();
});

mPhotoWrap.addEventListener('dragover', (e) => {
  e.preventDefault();
  mPhotoWrap.classList.add('dragover');
});
mPhotoWrap.addEventListener('dragleave', () => {
  mPhotoWrap.classList.remove('dragover');
});
mPhotoWrap.addEventListener('drop', (e) => {
  e.preventDefault();
  mPhotoWrap.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (ev) => applyPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }
});

mPhotoRemove.addEventListener('click', () => {
  mFoto.value = '';
  applyPhoto('');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// ============================================================
// AUTH STATE OBSERVER — controla login/logout
// ============================================================

auth.onAuthStateChanged((user) => {
  loading.style.display = 'none';
  toolbar.style.display = 'none';
  authOverlay.classList.remove('open');
  rosterEl.style.display = 'none';
  emptyEl.style.display = 'none';

  if (user) {
    currentUser = user;
    userNameEl.textContent = user.email;
    userBar.style.display = 'flex';
    headerSubtitle.textContent = 'Seu mostruário de personagens de luta';
    toolbar.style.display = 'flex';
    render();
  } else {
    currentUser = null;
    userBar.style.display = 'none';
    headerSubtitle.textContent = 'Faça login para acessar seu mostruário';
    authOverlay.classList.add('open');
  }
});

lucide.createIcons();
