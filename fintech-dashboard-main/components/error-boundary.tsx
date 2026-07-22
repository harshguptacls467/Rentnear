"use client";

import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center">
          <h2 className="text-destructive text-lg font-semibold mb-2">Что-то пошло не так</h2>
          <p className="text-muted-foreground text-sm mb-4">{errorMessage}</p>
          <Button onClick={resetErrorBoundary}>Обновить страницу</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={Fallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}