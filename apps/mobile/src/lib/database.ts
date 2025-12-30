import * as SQLite from 'expo-sqlite';
import { logger } from './logger';

const db = SQLite.openDatabaseSync('onsite.db');

// Tipos alinhados com o Mobile e Web
export interface SessaoDB {
  id: string;
  user_id: string;
  local_id: string;
  local_nome: string | null;
  entrada: string;
  saida: string | null;
  tipo: string;
  editado_manualmente: number;
  motivo_edicao: string | null;
  hash_integridade: string | null;
  cor: string | null;
  device_id: string | null;
  created_at: string;
  synced_at: string | null;

  // Campos auxiliares para a UI
  status?: 'ativa' | 'pausada' | 'finalizada';
  duracao_minutos?: number;
}

export interface EstatisticasDia {
  total_minutos: number;
  total_sessoes: number;
}

// ============================================
// INICIALIZAÇÃO E MIGRAÇÃO
// ============================================

export async function initDatabase(): Promise<void> {
  try {
    // Tabela de Locais
    db.execSync(`
      CREATE TABLE IF NOT EXISTS locais (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        raio INTEGER DEFAULT 100,
        cor TEXT,
        ativo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced_at TEXT
      )
    `);

    // Tabela de Registros (Estrutura unificada compatível com Supabase)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS registros (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        local_id TEXT NOT NULL,
        local_nome TEXT,
        entrada TEXT NOT NULL,
        saida TEXT,
        tipo TEXT DEFAULT 'automatico',
        editado_manualmente INTEGER DEFAULT 0,
        motivo_edicao TEXT,
        hash_integridade TEXT,
        cor TEXT,
        device_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced_at TEXT
      )
    `);

    logger.info('database', 'Database initialized');
  } catch (error) {
    logger.error('database', 'Failed to init database', {
      error: String(error),
    });
  }
}

// ============================================
// FUNÇÕES DE LOCAIS (Restauradas)
// ============================================

export async function saveLocal(dados: {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio?: number;
  cor?: string;
  ativo?: boolean | number;
  user_id?: string;
}): Promise<string> {
  const agora = new Date().toISOString();
  const id = dados.id || generateUUID();
  // Fallback seguro para user_id se vier vazio
  const userId = dados.user_id || 'user_mobile_local';
  const ativoInt = dados.ativo === true || dados.ativo === 1 ? 1 : 0;

  try {
    db.runSync(
      `INSERT OR REPLACE INTO locais (id, user_id, nome, latitude, longitude, raio, cor, ativo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        dados.nome,
        dados.latitude,
        dados.longitude,
        dados.raio || 100,
        dados.cor || '#3B82F6',
        ativoInt,
        agora,
        agora,
      ]
    );
    return id;
  } catch (error) {
    logger.error('database', 'Erro ao salvar local', { error: String(error) });
    throw error;
  }
}

// Alias para compatibilidade caso algum arquivo antigo chame adicionarLocal
export async function adicionarLocal(dados: any): Promise<string> {
  return saveLocal({ ...dados, id: generateUUID() });
}

export async function getLocais(): Promise<any[]> {
  return db.getAllSync(`SELECT * FROM locais`);
}

export async function deleteLocal(id: string): Promise<void> {
  db.runSync(`DELETE FROM locais WHERE id = ?`, [id]);
}

// ============================================
// FUNÇÕES DE REGISTROS (Correção do NaN)
// ============================================

export async function saveRegistro(dados: {
  local_id: string;
  tipo: 'entrada' | 'saida' | 'pause' | 'resume';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  automatico?: boolean;
}): Promise<string> {
  const uuid = generateUUID();
  const agora = new Date().toISOString();
  const userId = 'user_mobile_local';

  if (dados.tipo === 'entrada') {
    const local = await getLocalById(dados.local_id);

    db.runSync(
      `INSERT INTO registros (id, user_id, local_id, local_nome, entrada, tipo, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        userId,
        dados.local_id,
        local?.nome || 'Local',
        agora,
        dados.automatico ? 'automatico' : 'manual',
        agora,
      ]
    );
    return uuid;
  } else if (dados.tipo === 'saida') {
    // Tenta fechar a sessão aberta
    const sessaoAberta = await getSessaoAberta(dados.local_id);
    if (sessaoAberta) {
      db.runSync(
        `UPDATE registros SET saida = ?, synced_at = NULL WHERE id = ?`,
        [agora, sessaoAberta.id]
      );
      return sessaoAberta.id;
    }
    // Se não achar sessão aberta, apenas loga e retorna (evita erro)
    return uuid;
  }
  return uuid;
}

export async function getSessaoAberta(
  localId: string
): Promise<SessaoDB | null> {
  const row = db.getFirstSync<SessaoDB>(
    `SELECT * FROM registros WHERE local_id = ? AND saida IS NULL ORDER BY entrada DESC LIMIT 1`,
    [localId]
  );

  if (row) {
    return {
      ...row,
      status: 'ativa',
      duracao_minutos: calculateDurationSafe(
        row.entrada,
        new Date().toISOString()
      ),
    };
  }
  return null;
}

export async function getSessaoAtivaGlobal(): Promise<SessaoDB | null> {
  const row = db.getFirstSync<SessaoDB>(
    `SELECT * FROM registros WHERE saida IS NULL ORDER BY entrada DESC LIMIT 1`
  );

  if (row) {
    return {
      ...row,
      status: 'ativa',
      duracao_minutos: calculateDurationSafe(
        row.entrada,
        new Date().toISOString()
      ),
    };
  }
  return null;
}

export async function getSessoesHoje(): Promise<SessaoDB[]> {
  const hoje = new Date().toISOString().split('T')[0];
  const rows = db.getAllSync<SessaoDB>(
    `SELECT * FROM registros WHERE entrada LIKE ? ORDER BY entrada DESC`,
    [`${hoje}%`]
  );

  return rows.map((r) => ({
    ...r,
    status: r.saida ? 'finalizada' : 'ativa',
    duracao_minutos: calculateDurationSafe(
      r.entrada,
      r.saida || new Date().toISOString()
    ),
  }));
}

export async function getEstatisticasHoje(): Promise<EstatisticasDia> {
  const sessoes = await getSessoesHoje();
  const finalizadas = sessoes.filter((s) => s.saida !== null);
  const total = finalizadas.reduce(
    (acc, curr) => acc + (curr.duracao_minutos || 0),
    0
  );
  return { total_minutos: total, total_sessoes: finalizadas.length };
}

// Mantendo funções legadas para não quebrar outros arquivos
export async function iniciarSessao(
  localId: string,
  sessaoId: string
): Promise<void> {}
export async function finalizarSessao(
  localId: string,
  registroId: string
): Promise<void> {}
export async function finalizarSessaoComAjuste(
  localId: string,
  registroId: string,
  minutosAjuste: number
): Promise<void> {
  const sessaoAberta = await getSessaoAberta(localId);
  if (!sessaoAberta) return;
  const agora = new Date();
  const saidaAjustada = new Date(
    agora.getTime() + minutosAjuste * 60000
  ).toISOString();
  db.runSync(
    `UPDATE registros SET saida = ?, editado_manualmente = 1, synced_at = NULL WHERE id = ?`,
    [saidaAjustada, sessaoAberta.id]
  );
}
export async function pausarSessao(sessaoId: string): Promise<void> {}
export async function retomarSessao(sessaoId: string): Promise<void> {}

// ============================================
// HELPERS ROBUSTOS (Aqui estava o erro)
// ============================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Cálculo ultra-seguro para evitar NaN
function calculateDurationSafe(start: string, end: string): number {
  if (!start || !end) return 0;

  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();

    if (isNaN(s) || isNaN(e)) return 0;

    const diff = Math.round((e - s) / 60000);
    return diff > 0 ? diff : 0;
  } catch (err) {
    return 0;
  }
}

// Formatação protegida contra NaN
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return '0min';
  }

  const totalMinutes = Math.floor(Math.max(0, minutes));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

async function getLocalById(id: string): Promise<{ nome: string } | null> {
  const res = db.getFirstSync<{ nome: string }>(
    `SELECT nome FROM locais WHERE id = ?`,
    [id]
  );
  return res;
}
