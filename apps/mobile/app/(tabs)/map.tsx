import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocationStore, type LocalDeTrabalho } from '../../src/stores/locationStore';
import { searchAddress, reverseGeocode, type GeocodingResult } from '../../src/lib/geocoding';
import { colors } from '../../src/constants/colors';
import { logger } from '../../src/lib/logger';
import { Button } from '../../src/components/ui/Button';

export default function MapScreen() {
  const {
    initialize,
    currentLocation,
    accuracy,
    refreshLocation,
    locais,
    addLocal,
    removeLocal,
    activeGeofence,
    isGeofencingActive,
    startGeofenceMonitoring,
    stopGeofenceMonitoring,
    hasPermission,
    hasBackgroundPermission,
  } = useLocationStore();

  const mapRef = useRef<MapView>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocalName, setNewLocalName] = useState('');
  const [newLocalRaio, setNewLocalRaio] = useState('50');
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationType, setLocationType] = useState<'current' | 'search' | 'map'>('current');

  useEffect(() => {
    initialize();
  }, []);

  // Buscar endereço
  const handleSearch = async () => {
    if (searchQuery.length < 3) return;
    
    setIsSearching(true);
    try {
      const results = await searchAddress(searchQuery);
      setSearchResults(results);
    } catch (error) {
      logger.error('map', 'Search error', { error });
    } finally {
      setIsSearching(false);
    }
  };

  // Selecionar resultado da busca
  const selectSearchResult = (result: GeocodingResult) => {
    setSelectedLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
    });
    setSearchResults([]);
    setSearchQuery('');
    setLocationType('search');
    
    // Mover mapa para o local
    mapRef.current?.animateToRegion({
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);
  };

  // Selecionar ponto no mapa
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Buscar endereço do ponto
    const address = await reverseGeocode(latitude, longitude);
    
    setSelectedLocation({
      latitude,
      longitude,
      address: address || undefined,
    });
    setLocationType('map');
  };

  // Usar localização atual
  const useCurrentLocation = () => {
    if (currentLocation) {
      setSelectedLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setLocationType('current');
    }
  };

  // Abrir modal de adicionar
  const openAddModal = () => {
    useCurrentLocation();
    setNewLocalName('');
    setNewLocalRaio('50');
    setShowAddModal(true);
  };

  // Salvar novo local
  const handleSaveLocal = () => {
    if (!newLocalName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o local');
      return;
    }
    
    if (!selectedLocation) {
      Alert.alert('Erro', 'Selecione uma localização');
      return;
    }
    
    const raio = parseInt(newLocalRaio) || 50;
    
    addLocal({
      nome: newLocalName.trim(),
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      raio,
      cor: getRandomColor(),
      ativo: true,
    });
    
    setShowAddModal(false);
    setNewLocalName('');
    setSelectedLocation(null);
    
    Alert.alert('Sucesso', 'Local adicionado!');
  };

  // Deletar local
  const handleDeleteLocal = (local: LocalDeTrabalho) => {
    Alert.alert(
      'Remover Local',
      `Deseja remover "${local.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => removeLocal(local.id),
        },
      ]
    );
  };

  const getRandomColor = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const activeLocal = locais.find(l => l.id === activeGeofence);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Mapa */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
            onPress={handleMapPress}
          >
            {/* Círculos dos geofences */}
            {locais.map((local) => (
              <React.Fragment key={local.id}>
                <Circle
                  center={{ latitude: local.latitude, longitude: local.longitude }}
                  radius={local.raio}
                  fillColor={`${local.cor}30`}
                  strokeColor={local.cor}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{ latitude: local.latitude, longitude: local.longitude }}
                  title={local.nome}
                  description={`Raio: ${local.raio}m`}
                  pinColor={local.cor}
                />
              </React.Fragment>
            ))}
            
            {/* Marcador de seleção */}
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                pinColor="#FF6B6B"
                title="Local selecionado"
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingMap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando mapa...</Text>
          </View>
        )}
        
        {/* Status overlay */}
        {activeLocal && (
          <View style={styles.statusOverlay}>
            <Text style={styles.statusText}>🎯 Você está em: {activeLocal.nome}</Text>
          </View>
        )}
      </View>
      
      {/* Painel inferior */}
      <View style={styles.panel}>
        <ScrollView>
          {/* Locais */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📍 Locais ({locais.length})</Text>
              <TouchableOpacity onPress={openAddModal}>
                <Text style={styles.addButton}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>
            
            {locais.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum local cadastrado</Text>
            ) : (
              locais.map((local) => (
                <View key={local.id} style={styles.localItem}>
                  <View style={[styles.localDot, { backgroundColor: local.cor }]} />
                  <View style={styles.localInfo}>
                    <Text style={styles.localName}>{local.nome}</Text>
                    <Text style={styles.localDetails}>Raio: {local.raio}m</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteLocal(local)}>
                    <Text style={styles.deleteButton}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
          
          {/* Monitoramento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Monitoramento</Text>
            <Text style={styles.statusLabel}>
              Status: {isGeofencingActive ? '🟢 Ativo' : '⚫ Inativo'}
            </Text>
            
            <Button
              title={isGeofencingActive ? '⏹️ Parar' : '▶️ Iniciar Monitoramento'}
              onPress={isGeofencingActive ? stopGeofenceMonitoring : startGeofenceMonitoring}
              variant={isGeofencingActive ? 'secondary' : 'primary'}
              disabled={locais.length === 0}
            />
          </View>
        </ScrollView>
      </View>
      
      {/* Modal Adicionar Local */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📍 Adicionar Local</Text>
            
            {/* Opções de localização */}
            <View style={styles.locationOptions}>
              <TouchableOpacity
                style={[styles.locationOption, locationType === 'current' && styles.locationOptionActive]}
                onPress={useCurrentLocation}
              >
                <Text style={styles.locationOptionText}>📍 Local atual</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.locationOption, locationType === 'search' && styles.locationOptionActive]}
                onPress={() => setLocationType('search')}
              >
                <Text style={styles.locationOptionText}>🔍 Buscar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.locationOption, locationType === 'map' && styles.locationOptionActive]}
                onPress={() => setLocationType('map')}
              >
                <Text style={styles.locationOptionText}>🗺️ No mapa</Text>
              </TouchableOpacity>
            </View>
            
            {/* Busca de endereço */}
            {locationType === 'search' && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Digite o endereço..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                  <Text style={styles.searchButtonText}>🔍</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Resultados da busca */}
            {isSearching && <ActivityIndicator style={{ marginVertical: 10 }} />}
            {searchResults.length > 0 && (
              <ScrollView style={styles.searchResults}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => selectSearchResult(result)}
                  >
                    <Text style={styles.searchResultText} numberOfLines={2}>
                      {result.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            {/* Local selecionado */}
            {selectedLocation && (
              <View style={styles.selectedLocation}>
                <Text style={styles.selectedLocationLabel}>Local selecionado:</Text>
                <Text style={styles.selectedLocationText}>
                  {selectedLocation.address || 
                   `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                </Text>
              </View>
            )}
            
            {/* Nome do local */}
            <TextInput
              style={styles.input}
              placeholder="Nome do local (ex: Escritório)"
              value={newLocalName}
              onChangeText={setNewLocalName}
            />
            
            {/* Raio */}
            <View style={styles.raioContainer}>
              <Text style={styles.raioLabel}>Raio (metros):</Text>
              <TextInput
                style={styles.raioInput}
                keyboardType="numeric"
                value={newLocalRaio}
                onChangeText={setNewLocalRaio}
              />
            </View>
            
            {/* Botões */}
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setShowAddModal(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Salvar"
                onPress={handleSaveLocal}
                style={{ flex: 1, marginLeft: 8 }}
                disabled={!newLocalName.trim() || !selectedLocation}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  statusOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusText: {
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  panel: {
    maxHeight: '40%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  localItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  localDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  localInfo: {
    flex: 1,
  },
  localName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  localDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    fontSize: 18,
    padding: 4,
  },
  statusLabel: {
    color: colors.textSecondary,
    marginBottom: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  locationOptions: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  locationOption: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  locationOptionActive: {
    backgroundColor: colors.primary,
  },
  locationOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  searchResults: {
    maxHeight: 150,
    marginBottom: 12,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultText: {
    fontSize: 13,
    color: colors.text,
  },
  selectedLocation: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedLocationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  selectedLocationText: {
    fontSize: 13,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  raioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  raioLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 12,
  },
  raioInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
  },
});
