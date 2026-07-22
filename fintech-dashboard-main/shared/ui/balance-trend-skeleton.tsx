"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function BalanceTrendSkeleton() {
  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm dark:text-gray-200">Динамика баланса</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1">
        <Skeleton height={180} />
      </CardContent>
    </Card>
  );
}