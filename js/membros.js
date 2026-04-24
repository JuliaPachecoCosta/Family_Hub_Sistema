// ============================
// MEMBROS - Renderização com suporte a fotos
// ============================

/**
 * Renderiza a lista de membros no grid
 */
async function renderMembros() {
  const grid = document.getElementById('membros-grid');
  grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">Carregando...</div>`;
  
  try {
    const membros = await api('GET', '/membros');
    state.membros = membros;
    
    grid.innerHTML = membros.length 
      ? membros.map(m => membroCardHTML(m)).join('') 
      : `<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Nenhum membro cadastrado</div></div>`;
  } catch(e) { 
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-text">Erro ao carregar</div></div>`; 
  }
}

/**
 * Gera o HTML do card de membro
 * @param {Object} m - Dados do membro
 * @returns {string} HTML do card
 */
function membroCardHTML(m) {
  const pct = m.total > 0 ? Math.round((m.concluidas / m.total) * 100) : 0;
  const corPerfil = m.cor || '#888888';
  
  // Determina o conteúdo do avatar (foto ou inicial)
  const avatarContent = m.foto 
    ? `<img src="${m.foto}" alt="${m.nome}" style="width:100%;height:100%;object-fit:cover;" />`
    : m.nome[0].toUpperCase();
  
  return `
    <div class="membro-card fade-up" style="--delay:${Math.random()*0.2}s">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${corPerfil}"></div>
      <div class="membro-header">
        <div class="membro-avatar" style="background:${corPerfil}">
          ${avatarContent}
        </div>
        <div>
          <div class="membro-name">${m.nome}</div>
          <div class="membro-role">${m.papel}</div>
        </div>
      </div>
      <div class="membro-stats">
        <div class="membro-stat">
          <div class="membro-stat-val" style="color:${corPerfil}">${m.total||0}</div>
          <div class="membro-stat-lbl">Atividades</div>
        </div>
        <div class="membro-stat">
          <div class="membro-stat-val" style="color:var(--green)">${m.concluidas||0}</div>
          <div class="membro-stat-lbl">Concluídas</div>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--muted);margin-bottom:6px">
          <span>Taxa de conclusão</span><span>${pct}%</span>
        </div>
        <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%;background:${corPerfil}"></div></div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:10px;text-align:center;margin-bottom:16px">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;color:var(--accent)">⭐ ${m.pontos||0}</div>
        <div style="font-size:0.72rem;color:var(--muted)">pontos</div>
      </div>
      <div class="membro-actions">
        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="editMembro(${m.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteMembro(${m.id})">🗑️</button>
      </div>
    </div>
  `;
}