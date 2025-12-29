import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation, useGeofences, useCurrentLocation } from '../../src/hooks/useLocation';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/constants/colors';
import { formatDistance, calculateDistance } from '../../src/lib/location';

export default function MapScreen() {
  const { hasPermission, hasBackgroundPermission, isWatching, startTracking, stopTracking } = useLocation();
  const { location, accuracy, refresh } = useCurrentLocation();
  const { locais, activeLocal, isMonitoring, addLocal, removeLocal, startMonitoring, stopMonitoring } = useGeofences();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocalName, setNewLocalName] = useState('');
  const [newLocalRaio, setNewLocalRaio] = useState('50');
  
  // Inicializar ao montar
  useEffect(() => {
    refresh();
  }, []);
  
  const handleAddLocal = () => {
    if (!location) {
      Alert.alert('Erro', 'Aguarde obter sua localização primeiro');
      return;
    }
    
    if (!newLocalName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o local');
      return;
    }
    
    addLocal({
      nome: newLocalName.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      raio: parseInt(newLocalRaio) || 50,
      cor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      ativo: true,
    });
    
    setNewLocalName('');
    setNewLocalRaio('50');
    setShowAddModal(false);
    
    Alert.alert('Sucesso', 'Local adicionado! Ative o monitoramento para começar.');
  };
  
  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      await stopMonitoring();
    } else {
      if (locais.length === 0) {
        Alert.alert('Erro', 'Adicione pelo menos um local primeiro');
        return;
      }
      await startMonitoring();
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ Mapa</Text>
          <Text style={styles.subtitle}>Gerencie seus locais de trabalho</Text>
        </View>
        
        {/* Status de Permissões */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Permissões</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>GPS (foreground):</Text>
            <Text style={[styles.statusValue, hasPermission ? styles.statusOk : styles.statusNo]}>
              {hasPermission ? '✅ Permitido' : '❌ Negado'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>GPS (background):</Text>
            <Text style={[styles.statusValue, hasBackgroundPermission ? styles.statusOk : styles.statusNo]}>
              {hasBackgroundPermission ? '✅ Permitido' : '⚠️ Não solicitado'}
            </Text>
          </View>
        </View>
        
        {/* Localização Atual */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Sua Localização</Text>
          {location ? (
            <>
              <Text style={styles.coordText}>
                Lat: {location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordText}>
                Lng: {location.longitude.toFixed(6)}
              </Text>
              {accuracy && (
                <Text style={styles.accuracyText}>
                  Precisão: ~{accuracy.toFixed(0)}m
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>Obtendo localização...</Text>
          )}
          
          <View style={styles.buttonRow}>
            <Button 
              title="🔄 Atualizar" 
              onPress={refresh}
              variant="outline"
              style={styles.smallButton}
            />
            <Button 
              title={isWatching ? "⏹️ Parar" : "▶️ Tempo Real"} 
              onPress={isWatching ? stopTracking : startTracking}
              variant={isWatching ? "secondary" : "primary"}
              style={styles.smallButton}
            />
          </View>
        </View>
        
        {/* Geofence Ativo */}
        {activeLocal && (
          <View style={[styles.card, styles.activeCard]}>
            <Text style={styles.cardTitle}>🎯 VOCÊ ESTÁ EM:</Text>
            <Text style={styles.activeLocalName}>{activeLocal.nome}</Text>
          </View>
        )}
        
        {/* Lista de Locais */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📋 Locais ({locais.length})</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Text style={styles.addButton}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>
          
          {locais.length === 0 ? (
            <Text style={styles.noDataText}>
              Nenhum local cadastrado.{'\n'}
              Toque em "+ Adicionar" para criar um local na sua posição atual.
            </Text>
          ) : (
            locais.map((local) => {
              const distance = location 
                ? calculateDistance(location, { latitude: local.latitude, longitude: local.longitude })
                : null;
              
              return (
                <View key={local.id} style={styles.localItem}>
                  <View style={[styles.localColor, { backgroundColor: local.cor }]} />
                  <View style={styles.localInfo}>
                    <Text style={styles.localName}>{local.nome}</Text>
                    <Text style={styles.localDetails}>
                      Raio: {local.raio}m
                      {distance !== null && ` • ${formatDistance(distance)} de distância`}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert(
                        'Remover Local',
                        `Deseja remover "${local.nome}"?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Remover', style: 'destructive', onPress: () => removeLocal(local.id) },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.removeButton}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
        
        {/* Controle de Monitoramento */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔔 Monitoramento</Text>
          <Text style={styles.monitoringStatus}>
            Status: {isMonitoring ? '🟢 Ativo' : '⚫ Inativo'}
          </Text>
          <Button
            title={isMonitoring ? '⏹️ Parar Monitoramento' : '▶️ Iniciar Monitoramento'}
            onPress={handleToggleMonitoring}
            variant={isMonitoring ? 'secondary' : 'primary'}
            disabled={locais.length === 0}
          />
          {locais.length === 0 && (
            <Text style={styles.hintText}>
              Adicione locais acima para poder monitorar
            </Text>
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Modal Adicionar Local */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Adicionar Local</Text>
            
            <Text style={styles.inputLabel}>Nome do Local</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Escritório, Obra, Cliente"
              value={newLocalName}
              onChangeText={setNewLocalName}
            />
            
            <Text style={styles.inputLabel}>Raio (metros)</Text>
            <TextInput
              style={styles.input}
              placeholder="50"
              value={newLocalRaio}
              onChangeText={setNewLocalRaio}
              keyboardType="number-pad"
            />
            
            <Text style={styles.modalHint}>
              📍 O local será criado na sua posição atual
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setShowAddModal(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Adicionar"
                onPress={handleAddLocal}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
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
  card: {
    backgroundColor: colors.background,
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  activeCard: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: colors.success,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    color: colors.textSecondary,
  },
  statusValue: {
    fontWeight: '500',
  },
  statusOk: {
    color: colors.success,
  },
  statusNo: {
    color: colors.warning,
  },
  coordText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  noDataText: {
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 10,
  },
  activeLocalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
  },
  addButton: {
    color: colors.primary,
    fontWeight: '600',
  },
  localItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  localColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  localInfo: {
    flex: 1,
  },
  localName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  localDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    fontSize: 20,
    padding: 8,
  },
  monitoringStatus: {
    fontSize: 16,
    marginBottom: 12,
    color: colors.text,
  },
  hintText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
  },
});
