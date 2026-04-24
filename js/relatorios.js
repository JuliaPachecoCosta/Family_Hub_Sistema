// ============================
// RELATÓRIOS
// ============================
async function renderRelatorios() {
  try {
    const [membros, ativs] = await Promise.all([
      api('GET', '/membros'),
      api('GET', '/atividades'),
    ]);
    const cores = { Escolar:'var(--accent)', Esporte:'var(--green)', Social:'var(--pink)', Saúde:'var(--yellow)', Outro:'var(--muted)' };

    // Por membro
    const porMembro = document.getElementById('rel-por-membro');
    const maxA = Math.max(...membros.map(m => m.total||0), 1);
    porMembro.innerHTML = membros.map(m => `
      <div class="chart-bar-item">
        <div class="chart-bar-label">
          <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:${m.cor};display:inline-block"></span>${m.nome}</span>
          <span style="color:var(--muted)">${m.total||0} (${m.concluidas||0} ✅)</span>
        </div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${((m.total||0)/maxA)*100}%;background:${m.cor||'#6366f1'}"></div></div>
      </div>
    `).join('') || '<div style="color:var(--muted)">Sem dados</div>';

    // Por tipo
    const porTipo = document.getElementById('rel-por-tipo');
    const tipos = {};
    ativs.forEach(a => { tipos[a.tipo] = (tipos[a.tipo]||0)+1; });
    const maxT = Math.max(...Object.values(tipos), 1);
    porTipo.innerHTML = Object.entries(tipos).map(([tipo,total]) => `
      <div class="chart-bar-item">
        <div class="chart-bar-label"><span>${tipo}</span><span style="color:var(--muted)">${total}</span></div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(total/maxT)*100}%;background:${cores[tipo]||'var(--muted)'}"></div></div>
      </div>
    `).join('') || '<div style="color:var(--muted)">Sem dados</div>';

    // Por prioridade
    const prioEl = document.getElementById('rel-prioridade');
    const prios = { alta:[], media:[], baixa:[] };
    ativs.forEach(a => { if(prios[a.prioridade]) prios[a.prioridade].push(a); });
    const prioLabels = { alta:'🔴 Alta', media:'🟡 Média', baixa:'🟢 Baixa' };
    prioEl.innerHTML = Object.entries(prios).map(([p, arr]) => {
      const conc = arr.filter(a => a.concluida).length;
      const pct = arr.length ? Math.round((conc/arr.length)*100) : 0;
      return `
        <div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:1px solid var(--border)">
          <div style="min-width:100px;font-weight:500">${prioLabels[p]}</div>
          <div style="flex:1">
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${p==='alta'?'var(--red)':p==='media'?'var(--yellow)':'var(--green)'}"></div></div>
          </div>
          <div style="font-size:0.8rem;color:var(--muted);min-width:80px">${conc}/${arr.length} (${pct}%)</div>
        </div>
      `;
    }).join('');

  } catch(e) { console.error(e); }
}