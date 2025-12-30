export type Database = {
  public: {
    Tables: {
      locais: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          latitude: number;
          longitude: number;
          raio: number;
          cor: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          latitude: number;
          longitude: number;
          raio?: number;
          cor?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          latitude?: number;
          longitude?: number;
          raio?: number;
          cor?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessoes: {
        Row: {
          id: string;
          user_id: string;
          local_id: string;
          local_nome: string | null;
          inicio: string;
          fim: string | null;
          duracao_minutos: number | null;
          status: 'ativa' | 'pausada' | 'finalizada';
          tempo_pausado_minutos: number | null;
          coords_entrada: any | null;
          coords_saida: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          local_id: string;
          local_nome?: string | null;
          inicio: string;
          fim?: string | null;
          duracao_minutos?: number | null;
          status?: 'ativa' | 'pausada' | 'finalizada';
          tempo_pausado_minutos?: number | null;
          coords_entrada?: any | null;
          coords_saida?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          local_id?: string;
          local_nome?: string | null;
          inicio?: string;
          fim?: string | null;
          duracao_minutos?: number | null;
          status?: 'ativa' | 'pausada' | 'finalizada';
          tempo_pausado_minutos?: number | null;
          coords_entrada?: any | null;
          coords_saida?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Tipos auxiliares
export type Local = Database['public']['Tables']['locais']['Row'];
export type Sessao = Database['public']['Tables']['sessoes']['Row'];
export type SessaoStatus = 'ativa' | 'pausada' | 'finalizada';
