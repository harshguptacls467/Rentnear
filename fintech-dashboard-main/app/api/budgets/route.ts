import { NextResponse } from "next/server";
import { getBudgetService } from "@/lib/services/service-factory";
import { budgetSchema } from "@/entities/budget/model/types";

export async function GET() {
  try {
    const service = getBudgetService();
    const budgets = await service.getAll();
    return NextResponse.json(budgets);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = budgetSchema.parse(body);
    const service = getBudgetService();
    const budget = await service.setLimit(input.category, input.limit);
    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid data" },
      { status: 400 }
    );
  }
}