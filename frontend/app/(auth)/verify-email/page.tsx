import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VerifyEmailForm from '@/components/ui/VerifyEmailForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Verify Your Email - BizPrimeHub',
  description: 'Enter your 6-digit verification code to activate your BizPrimeHub account.',
};

export default function VerifyEmailPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }} className="flex items-center py-12 px-4">
        <div className="container-max w-full">
          <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading verification...</div>}>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
