import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const metadata = {
  title: 'Admin Dashboard - PKbizMap',
  description: 'Manage businesses, users, and reviews.',
};

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }}>
        <AdminDashboardClient />
      </main>
      <Footer />
    </>
  );
}
