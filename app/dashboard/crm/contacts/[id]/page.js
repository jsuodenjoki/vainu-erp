import ContactDetailClient from "@/components/crm/ContactDetailClient";
export const dynamic = "force-dynamic";
export default function ContactDetailPage({ params }) {
  return <ContactDetailClient params={params} />;
}
