import { Program } from "@/views/account/ui/Program";

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Program slug={slug} />;
}