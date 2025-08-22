// setup-sqlite.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Setting up SQLite database for WorldVibe...');

// Make sure the prisma directory exists
const prismaDir = path.join(__dirname, 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Generate the Prisma client
console.log('🔄 Generating Prisma client...');
exec('npx prisma generate', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error generating Prisma client:', error);
    return;
  }
  console.log('✅ Prisma client generated');
  console.log(stdout);
  
  // Create SQLite database
  console.log('🔄 Creating SQLite database...');
  exec('npx prisma migrate dev --name initial_sqlite_setup', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error creating SQLite database:', error);
      return;
    }
    console.log('✅ SQLite database created');
    console.log(stdout);
    
    // Seed the database with sample data
    console.log('🔄 Seeding database with sample data...');
    
    // Import the PrismaClient
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function seedDatabase() {
      try {
        // Create sample emotions
        const emotions = ['JOY', 'CALM', 'STRESS', 'SADNESS', 'ANGER', 'FEAR', 'TRUST'];
        const regions = ['NORTH_AMERICA', 'EUROPE', 'ASIA', 'AFRICA', 'SOUTH_AMERICA', 'OCEANIA', 'GLOBAL'];
        
        // Generate 20 sample check-ins
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
        
        // Create sample sessions
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
        
        // Add sample realtime stats
        for (const region of regions) {
          const emotionCounts = JSON.stringify({
            JOY: Math.floor(Math.random() * 100),
            CALM: Math.floor(Math.random() * 100),
            STRESS: Math.floor(Math.random() * 100),
            SADNESS: Math.floor(Math.random() * 100),
            ANGER: Math.floor(Math.random() * 50),
          });
          
          await prisma.realtimeStats.create({
            data: {
              regionHash: region,
              emotionCounts: emotionCounts, // String for SQLite
              lastUpdated: new Date(),
            }
          });
        }
        
        console.log('✅ Database seeded successfully');
      } catch (error) {
        console.error('❌ Error seeding database:', error);
      } finally {
        await prisma.$disconnect();
      }
    }
    
    seedDatabase();
  });
});