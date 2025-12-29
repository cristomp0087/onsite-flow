import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useLocation, useGeofences, useCurrentLocation } from '../../src/hooks/useLocation';
import { logger } from '../../src/lib/logger';
import { colors } from '../../src/constants/colors';
import { Button } from '../../src/components/ui/Button';
import { formatDistance, calculateDistance } from '../../src/lib/location';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { initialize, isGeofencingActive, isBackgroundActive } = useLocation();
  const { location, accuracy } = useCurrentLocation();
  const { locais, activeLocal } = useGeofences();
  
  useEffect(() => {
    logger.info('auth', 'Home screen loaded', { userId: user?.id });
    initialize();
  }, []);
  
  // Calcular distância do local mais próximo
  const nearestLocal = location && locais.length > 0
    ? locais.reduce((nearest, local) => {
        const dist = calculateDistance(location, { latitude: local.latitude, longitude: local.longitude });
        if (!nearest || dist < nearest.distance) {
          return { local, distance: dist };
        }
        return nearest;
      }, null as { local: typeof locais[0]; distance: number } | null)
    : null;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>👋 Olá!</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      
      {/* Status Card */}
      <View style={[
        styles.card, 
        activeLocal ? styles.activeCard : null
      ]}>
        <Text style={styles.cardTitle}>📍 Status</Text>
        {activeLocal ? (
          <>
            <Text style={styles.activeStatus}>TRABALHANDO</Text>
            <Text style={styles.activeLocalName}>{activeLocal.nome}</Text>
          </>
        ) : (
          <>
            <Text style={styles.inactiveStatus}>Fora do local de trabalho</Text>
            {nearestLocal && (
              <Text style={styles.nearestText}>
                Mais próximo: {nearestLocal.local.nome} ({formatDistance(nearestLocal.distance)})
              </Text>
            )}
            {locais.length === 0 && (
              <Text style={styles.hint}>
                Vá até a aba Mapa para adicionar locais de trabalho
              </Text>
            )}
          </>
        )}
      </View>
      
      {/* Horas Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⏱️ Hoje</Text>
        <Text style={styles.bigNumber}>0h 00min</Text>
        <Text style={styles.hint}>Nenhum registro hoje</Text>
      </View>
      
      {/* GPS Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛰️ GPS</Text>
        <View style={styles.gpsRow}>
          <Text style={styles.gpsLabel}>Localização:</Text>
          <Text style={styles.gpsValue}>
            {location 
              ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
              : 'Obtendo...'
            }
          </Text>
        </View>
        <View style={styles.gpsRow}>
          <Text style={styles.gpsLabel}>Precisão:</Text>
          <Text style={styles.gpsValue}>
            {accuracy ? `~${accuracy.toFixed(0)}m` : '-'}
          </Text>
        </View>
        <View style={styles.gpsRow}>
          <Text style={styles.gpsLabel}>Monitoramento:</Text>
          <Text style={[styles.gpsValue, isGeofencingActive ? styles.activeText : null]}>
            {isGeofencingActive ? '🟢 Ativo' : '⚫ Inativo'}
          </Text>
        </View>
        <View style={styles.gpsRow}>
          <Text style={styles.gpsLabel}>Background:</Text>
          <Text style={[styles.gpsValue, isBackgroundActive ? styles.activeText : null]}>
            {isBackgroundActive ? '🟢 Ativo' : '⚫ Inativo'}
          </Text>
        </View>
      </View>
      
      {/* Test DevMonitor */}
      <View style={styles.testSection}>
        <Text style={styles.testTitle}>🧪 Teste o DevMonitor:</Text>
        <Button 
          title="Gerar Logs de Teste" 
          onPress={() => {
            logger.debug('perf', 'Debug test', { test: true });
            logger.info('gps', 'GPS position update', { 
              lat: location?.latitude || 45.4215, 
              lng: location?.longitude || -75.6972 
            });
            logger.warn('sync', 'Sync retry warning', { attempt: 2 });
            logger.error('api', 'API error test', { status: 500 });
          }}
          variant="outline"
        />
        <Text style={styles.testHint}>
          Toque no botão 🔍 no canto inferior direito para ver os logs!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
  },
  header: {
    marginBottom: 24,
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
    padding: 20,
    marginBottom: 16,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  activeStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 4,
  },
  activeLocalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
  },
  inactiveStatus: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  nearestText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  hint: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  gpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gpsLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  gpsValue: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  activeText: {
    color: colors.success,
    fontWeight: '600',
  },
  testSection: {
    marginTop: 'auto',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  testHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 12,
    textAlign: 'center',
  },
});
