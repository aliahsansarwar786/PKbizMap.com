import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoginForm from '@/components/ui/LoginForm';

export const metadata = {
  title: 'Login - PKbizMap',
  description: 'Sign in to your PKbizMap account.',
};

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f9fafb', minHeight: '80vh' }} className="flex items-center py-12">
        <div className="container-max w-full">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
