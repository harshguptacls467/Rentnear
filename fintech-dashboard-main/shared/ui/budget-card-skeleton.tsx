"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function BudgetCardSkeleton() {
  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm dark:text-gray-200">Бюджет</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton height={14} width={60} className="mb-1" />
              <Skeleton height={8} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}