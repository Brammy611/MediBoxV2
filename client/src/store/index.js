import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialAuthState = {
  token: null,
  user: null,
  role: null,
  loading: true,
};

const initialEntities = {
  reminders: [],
  healthReports: [],
  alerts: [],
  adherenceLogs: [],
  refillRequests: [],
  medicines: [],
  mediboxes: [],
};

const initialUIState = {
  notifications: [],
  lastNotificationCheck: null,
};

const useStore = create(
  persist(
    (set, get) => ({
      auth: { ...initialAuthState },
      entities: { ...initialEntities },
      ui: { ...initialUIState },
      loading: {},
      errors: {},

      setAuth: (payload) =>
        set((state) => ({
          auth: {
            ...state.auth,
            ...payload,
          },
        })),

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('token');
        }

        set({
          auth: { ...initialAuthState, loading: false },
          entities: { ...initialEntities },
          ui: { ...initialUIState },
          loading: {},
          errors: {},
        });
      },

      updateEntities: (key, valueOrUpdater) =>
        set((state) => ({
          entities: {
            ...state.entities,
            [key]:
              typeof valueOrUpdater === 'function'
                ? valueOrUpdater(state.entities[key])
                : valueOrUpdater,
          },
        })),

      setLoading: (key, value) =>
        set((state) => ({
          loading: {
            ...state.loading,
            [key]: value,
          },
        })),

      setError: (key, message) =>
        set((state) => ({
          errors: {
            ...state.errors,
            [key]: message,
          },
        })),

      appendNotification: (notification) =>
        set((state) => ({
          ui: {
            ...state.ui,
            notifications: [notification, ...state.ui.notifications].slice(0, 50),
          },
        })),

      setLastNotificationCheck: (timestamp) =>
        set((state) => ({
          ui: {
            ...state.ui,
            lastNotificationCheck: timestamp,
          },
        })),
    }),
    {
      name: 'medibox-app-store',
      partialize: (state) => ({
        auth: {
          token: state.auth.token,
          role: state.auth.role,
          user: state.auth.user,
        },
      }),
    }
  )
);

export default useStore;
export { initialAuthState, initialEntities, initialUIState };