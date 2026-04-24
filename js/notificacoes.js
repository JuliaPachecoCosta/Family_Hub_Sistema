// ============================
// NOTIFICAÇÕES
// ============================
async function checkNotificacoes() {
  try {
    const notifs = await api('GET', '/notificacoes');
    const naoLidas = notifs.filter(n => !n.lida).length;
    const badge = document.getElementById('notif-badge');
    badge.textContent = naoLidas;
    badge.classList.toggle('hidden', naoLidas === 0);

    const list = document.getElementById('notif-list');
    list.innerHTML = notifs.length ? notifs.map(n => `
      <div class="notif-item ${n.lida?'lida':''}">
        <div>${n.mensagem}</div>
        <div class="notif-item-time">${formatDateTime(n.criado_em)}</div>
      </div>
    `).join('') : `<div class="notif-empty">🔕 Nenhuma notificação</div>`;
  } catch(e) {}
}

async function marcarTodasLidas() {
  await api('PATCH', '/notificacoes/lidas');
  checkNotificacoes();
  toast('Notificações marcadas como lidas', 'success');
}

function toggleNotif() {
  const panel = document.getElementById('notif-panel');
  const overlay = document.getElementById('notif-overlay');
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
  if (panel.classList.contains('open')) checkNotificacoes();
}
