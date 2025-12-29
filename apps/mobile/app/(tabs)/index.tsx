import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { logger } from '../../src/lib/logger';
import { colors } from '../../src/constants/colors';
import { Button } from '../../src/components/ui/Button';

export default function HomeScreen() {
  const { user } = useAuthStore();
  
  useEffect(() => {
    logger.info('auth', 'Home screen loaded', { userId: user?.id });
  }, []);
  
  const testLog = () => {
    logger.debug('perf', 'Debug test', { test: true });
    logger.info('gps', 'Info test - GPS position updated', { lat: 45.4215, lng: -75.6972 });
    logger.warn('sync', 'Warning test - Sync retry', { attempt: 2 });
    logger.error('api', 'Error test - API failed', { status: 500 });
    logger.security('auth', 'Security test - Token check');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>👋 Olá!</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Status</Text>
        <Text style={styles.status}>Nenhum local ativo</Text>
        <Text style={styles.hint}>
          Vá até a aba Mapa para adicionar locais de trabalho
        </Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⏱️ Hoje</Text>
        <Text style={styles.bigNumber}>0h 00min</Text>
        <Text style={styles.hint}>Nenhum registro hoje</Text>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.testTitle}>🧪 Teste o DevMonitor:</Text>
        <Button 
          title="Gerar Logs de Teste" 
          onPress={testLog}
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  status: {
    fontSize: 18,
    color: colors.textSecondary,
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
