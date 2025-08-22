// sqlite-setup.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

console.log('🔄 Setting up SQLite database for WorldVibe...');

async function setupSQLite() {
  try {
    // Initialize Prisma client
    console.log('🔄 Initializing database...');
    const prisma = new PrismaClient();
    
    // Test connection
    console.log('🔄 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection established');
    
    // Check if we need to seed the database
    // We'll check if we have realtime stats, which are required
    console.log('🔄 Checking if database needs seeding...');
    const statsCount = await prisma.realtimeStats.count();
    
    if (statsCount === 0) {
      console.log('🔄 Database needs seeding. Adding sample data...');
      
      // Constants
      const emotions = ['JOY', 'CALM', 'STRESS', 'SADNESS', 'ANGER', 'FEAR', 'TRUST'];
      const regions = ['NORTH_AMERICA', 'EUROPE', 'ASIA', 'AFRICA', 'SOUTH_AMERICA', 'OCEANIA', 'GLOBAL'];
      
      // Create realtime stats first
      console.log('🔄 Creating sample regional stats...');
      for (const region of regions) {
        const emotionCounts = JSON.stringify({
          JOY: Math.floor(Math.random() * 100),
          CALM: Math.floor(Math.random() * 100),
          STRESS: Math.floor(Math.random() * 100),
          SADNESS: Math.floor(Math.random() * 100),
          ANGER: Math.floor(Math.random() * 50),
        });
        
        try {
          await prisma.realtimeStats.upsert({
            where: { regionHash: region },
            update: { 
              emotionCounts: emotionCounts,
              lastUpdated: new Date()
            },
            create: {
              regionHash: region,
              emotionCounts: emotionCounts,
              lastUpdated: new Date(),
            }
          });
        } catch (err) {
          console.log(`Warning: Could not create stats for ${region}: ${err.message}`);
        }
      }
      
      // Check if we need to create check-ins
      const checkInsCount = await prisma.checkIn.count();
      if (checkInsCount === 0) {
        // Generate check-ins
        console.log('🔄 Creating sample check-ins...');
        for (let i = 0; i < 20; i++) {
          const deviceId = `device-${Math.floor(Math.random() * 10000)}`;
          const regionHash = regions[Math.floor(Math.random() * regions.length)];
          const emotion = emotions[Math.floor(Math.random() * emotions.length)];
          const intensity = Math.floor(Math.random() * 5) + 1;
          const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)); // Random date within last week
          
          await prisma.checkIn.create({
            data: {
              deviceId,
              regionHash,
              emotion,
              intensity,
              createdAt,
              deviceType: "MOBILE", // String value for deviceType
              deviceHash: `hash-${deviceId}`,
              dataRetention: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
              note: i % 3 === 0 ? `Sample note for check-in ${i}` : null,
            }
          });
        }
      }
      
      // Check if we need to create sessions
      const sessionsCount = await prisma.session.count();
      if (sessionsCount === 0) {
        // Create sample sessions
        console.log('🔄 Creating sample sessions...');
        for (let i = 0; i < 5; i++) {
          const deviceId = `device-${Math.floor(Math.random() * 10000)}`;
          await prisma.session.create({
            data: {
              deviceId,
              pageViews: Math.floor(Math.random() * 10) + 1,
              bounced: Math.random() > 0.7,
            }
          });
        }
      }
      
      console.log('✅ Sample data created successfully');
    } else {
      console.log('✅ Database already seeded with data');
    }
    
    console.log('✅ SQLite database setup complete!');
    console.log('🚀 Starting Next.js app...');
    
    // Disconnect Prisma client
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error setting up SQLite database:', error);
    process.exit(1);
  }
}

// Run the setup
setupSQLite();