import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResetPasswordForm from '@/components/ui/ResetPasswordForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Reset Password - BizPrimeHub',
  description: 'Set a new password for your BizPrimeHub account.',
};

export default async function ResetPasswordWithTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  const token = resolvedParams?.token || '';

  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }} className="flex items-center py-12">
        <div className="container-max w-full">
          <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
            <ResetPasswordForm tokenProp={token} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
