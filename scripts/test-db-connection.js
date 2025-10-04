// Test database connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    console.log('🔍 Testing database connection...\n');

    // Test 1: Raw query to check connection
    console.log('Test 1: Raw SQL query');
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Connection successful!');
    console.log('Database time:', result[0].current_time);
    console.log('PostgreSQL version:', result[0].pg_version.split(' ')[0], '\n');

    // Test 2: Check if tables exist
    console.log('Test 2: Checking tables');
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    if (tables.length === 0) {
      console.log('⚠️  No tables found - migrations need to be run\n');
    } else {
      console.log('✅ Found tables:', tables.map(t => t.tablename).join(', '), '\n');
    }

    // Test 3: Try to query CheckIn table (if it exists)
    try {
      console.log('Test 3: Query CheckIn table');
      const count = await prisma.checkIn.count();
      console.log(`✅ CheckIn table exists with ${count} records\n`);
    } catch (error) {
      console.log('⚠️  CheckIn table does not exist yet\n');
    }

    console.log('✅ All connection tests passed!');
    console.log('\nNext steps:');
    if (tables.length === 0) {
      console.log('1. Run migrations using the direct database URL (not pooler)');
      console.log('2. Get direct URL from Supabase: Settings > Database > Connection string (Direct)');
      console.log('3. Run: DATABASE_URL="<direct-url>" npx prisma migrate deploy');
    } else {
      console.log('Database is ready for use! 🎉');
    }

  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(error.message);

    if (error.message.includes('P1001')) {
      console.log('\n💡 Tip: Make sure DATABASE_URL is set correctly');
      console.log('Current DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
