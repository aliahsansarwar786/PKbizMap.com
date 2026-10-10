import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Terms of Service - BizPrimeHub',
  description: 'Terms of Service for BizPrimeHub.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="page-header" suppressHydrationWarning>
          <div className="container-max" suppressHydrationWarning>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>Terms of Service</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Guidelines for using our platform
            </p>
          </div>
        </div>

        <section className="section" suppressHydrationWarning>
          <div className="container-max max-w-3xl" suppressHydrationWarning>
            <div className="card p-8 space-y-6" suppressHydrationWarning>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Acceptance of Terms</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                By accessing and using BizPrimeHub, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginTop: '2rem' }}>User Responsibilities</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                Users are responsible for ensuring that all information provided in business listings is accurate and up-to-date. We reserve the right to remove or modify listings that violate our community guidelines.
              </p>

              <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1d4ed8' }}>Contact Us</h3>
                <p style={{ color: '#3b82f6', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
                  If you have any questions about these Terms, please contact us at ahsanalisarwar555@gmail.com.
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
