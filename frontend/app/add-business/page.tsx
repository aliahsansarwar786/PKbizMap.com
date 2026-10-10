import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessForm from '@/components/business/BusinessForm';

export const metadata = {
  title: 'Add Business - BizPrimeHub',
  description: 'List your business on BizPrimeHub for free. Reach thousands of customers.',
};

export default function AddBusinessPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }}>
        <div className="page-header">
          <div className="container-max">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
              Add Your Business
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Fill in your business details. Your listing will be reviewed and approved within 24 hours.
            </p>
          </div>
        </div>
        <div className="section-sm">
          <div className="container-max max-w-3xl">
            <BusinessForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
