import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResetPasswordForm from '@/components/ui/ResetPasswordForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Reset Password - PKbizMap',
};

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }} className="flex items-center py-12">
        <div className="container-max w-full">
          <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
