// ============================
// INIT
// ============================

// Função principal de inicialização do sistema
async function init() {
  // Carrega todos os dados iniciais (membros e estatísticas)
  await loadAll();

  // Renderiza (mostra) a página inicial, que é o dashboard
  renderPage('dashboard');

  // Verifica se existem notificações no sistema
  checkNotificacoes();

  // Verifica notificações automaticamente a cada 30 segundos
  setInterval(checkNotificacoes, 30000);
}

// Função responsável por carregar dados do backend
async function loadAll() {
  try {
    // Executa duas requisições ao mesmo tempo:
    // 1. Buscar membros
    // 2. Buscar estatísticas do sistema
    const [membros, stats] = await Promise.all([
      api('GET', '/membros'), // Requisição para obter lista de membros
      api('GET', '/stats'),   // Requisição para obter dados do dashboard
    ]);

    // Armazena os membros no estado global
    // Se vier vazio ou null, usa array vazio
    state.membros = membros || [];

    // Armazena as estatísticas no estado global
    // Se vier vazio ou null, usa objeto vazio
    state.stats = stats || {};

  } catch(e) {
    // Caso ocorra erro (ex: servidor desligado)
    // Exibe mensagem de erro na tela
    toast('Erro ao conectar com o servidor. Verifique se ele está rodando.', 'error');
  }
}