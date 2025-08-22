#!/usr/bin/env node

/**
 * Database Test Script
 * -------------------
 * Tests database connectivity and basic operations.
 * Verifies the database setup is working correctly.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Create a Prisma client
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

// Test database functions
async function testDatabase() {
  console.log('Running database tests...');
  
  try {
    // Test 1: Verify connection
    console.log('\n1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful');
    
    // Test 2: Check if tables exist
    console.log('\n2. Checking tables...');
    const checkInsTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'check_ins'
      ) as exists
    `;
    
    if (checkInsTable[0].exists) {
      console.log('✅ Tables exist');
    } else {
      console.log('❌ Tables do not exist. Run migrations first.');
      return;
    }
    
    // Test 3: Check if TimescaleDB is set up
    console.log('\n3. Checking TimescaleDB setup...');
    try {
      const hypertableCheck = await prisma.$queryRaw`
        SELECT * FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'check_ins'
      `;
      
      if (hypertableCheck.length > 0) {
        console.log('✅ TimescaleDB is properly configured');
      } else {
        console.log('❌ check_ins is not a hypertable. TimescaleDB might not be set up correctly.');
      }
    } catch (error) {
      console.log('❌ TimescaleDB might not be installed or enabled.');
      console.log(error.message);
    }
    
    // Test 4: Basic CRUD operations
    console.log('\n4. Testing CRUD operations...');
    
    // Create a test check-in
    const testCheckIn = await prisma.checkIn.create({
      data: {
        deviceId: 'test-device-123',
        regionHash: 'test-region-456',
        emotion: 'JOY',
        intensity: 5,
        deviceType: 'DESKTOP',
        deviceHash: 'test-device-hash',
        dataRetention: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        note: 'Test check-in from database test script'
      }
    });
    console.log('✅ Created test check-in:', testCheckIn.id);
    
    // Read the check-in
    const retrievedCheckIn = await prisma.checkIn.findUnique({
      where: { id: testCheckIn.id }
    });
    console.log('✅ Retrieved check-in:', retrievedCheckIn.id);
    
    // Update the check-in
    const updatedCheckIn = await prisma.checkIn.update({
      where: { id: testCheckIn.id },
      data: { intensity: 4 }
    });
    console.log('✅ Updated check-in intensity:', updatedCheckIn.intensity);
    
    // Delete the check-in
    await prisma.checkIn.delete({
      where: { id: testCheckIn.id }
    });
    console.log('✅ Deleted check-in');
    
    // Test 5: Test transaction
    console.log('\n5. Testing transactions...');
    
    try {
      await prisma.$transaction(async (tx) => {
        // Create a session
        const session = await tx.session.create({
          data: {
            deviceId: 'test-device-123',
            pageViews: 5,
            bounced: false
          }
        });
        
        // Create a check-in associated with the session
        const checkIn = await tx.checkIn.create({
          data: {
            deviceId: 'test-device-123',
            regionHash: 'test-region-456',
            emotion: 'CALM',
            intensity: 3,
            deviceType: 'MOBILE',
            deviceHash: 'test-device-hash',
            dataRetention: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            sessionId: session.id
          }
        });
        
        // Create an event associated with the session
        await tx.event.create({
          data: {
            sessionId: session.id,
            eventType: 'TEST_EVENT',
            properties: { test: true }
          }
        });
        
        console.log('✅ Transaction created session, check-in and event');
        
        // Clean up after test
        await tx.event.deleteMany({
          where: { sessionId: session.id }
        });
        
        await tx.checkIn.delete({
          where: { id: checkIn.id }
        });
        
        await tx.session.delete({
          where: { id: session.id }
        });
      });
      
      console.log('✅ Transaction cleanup successful');
    } catch (error) {
      console.log('❌ Transaction test failed:', error.message);
    }
    
    // Test 6: Check if PostGIS works
    console.log('\n6. Testing PostGIS functionality...');
    try {
      const postgisCheck = await prisma.$queryRaw`SELECT PostGIS_version()`;
      console.log('✅ PostGIS is working:', postgisCheck[0].postgis_version);
    } catch (error) {
      console.log('❌ PostGIS might not be installed or enabled.');
      console.log(error.message);
    }
    
    console.log('\nAll database tests completed! 🎉');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main function
async function main() {
  try {
    // Check if database exists
    try {
      await prisma.$connect();
      console.log('Database exists and is accessible.');
    } catch (error) {
      console.log('Unable to connect to database. Running setup first...');
      execSync('node scripts/setup-database.js --non-interactive', { stdio: 'inherit' });
    }
    
    // Run the tests
    await testDatabase();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();