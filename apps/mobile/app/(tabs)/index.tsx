import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useLocationStore } from '../../src/stores/locationStore';
import { useRegistroStore } from '../../src/stores/registroStore';
import { useWorkSessionStore } from '../../src/stores/workSessionStore';
import { logger } from '../../src/lib/logger';
import { colors } from '../../src/constants/colors';
import { Button } from '../../src/components/ui/Button';
import { formatDuration } from '../../src/lib/database';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { 
    initialize: initLocation, 
    isGeofencingActive,
    currentLocation,
    accuracy,
    locais,
    activeGeofence,
  } = useLocationStore();
  
  const {
    initialize: initRegistros,
    estatisticasHoje,
    sessoesHoje,
    sessaoAtual,
    refreshData,
    pausar,
    retomar,
    registrarSaida,
  } = useRegistroStore();
  
  const { startTimer } = useWorkSessionStore();
  
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  
  const activeLocal = locais.find(l => l.id === activeGeofence);
  const isInsideGeofence = !!activeGeofence;
  const isWorking = sessaoAtual && sessaoAtual.status !== 'finalizada';
  const isPaused = sessaoAtual?.status === 'pausada';
  
  useEffect(() => {
    initLocation();
    initRegistros();
  }, []);
  
  // Cronômetro em tempo real
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (sessaoAtual && sessaoAtual.status === 'ativa') {
      updateElapsedTime();
      timer = setInterval(updateElapsedTime, 1000);
    } else if (sessaoAtual && sessaoAtual.status === 'pausada') {
      // Quando pausado, mostrar tempo até a pausa
      updateElapsedTime();
    } else {
      setElapsedMinutes(estatisticasHoje?.total_minutos || 0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessaoAtual, estatisticasHoje]);
  
  const updateElapsedTime = () => {
    if (!sessaoAtual) return;
    
    const inicio = new Date(sessaoAtual.inicio);
    const agora = new Date();
    const diffMinutes = Math.floor((agora.getTime() - inicio.getTime()) / 60000);
    
    const sessoesFinalizadas = sessoesHoje
      .filter(s => s.status === 'finalizada')
      .reduce((acc, s) => acc + (s.duracao_minutos || 0), 0);
    
    // Descontar tempo pausado
    const tempoPausado = sessaoAtual.tempo_pausado_minutos || 0;
    
    if (sessaoAtual.status === 'ativa') {
      setElapsedMinutes(sessoesFinalizadas + diffMinutes - tempoPausado);
    } else {
      // Se pausado, não incrementar
      setElapsedMinutes(sessoesFinalizadas + diffMinutes - tempoPausado);
    }
  };
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshData();
      }
    });
    return () => subscription.remove();
  }, []);
  
  // Iniciar manualmente
  const handleStart = async () => {
    if (!activeGeofence) {
      Alert.alert('Aviso', 'Você precisa estar dentro de um local de trabalho para iniciar.');
      return;
    }
    
    await startTimer(activeGeofence, currentLocation ? {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: accuracy || undefined,
    } : undefined);
    
    refreshData();
  };
  
  // Pausar
  const handlePause = () => {
    Alert.alert(
      'Pausar Cronômetro',
      'Deseja pausar? O tempo não será contado até você retomar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Pausar', onPress: pausar },
      ]
    );
  };
  
  // Retomar
  const handleResume = () => {
    retomar();
  };
  
  // Encerrar
  const handleStop = () => {
    if (!sessaoAtual) return;
    
    Alert.alert(
      'Encerrar Cronômetro',
      'Deseja encerrar e gerar o relatório?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Encerrar', 
          style: 'destructive',
          onPress: async () => {
            await registrarSaida(sessaoAtual.local_id, currentLocation ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              accuracy: accuracy || undefined,
            } : undefined);
          }
        },
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>👋 Olá!</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        
        {/* Status Card */}
        <View style={[styles.card, isWorking && !isPaused && styles.activeCard, isPaused && styles.pausedCard]}>
          <Text style={styles.cardTitle}>📍 Status</Text>
          
          {isWorking ? (
            <>
              <Text style={[styles.statusText, isPaused && styles.pausedText]}>
                {isPaused ? '⏸️ PAUSADO' : '🟢 TRABALHANDO'}
              </Text>
              <Text style={styles.localName}>{sessaoAtual?.local_nome || activeLocal?.nome || 'Local'}</Text>
              <Text style={styles.sinceText}>
                Desde {new Date(sessaoAtual!.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              
              {/* Botões de controle */}
              <View style={styles.controlButtons}>
                {isPaused ? (
                  <Button
                    title="▶️ Retomar"
                    onPress={handleResume}
                    style={styles.resumeButton}
                  />
                ) : (
                  <Button
                    title="⏸️ Pausar"
                    onPress={handlePause}
                    variant="outline"
                    style={styles.pauseButton}
                  />
                )}
                <Button
                  title="⏹️ Encerrar"
                  onPress={handleStop}
                  variant="secondary"
                  style={styles.stopButton}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.inactiveText}>
                {isInsideGeofence ? 'Pronto para trabalhar' : 'Fora do local de trabalho'}
              </Text>
              {isInsideGeofence && (
                <>
                  <Text style={styles.localName}>{activeLocal?.nome}</Text>
                  <Button
                    title="▶️ Iniciar Cronômetro"
                    onPress={handleStart}
                    style={{ marginTop: 12 }}
                  />
                </>
              )}
              {!isInsideGeofence && locais.length === 0 && (
                <Text style={styles.hint}>Vá até a aba Mapa para adicionar locais</Text>
              )}
            </>
          )}
        </View>
        
        {/* Horas Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏱️ Hoje</Text>
          <Text style={[styles.bigNumber, isWorking && !isPaused && styles.activeNumber]}>
            {formatDuration(elapsedMinutes)}
          </Text>
          {isWorking && !isPaused && (
            <Text style={styles.runningIndicator}>● Cronômetro rodando...</Text>
          )}
          {isPaused && (
            <Text style={styles.pausedIndicator}>⏸️ Pausado</Text>
          )}
          {!isWorking && sessoesHoje.length === 0 && (
            <Text style={styles.hint}>Nenhum registro hoje</Text>
          )}
        </View>
        
        {/* Sessões de Hoje */}
        {sessoesHoje.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Sessões de Hoje</Text>
            {sessoesHoje.slice(0, 5).map((sessao) => (
              <View key={sessao.id} style={styles.sessaoItem}>
                <View style={styles.sessaoInfo}>
                  <Text style={styles.sessaoLocal}>{sessao.local_nome || 'Local'}</Text>
                  <Text style={styles.sessaoTime}>
                    {new Date(sessao.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {sessao.fim 
                      ? ` - ${new Date(sessao.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : ' - agora'}
                  </Text>
                </View>
                <Text style={[
                  styles.sessaoDuracao,
                  sessao.status === 'pausada' && styles.pausedDuracao,
                  sessao.status === 'ativa' && styles.activeDuracao,
                ]}>
                  {sessao.status === 'finalizada' 
                    ? formatDuration(sessao.duracao_minutos || 0)
                    : sessao.status === 'pausada' ? '⏸️' : '⏳'}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* GPS Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛰️ GPS</Text>
          <View style={styles.gpsRow}>
            <Text style={styles.gpsLabel}>Localização:</Text>
            <Text style={styles.gpsValue}>
              {currentLocation 
                ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                : 'Obtendo...'}
            </Text>
          </View>
          <View style={styles.gpsRow}>
            <Text style={styles.gpsLabel}>Monitoramento:</Text>
            <Text style={[styles.gpsValue, isGeofencingActive && styles.activeGps]}>
              {isGeofencingActive ? '🟢 Ativo' : '⚫ Inativo'}
            </Text>
          </View>
        </View>
        
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
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCard: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: colors.success,
  },
  pausedCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
  },
  pausedText: {
    color: '#F59E0B',
  },
  localName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  sinceText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  controlButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  pauseButton: {
    flex: 1,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
  },
  inactiveText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  bigNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
  },
  activeNumber: {
    color: colors.success,
  },
  runningIndicator: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
  },
  pausedIndicator: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  sessaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessaoInfo: {
    flex: 1,
  },
  sessaoLocal: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  sessaoTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessaoDuracao: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  pausedDuracao: {
    color: '#F59E0B',
  },
  activeDuracao: {
    color: colors.success,
  },
  gpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gpsLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  gpsValue: {
    color: colors.text,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  activeGps: {
    color: colors.success,
  },
});
