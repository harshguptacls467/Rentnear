// Vision API временно отключён.
// Распознавание чеков планируется в будущих версиях.
// Исходный код сохранён в git-истории.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Распознавание чеков временно недоступно' },
    { status: 503 },
  );
}