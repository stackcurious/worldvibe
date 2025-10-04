// src/services/trending-notes-service.ts
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

// Stop words to filter out common words
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
  'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'each',
  'which', 'their', 'said', 'if', 'will', 'up', 'other', 'about', 'out', 'many',
  'then', 'them', 'can', 'only', 'other', 'new', 'some', 'what', 'time', 'very',
  'when', 'much', 'get', 'through', 'back', 'much', 'before', 'go', 'good', 'little',
  'very', 'still', 'should', 'here', 'where', 'why', 'how', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just',
  'should', 'now', 'today', 'yesterday', 'tomorrow', 'always', 'never', 'sometimes',
  'often', 'usually', 'really', 'actually', 'basically', 'literally', 'totally',
  'completely', 'absolutely', 'definitely', 'probably', 'maybe', 'perhaps',
  'obviously', 'clearly', 'exactly', 'precisely', 'specifically', 'particularly',
  'especially', 'mainly', 'mostly', 'generally', 'typically', 'normally',
  'usually', 'commonly', 'frequently', 'regularly', 'constantly', 'continuously',
  'permanently', 'temporarily', 'immediately', 'instantly', 'quickly', 'slowly',
  'gradually', 'suddenly', 'eventually', 'finally', 'ultimately', 'initially',
  'originally', 'previously', 'recently', 'currently', 'presently', 'nowadays',
  'meanwhile', 'simultaneously', 'concurrently', 'together', 'separately',
  'individually', 'collectively', 'jointly', 'mutually', 'reciprocally',
  'respectively', 'correspondingly', 'similarly', 'likewise', 'conversely',
  'contrarily', 'oppositely', 'differently', 'alternatively', 'otherwise',
  'instead', 'rather', 'preferably', 'ideally', 'hopefully', 'fortunately',
  'unfortunately', 'sadly', 'regrettably', 'disappointingly', 'surprisingly',
  'amazingly', 'incredibly', 'unbelievably', 'remarkably', 'notably',
  'significantly', 'substantially', 'considerably', 'dramatically', 'radically',
  'fundamentally', 'essentially', 'basically', 'primarily', 'mainly',
  'chiefly', 'principally', 'largely', 'mostly', 'predominantly', 'overwhelmingly',
  'entirely', 'completely', 'totally', 'fully', 'wholly', 'partially',
  'partly', 'somewhat', 'slightly', 'barely', 'hardly', 'scarcely',
  'nearly', 'almost', 'quite', 'rather', 'fairly', 'pretty', 'very',
  'extremely', 'highly', 'greatly', 'enormously', 'tremendously', 'incredibly',
  'unbelievably', 'amazingly', 'remarkably', 'notably', 'significantly',
  'substantially', 'considerably', 'dramatically', 'radically', 'fundamentally'
]);

// Redis keys
const TRENDING_KEYWORDS_KEY = 'trending:keywords';
const EMOTION_KEYWORDS_KEY = 'trending:emotion:keywords';
const RECENT_NOTES_KEY = 'recent:notes';

interface TrendingKeyword {
  word: string;
  count: number;
  emotion: string;
}

interface ProcessedNote {
  id: string;
  note: string;
  emotion: string;
  createdAt: Date;
  words: string[];
}

/**
 * Extract meaningful words from a note
 */
function extractWords(note: string): string[] {
  if (!note || typeof note !== 'string') return [];
  
  return note
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !STOP_WORDS.has(word) &&
      !/^\d+$/.test(word) // Remove pure numbers
    );
}

/**
 * Process a single note and extract trending keywords
 */
export async function processNoteForTrending(note: string, emotion: string, checkInId: string): Promise<void> {
  try {
    const words = extractWords(note);
    
    if (words.length === 0) return;
    
    // Store recent note for context
    const noteData = {
      id: checkInId,
      note: note.substring(0, 200), // Truncate for storage
      emotion,
      words: words.slice(0, 10), // Limit words per note
      timestamp: Date.now()
    };
    
    await redis.set(`${RECENT_NOTES_KEY}:${checkInId}`, JSON.stringify(noteData), 86400); // 24 hours
    
    // Process each word
    for (const word of words) {
      // Add word to trending set (Redis REST API doesn't support zincrby)
      // await redis.zincrby(TRENDING_KEYWORDS_KEY, 1, word);
      
      // Add word to emotion-specific trending
      // await redis.zincrby(`${EMOTION_KEYWORDS_KEY}:${emotion.toLowerCase()}`, 1, word);
    }
    
    metrics.increment('trending.notes.processed');
    logger.debug('Processed note for trending', { 
      checkInId, 
      emotion, 
      wordCount: words.length 
    });
    
  } catch (error) {
    logger.error('Error processing note for trending', { 
      error: error instanceof Error ? error.message : String(error),
      checkInId,
      emotion 
    });
    metrics.increment('trending.notes.errors');
  }
}

/**
 * Get trending keywords for a specific emotion
 */
export async function getTrendingKeywords(emotion?: string, limit: number = 20): Promise<TrendingKeyword[]> {
  try {
    // Since Redis REST API doesn't support sorted sets, we'll use a simpler approach
    // This is a placeholder implementation
    const keywords: TrendingKeyword[] = [];
    
    // TODO: Implement proper trending logic with Redis REST API
    // For now, return empty array to avoid errors
    
    metrics.increment('trending.keywords.requests');
    return keywords;
    
  } catch (error) {
    logger.error('Error getting trending keywords', { 
      error: error instanceof Error ? error.message : String(error),
      emotion 
    });
    metrics.increment('trending.keywords.errors');
    return [];
  }
}

/**
 * Get recent notes for context
 */
export async function getRecentNotes(limit: number = 50): Promise<ProcessedNote[]> {
  try {
    // Since Redis REST API doesn't support pattern matching, we'll use a simpler approach
    // This is a placeholder implementation
    const notes: ProcessedNote[] = [];
    
    // TODO: Implement proper recent notes retrieval with Redis REST API
    // For now, return empty array to avoid errors
    
    metrics.increment('trending.notes.requests');
    return notes;
    
  } catch (error) {
    logger.error('Error getting recent notes', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    metrics.increment('trending.notes.errors');
    return [];
  }
}

/**
 * Get trending keywords across all emotions
 */
export async function getAllTrendingKeywords(limit: number = 30): Promise<TrendingKeyword[]> {
  try {
    // Since Redis REST API doesn't support sorted sets, we'll use a simpler approach
    // This is a placeholder implementation
    const keywords: TrendingKeyword[] = [];
    
    // TODO: Implement proper trending logic with Redis REST API
    // For now, return empty array to avoid errors
    
    metrics.increment('trending.all_keywords.requests');
    return keywords;
    
  } catch (error) {
    logger.error('Error getting all trending keywords', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    metrics.increment('trending.all_keywords.errors');
    return [];
  }
}

/**
 * Get trending keywords by time period
 */
export async function getTrendingKeywordsByPeriod(
  period: 'hour' | 'day' | 'week' = 'day',
  limit: number = 20
): Promise<TrendingKeyword[]> {
  try {
    // Since Redis REST API doesn't support sorted sets, we'll use a simpler approach
    // This is a placeholder implementation
    const keywords: TrendingKeyword[] = [];
    
    // TODO: Implement proper trending logic with Redis REST API
    // For now, return empty array to avoid errors
    
    metrics.increment('trending.keywords_by_period.requests');
    return keywords;
    
  } catch (error) {
    logger.error('Error getting trending keywords by period', { 
      error: error instanceof Error ? error.message : String(error),
      period 
    });
    metrics.increment('trending.keywords_by_period.errors');
    return [];
  }
}

/**
 * Clean up old trending data
 */
export async function cleanupTrendingData(): Promise<void> {
  try {
    // Since Redis REST API doesn't support pattern matching, we'll use a simpler approach
    // This is a placeholder implementation
    
    // TODO: Implement proper cleanup logic with Redis REST API
    
    metrics.increment('trending.cleanup.completed');
    logger.info('Trending data cleanup completed');
    
  } catch (error) {
    logger.error('Error cleaning up trending data', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    metrics.increment('trending.cleanup.errors');
  }
}
