import { create } from 'zustand';
import { logger } from '../lib/logger';
import {
  requestNotificationPermissions,
  setupNotificationCategories,
  showGeofenceEnterNotification,
  showGeofenceExitNotification,
  showAutoStartNotification,
  scheduleDelayedStart,
  cancelNotification,
  addNotificationResponseListener,
  type NotificationAction,
  type GeofenceNotificationData,
} from '../lib/notifications';
import { useRegistroStore } from './registroStore';
import type { Coordinates } from '../lib/location';

// Tempo para auto-iniciar (30 segundos)
const AUTO_START_TIMEOUT = 30000;

interface PendingEntry {
  localId: string;
  localNome: string;
  notificationId: string;
  timeoutId: NodeJS.Timeout;
  coords?: Coordinates & { accuracy?: number };
}

interface WorkSessionState {
  // Estado
  isInitialized: boolean;
  pendingEntry: PendingEntry | null;
  skippedToday: string[]; // IDs de locais ignorados hoje
  delayedStarts: Map<string, string>; // localId -> notificationId
  
  // Actions
  initialize: () => Promise<void>;
  
  // Chamado quando entra no geofence
  handleGeofenceEnter: (
    localId: string, 
    localNome: string, 
    coords?: Coordinates & { accuracy?: number }
  ) => Promise<void>;
  
  // Chamado quando sai do geofence
  handleGeofenceExit: (
    localId: string, 
    localNome: string,
    coords?: Coordinates & { accuracy?: number }
  ) => Promise<void>;
  
  // Processar resposta da notificação
  handleNotificationAction: (action: NotificationAction, data: GeofenceNotificationData) => Promise<void>;
  
  // Iniciar cronômetro manualmente
  startTimer: (localId: string, coords?: Coordinates & { accuracy?: number }) => Promise<void>;
  
  // Parar cronômetro
  stopTimer: (localId: string, coords?: Coordinates & { accuracy?: number }) => Promise<void>;
  
  // Limpar skipped (chamado à meia-noite)
  resetSkippedToday: () => void;
}

export const useWorkSessionStore = create<WorkSessionState>((set, get) => ({
  isInitialized: false,
  pendingEntry: null,
  skippedToday: [],
  delayedStarts: new Map(),
  
  initialize: async () => {
    try {
      logger.info('workSession', 'Initializing work session store...');
      
      // Solicitar permissões
      await requestNotificationPermissions();
      
      // Configurar categorias de ações
      await setupNotificationCategories();
      
      // Listener para respostas às notificações
      addNotificationResponseListener((response) => {
        const actionId = response.actionIdentifier;
        const data = response.notification.request.content.data as GeofenceNotificationData;
        
        logger.info('workSession', 'Notification response received', { actionId, data });
        
        // Mapear ação
        let action: NotificationAction = 'start';
        if (actionId === 'start') action = 'start';
        else if (actionId === 'skip_today') action = 'skip_today';
        else if (actionId === 'delay_10min') action = 'delay_10min';
        else if (actionId === 'stop') action = 'stop';
        else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          // Usuário tocou na notificação (não em um botão)
          action = 'start';
        }
        
        get().handleNotificationAction(action, data);
      });
      
      set({ isInitialized: true });
      logger.info('workSession', 'Work session store initialized');
    } catch (error) {
      logger.error('workSession', 'Failed to initialize', { error });
    }
  },
  
  handleGeofenceEnter: async (localId, localNome, coords) => {
    const { skippedToday, pendingEntry } = get();
    
    // Verificar se o local foi ignorado hoje
    if (skippedToday.includes(localId)) {
      logger.info('workSession', 'Local skipped for today', { localId, localNome });
      return;
    }
    
    // Se já tem uma entrada pendente para este local, ignorar
    if (pendingEntry?.localId === localId) {
      logger.debug('workSession', 'Already pending entry for this local');
      return;
    }
    
    // Cancelar entrada pendente anterior (se houver)
    if (pendingEntry) {
      clearTimeout(pendingEntry.timeoutId);
      await cancelNotification(pendingEntry.notificationId);
    }
    
    logger.info('workSession', '📍 Geofence ENTER - showing notification', { localId, localNome });
    
    // Mostrar notificação
    const notificationId = await showGeofenceEnterNotification(localId, localNome);
    
    // Configurar timeout para auto-iniciar em 30 segundos
    const timeoutId = setTimeout(async () => {
      logger.info('workSession', '⏱️ Auto-starting timer (30s timeout)');
      await get().startTimer(localId, coords);
      await showAutoStartNotification(localNome);
      set({ pendingEntry: null });
    }, AUTO_START_TIMEOUT);
    
    set({
      pendingEntry: {
        localId,
        localNome,
        notificationId,
        timeoutId,
        coords,
      },
    });
  },
  
  handleGeofenceExit: async (localId, localNome, coords) => {
    const { pendingEntry } = get();
    
    // Se tinha entrada pendente, cancelar
    if (pendingEntry?.localId === localId) {
      clearTimeout(pendingEntry.timeoutId);
      await cancelNotification(pendingEntry.notificationId);
      set({ pendingEntry: null });
      logger.info('workSession', 'Pending entry cancelled due to exit');
      return;
    }
    
    logger.info('workSession', '🚪 Geofence EXIT - stopping timer', { localId, localNome });
    
    // Parar cronômetro e mostrar notificação
    await get().stopTimer(localId, coords);
    await showGeofenceExitNotification(localId, localNome);
  },
  
  handleNotificationAction: async (action, data) => {
    const { pendingEntry } = get();
    
    logger.info('workSession', 'Processing action', { action, data });
    
    // Cancelar timeout se existir
    if (pendingEntry?.localId === data.localId) {
      clearTimeout(pendingEntry.timeoutId);
    }
    
    switch (action) {
      case 'start':
        await get().startTimer(data.localId, pendingEntry?.coords);
        set({ pendingEntry: null });
        break;
        
      case 'skip_today':
        set((state) => ({
          skippedToday: [...state.skippedToday, data.localId],
          pendingEntry: null,
        }));
        logger.info('workSession', 'Local skipped for today', { localId: data.localId });
        break;
        
      case 'delay_10min':
        const delayNotifId = await scheduleDelayedStart(data.localId, data.localNome, 10);
        set((state) => {
          const newDelayed = new Map(state.delayedStarts);
          newDelayed.set(data.localId, delayNotifId);
          return { delayedStarts: newDelayed, pendingEntry: null };
        });
        logger.info('workSession', 'Start delayed by 10 minutes');
        break;
        
      case 'stop':
        await get().stopTimer(data.localId);
        break;
        
      case 'timeout':
        // Já tratado pelo setTimeout
        break;
    }
  },
  
  startTimer: async (localId, coords) => {
    logger.info('workSession', '▶️ Starting timer', { localId });
    
    const registroStore = useRegistroStore.getState();
    await registroStore.registrarEntrada(localId, coords);
  },
  
  stopTimer: async (localId, coords) => {
    logger.info('workSession', '⏹️ Stopping timer', { localId });
    
    const registroStore = useRegistroStore.getState();
    await registroStore.registrarSaida(localId, coords);
  },
  
  resetSkippedToday: () => {
    set({ skippedToday: [] });
    logger.info('workSession', 'Skipped list reset');
  },
}));

// Import necessário para o listener
import * as Notifications from 'expo-notifications';
