import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

const CATEGORIES = [
  { name: 'Bank', image: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=500&q=80', description: 'Commercial banks, retail banking, branches, and financial services' },
  { name: 'Laboratory', image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=500&q=80', description: 'Diagnostic labs, medical testing, clinical research, and pathology' },
  { name: 'Bus Companies', image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=500&q=80', description: 'Intercity coaches, public transit, charter buses, and transportation' },
  { name: 'Information Technology (IT) & Services', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&q=80', description: 'IT consulting, software development, cloud computing, and tech solutions' },
  { name: 'Hospital', image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=500&q=80', description: 'Emergency care, specialty hospitals, clinics, and surgical centers' },
  { name: 'Local Shops & Traders', image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=500&q=80', description: 'Neighborhood markets, general stores, wholesale traders, and local shops' },
  { name: 'Education', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80', description: 'Schools, tutoring, courses, and educational services' },
  { name: 'Shopping & Retail Chains', image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=500&q=80', description: 'Supermarkets, hypermarkets, departmental stores, and retail brands' },
  { name: 'Real Estate', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80', description: 'Property listings, agents, and real estate services' },
  { name: 'Restaurants & Food Chains', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80', description: 'Fine dining, fast food chains, cafes, bakeries, and eateries' },
  { name: 'Importer and Exporter', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80', description: 'Global trade, shipping merchants, customs clearance, and import/export' },
  { name: 'Courier & Cargo Companies', image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=500&q=80', description: 'Parcel delivery, freight forwarding, logistics, and express cargo' },
  { name: 'Hotels & Guest Houses', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80', description: 'Luxury hotels, boutique stays, resorts, motels, and guest houses' },
  { name: 'Telecom Companies', image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&q=80', description: 'Mobile network operators, broadband internet, fiber optics, and telecom' },
  { name: 'IT', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80', description: 'Software, web development, IT services and tech companies' },
  { name: 'Restaurant', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80', description: 'Restaurants, cafes, food delivery, and catering' },
  { name: 'Healthcare', image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&q=80', description: 'Clinics, hospitals, doctors, dentists, and wellness' },
  { name: 'Automotive', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80', description: 'Car dealers, repair shops, and auto services' },
  { name: 'Retail', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80', description: 'Shops, stores, boutiques, and online retail' },
  { name: 'Finance', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80', description: 'Banks, accountants, financial advisors, and insurance' },
  { name: 'Beauty', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80', description: 'Salons, spas, barbershops, and beauty services' },
  { name: 'Travel', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80', description: 'Travel agencies, hotels, and tourism services' },
  { name: 'Professional Services', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=80', description: 'Lawyers, consultants, and professional services' },
  { name: 'Construction', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80', description: 'Contractors, builders, and construction companies' },
  { name: 'Other', image: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=500&q=80', description: 'All other business types not listed above' },
];

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
                  className="flex items-center gap-5 p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  suppressHydrationWarning
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 shadow-sm">
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
