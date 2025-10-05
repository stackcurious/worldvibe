/**
 * Region hash decoder
 * Converts region hashes back to human-readable location names
 */

// Map of common region hashes to location names
// In production, this would ideally be stored in a database
const REGION_MAP: { [key: string]: string } = {
  'GLOBAL': 'Global',
  'US': 'United States',
  'US-CA': 'California, USA',
  'US-NY': 'New York, USA',
  'US-TX': 'Texas, USA',
  'US-FL': 'Florida, USA',
  'GB': 'United Kingdom',
  'GB-ENG': 'England, UK',
  'FR': 'France',
  'DE': 'Germany',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'BR': 'Brazil',
  'AU': 'Australia',
  'CA': 'Canada',
  'MX': 'Mexico',
  'ES': 'Spain',
  'IT': 'Italy',
  'KR': 'South Korea',
  'RU': 'Russia',
};

/**
 * Decode a region hash to a human-readable location name
 */
export function decodeRegionHash(regionHash: string): string {
  if (!regionHash) {
    return 'Unknown Location';
  }

  // Remove the 'rgn:' prefix if present
  const cleanHash = regionHash.startsWith('rgn:')
    ? regionHash.substring(4)
    : regionHash;

  // Check if it's a known region code
  for (const [code, name] of Object.entries(REGION_MAP)) {
    if (cleanHash.toUpperCase().startsWith(code)) {
      return name;
    }
  }

  // For coordinate-based hashes, extract rough location
  // These are hashed lat/lng, so we can only give general regions
  if (cleanHash.length >= 6) {
    const prefix = cleanHash.substring(0, 2).toLowerCase();

    // Very rough geographic mapping based on hash prefixes
    // This is just for display purposes
    const prefixMap: { [key: string]: string } = {
      '2f': 'North America',
      '3a': 'Europe',
      '4b': 'Asia',
      '5c': 'South America',
      '6d': 'Africa',
      '7e': 'Oceania',
      '8f': 'Middle East',
      '9a': 'Central America',
      'ab': 'Northern Europe',
      'bc': 'Eastern Europe',
      'cd': 'Southeast Asia',
      'de': 'East Asia',
      'ef': 'Western Europe',
      'f0': 'Southern Europe',
    };

    const region = prefixMap[prefix];
    if (region) {
      return region;
    }
  }

  // Default fallback
  return 'Earth';
}

/**
 * Get a friendly display name for a region
 */
export function getRegionDisplayName(regionHash: string | null | undefined): string {
  if (!regionHash) {
    return 'Unknown Location';
  }

  return decodeRegionHash(regionHash);
}

/**
 * Format region for display with emoji
 */
export function formatRegionWithEmoji(regionHash: string): string {
  const location = decodeRegionHash(regionHash);

  // Add flag emojis for known countries
  const flagMap: { [key: string]: string } = {
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'India': '🇮🇳',
    'Brazil': '🇧🇷',
    'Australia': '🇦🇺',
    'Canada': '🇨🇦',
    'Mexico': '🇲🇽',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'South Korea': '🇰🇷',
    'Russia': '🇷🇺',
    'Global': '🌍',
    'Earth': '🌎',
  };

  // Check if location contains any country name
  for (const [country, flag] of Object.entries(flagMap)) {
    if (location.includes(country)) {
      return `${flag} ${location}`;
    }
  }

  // Regional emojis
  if (location.includes('America')) return `🌎 ${location}`;
  if (location.includes('Europe')) return `🌍 ${location}`;
  if (location.includes('Asia')) return `🌏 ${location}`;
  if (location.includes('Africa')) return `🌍 ${location}`;
  if (location.includes('Oceania')) return `🌏 ${location}`;

  return `📍 ${location}`;
}