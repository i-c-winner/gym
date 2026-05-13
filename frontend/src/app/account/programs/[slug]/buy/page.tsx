import { ProgramBuy } from "@/views/account/ui/ProgramBuy";

export default async function ProgramBuyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProgramBuy slug={slug} />;
}
