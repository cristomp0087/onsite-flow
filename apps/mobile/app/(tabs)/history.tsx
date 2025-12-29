import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useRegistroStore } from '../../src/stores/registroStore';
import { getSessoes, formatDuration, type SessaoDB } from '../../src/lib/database';
import { colors } from '../../src/constants/colors';
import { logger } from '../../src/lib/logger';

type FilterPeriod = 'hoje' | 'semana' | 'mes';

export default function HistoryScreen() {
  const { refreshData, isInitialized } = useRegistroStore();
  const [filter, setFilter] = useState<FilterPeriod>('hoje');
  const [sessoes, setSessoes] = useState<SessaoDB[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalMinutos, setTotalMinutos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadSessoes = useCallback(async () => {
    if (!isInitialized) {
      logger.debug('database', 'History: waiting for initialization');
      return;
    }
    
    try {
      setIsLoading(true);
      let dataInicio: string | undefined;
      const hoje = new Date();
      
      switch (filter) {
        case 'hoje':
          dataInicio = hoje.toISOString().split('T')[0];
          break;
        case 'semana':
          const semanaAtras = new Date(hoje);
          semanaAtras.setDate(hoje.getDate() - 7);
          dataInicio = semanaAtras.toISOString().split('T')[0];
          break;
        case 'mes':
          const mesAtras = new Date(hoje);
          mesAtras.setMonth(hoje.getMonth() - 1);
          dataInicio = mesAtras.toISOString().split('T')[0];
          break;
      }
      
      const result = await getSessoes({ 
        dataInicio,
        dataFim: hoje.toISOString().split('T')[0],
      });
      
      setSessoes(result);
      
      // Calcular total
      const total = result.reduce((acc, s) => acc + (s.duracao_minutos || 0), 0);
      setTotalMinutos(total);
      
      logger.debug('database', `History: loaded ${result.length} sessions for ${filter}`);
    } catch (error) {
      logger.error('database', 'Error loading sessions', { error: String(error) });
    } finally {
      setIsLoading(false);
    }
  }, [filter, isInitialized]);
  
  // Carregar ao mudar filtro
  useEffect(() => {
    loadSessoes();
  }, [loadSessoes]);
  
  // ATUALIZAR QUANDO A TELA RECEBE FOCO
  useFocusEffect(
    useCallback(() => {
      logger.debug('database', 'History screen focused - refreshing');
      refreshData();
      loadSessoes();
    }, [loadSessoes, refreshData])
  );
  
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadSessoes();
    setRefreshing(false);
  };
  
  // Agrupar sessões por dia
  const sessoesPorDia = sessoes.reduce((acc, sessao) => {
    const dia = sessao.inicio.split('T')[0];
    if (!acc[dia]) {
      acc[dia] = [];
    }
    acc[dia].push(sessao);
    return acc;
  }, {} as Record<string, SessaoDB[]>);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === hoje) return 'Hoje';
    if (dateStr === ontem) return 'Ontem';
    
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short' 
    });
  };
  
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📋 Histórico</Text>
        <Text style={styles.subtitle}>Seus registros de trabalho</Text>
      </View>
      
      {/* Filtros */}
      <View style={styles.filterContainer}>
        {(['hoje', 'semana', 'mes'] as FilterPeriod[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.filterButton, filter === period && styles.filterActive]}
            onPress={() => setFilter(period)}
          >
            <Text style={[styles.filterText, filter === period && styles.filterTextActive]}>
              {period === 'hoje' ? 'Hoje' : period === 'semana' ? '7 dias' : '30 dias'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total no período</Text>
        <Text style={styles.totalValue}>{formatDuration(totalMinutos)}</Text>
        <Text style={styles.totalSessions}>
          {sessoes.length} {sessoes.length === 1 ? 'sessão' : 'sessões'}
        </Text>
      </View>
      
      {/* Lista de Sessões */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Carregando...</Text>
          </View>
        ) : sessoes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
            <Text style={styles.emptySubtext}>
              Os registros aparecerão aqui quando você entrar e sair de um local de trabalho
            </Text>
          </View>
        ) : (
          Object.entries(sessoesPorDia)
            .sort(([a], [b]) => b.localeCompare(a)) // Mais recente primeiro
            .map(([dia, sessoesDia]) => {
              const totalDia = sessoesDia.reduce((acc, s) => acc + (s.duracao_minutos || 0), 0);
              
              return (
                <View key={dia} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{formatDate(dia)}</Text>
                    <Text style={styles.dayTotal}>{formatDuration(totalDia)}</Text>
                  </View>
                  
                  {sessoesDia.map((sessao) => (
                    <View key={sessao.id} style={styles.sessaoCard}>
                      <View style={styles.sessaoLeft}>
                        <View style={styles.timeline}>
                          <View style={[styles.dot, styles.dotStart]} />
                          <View style={styles.line} />
                          <View style={[styles.dot, sessao.fim ? styles.dotEnd : styles.dotActive]} />
                        </View>
                        <View style={styles.times}>
                          <Text style={styles.time}>{formatTime(sessao.inicio)}</Text>
                          <Text style={styles.time}>
                            {sessao.fim ? formatTime(sessao.fim) : '...'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.sessaoRight}>
                        <Text style={styles.sessaoLocal}>{sessao.local_nome || 'Local'}</Text>
                        <Text style={[styles.sessaoDuracao, !sessao.fim && styles.emAndamento]}>
                          {sessao.duracao_minutos 
                            ? formatDuration(sessao.duracao_minutos)
                            : '⏳ Em andamento'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  totalCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  totalSessions: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  dayTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  sessaoCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
  },
  sessaoLeft: {
    flexDirection: 'row',
    marginRight: 16,
  },
  timeline: {
    width: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotStart: {
    backgroundColor: colors.success,
  },
  dotEnd: {
    backgroundColor: colors.error,
  },
  dotActive: {
    backgroundColor: '#F59E0B',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  times: {
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  sessaoRight: {
    flex: 1,
    justifyContent: 'center',
  },
  sessaoLocal: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  sessaoDuracao: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  emAndamento: {
    color: '#F59E0B',
  },
});
