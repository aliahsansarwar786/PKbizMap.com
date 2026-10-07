import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DashboardClient from '@/components/ui/DashboardClient';

export const metadata = {
  title: 'Dashboard - PKbizMap',
  description: 'Manage your businesses, reviews, and account settings.',
};

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }}>
        <DashboardClient />
      </main>
      <Footer />
    </>
  );
}
