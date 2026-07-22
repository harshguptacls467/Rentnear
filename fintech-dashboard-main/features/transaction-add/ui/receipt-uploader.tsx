"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Camera, Loader2 } from "lucide-react";

interface ReceiptUploaderProps {
  onDataFilled: (data: {
    title: string;
    amount: number;
    date: string;
    category: string;
  }) => void;
}

export function ReceiptUploader({ onDataFilled }: ReceiptUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка распознавания");
      }

      const data = await response.json();
      onDataFilled({
        title: data.title,
        amount: data.amount,
        date: data.date,
        category: data.category,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      e.target.value = ""; // сброс input
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("receipt-upload")?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Распознаю чек..." : "Загрузить чек"}
        </Button>
        <input
          id="receipt-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}