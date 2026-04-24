// ============================
// CONFIG
// ============================
const API = 'http://localhost:3000/api';

// Estado da app
let state = {
  membros: [],
  atividades: [],
  stats: {},
  currentPage: 'dashboard',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth() + 1,
  filtroTipo: '',
  editingMembro: null,
  editingAtiv: null,
  calAtividades: [],
};