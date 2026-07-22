"use client";

import { Card, CardContent } from "@/shared/ui/card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function KpiCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
          <CardContent className="p-4">
            <Skeleton height={16} width={80} className="mb-2" />
            <Skeleton height={28} width={100} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}