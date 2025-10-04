import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test direct connection
    const { PrismaClient } = await import('@prisma/client');
    
    const testClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Test connection
    await testClient.$connect();
    const result = await testClient.$queryRaw`SELECT 1 as test`;
    await testClient.$disconnect();

    return NextResponse.json({
      success: true,
      message: "Direct connection successful",
      result: result,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }, { status: 500 });
  }
}
