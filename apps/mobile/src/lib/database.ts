import * as SQLite from 'expo-sqlite';
import { logger } from './logger';

const DB_NAME = 'onsite-flow.db';
let db: SQLite.SQLiteDatabase | null = null;

// ============================================
// Inicializar Banco
// ============================================
export async function initDatabase(): Promise<void> {
  try {
    logger.info('database', 'Initializing SQLite database...');
    
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    logger.info('database', 'Database opened, creating tables...');
    
    // Tabela de locais
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS locais (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        raio INTEGER NOT NULL DEFAULT 50,
        cor TEXT DEFAULT '#3B82F6',
        endereco TEXT,
        ativo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);
    
    // Tabela de registros
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS registros (
        id TEXT PRIMARY KEY NOT NULL,
        local_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        accuracy REAL,
        automatico INTEGER DEFAULT 1,
        observacao TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);
    
    // Tabela de sessões - ATUALIZADA com suporte a pause
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessoes (
        id TEXT PRIMARY KEY NOT NULL,
        local_id TEXT NOT NULL,
        entrada_id TEXT NOT NULL,
        saida_id TEXT,
        inicio TEXT NOT NULL,
        fim TEXT,
        duracao_minutos INTEGER,
        tempo_pausado_minutos INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ativa',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);
    
    // Tabela de pausas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pausas (
        id TEXT PRIMARY KEY NOT NULL,
        sessao_id TEXT NOT NULL,
        inicio TEXT NOT NULL,
        fim TEXT,
        duracao_minutos INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    logger.info('database', 'Database initialized successfully');
  } catch (error) {
    logger.error('database', 'Failed to initialize database', { error: String(error) });
    throw error;
  }
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// LOCAIS - CRUD
// ============================================
export interface LocalDB {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio: number;
  cor: string;
  endereco: string | null;
  ativo: number;
  created_at: string;
  updated_at: string;
  synced: number;
}

export async function saveLocal(local: {
  id?: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio: number;
  cor: string;
  endereco?: string;
  ativo: boolean;
}): Promise<string> {
  try {
    const database = getDb();
    const id = local.id || generateId();
    
    await database.runAsync(
      `INSERT OR REPLACE INTO locais (id, nome, latitude, longitude, raio, cor, endereco, ativo, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)`,
      [id, local.nome, local.latitude, local.longitude, local.raio, local.cor, local.endereco ?? null, local.ativo ? 1 : 0]
    );
    
    logger.info('database', 'Local saved', { id, nome: local.nome });
    return id;
  } catch (error) {
    logger.error('database', 'Error saving local', { error: String(error) });
    throw error;
  }
}

export async function getLocais(): Promise<LocalDB[]> {
  try {
    const database = getDb();
    const result = await database.getAllAsync<LocalDB>('SELECT * FROM locais ORDER BY created_at DESC');
    return result || [];
  } catch (error) {
    logger.error('database', 'Error getting locais', { error: String(error) });
    return [];
  }
}

export async function deleteLocal(id: string): Promise<void> {
  try {
    const database = getDb();
    await database.runAsync('DELETE FROM locais WHERE id = ?', [id]);
    logger.info('database', 'Local deleted', { id });
  } catch (error) {
    logger.error('database', 'Error deleting local', { error: String(error) });
  }
}

// ============================================
// REGISTROS - CRUD
// ============================================
export interface RegistroDB {
  id: string;
  local_id: string;
  tipo: 'entrada' | 'saida' | 'pause' | 'resume';
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  automatico: number;
  observacao: string | null;
  created_at: string;
  synced: number;
}

export async function saveRegistro(registro: {
  local_id: string;
  tipo: 'entrada' | 'saida' | 'pause' | 'resume';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  automatico?: boolean;
  observacao?: string;
}): Promise<string> {
  try {
    const database = getDb();
    const id = generateId();
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO registros (id, local_id, tipo, timestamp, latitude, longitude, accuracy, automatico, observacao, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        registro.local_id,
        registro.tipo,
        timestamp,
        registro.latitude ?? null,
        registro.longitude ?? null,
        registro.accuracy ?? null,
        registro.automatico !== false ? 1 : 0,
        registro.observacao ?? null,
      ]
    );
    
    logger.info('database', `Registro saved: ${registro.tipo}`, { id, local_id: registro.local_id });
    return id;
  } catch (error) {
    logger.error('database', 'Error saving registro', { error: String(error) });
    throw error;
  }
}

// ============================================
// SESSÕES - Com suporte a PAUSE
// ============================================
export interface SessaoDB {
  id: string;
  local_id: string;
  entrada_id: string;
  saida_id: string | null;
  inicio: string;
  fim: string | null;
  duracao_minutos: number | null;
  tempo_pausado_minutos: number;
  status: 'ativa' | 'pausada' | 'finalizada';
  created_at: string;
  synced: number;
  local_nome?: string;
}

export interface PausaDB {
  id: string;
  sessao_id: string;
  inicio: string;
  fim: string | null;
  duracao_minutos: number | null;
}

export async function iniciarSessao(local_id: string, entrada_id: string): Promise<string> {
  try {
    const database = getDb();
    const id = generateId();
    const inicio = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO sessoes (id, local_id, entrada_id, inicio, status, tempo_pausado_minutos, synced)
       VALUES (?, ?, ?, ?, 'ativa', 0, 0)`,
      [id, local_id, entrada_id, inicio]
    );
    
    logger.info('database', 'Sessão iniciada', { id, local_id });
    return id;
  } catch (error) {
    logger.error('database', 'Error starting session', { error: String(error) });
    throw error;
  }
}

export async function pausarSessao(sessao_id: string): Promise<void> {
  try {
    const database = getDb();
    const agora = new Date().toISOString();
    
    // Criar registro de pausa
    const pausaId = generateId();
    await database.runAsync(
      `INSERT INTO pausas (id, sessao_id, inicio) VALUES (?, ?, ?)`,
      [pausaId, sessao_id, agora]
    );
    
    // Atualizar status da sessão
    await database.runAsync(
      `UPDATE sessoes SET status = 'pausada' WHERE id = ?`,
      [sessao_id]
    );
    
    logger.info('database', 'Sessão pausada', { sessao_id, pausaId });
  } catch (error) {
    logger.error('database', 'Error pausing session', { error: String(error) });
    throw error;
  }
}

export async function retomarSessao(sessao_id: string): Promise<void> {
  try {
    const database = getDb();
    const agora = new Date().toISOString();
    
    // Finalizar pausa ativa
    const pausaAtiva = await database.getFirstAsync<PausaDB>(
      `SELECT * FROM pausas WHERE sessao_id = ? AND fim IS NULL ORDER BY inicio DESC LIMIT 1`,
      [sessao_id]
    );
    
    if (pausaAtiva) {
      const inicio = new Date(pausaAtiva.inicio);
      const fim = new Date(agora);
      const duracao = Math.round((fim.getTime() - inicio.getTime()) / 60000);
      
      await database.runAsync(
        `UPDATE pausas SET fim = ?, duracao_minutos = ? WHERE id = ?`,
        [agora, duracao, pausaAtiva.id]
      );
      
      // Atualizar tempo pausado total na sessão
      await database.runAsync(
        `UPDATE sessoes SET tempo_pausado_minutos = tempo_pausado_minutos + ?, status = 'ativa' WHERE id = ?`,
        [duracao, sessao_id]
      );
      
      logger.info('database', 'Sessão retomada', { sessao_id, pausaDuracao: duracao });
    } else {
      // Só atualizar status
      await database.runAsync(
        `UPDATE sessoes SET status = 'ativa' WHERE id = ?`,
        [sessao_id]
      );
    }
  } catch (error) {
    logger.error('database', 'Error resuming session', { error: String(error) });
    throw error;
  }
}

export async function finalizarSessao(local_id: string, saida_id: string): Promise<void> {
  try {
    const database = getDb();
    const fim = new Date().toISOString();
    
    const sessaoAberta = await database.getFirstAsync<SessaoDB>(
      `SELECT * FROM sessoes WHERE local_id = ? AND status != 'finalizada' ORDER BY inicio DESC LIMIT 1`,
      [local_id]
    );
    
    if (!sessaoAberta) {
      logger.warn('database', 'No open session found to close', { local_id });
      return;
    }
    
    // Se estava pausada, finalizar a pausa também
    if (sessaoAberta.status === 'pausada') {
      await retomarSessao(sessaoAberta.id);
      // Recarregar sessão com tempo atualizado
      const sessaoAtualizada = await database.getFirstAsync<SessaoDB>(
        `SELECT * FROM sessoes WHERE id = ?`,
        [sessaoAberta.id]
      );
      if (sessaoAtualizada) {
        sessaoAberta.tempo_pausado_minutos = sessaoAtualizada.tempo_pausado_minutos;
      }
    }
    
    const inicio = new Date(sessaoAberta.inicio);
    const fimDate = new Date(fim);
    const duracaoTotal = Math.round((fimDate.getTime() - inicio.getTime()) / 60000);
    const duracaoTrabalhada = duracaoTotal - (sessaoAberta.tempo_pausado_minutos || 0);
    
    await database.runAsync(
      `UPDATE sessoes SET saida_id = ?, fim = ?, duracao_minutos = ?, status = 'finalizada', synced = 0 WHERE id = ?`,
      [saida_id, fim, duracaoTrabalhada, sessaoAberta.id]
    );
    
    logger.info('database', 'Sessão finalizada', { 
      id: sessaoAberta.id, 
      duracao_total: duracaoTotal,
      tempo_pausado: sessaoAberta.tempo_pausado_minutos,
      duracao_trabalhada: duracaoTrabalhada,
    });
  } catch (error) {
    logger.error('database', 'Error finishing session', { error: String(error) });
    throw error;
  }
}

export async function getSessaoAberta(local_id: string): Promise<SessaoDB | null> {
  try {
    const database = getDb();
    const result = await database.getFirstAsync<SessaoDB>(
      `SELECT * FROM sessoes WHERE local_id = ? AND status != 'finalizada' ORDER BY inicio DESC LIMIT 1`,
      [local_id]
    );
    return result || null;
  } catch (error) {
    logger.error('database', 'Error getting open session', { error: String(error) });
    return null;
  }
}

export async function getSessaoAtivaGlobal(): Promise<SessaoDB | null> {
  try {
    const database = getDb();
    const result = await database.getFirstAsync<SessaoDB>(
      `SELECT s.*, l.nome as local_nome 
       FROM sessoes s 
       LEFT JOIN locais l ON s.local_id = l.id 
       WHERE s.status != 'finalizada' 
       ORDER BY s.inicio DESC LIMIT 1`
    );
    return result || null;
  } catch (error) {
    logger.error('database', 'Error getting active session', { error: String(error) });
    return null;
  }
}

export async function getSessoesHoje(): Promise<SessaoDB[]> {
  try {
    const database = getDb();
    const hoje = new Date().toISOString().split('T')[0];
    
    const result = await database.getAllAsync<SessaoDB>(
      `SELECT s.*, l.nome as local_nome 
       FROM sessoes s 
       LEFT JOIN locais l ON s.local_id = l.id 
       WHERE DATE(s.inicio) = ? 
       ORDER BY s.inicio DESC`,
      [hoje]
    );
    
    return result || [];
  } catch (error) {
    logger.error('database', 'Error getting today sessions', { error: String(error) });
    return [];
  }
}

export async function getSessoes(options?: {
  local_id?: string;
  dataInicio?: string;
  dataFim?: string;
  limit?: number;
}): Promise<SessaoDB[]> {
  try {
    const database = getDb();
    
    let query = `
      SELECT s.*, l.nome as local_nome 
      FROM sessoes s 
      LEFT JOIN locais l ON s.local_id = l.id 
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (options?.local_id) {
      query += ' AND s.local_id = ?';
      params.push(options.local_id);
    }
    
    if (options?.dataInicio) {
      query += ' AND DATE(s.inicio) >= ?';
      params.push(options.dataInicio);
    }
    
    if (options?.dataFim) {
      query += ' AND DATE(s.inicio) <= ?';
      params.push(options.dataFim);
    }
    
    query += ' ORDER BY s.inicio DESC';
    
    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }
    
    const result = await database.getAllAsync<SessaoDB>(query, params);
    return result || [];
  } catch (error) {
    logger.error('database', 'Error loading sessions', { error: String(error) });
    return [];
  }
}

// ============================================
// ESTATÍSTICAS
// ============================================
export interface EstatisticasDia {
  data: string;
  total_minutos: number;
  total_sessoes: number;
  locais: string[];
}

export async function getEstatisticasHoje(): Promise<EstatisticasDia> {
  try {
    const database = getDb();
    const hoje = new Date().toISOString().split('T')[0];
    
    const result = await database.getFirstAsync<{
      total_minutos: number | null;
      total_sessoes: number;
    }>(
      `SELECT 
         COALESCE(SUM(duracao_minutos), 0) as total_minutos,
         COUNT(*) as total_sessoes
       FROM sessoes 
       WHERE DATE(inicio) = ? AND status = 'finalizada'`,
      [hoje]
    );
    
    // Sessão em andamento
    const sessaoAtiva = await database.getFirstAsync<{ inicio: string; tempo_pausado_minutos: number; status: string }>(
      `SELECT inicio, tempo_pausado_minutos, status FROM sessoes WHERE DATE(inicio) = ? AND status != 'finalizada' LIMIT 1`,
      [hoje]
    );
    
    let totalMinutos = result?.total_minutos || 0;
    
    if (sessaoAtiva && sessaoAtiva.status === 'ativa') {
      const inicio = new Date(sessaoAtiva.inicio);
      const agora = new Date();
      const minutosCorridos = Math.round((agora.getTime() - inicio.getTime()) / 60000);
      totalMinutos += minutosCorridos - (sessaoAtiva.tempo_pausado_minutos || 0);
    }
    
    const locaisResult = await database.getAllAsync<{ nome: string | null }>(
      `SELECT DISTINCT l.nome 
       FROM sessoes s 
       LEFT JOIN locais l ON s.local_id = l.id 
       WHERE DATE(s.inicio) = ?`,
      [hoje]
    );
    
    return {
      data: hoje,
      total_minutos: Math.max(0, totalMinutos),
      total_sessoes: (result?.total_sessoes || 0) + (sessaoAtiva ? 1 : 0),
      locais: (locaisResult || []).map(l => l.nome).filter((n): n is string => n !== null),
    };
  } catch (error) {
    logger.error('database', 'Error getting today stats', { error: String(error) });
    return {
      data: new Date().toISOString().split('T')[0],
      total_minutos: 0,
      total_sessoes: 0,
      locais: [],
    };
  }
}

// ============================================
// Utilitários
// ============================================
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.abs(minutes % 60);
  return `${hours}h ${mins.toString().padStart(2, '0')}min`;
}

export async function clearAllData(): Promise<void> {
  try {
    const database = getDb();
    await database.execAsync('DELETE FROM pausas;');
    await database.execAsync('DELETE FROM sessoes;');
    await database.execAsync('DELETE FROM registros;');
    await database.execAsync('DELETE FROM locais;');
    logger.warn('database', 'All data cleared');
  } catch (error) {
    logger.error('database', 'Error clearing data', { error: String(error) });
  }
}
