import { requireUser } from '@/lib/auth';
import ListingForm from '@/components/listing-form';
export const metadata={title:'Create listing'};

export default async function NewListingPage(){
  await requireUser();
  return <section className="section"><div className="container-page">
    <h1 className="font-display text-4xl font-semibold">Create a property listing</h1>
    <p className="mt-3 text-muted">Add the essentials, generate an AI description and publish.</p>
    <ListingForm mode="create" />
  </div></section>;
}
