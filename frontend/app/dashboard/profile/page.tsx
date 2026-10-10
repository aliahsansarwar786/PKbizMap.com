import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProfileClient from '@/components/ui/ProfileClient';

export const metadata = {
  title: 'My Profile - BizPrimeHub',
};

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }}>
        <div className="page-header">
          <div className="container-max">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>My Profile</h1>
          </div>
        </div>
        <div className="section-sm">
          <div className="container-max max-w-2xl">
            <ProfileClient />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
