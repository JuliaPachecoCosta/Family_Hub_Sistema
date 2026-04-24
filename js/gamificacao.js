// ============================
// GAMIFICAÇÃO - Com suporte a fotos
// ============================

/**
 * Renderiza a página de gamificação
 */
async function renderGamificacao() {
  try {
    const membros = await api('GET', '/membros');
    const sorted = [...membros].sort((a,b) => (b.pontos||0)-(a.pontos||0));
    const maxPts = Math.max(...sorted.map(m => m.pontos||0), 1);

    // Renderiza ranking completo
    const rankEl = document.getElementById('game-ranking');
    rankEl.innerHTML = sorted.map((m,i) => {
      const corPerfil = m.cor || '#888888';
      const avatarContent = m.foto 
        ? `<img src="${m.foto}" alt="${m.nome}" style="width:100%;height:100%;object-fit:cover;" />`
        : m.nome[0];
      
      return `
        <div class="rank-item">
          <div style="font-size:1.4rem;width:28px">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div>
          <div class="rank-avatar" style="background:${corPerfil};width:44px;height:44px;font-size:1.1rem">
            ${avatarContent}
          </div>
          <div class="rank-info">
            <div class="rank-name" style="font-size:0.95rem">${m.nome}</div>
            <div style="color:var(--muted);font-size:0.72rem">${m.papel}</div>
            <div class="rank-bar-wrap" style="margin-top:6px"><div class="rank-bar" style="width:${((m.pontos||0)/maxPts)*100}%;background:${corPerfil}"></div></div>
          </div>
          <div style="text-align:right">
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;color:${corPerfil}">${m.pontos||0}</div>
            <div style="font-size:0.68rem;color:var(--muted)">pontos</div>
          </div>
        </div>
      `;
    }).join('') || '<div style="color:var(--muted)">Sem membros</div>';

    // Renderiza conquistas
    const conquEl = document.getElementById('game-conquistas');
    const conquistas = [
      { icon:'🌟', nome:'Primeira Atividade', desc:'Criou a primeira atividade', obtida: sorted.some(m => (m.total||0) > 0) },
      { icon:'🏃', nome:'Maratonista', desc:'Completou 5 atividades', obtida: sorted.some(m => (m.concluidas||0) >= 5) },
      { icon:'🎯', nome:'Focado', desc:'Completou atividade de alta prioridade', obtida: sorted.some(m => m.pontos >= 30) },
      { icon:'👨‍👩‍👧', nome:'Tribo Unida', desc:'3 ou mais membros cadastrados', obtida: membros.length >= 3 },
      { icon:'💯', nome:'Centenário', desc:'100 pontos acumulados', obtida: sorted.some(m => m.pontos >= 100) },
      { icon:'🚀', nome:'Supermembro', desc:'200 pontos acumulados', obtida: sorted.some(m => m.pontos >= 200) },
    ];
    
    conquEl.innerHTML = conquistas.map(c => `
      <div style="background:var(--bg3);border:1px solid ${c.obtida?'rgba(136,136,136,0.3)':'var(--border)'};border-radius:12px;padding:16px;text-align:center;${c.obtida?'':'opacity:0.4'}">
        <div style="font-size:2rem;margin-bottom:8px">${c.icon}</div>
        <div style="font-weight:600;font-size:0.88rem;margin-bottom:4px">${c.nome}</div>
        <div style="font-size:0.72rem;color:var(--muted)">${c.desc}</div>
        ${c.obtida?'<div style="margin-top:8px;font-size:0.7rem;color:var(--green);font-weight:600">✅ Obtida!</div>':''}
      </div>
    `).join('');
    
  } catch(e) { 
    console.error('Erro ao carregar gamificação:', e); 
  }
}