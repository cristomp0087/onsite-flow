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
import { useWorkSessionStore } from './workSessionStore';

export interface LocalDeTrabalho {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio: number;
  cor: string;
  ativo: boolean;
}

const POLLING_INTERVAL = 30000;
let pollingTimer: NodeJS.Timeout | null = null;

interface LocationState {
  hasPermission: boolean;
  hasBackgroundPermission: boolean;
  currentLocation: Coordinates | null;
  accuracy: number | null;
  lastUpdate: number | null;
  isWatching: boolean;
  locais: LocalDeTrabalho[];
  activeGeofence: string | null;
  isGeofencingActive: boolean;
  isBackgroundActive: boolean;
  isPollingActive: boolean;
  lastGeofenceEvent: GeofenceEvent | null;
  
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
  startPolling: () => void;
  stopPolling: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
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
  
  initialize: async () => {
    logger.info('gps', 'Initializing location store');
    
    await import('../lib/backgroundTasks');
    
    const permissions = await checkPermissions();
    set({
      hasPermission: permissions.foreground,
      hasBackgroundPermission: permissions.background,
    });
    
    setGeofenceCallback((event) => {
      logger.info('geofence', `System event: ${event.type} - ${event.regionIdentifier}`);
      set({ 
        lastGeofenceEvent: event,
        activeGeofence: event.type === 'enter' ? event.regionIdentifier : null,
      });
    });
    
    const location = await getCurrentLocation();
    if (location) {
      set({
        currentLocation: location.coords,
        accuracy: location.accuracy,
        lastUpdate: location.timestamp,
        hasPermission: true,
      });
      get().checkCurrentGeofence();
    }
  },
  
  refreshLocation: async () => {
    logger.debug('gps', 'Refreshing location...');
    const location = await getCurrentLocation();
    if (location) {
      set({
        currentLocation: location.coords,
        accuracy: location.accuracy,
        lastUpdate: location.timestamp,
      });
      get().checkCurrentGeofence();
    }
  },
  
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
  
  addLocal: (local) => {
    const newLocal: LocalDeTrabalho = {
      ...local,
      id: `local_${Date.now()}`,
    };
    
    logger.info('geofence', 'Adding new local', { nome: local.nome });
    set((state) => ({ locais: [...state.locais, newLocal] }));
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
  
  startPolling: () => {
    get().stopPolling();
    logger.info('gps', 'Starting active polling (every 30s)');
    get().refreshLocation();
    
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
    
    const success = await startGeofencing(regions);
    if (success) {
      set({ isGeofencingActive: true, hasBackgroundPermission: true });
      await startBackgroundLocation();
      set({ isBackgroundActive: true });
      get().startPolling();
      logger.info('geofence', 'Full monitoring started (geofence + polling)');
    }
  },
  
  stopGeofenceMonitoring: async () => {
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
  
  // ATUALIZADO: Usa workSessionStore para notificações
  checkCurrentGeofence: () => {
    const { currentLocation, locais, activeGeofence, accuracy } = get();
    if (!currentLocation) return;
    
    const activeLocais = locais.filter(l => l.ativo);
    const workSession = useWorkSessionStore.getState();
    
    for (const local of activeLocais) {
      const inside = isInsideGeofence(currentLocation, {
        identifier: local.id,
        latitude: local.latitude,
        longitude: local.longitude,
        radius: local.raio,
      });
      
      if (inside) {
        if (activeGeofence !== local.id) {
          // ENTROU no geofence
          logger.info('geofence', `✅ ENTERED: ${local.nome}`, {
            localId: local.id,
            distance: calculateDistance(currentLocation, {
              latitude: local.latitude,
              longitude: local.longitude,
            }).toFixed(1) + 'm',
          });
          
          set({ activeGeofence: local.id });
          
          // NOTIFICAÇÃO em vez de registro direto
          workSession.handleGeofenceEnter(local.id, local.nome, {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: accuracy || undefined,
          });
        }
        return;
      }
    }
    
    // Não está em nenhum geofence
    if (activeGeofence !== null) {
      const previousLocal = locais.find(l => l.id === activeGeofence);
      
      logger.info('geofence', `🚪 EXITED: ${previousLocal?.nome || 'unknown'}`, {
        localId: activeGeofence,
      });
      
      // NOTIFICAÇÃO de saída
      if (previousLocal) {
        workSession.handleGeofenceExit(activeGeofence, previousLocal.nome, {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: accuracy || undefined,
        });
      }
      
      set({ activeGeofence: null });
    }
  },
}));
