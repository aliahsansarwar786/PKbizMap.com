import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ForgotPasswordForm from '@/components/ui/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password - BizPrimeHub',
  description: 'Reset your BizPrimeHub account password.',
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }} className="flex items-center py-12">
        <div className="container-max w-full">
          <ForgotPasswordForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
