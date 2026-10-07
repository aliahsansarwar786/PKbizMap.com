import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessDetail from '@/components/business/BusinessDetail';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: 'Business Details',
    description: 'View business details, contact information, and reviews.',
  };
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Navbar />
      <main>
        <BusinessDetail id={id} />
      </main>
      <Footer />
    </>
  );
}
