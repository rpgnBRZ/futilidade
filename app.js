const STORAGE_KEY = 'fixario_roster_v1';

const fields = [
  'nome', 'sexo', 'idade', 'estilo', 'foto',
  'apelido', 'origem', 'altura', 'peso',
  'aparencia', 'personalidade', 'historico', 'motivacao',
  'armas', 'tecnicas', 'poderes', 'fraquezas', 'frase'
];

let roster = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingId = null;

// DOM
const rosterEl = document.getElementById('roster');
const emptyEl = document.getElementById('emptyState');
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

// Clicar na área da foto abre o seletor de arquivos
mPhotoWrap.addEventListener('click', () => {
  mFoto.click();
});

// Arrastar e soltar imagem na área da foto
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

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
}

function render() {
  rosterEl.innerHTML = '';
  if (roster.length === 0) {
    emptyEl.style.display = 'block';
    rosterEl.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  rosterEl.style.display = 'grid';

  roster.forEach(c => {
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
        <button class="btn" data-action="view" data-id="${c.id}" title="Ver detalhes"><i data-lucide="eye"></i></button>
        <button class="btn" data-action="edit" data-id="${c.id}" title="Editar"><i data-lucide="edit-3"></i></button>
        <button class="btn danger" data-action="delete" data-id="${c.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
      </div>
    `;
    rosterEl.appendChild(card);
  });
  lucide.createIcons();

  cardActionEvents();
}

function cardActionEvents() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') openEdit(id);
      if (action === 'delete') deleteChar(id);
      if (action === 'view') alert('Detalhes: edite o personagem para ver todas as informações.');
    });
  });
}

function escapeHtml(t) {
  if (!t) return '';
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function openEdit(id = null) {
  editingId = id;
  const char = id ? roster.find(c => c.id === id) : null;
  modalTitle.textContent = char ? 'Editar personagem' : 'Novo personagem';
  charId.value = char ? char.id : '';

  fields.forEach(f => {
    if (f === 'foto') return;
    const el = modalEls[f];
    el.value = char && char[f] !== undefined ? char[f] : '';
  });

  if (char && char.foto) {
    applyPhoto(char.foto);
  } else {
    applyPhoto('');
  }

  modal.classList.add('open');
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
  const data = { id: charId.value || Date.now().toString() };
  fields.forEach(f => {
    if (f === 'foto') {
      data[f] = mPhotoPreview.src && mPhotoPreview.style.display !== 'none' ? mPhotoPreview.src : '';
    } else {
      data[f] = modalEls[f] ? modalEls[f].value.trim() : '';
    }
  });
  return data;
}

function saveChar() {
  const data = getFormData();
  if (!data.nome) {
    alert('Preencha pelo menos o nome.');
    return;
  }
  if (editingId) {
    roster = roster.map(c => c.id === editingId ? data : c);
  } else {
    roster.push(data);
  }
  saveStorage();
  render();
  closeModal();
}

function deleteChar(id) {
  if (!confirm('Excluir este personagem?')) return;
  roster = roster.filter(c => c.id !== id);
  saveStorage();
  render();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(roster, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mostruario_lutadores.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        roster = data;
        saveStorage();
        render();
      } else {
        alert('JSON inválido: esperado uma lista de personagens.');
      }
    } catch (err) {
      alert('Erro ao ler o arquivo JSON.');
    }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!confirm('Limpar todo o mostruário? Essa ação não pode ser desfeita.')) return;
  roster = [];
  saveStorage();
  render();
}

// Events
document.getElementById('btnAdd').addEventListener('click', () => openEdit(null));
document.getElementById('btnExport').addEventListener('click', exportJSON);
document.getElementById('btnImportFile').addEventListener('click', () => document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', (e) => {
  if (e.target.files.length) importJSON(e.target.files[0]);
  e.target.value = '';
});
document.getElementById('btnClearAll').addEventListener('click', clearAll);

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modalSave').addEventListener('click', saveChar);

mFoto.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => applyPhoto(ev.target.result);
  reader.readAsDataURL(file);
});

mPhotoRemove.addEventListener('click', () => {
  mFoto.value = '';
  applyPhoto('');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Init
render();
lucide.createIcons();
