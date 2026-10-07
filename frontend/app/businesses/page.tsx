import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessDirectory from '@/components/business/BusinessDirectory';

export const metadata = {
  title: 'Business Directory - Find Local Businesses',
  description: 'Browse all verified local businesses. Filter by category, city, and rating.',
};

export default function BusinessesPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="page-header">
          <div className="container-max">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
              Business Directory
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Discover and connect with verified local businesses
            </p>
          </div>
        </div>
        <BusinessDirectory />
      </main>
      <Footer />
    </>
  );
}
