import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Type definitions for seed script
enum EmotionType {
  JOY = 'Joy',
  SADNESS = 'Sadness',
  ANTICIPATION = 'Anticipation',
  SURPRISE = 'Surprise',
  STRESS = 'Stress',
  CALM = 'Calm',
  ANGER = 'Anger',
  FEAR = 'Fear',
  DISGUST = 'Disgust',
  TRUST = 'Trust'
}

enum DeviceType {
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  OTHER = 'OTHER'
}

const prisma = new PrismaClient();

/**
 * Generate a random date within the past 7 days
 */
function randomRecentDate(): Date {
  const now = new Date();
  // Random offset between 0 and 7 days (in milliseconds)
  const offset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - offset);
}

/**
 * Generate a random region hash
 */
function randomRegionHash(): string {
  // This simulates the region hashing used in the application
  // In a real app, this would be deterministic based on location
  const regions = [
    'r:na:us:ca', 'r:na:us:ny', 'r:na:us:tx', 'r:na:us:fl',
    'r:eu:uk:ldn', 'r:eu:fr:par', 'r:eu:de:ber',
    'r:as:jp:tok', 'r:as:in:mum', 'r:as:cn:sha',
    'r:oc:au:syd', 'r:sa:br:rio', 'r:af:za:cpt'
  ];
  return regions[Math.floor(Math.random() * regions.length)];
}

/**
 * Generate random device hash
 */
function randomDeviceHash(): string {
  // In a real app, this would be a hash of device fingerprint
  return `dev:${randomUUID().substring(0, 16)}`;
}

/**
 * Generate a random emotion
 */
function randomEmotion(): EmotionType {
  const emotions = [
    EmotionType.JOY,
    EmotionType.CALM,
    EmotionType.STRESS,
    EmotionType.SADNESS,
    EmotionType.ANTICIPATION,
    EmotionType.ANGER,
    EmotionType.FEAR,
    EmotionType.DISGUST,
    EmotionType.SURPRISE,
    EmotionType.TRUST
  ];
  return emotions[Math.floor(Math.random() * emotions.length)];
}

/**
 * Generate a random intensity (1-5)
 */
function randomIntensity(): number {
  return Math.floor(Math.random() * 5) + 1;
}

/**
 * Generate a random device type
 */
function randomDeviceType(): DeviceType {
  const deviceTypes = [
    DeviceType.MOBILE,
    DeviceType.DESKTOP,
    DeviceType.TABLET,
    DeviceType.OTHER
  ];
  return deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
}

/**
 * Generate random notes for check-ins
 */
function randomNote(): string | null {
  // 70% chance of having a note
  if (Math.random() > 0.3) {
    const notes = [
      "Feeling great today!",
      "Stressed about work deadline",
      "Excited about upcoming vacation",
      "Worried about the economy",
      "Happy about my new job",
      "Anxious about the future",
      "Calm after meditation session",
      "Sad about the news today",
      "Delighted with my progress",
      "Frustrated with traffic",
      "Peaceful morning walk",
      "Nervous about presentation",
      "Proud of what I accomplished",
      "Annoyed with long lines",
      "Gratitude for my friends",
      "Disappointed by the weather",
      "Relaxed after yoga class",
      "Overwhelmed with tasks",
      "Hopeful about the weekend"
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }
  return null;
}

/**
 * Generate random preferences for privacy consent
 */
function randomPreferences(): Record<string, boolean> {
  return {
    analytics: Math.random() > 0.2,
    marketing: Math.random() > 0.6,
    locationTracking: Math.random() > 0.5,
    thirdPartySharing: Math.random() > 0.7,
    personalizedContent: Math.random() > 0.4
  };
}

/**
 * Main seed function
 */
async function main() {
  console.log('Starting database seeding...');
  
  // First, clear any existing data
  console.log('Cleaning existing data...');
  await prisma.$transaction([
    prisma.analytics.deleteMany(),
    prisma.checkIn.deleteMany(),
    prisma.event.deleteMany(),
    prisma.session.deleteMany(),
    prisma.rateLimit.deleteMany(),
    prisma.privacyConsent.deleteMany()
  ]);
  
  console.log('Generating sessions...');
  // Create some sessions
  const sessionCount = 50;
  const sessions = [];
  for (let i = 0; i < sessionCount; i++) {
    const deviceId = randomDeviceHash();
    const startedAt = randomRecentDate();
    
    // Some sessions are still active (endedAt is null)
    const endedAt = Math.random() > 0.3 ? new Date(startedAt.getTime() + Math.random() * 3600000) : null;
    
    // Calculate duration for ended sessions
    const duration = endedAt ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000) : null;
    
    // Random number of page views
    const pageViews = Math.floor(Math.random() * 20) + 1;
    
    // Session is bounced if only 1 page view
    const bounced = pageViews === 1;
    
    sessions.push({
      id: randomUUID(),
      deviceId,
      startedAt,
      endedAt,
      duration,
      pageViews,
      bounced
    });
  }
  
  await prisma.session.createMany({
    data: sessions
  });
  
  console.log('Generating check-ins...');
  // Create check-ins
  const checkInCount = 1000;
  const checkIns = [];
  
  for (let i = 0; i < checkInCount; i++) {
    const createdAt = randomRecentDate();
    const deviceId = randomDeviceHash();
    const deviceHash = randomDeviceHash();
    const emotion = randomEmotion();
    const intensity = randomIntensity();
    const regionHash = randomRegionHash();
    const deviceType = randomDeviceType();
    const note = randomNote();
    
    // 60% of check-ins are associated with a session
    const sessionId = Math.random() > 0.4 ? sessions[Math.floor(Math.random() * sessions.length)].id : null;
    
    // Generate future date for data retention (90 days)
    const dataRetention = new Date(createdAt);
    dataRetention.setDate(dataRetention.getDate() + 90);
    
    checkIns.push({
      id: randomUUID(),
      deviceId,
      regionHash,
      emotion,
      intensity,
      createdAt,
      deviceType,
      deviceHash,
      note,
      sessionId,
      dataRetention,
      privacyVersion: 1,
      // 70% of check-ins are processed
      processedAt: Math.random() > 0.3 ? new Date(createdAt.getTime() + 5000) : null
    });
  }
  
  await prisma.checkIn.createMany({
    data: checkIns
  });
  
  console.log('Generating events...');
  // Create events
  const eventCount = 500;
  const events = [];
  const eventTypes = [
    'PAGE_VIEW', 'BUTTON_CLICK', 'FORM_SUBMIT', 
    'EMOTION_SELECT', 'INTENSITY_SELECT', 'CHECK_IN_COMPLETE',
    'MAP_ZOOM', 'FILTER_CHANGE', 'SHARE_CLICK'
  ];
  
  for (let i = 0; i < eventCount; i++) {
    const session = sessions[Math.floor(Math.random() * sessions.length)];
    const createdAt = new Date(session.startedAt.getTime() + Math.random() * 1800000); // Within 30 minutes of session start
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Generate random properties based on event type
    let properties = {};
    switch (eventType) {
      case 'PAGE_VIEW':
        properties = { 
          page: ['home', 'check-in', 'dashboard', 'map', 'trends'][Math.floor(Math.random() * 5)],
          referrer: ['direct', 'search', 'social', 'email'][Math.floor(Math.random() * 4)]
        };
        break;
      case 'BUTTON_CLICK':
        properties = {
          buttonId: ['submit', 'cancel', 'share', 'continue'][Math.floor(Math.random() * 4)],
          position: { x: Math.floor(Math.random() * 1000), y: Math.floor(Math.random() * 800) }
        };
        break;
      case 'EMOTION_SELECT':
        properties = {
          emotion: randomEmotion()
        };
        break;
      default:
        properties = {
          timestamp: createdAt.toISOString()
        };
    }
    
    events.push({
      id: randomUUID(),
      sessionId: session.id,
      eventType,
      createdAt,
      properties: JSON.stringify(properties)
    });
  }

  await prisma.event.createMany({
    data: events
  });
  
  console.log('Generating privacy consents...');
  // Create privacy consents
  const consentCount = 200;
  const consents = [];
  
  // Generate unique device IDs
  const deviceIds = Array.from({ length: consentCount }, () => randomDeviceHash());
  
  for (let i = 0; i < consentCount; i++) {
    const deviceId = deviceIds[i];
    const consentedAt = randomRecentDate();
    const preferences = randomPreferences();
    // 10% of consents are revoked
    const revokedAt = Math.random() > 0.9 ? new Date(consentedAt.getTime() + Math.random() * 86400000 * 30) : null;
    
    consents.push({
      id: randomUUID(),
      deviceId,
      version: 1,
      consentedAt,
      revokedAt,
      preferences: JSON.stringify(preferences)
    });
  }

  await prisma.privacyConsent.createMany({
    data: consents
  });
  
  console.log('Generating rate limits...');
  // Create rate limits
  const rateLimitCount = 50;
  const rateLimits = [];
  
  for (let i = 0; i < rateLimitCount; i++) {
    const id = `check-in:${randomDeviceHash()}`;
    const count = Math.floor(Math.random() * 10) + 1;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 86400000); // 24 hours from now
    
    rateLimits.push({
      id,
      count,
      expiresAt,
      createdAt: now
    });
  }
  
  await prisma.rateLimit.createMany({
    data: rateLimits
  });
  
  console.log('Generating analytics...');
  // Create analytics records
  const analyticsCount = 100;
  const analytics = [];
  
  for (let i = 0; i < analyticsCount; i++) {
    // Get a random check-in
    const checkIn = checkIns[Math.floor(Math.random() * checkIns.length)];
    
    // Create a period for this analytics record
    const periodStart = new Date(checkIn.createdAt);
    periodStart.setHours(0, 0, 0, 0);
    
    const periodEnd = new Date(periodStart);
    periodEnd.setHours(23, 59, 59, 999);
    
    // Create emotion counts
    const emotionCounts: Record<string, number> = {};

    // Generate random counts for each emotion
    Object.values(EmotionType).forEach(emotion => {
      emotionCounts[emotion] = Math.floor(Math.random() * 100);
    });

    // Add the current check-in's emotion
    emotionCounts[checkIn.emotion] = (emotionCounts[checkIn.emotion] || 0) + 1;

    // Calculate total check-ins
    const totalCheckins = Object.values(emotionCounts).reduce((sum: number, count) => sum + (count as number), 0);
    
    // Calculate average intensity (between 1 and 5)
    const avgIntensity = 1 + Math.random() * 4;
    
    analytics.push({
      id: randomUUID(),
      checkInId: checkIn.id,
      periodStart,
      periodEnd,
      emotionCounts: JSON.stringify(emotionCounts),
      totalCheckins,
      avgIntensity
    });
  }

  await prisma.analytics.createMany({
    data: analytics
  });
  
  console.log('Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });