import CompanyDetailClient from "@/components/crm/CompanyDetailClient";

export const dynamic = "force-dynamic";

export default function CompanyDetailPage({ params }) {
  return <CompanyDetailClient params={params} />;
}
