// ============================
// CALENDÁRIO
// ============================
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

async function renderCalendario() {
  document.getElementById('cal-month-label').textContent = `${MESES[state.calMonth-1]} ${state.calYear}`;
  try {
    const ativs = await api('GET', `/atividades?mes=${state.calMonth}&ano=${state.calYear}`);
    state.calAtividades = ativs || [];
    buildCalGrid();
  } catch(e) { console.error(e); }
}

function buildCalGrid() {
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = DIAS.map(d => `<div class="cal-dayname">${d}</div>`).join('');

  const primeiroDia = new Date(state.calYear, state.calMonth-1, 1).getDay();
  const totalDias = new Date(state.calYear, state.calMonth, 0).getDate();
  const hoje = new Date();

  // Dias do mês anterior
  const diasMesAnt = new Date(state.calYear, state.calMonth-1, 0).getDate();
  for (let i = primeiroDia - 1; i >= 0; i--) {
    grid.innerHTML += `<div class="cal-day other-month"><div class="cal-day-num">${diasMesAnt-i}</div></div>`;
  }

  // Dias do mês atual
  for (let dia = 1; dia <= totalDias; dia++) {
    const dateStr = `${state.calYear}-${String(state.calMonth).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    const isToday = hoje.getDate()===dia && hoje.getMonth()===state.calMonth-1 && hoje.getFullYear()===state.calYear;
    const dayAtivs = state.calAtividades.filter(a => a.data_inicio === dateStr);
    const maxShow = 3;

    grid.innerHTML += `
      <div class="cal-day${isToday?' today':''}" onclick="openDia('${dateStr}')">
        <div class="cal-day-num">${dia}</div>
        <div class="cal-events">
          ${dayAtivs.slice(0,maxShow).map(a => `<div class="cal-event ${a.tipo}" title="${a.titulo}">${a.hora?a.hora+' ':''} ${a.titulo}</div>`).join('')}
          ${dayAtivs.length > maxShow ? `<div class="cal-more">+${dayAtivs.length-maxShow} mais</div>` : ''}
        </div>
      </div>
    `;
  }

  // Completar grid
  const total = primeiroDia + totalDias;
  const resto = 7 - (total % 7);
  if (resto < 7) for (let i = 1; i <= resto; i++) grid.innerHTML += `<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
}

function calNav(dir) {
  state.calMonth += dir;
  if (state.calMonth > 12) { state.calMonth = 1; state.calYear++; }
  if (state.calMonth < 1) { state.calMonth = 12; state.calYear--; }
  renderCalendario();
}

function openDia(dateStr) {
  const dayAtivs = state.calAtividades.filter(a => a.data_inicio === dateStr);
  const [y,m,d] = dateStr.split('-');
  document.getElementById('modal-dia-title').textContent = `📅 ${d}/${m}/${y}`;
  const content = document.getElementById('modal-dia-content');
  if (dayAtivs.length === 0) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌟</div><div class="empty-state-text">Nenhuma atividade neste dia</div></div>`;
  } else {
    content.innerHTML = dayAtivs.map(a => `
      <div class="activity-item">
        <div class="activity-dot" style="background:${a.membro_cor||'#6366f1'}"></div>
        <div class="activity-info">
          <div class="activity-title">${a.titulo}</div>
          <div class="activity-meta">${a.membro_nome||''} ${a.hora?' · '+a.hora:''} <span class="tipo-badge tipo-${a.tipo}" style="margin-left:4px">${a.tipo}</span></div>
        </div>
        ${a.concluida ? '<span style="color:var(--green);font-size:0.8rem">✅</span>' : ''}
      </div>
    `).join('');
  }
  openModal('modal-dia');
}
