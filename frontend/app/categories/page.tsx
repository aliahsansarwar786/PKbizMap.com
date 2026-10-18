import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';

export const metadata = {
  title: 'Browse Categories - BizPrimeHub',
  description: 'Explore all business categories on BizPrimeHub and find the services you need.',
};

export default function CategoriesPage() {
  return (
    <>
      <Navbar />
      <main suppressHydrationWarning>
        <div className="bg-slate-50 py-16 border-b border-slate-100" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center" suppressHydrationWarning>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">Business Categories</h1>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              Browse all {CATEGORIES.length} categories and find what you&apos;re looking for
            </p>
          </div>
        </div>

        <section className="py-16" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8" suppressHydrationWarning>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" suppressHydrationWarning>
              {CATEGORIES.map(({ name, image, description }) => (
                <Link
                  key={name}
                  href={`/businesses?category=${encodeURIComponent(name)}`}
                  className="flex items-center gap-3.5 sm:gap-5 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  suppressHydrationWarning
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 shadow-sm">
                    <img
                      src={image}
                      alt={name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div suppressHydrationWarning>
                    <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {name}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                      {description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
