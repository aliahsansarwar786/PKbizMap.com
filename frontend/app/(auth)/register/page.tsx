import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RegisterForm from '@/components/ui/RegisterForm';

export const metadata = {
  title: 'Create Account - BizPrimeHub',
  description: 'Create your free BizPrimeHub account and start listing or discovering businesses.',
};

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }} className="flex items-center py-12">
        <div className="container-max w-full">
          <RegisterForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
