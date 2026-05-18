import { Suspense } from "react";
import { TelegramCallback } from "@/views/app/ui/TelegramCallback";

export default function TelegramCallbackPage() {
  return (
    <Suspense>
      <TelegramCallback />
    </Suspense>
  );
}