// ============================
// NAVEGAÇÃO
// ============================
const pageTitles = {
  dashboard: 'Dashboard',
  membros: 'Membros da Família',
  atividades: 'Atividades',
  calendario: 'Calendário',
  relatorios: 'Relatórios',
  gamificacao: 'Gamificação 🏆',
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.textContent.toLowerCase().includes(pageTitles[page]?.split(' ')[0]?.toLowerCase() || page)) n.classList.add('active');
  });
  document.getElementById('page-title').textContent = pageTitles[page] || page;
  state.currentPage = page;
  renderPage(page);
  // Fechar sidebar mobile
  document.getElementById('sidebar').classList.remove('mobile-open');
}

function renderPage(page) {
  const actions = document.getElementById('topbar-actions');
  actions.innerHTML = '';
  if (page === 'dashboard') { renderDashboard(); }
  else if (page === 'membros') {
    actions.innerHTML = `<button class="btn btn-primary" onclick="openModalMembro()">+ Novo Membro</button>`;
    renderMembros();
  }
  else if (page === 'atividades') {
    actions.innerHTML = `<button class="btn btn-primary" onclick="openModalAtiv()">+ Nova Atividade</button>`;
    renderAtividades();
    populateMembroSelect('filtro-membro', true);
    populateMembroSelect('ativ-membro');
  }
  else if (page === 'calendario') {
    actions.innerHTML = `<button class="btn btn-primary" onclick="openModalAtiv()">+ Nova Atividade</button>`;
    renderCalendario();
  }
  else if (page === 'relatorios') { renderRelatorios(); }
  else if (page === 'gamificacao') { renderGamificacao(); }
}