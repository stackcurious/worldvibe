// src/config/emotions.ts
export const VALID_EMOTIONS = [
    'Joy',
    'Calm',
    'Stress',
    'Anticipation',
    'Sadness'
  ] as const;
  
  export type ValidEmotion = typeof VALID_EMOTIONS[number];
  
  export const EMOTION_COLORS = {
    Joy: '#FFB800',
    Calm: '#4CAF50',
    Stress: '#F44336',
    Anticipation: '#FF9800',
    Sadness: '#2196F3'
  } as const;
  
  export const EMOTION_ICONS = {
    Joy: '😊',
    Calm: '😌',
    Stress: '😰',
    Anticipation: '🤔',
    Sadness: '😢'
  } as const;
  
  export const EMOTION_DESCRIPTIONS = {
    Joy: 'Feeling happy and content',
    Calm: 'Feeling peaceful and relaxed',
    Stress: 'Feeling pressured or anxious',
    Anticipation: 'Feeling expectant or excited',
    Sadness: 'Feeling down or melancholy'
  } as const;