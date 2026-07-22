import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function TransactionTableSkeleton() {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Последние транзакции</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton height={40} count={5} />
        </div>
      </CardContent>
    </Card>
  );
}