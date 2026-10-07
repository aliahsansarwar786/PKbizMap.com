'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { businessAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessForm from '@/components/business/BusinessForm';
import toast from 'react-hot-toast';

export default function EditBusinessPage() {
  const { id } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;

    // Fetch business
    if (user?.role === 'admin') {
      import('@/lib/api').then(({ adminAPI }) => {
        adminAPI.getBusinessById(id)
          .then((res: any) => setBusiness(res.data.business))
          .catch(() => setError('Failed to load business.'))
          .finally(() => setLoading(false));
      });
    } else {
      businessAPI.getMyBusinesses()
        .then((res: any) => {
          const found = res.data.businesses.find((b: any) => b._id === id);
          if (!found) {
            setError('Business not found or you do not have permission to edit it.');
          } else {
            setBusiness(found);
          }
        })
        .catch(() => setError('Failed to load business.'))
        .finally(() => setLoading(false));
    }
  }, [id, isAuthenticated, authLoading, user, router]);

  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }}>
        <div className="page-header">
          <div className="container-max">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
              Edit Business
            </h1>
          </div>
        </div>
        <div className="section-sm">
          <div className="container-max max-w-3xl">
            {loading ? (
              <div className="card p-6 space-y-4">
                <div className="skeleton h-8 rounded" style={{ width: '40%' }} />
                <div className="skeleton h-12 rounded" />
                <div className="skeleton h-24 rounded" />
                <div className="skeleton h-12 rounded" />
              </div>
            ) : error ? (
              <div className="card p-8 text-center">
                <p style={{ color: '#dc2626' }}>{error}</p>
              </div>
            ) : business ? (
              <BusinessForm existingBusiness={business} />
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
