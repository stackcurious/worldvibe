
// src/stores/global-store.ts
import { create } from 'zustand';

interface GlobalState {
  globalData: any[];
  regionalData: Record<string, any>;
  updateData: (data: any) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  globalData: [],
  regionalData: {},
  updateData: (data) => set((state) => {
    // Update global and regional data
    return {
      globalData: [...state.globalData, data].slice(-100), // Keep last 100 entries
      regionalData: {
        ...state.regionalData,
        [data.region]: {
          dominantEmotion: data.emotion,
          checkInCount: (state.regionalData[data.region]?.checkInCount || 0) + 1
        }
      }
    };
  })
}));