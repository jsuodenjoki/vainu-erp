import DealDetailClient from "@/components/crm/DealDetailClient";
export const dynamic = "force-dynamic";
export default function DealDetailPage({ params }) {
  return <DealDetailClient params={params} />;
}
