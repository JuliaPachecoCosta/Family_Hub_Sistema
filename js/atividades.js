// ============================
// ATIVIDADES
// ============================
let todasAtividades = [];

async function renderAtividades() {
  const list = document.getElementById('ativ-list');
  list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">Carregando...</div>`;
  try {
    const ativs = await api('GET', '/atividades');
    todasAtividades = ativs || [];
    filterAtividades();
  } catch(e) { list.innerHTML = `<div class="empty-state"><div class="empty-state-text">Erro ao carregar</div></div>`; }
}

function filterAtividades() {
  const q = document.getElementById('search-ativ')?.value?.toLowerCase() || '';
  const tipo = state.filtroTipo;
  const membroId = document.getElementById('filtro-membro')?.value || '';
  let filtered = todasAtividades;
  if (q) filtered = filtered.filter(a => a.titulo.toLowerCase().includes(q) || a.descricao?.toLowerCase().includes(q));
  if (tipo) filtered = filtered.filter(a => a.tipo === tipo);
  if (membroId) filtered = filtered.filter(a => a.id_membro == membroId);

  const list = document.getElementById('ativ-list');
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Nenhuma atividade encontrada</div></div>`;
    return;
  }
  list.innerHTML = filtered.map(a => ativCardHTML(a)).join('');
}

function ativCardHTML(a) {
  const done = a.concluida;
  const prioEmoji = { alta:'🔴', media:'🟡', baixa:'🟢' };
  return `
    <div class="ativ-card tipo-${a.tipo} ${done?'concluida':''}" id="ac-${a.id}">
      <div class="ativ-check ${done?'done':''}" onclick="toggleConcluir(${a.id})" title="${done?'Reabrir':'Concluir'}">
        ${done?'<span style="color:#fff;font-size:0.8rem">✓</span>':''}
      </div>
      <div class="ativ-body">
        <div class="ativ-title ${done?'done':''}">${a.titulo}</div>
        <div class="ativ-details">
          <span class="tipo-badge tipo-${a.tipo}">${a.tipo}</span>
          <span style="font-size:0.75rem">${prioEmoji[a.prioridade]||''} ${a.prioridade||''}</span>
          ${a.membro_nome ? `<div class="ativ-member"><div class="member-dot" style="background:${a.membro_cor||'#6366f1'}"></div>${a.membro_nome}</div>` : ''}
          <span class="ativ-date">📅 ${formatDate(a.data_inicio)}${a.hora?' ⏰ '+a.hora:''}</span>
        </div>
      </div>
      <div class="ativ-actions">
        <button class="icon-btn edit" onclick="editAtiv(${a.id})" title="Editar">✏️</button>
        <button class="icon-btn delete" onclick="deleteAtiv(${a.id})" title="Excluir">🗑️</button>
      </div>
    </div>
  `;
}

function setFiltroTipo(el, tipo) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  state.filtroTipo = tipo;
  filterAtividades();
}
