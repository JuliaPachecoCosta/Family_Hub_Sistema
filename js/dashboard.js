// ============================
// DASHBOARD - Com suporte a fotos no ranking
// ============================

/**
 * Renderiza o dashboard completo
 */
async function renderDashboard() {
  try {
    const [stats, hoje] = await Promise.all([
      api('GET', '/stats'),
      api('GET', '/atividades/hoje'),
    ]);
    state.stats = stats;

    // Atualiza cards de estatísticas
    document.getElementById('stat-membros').textContent = stats.totalMembros || 0;
    document.getElementById('stat-total').textContent = stats.totalAtiv || 0;
    document.getElementById('stat-concluidas').textContent = stats.concluidasHoje || 0;
    document.getElementById('stat-pendentes').textContent = stats.pendentes || 0;

    // Renderiza atividades de hoje
    const hojeEl = document.getElementById('hoje-list');
    if (!hoje || hoje.length === 0) {
      hojeEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌟</div><div class="empty-state-text">Nenhuma atividade hoje</div></div>`;
    } else {
      hojeEl.innerHTML = hoje.map(a => atividadeItemHTML(a, true)).join('');
    }

    // Renderiza ranking
    const rankEl = document.getElementById('ranking-list');
    const maxPts = Math.max(...(stats.topMembros||[]).map(m => m.pontos), 1);
    
    if ((stats.topMembros||[]).length === 0) {
      rankEl.innerHTML = '<div class="empty-state"><div class="empty-state-text">Nenhum membro</div></div>';
    } else {
      rankEl.innerHTML = (stats.topMembros||[]).map((m,i) => {
        // Busca dados completos do membro para obter foto
        const membroCompleto = state.membros.find(mb => mb.nome === m.nome);
        const foto = membroCompleto ? membroCompleto.foto : '';
        const corPerfil = m.cor || '#888888';
        
        // Conteúdo do avatar
        const avatarContent = foto 
          ? `<img src="${foto}" alt="${m.nome}" style="width:100%;height:100%;object-fit:cover;" />`
          : m.nome[0];
        
        // Medalhas para os 3 primeiros
        const posicao = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;
        const corPosicao = i === 0 ? '#aaaaaa' : i === 1 ? '#999999' : i === 2 ? '#888888' : 'var(--muted)';
        
        return `
          <div class="rank-item">
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;color:${corPosicao};width:20px">${posicao}</div>
            <div class="rank-avatar" style="background:${corPerfil}">
              ${avatarContent}
            </div>
            <div class="rank-info">
              <div class="rank-name">${m.nome}</div>
              <div class="rank-bar-wrap"><div class="rank-bar" style="width:${(m.pontos/maxPts)*100}%;background:${corPerfil}"></div></div>
            </div>
            <div class="rank-pts" style="color:${corPerfil}">${m.pontos} pts</div>
          </div>
        `;
      }).join('');
    }

    // Renderiza gráfico por tipo
    const chartEl = document.getElementById('chart-tipos');
    const cores = { Escolar:'#888888', Esporte:'#777777', Social:'#999999', Saúde:'#aaaaaa', Outro:'#666666' };
    const maxT = Math.max(...(stats.porTipo||[]).map(t => t.total), 1);
    
    chartEl.innerHTML = (stats.porTipo||[]).length > 0 
      ? (stats.porTipo||[]).map(t => `
        <div class="chart-bar-item">
          <div class="chart-bar-label"><span>${t.tipo}</span><span style="color:var(--muted)">${t.total}</span></div>
          <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(t.total/maxT)*100}%;background:${cores[t.tipo]||'var(--muted)'}"></div></div>
        </div>
      `).join('') 
      : '<div style="color:var(--muted);font-size:0.85rem">Sem dados</div>';

    // Renderiza próximas atividades
    const proximas = await api('GET', '/atividades?concluida=0');
    const proxEl = document.getElementById('proximas-list');
    const futuras = (proximas||[]).filter(a => !a.concluida).slice(0, 5);
    
    proxEl.innerHTML = futuras.length 
      ? futuras.map(a => atividadeItemHTML(a, true)).join('') 
      : `<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">Tudo em dia!</div></div>`;

    // Atualiza badge de notificações
    document.getElementById('notif-badge').textContent = stats.notLidas || 0;
    document.getElementById('notif-badge').classList.toggle('hidden', !stats.notLidas);

  } catch(e) { 
    console.error('Erro ao carregar dashboard:', e); 
  }
}

/**
 * Gera HTML para item de atividade
 * @param {Object} a - Dados da atividade
 * @param {boolean} mini - Se true, versão compacta
 * @returns {string} HTML do item
 */
function atividadeItemHTML(a, mini = false) {
  const done = a.concluida;
  const corMembro = a.membro_cor || '#888888';
  
  return `
    <div class="activity-item" id="ait-${a.id}">
      <div class="activity-dot" style="background:${corMembro}"></div>
      <div class="activity-info">
        <div class="activity-title ${done?'done':''}" style="${done?'text-decoration:line-through;opacity:.5':''}">
          ${a.titulo}
        </div>
        <div class="activity-meta">
          ${a.membro_nome ? `<span>${a.membro_nome}</span> · ` : ''}
          <span>${formatDate(a.data_inicio)}${a.hora?' às '+a.hora:''}</span>
          <span class="tipo-badge tipo-${a.tipo}" style="margin-left:6px">${a.tipo}</span>
        </div>
      </div>
      <div class="activity-actions">
        <button class="icon-btn" onclick="toggleConcluir(${a.id})" title="${done?'Reabrir':'Concluir'}">${done?'↩':'✓'}</button>
      </div>
    </div>
  `;
}