import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'About Us - PKbizMap',
  description: 'Learn more about PKbizMap, our mission, and our team.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="page-header" suppressHydrationWarning>
          <div className="container-max" suppressHydrationWarning>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>About Us</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Discover our mission to connect local communities with trusted businesses
            </p>
          </div>
        </div>

        <section className="section" suppressHydrationWarning>
          <div className="container-max max-w-3xl" suppressHydrationWarning>
            <div className="card p-8 space-y-6" suppressHydrationWarning>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Our Mission</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                At PKbizMap, our mission is to empower local businesses in Multan and across Pakistan. We believe that small businesses are the backbone of our economy, and we want to provide them with a platform to shine.
              </p>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginTop: '2rem' }}>What We Do</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                We manually review and verify all businesses listed on our platform to ensure a high standard of quality. Customers can read genuine reviews, find contact information, and connect with local professionals instantly.
              </p>

              <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1d4ed8' }}>Join our growing community</h3>
                <p style={{ color: '#3b82f6', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
                  Whether you are a business owner looking to expand your reach, or a customer looking for the best services in town, PKbizMap is here for you.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
