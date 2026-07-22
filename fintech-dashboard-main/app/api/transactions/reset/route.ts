import { NextResponse } from "next/server";
import { getTransactionService } from "@/lib/services/service-factory";
import { invalidateAiCaches } from "@/lib/invalidate-ai-cache";

export async function POST() {
  try {
    const service = getTransactionService();
    const transactions = await service.reset();
    await invalidateAiCaches();
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json(
      { message: "Reset failed" },
      { status: 500 }
    );
  }
}