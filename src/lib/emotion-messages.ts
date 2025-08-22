// src/lib/emotion-messages.ts

/**
 * Returns a message based on the provided emotion.
 *
 * @param emotion - The current emotion.
 * @returns A tailored message for the given emotion.
 */
export function getEmotionBasedMessage(emotion: string): string {
    switch (emotion.toLowerCase()) {
      case "joyful":
        return "Your joy is contagious. Keep spreading happiness!";
      case "peaceful":
        return "Embrace the calm and let it guide you.";
      case "stressed":
        return "Take a deep breath and remember, this too shall pass.";
      case "anxious":
        return "Stay grounded and focus on what you can control.";
      case "energetic":
        return "Your energy is inspiring. Keep moving forward!";
      case "tired":
        return "Take some rest; you deserve a break.";
      default:
        return "Your mood is unique—embrace it!";
    }
  }
  