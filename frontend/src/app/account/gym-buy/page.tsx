import { Suspense } from "react";
import { GymBuyPage } from "@/views/account/ui/GymBuyPage";

export default function Page() {
  return (
    <Suspense>
      <GymBuyPage />
    </Suspense>
  );
}