import { ProgramDetail } from "@/views/programs/ui/ProgramDetail";

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProgramDetail slug={slug} />;
}
