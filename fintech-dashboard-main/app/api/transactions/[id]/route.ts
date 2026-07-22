import { NextResponse } from "next/server";
import { getTransactionService } from "@/lib/services/service-factory";
import { updateTransactionSchema } from "@/entities/transaction/model/types";
import { invalidateAiCaches } from "@/lib/invalidate-ai-cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = getTransactionService();
    const transaction = await service.getById(id);
    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedBody = updateTransactionSchema.parse(body);
    const service = getTransactionService();
    const updated = await service.update(id, validatedBody);
    await invalidateAiCaches();
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "Invalid data", errors: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = getTransactionService();
    await service.delete(id);
    await invalidateAiCaches();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 }
    );
  }
}