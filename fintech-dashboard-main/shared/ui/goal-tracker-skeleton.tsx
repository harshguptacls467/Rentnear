"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function GoalTrackerSkeleton() {
  return (
    <Card className="shadow-soft border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
      <CardHeader className="pb-1 px-3">
        <CardTitle className="text-sm dark:text-gray-200">Финансовые цели</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1">
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <Skeleton height={14} width={80} />
                <Skeleton height={14} width={40} />
              </div>
              <Skeleton height={6} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}