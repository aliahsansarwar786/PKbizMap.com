import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Privacy Policy - PKbizMap',
  description: 'Privacy Policy for PKbizMap.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="page-header" suppressHydrationWarning>
          <div className="container-max" suppressHydrationWarning>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>Privacy Policy</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              How we collect, use, and protect your data
            </p>
          </div>
        </div>

        <section className="section" suppressHydrationWarning>
          <div className="container-max max-w-3xl" suppressHydrationWarning>
            <div className="card p-8 space-y-6" suppressHydrationWarning>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Information Collection</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                We collect information you provide directly to us when you create an account, list a business, or contact us for support.
              </p>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginTop: '2rem' }}>How We Use Information</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                We use the information we collect to provide, maintain, and improve our services, as well as to communicate with you about your account and business listings.
              </p>

              <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1d4ed8' }}>Contact Us</h3>
                <p style={{ color: '#3b82f6', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
                  If you have any questions about this Privacy Policy, please contact us at ahsanalisarwar555@gmail.com.
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
