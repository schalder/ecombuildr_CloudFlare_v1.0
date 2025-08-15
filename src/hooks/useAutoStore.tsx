import { useUserStore } from './useUserStore';
import { useAuth } from './useAuth';

/**
 * Hook that automatically ensures a user has a store when needed
 * This replaces the need for explicit store creation flows
 */
export const useAutoStore = () => {
  const { user } = useAuth();
  const { store, ensureStore, loading, error } = useUserStore();

  const getOrCreateStore = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // If store exists, return it
    if (store) {
      return store;
    }

    // Otherwise create one automatically
    return await ensureStore();
  };

  return {
    store,
    loading,
    error,
    getOrCreateStore,
  };
};
