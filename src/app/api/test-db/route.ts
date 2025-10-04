import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    // Simple database test
    const result = await prisma.checkIn.findFirst({ take: 1 });
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      hasRecords: !!result,
      recordCount: result ? 1 : 0
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
