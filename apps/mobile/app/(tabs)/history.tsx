import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useRegistroStore } from '../../src/stores/registroStore';
import { useAuthStore } from '../../src/stores/authStore';
import { getSessoes, formatDuration, type SessaoDB } from '../../src/lib/database';
import { 
  generateTextReport, 
  generateSummaryReport,
  generateSingleSessionReport,
  formatDateBR,
  formatDurationText,
} from '../../src/lib/reports';
import { colors } from '../../src/constants/colors';
import { logger } from '../../src/lib/logger';

type FilterPeriod = 'hoje' | 'semana' | 'mes';

export default function HistoryScreen() {
  const { refreshData, isInitialized } = useRegistroStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterPeriod>('hoje');
  const [sessoes, setSessoes] = useState<SessaoDB[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalMinutos, setTotalMinutos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modo seleção
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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
      
      // Filtrar apenas sessões finalizadas para o relatório
      const finalizadas = result.filter(s => s.status === 'finalizada');
      setSessoes(result); // Mantém todas para exibição
      
      // Calcular total apenas das finalizadas
      const total = finalizadas.reduce((acc, s) => acc + (s.duracao_minutos || 0), 0);
      setTotalMinutos(total);
      
      logger.debug('database', `History: loaded ${result.length} sessions for ${filter}`);
    } catch (error) {
      logger.error('database', 'Error loading sessions', { error: String(error) });
    } finally {
      setIsLoading(false);
    }
  }, [filter, isInitialized]);
  
  useEffect(() => {
    loadSessoes();
  }, [loadSessoes]);
  
  useFocusEffect(
    useCallback(() => {
      logger.debug('database', 'History screen focused - refreshing');
      refreshData();
      loadSessoes();
      // Limpar seleção ao voltar
      setSelectionMode(false);
      setSelectedIds(new Set());
    }, [loadSessoes, refreshData])
  );
  
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadSessoes();
    setRefreshing(false);
  };
  
  // Toggle seleção de uma sessão
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  // Ativar modo seleção (long press)
  const handleLongPress = (id: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([id]));
    }
  };
  
  // Cancelar seleção
  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };
  
  // Selecionar todas
  const selectAll = () => {
    const finalizadas = sessoes.filter(s => s.status === 'finalizada');
    setSelectedIds(new Set(finalizadas.map(s => s.id)));
  };
  
  // Compartilhar selecionadas
  const shareSelected = async () => {
    const selectedSessoes = sessoes.filter(s => selectedIds.has(s.id) && s.status === 'finalizada');
    
    if (selectedSessoes.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos uma sessão finalizada.');
      return;
    }
    
    // Determinar período
    const datas = selectedSessoes.map(s => s.inicio.split('T')[0]).sort();
    const dataInicio = datas[0];
    const dataFim = datas[datas.length - 1];
    
    const report = generateTextReport({
      sessoes: selectedSessoes,
      dataInicio,
      dataFim,
      userEmail: user?.email,
    });
    
    try {
      // Compartilhar usando Share nativo
      const result = await Share.share({
        message: report,
        title: 'Relatório de Horas',
      });
      
      if (result.action === Share.sharedAction) {
        cancelSelection();
      }
    } catch (error) {
      logger.error('reports', 'Error sharing report', { error: String(error) });
      Alert.alert('Erro', 'Não foi possível compartilhar o relatório.');
    }
  };
  
  // Compartilhar sessão individual
  const shareSingle = async (sessao: SessaoDB) => {
    if (sessao.status !== 'finalizada') {
      Alert.alert('Aviso', 'Só é possível compartilhar sessões finalizadas.');
      return;
    }
    
    const report = generateSingleSessionReport(sessao, user?.email);
    
    try {
      await Share.share({
        message: report,
        title: 'Registro de Trabalho',
      });
    } catch (error) {
      logger.error('reports', 'Error sharing single report', { error: String(error) });
      Alert.alert('Erro', 'Não foi possível compartilhar o registro.');
    }
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
  
  const selectedCount = selectedIds.size;
  const selectedMinutos = sessoes
    .filter(s => selectedIds.has(s.id))
    .reduce((acc, s) => acc + (s.duracao_minutos || 0), 0);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {selectionMode ? (
          <View style={styles.selectionHeader}>
            <TouchableOpacity onPress={cancelSelection}>
              <Text style={styles.cancelButton}>✕ Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.selectionCount}>{selectedCount} selecionado(s)</Text>
            <TouchableOpacity onPress={selectAll}>
              <Text style={styles.selectAllButton}>Todos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.title}>📋 Histórico</Text>
            <Text style={styles.subtitle}>Toque e segure para selecionar</Text>
          </>
        )}
      </View>
      
      {/* Filtros */}
      {!selectionMode && (
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
      )}
      
      {/* Total Card */}
      <View style={[styles.totalCard, selectionMode && styles.totalCardSelection]}>
        {selectionMode ? (
          <>
            <Text style={styles.totalLabel}>Selecionado</Text>
            <Text style={styles.totalValue}>{formatDurationText(selectedMinutos)}</Text>
            <Text style={styles.totalSessions}>
              {selectedCount} {selectedCount === 1 ? 'sessão' : 'sessões'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.totalLabel}>Total no período</Text>
            <Text style={styles.totalValue}>{formatDuration(totalMinutos)}</Text>
            <Text style={styles.totalSessions}>
              {sessoes.filter(s => s.status === 'finalizada').length} {sessoes.filter(s => s.status === 'finalizada').length === 1 ? 'sessão' : 'sessões'} finalizada(s)
            </Text>
          </>
        )}
      </View>
      
      {/* Botão de Compartilhar (modo seleção) */}
      {selectionMode && selectedCount > 0 && (
        <TouchableOpacity style={styles.shareButton} onPress={shareSelected}>
          <Text style={styles.shareButtonText}>📤 Compartilhar Relatório</Text>
        </TouchableOpacity>
      )}
      
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
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([dia, sessoesDia]) => {
              const totalDia = sessoesDia
                .filter(s => s.status === 'finalizada')
                .reduce((acc, s) => acc + (s.duracao_minutos || 0), 0);
              
              return (
                <View key={dia} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{formatDate(dia)}</Text>
                    <Text style={styles.dayTotal}>{formatDuration(totalDia)}</Text>
                  </View>
                  
                  {sessoesDia.map((sessao) => {
                    const isSelected = selectedIds.has(sessao.id);
                    const isFinalized = sessao.status === 'finalizada';
                    
                    return (
                      <TouchableOpacity
                        key={sessao.id}
                        style={[
                          styles.sessaoCard,
                          isSelected && styles.sessaoCardSelected,
                          !isFinalized && styles.sessaoCardPending,
                        ]}
                        onPress={() => {
                          if (selectionMode) {
                            if (isFinalized) toggleSelection(sessao.id);
                          } else {
                            if (isFinalized) shareSingle(sessao);
                          }
                        }}
                        onLongPress={() => {
                          if (isFinalized) handleLongPress(sessao.id);
                        }}
                        delayLongPress={300}
                      >
                        {/* Checkbox visual */}
                        {selectionMode && (
                          <View style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                            !isFinalized && styles.checkboxDisabled,
                          ]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                        )}
                        
                        <View style={styles.sessaoLeft}>
                          <View style={styles.timeline}>
                            <View style={[styles.dot, styles.dotStart]} />
                            <View style={styles.line} />
                            <View style={[
                              styles.dot, 
                              sessao.status === 'finalizada' ? styles.dotEnd : 
                              sessao.status === 'pausada' ? styles.dotPaused : styles.dotActive
                            ]} />
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
                          <View style={styles.sessaoFooter}>
                            <Text style={[
                              styles.sessaoDuracao, 
                              !isFinalized && styles.emAndamento
                            ]}>
                              {isFinalized 
                                ? formatDuration(sessao.duracao_minutos || 0)
                                : sessao.status === 'pausada' ? '⏸️ Pausada' : '⏳ Em andamento'}
                            </Text>
                            {!selectionMode && isFinalized && (
                              <Text style={styles.shareHint}>📤</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
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
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectAllButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
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
  totalCardSelection: {
    backgroundColor: '#10B981',
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
  shareButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    alignItems: 'center',
  },
  sessaoCardSelected: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  sessaoCardPending: {
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxDisabled: {
    opacity: 0.3,
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
  dotPaused: {
    backgroundColor: '#F59E0B',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
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
  sessaoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessaoDuracao: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  emAndamento: {
    color: '#F59E0B',
  },
  shareHint: {
    fontSize: 14,
    opacity: 0.5,
  },
});
