import { create } from 'zustand';
import { logger } from '../lib/logger';
import {
  getCurrentLocation,
  startWatchingLocation,
  stopWatchingLocation,
  startGeofencing,
  stopGeofencing,
  startBackgroundLocation,
  stopBackgroundLocation,
  checkPermissions,
  calculateDistance,
  isInsideGeofence,
  type Coordinates,
  type LocationResult,
  type GeofenceRegion,
} from '../lib/location';
import { setGeofenceCallback, type GeofenceEvent } from '../lib/backgroundTasks';

export interface LocalDeTrabalho {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio: number;
  cor: string;
  ativo: boolean;
}

// Intervalo de polling em ms (30 segundos)
const POLLING_INTERVAL = 30000;

// Variável para o timer de polling
let pollingTimer: NodeJS.Timeout | null = null;

interface LocationState {
  // Permissões
  hasPermission: boolean;
  hasBackgroundPermission: boolean;
  
  // Localização atual
  currentLocation: Coordinates | null;
  accuracy: number | null;
  lastUpdate: number | null;
  isWatching: boolean;
  
  // Geofencing
  locais: LocalDeTrabalho[];
  activeGeofence: string | null;
  isGeofencingActive: boolean;
  isBackgroundActive: boolean;
  isPollingActive: boolean;
  
  // Eventos
  lastGeofenceEvent: GeofenceEvent | null;
  
  // Actions
  initialize: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  
  addLocal: (local: Omit<LocalDeTrabalho, 'id'>) => void;
  removeLocal: (id: string) => void;
  updateLocal: (id: string, updates: Partial<LocalDeTrabalho>) => void;
  
  startGeofenceMonitoring: () => Promise<void>;
  stopGeofenceMonitoring: () => Promise<void>;
  
  checkCurrentGeofence: () => void;
  
  // Polling
  startPolling: () => void;
  stopPolling: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  // Estado inicial
  hasPermission: false,
  hasBackgroundPermission: false,
  currentLocation: null,
  accuracy: null,
  lastUpdate: null,
  isWatching: false,
  locais: [],
  activeGeofence: null,
  isGeofencingActive: false,
  isBackgroundActive: false,
  isPollingActive: false,
  lastGeofenceEvent: null,
  
  // ============================================
  // Inicializar
  // ============================================
  initialize: async () => {
    logger.info('gps', 'Initializing location store');
    
    // Importar tasks de background
    await import('../lib/backgroundTasks');
    
    // Verificar permissões existentes
    const permissions = await checkPermissions();
    set({
      hasPermission: permissions.foreground,
      hasBackgroundPermission: permissions.background,
    });
    
    // Configurar callback de geofence (do sistema)
    setGeofenceCallback((event) => {
      logger.info('geofence', `System event: ${event.type} - ${event.regionIdentifier}`);
      set({ 
        lastGeofenceEvent: event,
        activeGeofence: event.type === 'enter' ? event.regionIdentifier : null,
      });
    });
    
    // Tentar obter localização inicial
    const location = await getCurrentLocation();
    if (location) {
      set({
        currentLocation: location.coords,
        accuracy: location.accuracy,
        lastUpdate: location.timestamp,
        hasPermission: true,
      });
      
      // Verificar geofence inicial
      get().checkCurrentGeofence();
    }
  },
  
  // ============================================
  // Atualizar localização
  // ============================================
  refreshLocation: async () => {
    logger.debug('gps', 'Refreshing location...');
    const location = await getCurrentLocation();
    if (location) {
      set({
        currentLocation: location.coords,
        accuracy: location.accuracy,
        lastUpdate: location.timestamp,
      });
      
      // Verificar se está em algum geofence
      get().checkCurrentGeofence();
    }
  },
  
  // ============================================
  // Tracking em tempo real (tela ligada)
  // ============================================
  startTracking: async () => {
    const success = await startWatchingLocation((location) => {
      set({
        currentLocation: location.coords,
        accuracy: location.accuracy,
        lastUpdate: location.timestamp,
      });
      get().checkCurrentGeofence();
    });
    
    if (success) {
      set({ isWatching: true, hasPermission: true });
      logger.info('gps', 'Real-time tracking started');
    }
  },
  
  stopTracking: async () => {
    await stopWatchingLocation();
    set({ isWatching: false });
    logger.info('gps', 'Real-time tracking stopped');
  },
  
  // ============================================
  // Gerenciar locais
  // ============================================
  addLocal: (local) => {
    const newLocal: LocalDeTrabalho = {
      ...local,
      id: `local_${Date.now()}`,
    };
    
    logger.info('geofence', 'Adding new local', { nome: local.nome });
    set((state) => ({ locais: [...state.locais, newLocal] }));
    
    // Verificar se já está dentro do novo local
    setTimeout(() => get().checkCurrentGeofence(), 100);
  },
  
  removeLocal: (id) => {
    logger.info('geofence', 'Removing local', { id });
    set((state) => ({ 
      locais: state.locais.filter(l => l.id !== id),
      activeGeofence: state.activeGeofence === id ? null : state.activeGeofence,
    }));
  },
  
  updateLocal: (id, updates) => {
    set((state) => ({
      locais: state.locais.map(l => l.id === id ? { ...l, ...updates } : l),
    }));
  },
  
  // ============================================
  // POLLING - Checagem periódica ativa
  // ============================================
  startPolling: () => {
    // Para qualquer polling anterior
    get().stopPolling();
    
    logger.info('gps', 'Starting active polling (every 30s)');
    
    // Primeira checagem imediata
    get().refreshLocation();
    
    // Configura timer para checar a cada 30 segundos
    pollingTimer = setInterval(() => {
      logger.debug('gps', 'Polling check...');
      get().refreshLocation();
    }, POLLING_INTERVAL);
    
    set({ isPollingActive: true });
  },
  
  stopPolling: () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
      logger.info('gps', 'Polling stopped');
    }
    set({ isPollingActive: false });
  },
  
  // ============================================
  // Geofence Monitoring (ATUALIZADO com polling)
  // ============================================
  startGeofenceMonitoring: async () => {
    const { locais } = get();
    const activeLocais = locais.filter(l => l.ativo);
    
    if (activeLocais.length === 0) {
      logger.warn('geofence', 'No active locations to monitor');
      return;
    }
    
    const regions: GeofenceRegion[] = activeLocais.map(local => ({
      identifier: local.id,
      latitude: local.latitude,
      longitude: local.longitude,
      radius: local.raio,
      notifyOnEnter: true,
      notifyOnExit: true,
    }));
    
    // 1. Iniciar geofencing nativo (backup, funciona com app fechado)
    const success = await startGeofencing(regions);
    if (success) {
      set({ isGeofencingActive: true, hasBackgroundPermission: true });
      
      // 2. Iniciar background location
      await startBackgroundLocation();
      set({ isBackgroundActive: true });
      
      // 3. NOVO: Iniciar polling ativo para detecção rápida
      get().startPolling();
      
      logger.info('geofence', 'Full monitoring started (geofence + polling)');
    }
  },
  
  stopGeofenceMonitoring: async () => {
    // Para tudo
    get().stopPolling();
    await stopGeofencing();
    await stopBackgroundLocation();
    
    set({ 
      isGeofencingActive: false, 
      isBackgroundActive: false,
      isPollingActive: false,
    });
    
    logger.info('geofence', 'All monitoring stopped');
  },
  
  // ============================================
  // Verificar geofence atual
  // ============================================
  checkCurrentGeofence: () => {
    const { currentLocation, locais, activeGeofence } = get();
    if (!currentLocation) return;
    
    const activeLocais = locais.filter(l => l.ativo);
    
    // Verificar cada local
    for (const local of activeLocais) {
      const inside = isInsideGeofence(currentLocation, {
        identifier: local.id,
        latitude: local.latitude,
        longitude: local.longitude,
        radius: local.raio,
      });
      
      if (inside) {
        // Entrou em um geofence
        if (activeGeofence !== local.id) {
          logger.info('geofence', `✅ ENTERED: ${local.nome}`, {
            localId: local.id,
            distance: calculateDistance(currentLocation, {
              latitude: local.latitude,
              longitude: local.longitude,
            }).toFixed(1) + 'm',
          });
          set({ activeGeofence: local.id });
        }
        return; // Encontrou um, para de procurar
      }
    }
    
    // Não está em nenhum geofence
    if (activeGeofence !== null) {
      const previousLocal = locais.find(l => l.id === activeGeofence);
      logger.info('geofence', `🚪 EXITED: ${previousLocal?.nome || 'unknown'}`, {
        localId: activeGeofence,
      });
      set({ activeGeofence: null });
    }
  },
}));
