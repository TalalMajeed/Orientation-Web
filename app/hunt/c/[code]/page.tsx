import HuntRedeem from "@/components/hunt/HuntRedeem";

type PageProps = { params: Promise<{ code: string }> };

export const metadata = { title: "Scavenger Hunt — NUST Orientation '26" };

export default async function HuntCodePage({ params }: PageProps) {
  const { code } = await params;

  return <HuntRedeem code={code.toUpperCase()} />;
}
