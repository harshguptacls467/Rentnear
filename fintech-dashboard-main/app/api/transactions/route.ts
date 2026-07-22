import { NextResponse } from "next/server";
import { getTransactionService } from "@/lib/services/service-factory";
import { newTransactionSchema } from "@/entities/transaction/model/types";
import { invalidateAiCaches } from "@/lib/invalidate-ai-cache";

export async function GET() {
  try {
    const service = getTransactionService();
    const transactions = await service.getAll();
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "deleteAll") {
      const service = getTransactionService();
      await service.deleteAll();
      await invalidateAiCaches();
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const input = newTransactionSchema.parse(body);
    const service = getTransactionService();
    const created = await service.create(input);
    await invalidateAiCaches();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid data" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  try {
    console.log("DELETE /api/transactions called");
    const service = getTransactionService();
    await service.deleteAll();
    await invalidateAiCaches();
    console.log("DELETE /api/transactions success");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Delete all failed" },
      { status: 500 }
    );
  }
}