import { Suspense } from "react";
import { ProgramBuyPage } from "@/views/programs/ui/ProgramBuyPage";

export default async function BuyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense>
      <ProgramBuyPage slug={slug} />
    </Suspense>
  );
}
