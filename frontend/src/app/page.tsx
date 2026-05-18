import { Suspense } from "react";
import { PlaceholderPage } from "@/views/app/ui/PlaceholderPage";

export default function Page() {
  return (
    <Suspense>
      <PlaceholderPage />
    </Suspense>
  );
}