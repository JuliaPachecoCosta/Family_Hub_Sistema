const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ============================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ============================================
let db;
try {
  const Database = require('better-sqlite3');
  db = new Database(path.join(__dirname, '..', 'bd', 'familyhub.db'));
  db.pragma('journal_mode = WAL');
  console.log('✅ Banco SQLite conectado (better-sqlite3)');
} catch(e) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    db = null;
  } catch(e2) {
    db = null;
  }
}

// Fallback: armazenamento em memória
let memDB = { membros: [], atividades: [], notificacoes: [], pontos: [] };
let nextId = { membros: 1, atividades: 1, notificacoes: 1 };
const useMem = !db;

// ============================================
// INICIALIZAÇÃO DO BANCO
// ============================================
function initDB() {
  if (!useMem) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS membros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        papel TEXT NOT NULL,
        avatar TEXT DEFAULT '',
        cor TEXT DEFAULT '#888888',
        foto TEXT DEFAULT '',         -- Coluna para armazenar caminho/base64 da foto
        pontos INTEGER DEFAULT 0,
        criado_em TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS atividades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT DEFAULT '',
        tipo TEXT NOT NULL,
        prioridade TEXT DEFAULT 'media',
        id_membro INTEGER NOT NULL,
        data_inicio TEXT NOT NULL,
        data_fim TEXT,
        hora TEXT,
        concluida INTEGER DEFAULT 0,
        criado_em TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(id_membro) REFERENCES membros(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notificacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mensagem TEXT NOT NULL,
        lida INTEGER DEFAULT 0,
        id_atividade INTEGER,
        criado_em TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        criado_em TEXT DEFAULT (datetime('now'))
      );
    `);
    
    // Seed inicial
    const count = db.prepare('SELECT COUNT(*) as c FROM membros').get();
    if (count.c === 0) {
      db.prepare("INSERT INTO membros (nome, papel, cor, foto) VALUES (?, ?, ?, ?)").run('Maria Silva', 'Mãe', '#888888', '');
      db.prepare("INSERT INTO membros (nome, papel, cor, foto) VALUES (?, ?, ?, ?)").run('João Silva', 'Pai', '#777777', '');
      db.prepare("INSERT INTO membros (nome, papel, cor, foto) VALUES (?, ?, ?, ?)").run('Ana Silva', 'Filho(a)', '#999999', '');
      const hoje = new Date().toISOString().split('T')[0];
      db.prepare("INSERT INTO atividades (titulo, descricao, tipo, prioridade, id_membro, data_inicio, hora) VALUES (?, ?, ?, ?, ?, ?, ?)").run('Reunião Escolar', 'Reunião de pais e mestres', 'Escolar', 'alta', 1, hoje, '14:00');
      db.prepare("INSERT INTO atividades (titulo, descricao, tipo, prioridade, id_membro, data_inicio, hora) VALUES (?, ?, ?, ?, ?, ?, ?)").run('Treino de Futebol', 'Treino semanal', 'Esporte', 'media', 3, hoje, '16:00');
    }
  } else {
    // Seed em memória
    if (memDB.membros.length === 0) {
      const hoje = new Date().toISOString().split('T')[0];
      memDB.membros = [
        { id: 1, nome: 'Maria Silva', papel: 'Mãe', cor: '#888888', foto: '', pontos: 0, criado_em: new Date().toISOString() },
        { id: 2, nome: 'João Silva', papel: 'Pai', cor: '#777777', foto: '', pontos: 0, criado_em: new Date().toISOString() },
        { id: 3, nome: 'Ana Silva', papel: 'Filho(a)', cor: '#999999', foto: '', pontos: 10, criado_em: new Date().toISOString() },
      ];
      memDB.atividades = [
        { id: 1, titulo: 'Reunião Escolar', descricao: 'Reunião de pais e mestres', tipo: 'Escolar', prioridade: 'alta', id_membro: 1, data_inicio: hoje, hora: '14:00', concluida: 0, criado_em: new Date().toISOString() },
        { id: 2, titulo: 'Treino de Futebol', descricao: 'Treino semanal', tipo: 'Esporte', prioridade: 'media', id_membro: 3, data_inicio: hoje, hora: '16:00', concluida: 0, criado_em: new Date().toISOString() },
      ];
      nextId = { membros: 4, atividades: 3, notificacoes: 1 };
    }
  }
}

// ============================================
// CONFIGURAÇÃO DO EXPRESS
// ============================================
const app = express();

// Aumenta limite para upload de fotos em base64 (até 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Servir arquivos estáticos das pastas corretas
app.use(express.static(path.join(__dirname, '..')));        // Raiz do projeto
app.use('/js', express.static(path.join(__dirname)));        // Arquivos JS
app.use('/css', express.static(path.join(__dirname, '..', 'css'))); // CSS
app.use('/bd', express.static(path.join(__dirname, '..', 'bd')));   // BD
app.use('/fotos', express.static(path.join(__dirname, '..', 'fotos'))); // Fotos

// Criar pasta de fotos se não existir
const fotosDir = path.join(__dirname, '..', 'fotos');
if (!fs.existsSync(fotosDir)) {
  fs.mkdirSync(fotosDir, { recursive: true });
}

initDB();

// ============================================
// FUNÇÃO AUXILIAR PARA SALVAR FOTO
// ============================================
function salvarFoto(base64Data, membroId) {
  if (!base64Data || !base64Data.startsWith('data:image')) {
    // Se não for base64, retorna o próprio valor (pode ser caminho já existente)
    return base64Data || '';
  }
  
  // Extrai extensão da imagem
  const matches = base64Data.match(/^data:image\/(\w+);base64,/);
  if (!matches) return '';
  
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const fileName = `membro_${membroId}_${Date.now()}.${ext}`;
  const filePath = path.join(fotosDir, fileName);
  
  // Remove o prefixo base64 e salva
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, base64Image, 'base64');
  
  // Retorna caminho relativo
  return `fotos/${fileName}`;
}

// ============================================
// ROTAS DA API - MEMBROS
// ============================================

// GET /api/membros - Lista todos os membros
app.get('/api/membros', (req, res) => {
  if (!useMem) {
    const rows = db.prepare(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM atividades WHERE id_membro = m.id AND concluida = 1) as concluidas,
        (SELECT COUNT(*) FROM atividades WHERE id_membro = m.id) as total
      FROM membros m ORDER BY m.id
    `).all();
    res.json(rows);
  } else {
    const rows = memDB.membros.map(m => ({
      ...m,
      concluidas: memDB.atividades.filter(a => a.id_membro === m.id && a.concluida === 1).length,
      total: memDB.atividades.filter(a => a.id_membro === m.id).length
    }));
    res.json(rows);
  }
});

// POST /api/membros - Cria novo membro
app.post('/api/membros', (req, res) => {
  const { nome, papel, cor, foto } = req.body;
  if (!nome || !papel) return res.status(400).json({ error: 'Nome e papel são obrigatórios' });
  
  if (!useMem) {
    // Insere primeiro para obter ID
    const r = db.prepare('INSERT INTO membros (nome, papel, cor, foto) VALUES (?, ?, ?, ?)').run(nome, papel, cor || '#888888', '');
    const membroId = r.lastInsertRowid;
    
    // Salva foto se existir
    let fotoPath = '';
    if (foto) {
      fotoPath = salvarFoto(foto, membroId);
      if (fotoPath) {
        db.prepare('UPDATE membros SET foto = ? WHERE id = ?').run(fotoPath, membroId);
      }
    }
    
    res.json({ id: membroId, nome, papel, cor: cor || '#888888', foto: fotoPath, pontos: 0 });
  } else {
    const novo = { id: nextId.membros++, nome, papel, cor: cor || '#888888', foto: '', pontos: 0, criado_em: new Date().toISOString() };
    
    // Salva foto se existir
    if (foto) {
      novo.foto = salvarFoto(foto, novo.id);
    }
    
    memDB.membros.push(novo);
    res.json(novo);
  }
});

// PUT /api/membros/:id - Atualiza membro
app.put('/api/membros/:id', (req, res) => {
  const { nome, papel, cor, foto } = req.body;
  const id = parseInt(req.params.id);
  
  if (!useMem) {
    // Atualiza dados básicos
    db.prepare('UPDATE membros SET nome=?, papel=?, cor=? WHERE id=?').run(nome, papel, cor || '#888888', id);
    
    // Atualiza foto se fornecida
    if (foto !== undefined) {
      let fotoPath = foto; // Mantém valor existente se não for base64
      if (foto && foto.startsWith('data:image')) {
        fotoPath = salvarFoto(foto, id);
      }
      db.prepare('UPDATE membros SET foto = ? WHERE id = ?').run(fotoPath, id);
    }
    
    res.json({ success: true });
  } else {
    const m = memDB.membros.find(x => x.id === id);
    if (!m) return res.status(404).json({ error: 'Não encontrado' });
    Object.assign(m, { nome, papel, cor: cor || '#888888' });
    
    if (foto !== undefined) {
      m.foto = foto.startsWith('data:image') ? salvarFoto(foto, id) : foto;
    }
    
    res.json({ success: true });
  }
});

// DELETE /api/membros/:id - Remove membro
app.delete('/api/membros/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!useMem) {
    db.prepare('DELETE FROM atividades WHERE id_membro=?').run(id);
    db.prepare('DELETE FROM membros WHERE id=?').run(id);
  } else {
    memDB.atividades = memDB.atividades.filter(a => a.id_membro !== id);
    memDB.membros = memDB.membros.filter(m => m.id !== id);
  }
  res.json({ success: true });
});

// ============================================
// ROTAS DA API - ATIVIDADES
// ============================================

// GET /api/atividades - Lista atividades com filtros
app.get('/api/atividades', (req, res) => {
  const { mes, ano, id_membro, tipo, concluida } = req.query;
  
  if (!useMem) {
    let q = `SELECT a.*, m.nome as membro_nome, m.cor as membro_cor FROM atividades a JOIN membros m ON a.id_membro=m.id WHERE 1=1`;
    const params = [];
    
    if (mes && ano) { 
      q += ` AND strftime('%m', a.data_inicio)=? AND strftime('%Y', a.data_inicio)=?`; 
      params.push(String(mes).padStart(2,'0'), ano); 
    }
    if (id_membro) { q += ` AND a.id_membro=?`; params.push(id_membro); }
    if (tipo) { q += ` AND a.tipo=?`; params.push(tipo); }
    if (concluida !== undefined) { q += ` AND a.concluida=?`; params.push(concluida); }
    
    q += ` ORDER BY a.data_inicio, a.hora`;
    res.json(db.prepare(q).all(...params));
  } else {
    let rows = memDB.atividades.map(a => {
      const m = memDB.membros.find(x => x.id === a.id_membro) || {};
      return { ...a, membro_nome: m.nome, membro_cor: m.cor };
    });
    
    if (mes && ano) rows = rows.filter(a => {
      const d = new Date(a.data_inicio);
      return d.getMonth()+1 === parseInt(mes) && d.getFullYear() === parseInt(ano);
    });
    if (id_membro) rows = rows.filter(a => a.id_membro === parseInt(id_membro));
    if (tipo) rows = rows.filter(a => a.tipo === tipo);
    if (concluida !== undefined) rows = rows.filter(a => a.concluida === parseInt(concluida));
    
    res.json(rows.sort((a,b) => a.data_inicio.localeCompare(b.data_inicio)));
  }
});

// GET /api/atividades/hoje - Atividades do dia
app.get('/api/atividades/hoje', (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];
  if (!useMem) {
    const rows = db.prepare(`
      SELECT a.*, m.nome as membro_nome, m.cor as membro_cor 
      FROM atividades a JOIN membros m ON a.id_membro=m.id 
      WHERE a.data_inicio=? ORDER BY a.hora
    `).all(hoje);
    res.json(rows);
  } else {
    const rows = memDB.atividades.filter(a => a.data_inicio === hoje).map(a => {
      const m = memDB.membros.find(x => x.id === a.id_membro) || {};
      return { ...a, membro_nome: m.nome, membro_cor: m.cor };
    });
    res.json(rows);
  }
});

// POST /api/atividades - Cria atividade
app.post('/api/atividades', (req, res) => {
  const { titulo, descricao, tipo, prioridade, id_membro, data_inicio, hora } = req.body;
  if (!titulo || !tipo || !id_membro || !data_inicio) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  
  if (!useMem) {
    const r = db.prepare('INSERT INTO atividades (titulo, descricao, tipo, prioridade, id_membro, data_inicio, hora) VALUES (?,?,?,?,?,?,?)')
      .run(titulo, descricao||'', tipo, prioridade||'media', id_membro, data_inicio, hora||'');
    db.prepare("INSERT INTO notificacoes (mensagem, id_atividade) VALUES (?, ?)")
      .run(`Nova atividade: ${titulo} em ${data_inicio}`, r.lastInsertRowid);
    res.json({ id: r.lastInsertRowid, titulo, descricao, tipo, prioridade, id_membro, data_inicio, hora });
  } else {
    const novo = { id: nextId.atividades++, titulo, descricao: descricao||'', tipo, prioridade: prioridade||'media', id_membro: parseInt(id_membro), data_inicio, hora: hora||'', concluida: 0, criado_em: new Date().toISOString() };
    memDB.atividades.push(novo);
    memDB.notificacoes.push({ id: nextId.notificacoes++, mensagem: `Nova atividade: ${titulo} em ${data_inicio}`, lida: 0, id_atividade: novo.id, criado_em: new Date().toISOString() });
    res.json(novo);
  }
});

// PUT /api/atividades/:id - Atualiza atividade
app.put('/api/atividades/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, descricao, tipo, prioridade, id_membro, data_inicio, hora, concluida } = req.body;
  
  if (!useMem) {
    db.prepare('UPDATE atividades SET titulo=?,descricao=?,tipo=?,prioridade=?,id_membro=?,data_inicio=?,hora=?,concluida=? WHERE id=?')
      .run(titulo, descricao, tipo, prioridade, id_membro, data_inicio, hora, concluida ? 1 : 0, id);
    
    if (concluida) {
      const pts = prioridade === 'alta' ? 30 : prioridade === 'media' ? 20 : 10;
      db.prepare('UPDATE membros SET pontos = pontos + ? WHERE id=?').run(pts, id_membro);
    }
    res.json({ success: true });
  } else {
    const a = memDB.atividades.find(x => x.id === id);
    if (!a) return res.status(404).json({ error: 'Não encontrado' });
    if (concluida && !a.concluida) {
      const m = memDB.membros.find(x => x.id === (id_membro || a.id_membro));
      if (m) m.pontos += prioridade === 'alta' ? 30 : prioridade === 'media' ? 20 : 10;
    }
    Object.assign(a, { titulo, descricao, tipo, prioridade, id_membro: parseInt(id_membro), data_inicio, hora, concluida: concluida ? 1 : 0 });
    res.json({ success: true });
  }
});

// PATCH /api/atividades/:id/concluir - Toggle conclusão
app.patch('/api/atividades/:id/concluir', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!useMem) {
    const a = db.prepare('SELECT * FROM atividades WHERE id=?').get(id);
    if (!a) return res.status(404).json({ error: 'Não encontrado' });
    const novo = a.concluida ? 0 : 1;
    db.prepare('UPDATE atividades SET concluida=? WHERE id=?').run(novo, id);
    if (novo === 1) {
      const pts = a.prioridade === 'alta' ? 30 : a.prioridade === 'media' ? 20 : 10;
      db.prepare('UPDATE membros SET pontos = pontos + ? WHERE id=?').run(pts, a.id_membro);
    }
    res.json({ concluida: novo });
  } else {
    const a = memDB.atividades.find(x => x.id === id);
    if (!a) return res.status(404).json({ error: 'Não encontrado' });
    a.concluida = a.concluida ? 0 : 1;
    if (a.concluida) {
      const m = memDB.membros.find(x => x.id === a.id_membro);
      if (m) m.pontos += a.prioridade === 'alta' ? 30 : a.prioridade === 'media' ? 20 : 10;
    }
    res.json({ concluida: a.concluida });
  }
});

// DELETE /api/atividades/:id - Remove atividade
app.delete('/api/atividades/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!useMem) db.prepare('DELETE FROM atividades WHERE id=?').run(id);
  else memDB.atividades = memDB.atividades.filter(x => x.id !== id);
  res.json({ success: true });
});

// ============================================
// ROTAS DA API - NOTIFICAÇÕES
// ============================================
app.get('/api/notificacoes', (req, res) => {
  if (!useMem) {
    res.json(db.prepare('SELECT * FROM notificacoes ORDER BY criado_em DESC LIMIT 20').all());
  } else {
    res.json([...memDB.notificacoes].reverse().slice(0, 20));
  }
});

app.patch('/api/notificacoes/lidas', (req, res) => {
  if (!useMem) db.prepare('UPDATE notificacoes SET lida=1').run();
  else memDB.notificacoes.forEach(n => n.lida = 1);
  res.json({ success: true });
});

// ============================================
// ROTAS DA API - STATS DO DASHBOARD
// ============================================
app.get('/api/stats', (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];
  
  if (!useMem) {
    const totalMembros = db.prepare('SELECT COUNT(*) as c FROM membros').get().c;
    const totalAtiv = db.prepare('SELECT COUNT(*) as c FROM atividades').get().c;
    const concluidasHoje = db.prepare("SELECT COUNT(*) as c FROM atividades WHERE concluida=1 AND data_inicio=?").get(hoje).c;
    const pendentes = db.prepare("SELECT COUNT(*) as c FROM atividades WHERE concluida=0 AND data_inicio>=?").get(hoje).c;
    const notLidas = db.prepare('SELECT COUNT(*) as c FROM notificacoes WHERE lida=0').get().c;
    const porTipo = db.prepare("SELECT tipo, COUNT(*) as total FROM atividades GROUP BY tipo").all();
    const topMembros = db.prepare("SELECT m.nome, m.cor, m.pontos, COUNT(a.id) as atividades FROM membros m LEFT JOIN atividades a ON m.id=a.id_membro GROUP BY m.id ORDER BY m.pontos DESC").all();
    res.json({ totalMembros, totalAtiv, concluidasHoje, pendentes, notLidas, porTipo, topMembros });
  } else {
    const totalMembros = memDB.membros.length;
    const totalAtiv = memDB.atividades.length;
    const concluidasHoje = memDB.atividades.filter(a => a.concluida && a.data_inicio === hoje).length;
    const pendentes = memDB.atividades.filter(a => !a.concluida && a.data_inicio >= hoje).length;
    const notLidas = memDB.notificacoes.filter(n => !n.lida).length;
    const tipos = {};
    memDB.atividades.forEach(a => tipos[a.tipo] = (tipos[a.tipo]||0)+1);
    const porTipo = Object.entries(tipos).map(([tipo,total]) => ({tipo,total}));
    const topMembros = memDB.membros.map(m => ({
      ...m,
      atividades: memDB.atividades.filter(a => a.id_membro === m.id).length
    })).sort((a,b) => b.pontos - a.pontos);
    res.json({ totalMembros, totalAtiv, concluidasHoje, pendentes, notLidas, porTipo, topMembros });
  }
});

// ============================================
// SERVE INDEX.HTML PARA QUALQUER ROTA NÃO-API
// ============================================
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ============================================
// INICIA O SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🚀 FamilyHub rodando em http://localhost:${PORT}\n`));