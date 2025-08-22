// src/lib/mock-data.ts
export const mockEmotionData = [
    { emotion: "Joyful", count: 35, color: "#FFB800" },
    { emotion: "Peaceful", count: 25, color: "#4CAF50" },
    { emotion: "Anxious", count: 15, color: "#9C27B0" },
    { emotion: "Stressed", count: 12, color: "#F44336" },
    { emotion: "Energetic", count: 8, color: "#2196F3" },
    { emotion: "Tired", count: 5, color: "#607D8B" },
  ];
  
  export const mockRegionalData = [
    {
      regionCode: "NA",
      emotionalIndex: 75,
      dominantEmotion: "Joyful",
      averageIntensity: 3.8,
      checkInCount: 125000
    },
    {
      regionCode: "EU",
      emotionalIndex: 68,
      dominantEmotion: "Peaceful",
      averageIntensity: 3.5,
      checkInCount: 98000
    },
    // Add more regions as needed
  ];
  
  export const mockTrendData = [
    {
      id: "Global Mood Index",
      color: "hsl(211, 70%, 50%)",
      data: [
        { x: "Mon", y: 65 },
        { x: "Tue", y: 68 },
        { x: "Wed", y: 72 },
        { x: "Thu", y: 70 },
        { x: "Fri", y: 75 },
        { x: "Sat", y: 82 },
        { x: "Sun", y: 78 }
      ]
    }
  ];