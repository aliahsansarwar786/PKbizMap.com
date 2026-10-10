import Link from 'next/link';
import { Mail, Phone, MapPin, Heart, ArrowRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0f1c] text-slate-200 font-sans border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        
        {/* Top CTA Section (Sleek & Integrated) */}
        <div className="py-12 border-b border-slate-800/60">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-blue-900/20 to-slate-900/40 rounded-2xl p-8 lg:p-10 border border-blue-900/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            
            <div className="text-center md:text-left max-w-xl relative z-10">
              <h3 className="text-2xl font-bold !text-white mb-2 tracking-tight">Ready to grow your business?</h3>
              <p className="text-slate-300 font-medium">Join Pakistan's local directory. List your business for free and start reaching potential customers today.</p>
            </div>
            
            <div className="shrink-0 relative z-10">
              <Link href="/add-business" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 !text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-900/40 transition-all group">
                List Your Business
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-6 inline-flex !text-white">
              <div className="w-16 h-16 bg-white rounded-xl p-1.5 shadow-md flex items-center justify-center ring-2 ring-white/5 shrink-0">
                <img src="/logo-transparent.png" alt="BizPrimeHub" className="w-full h-full object-contain scale-110 contrast-125 saturate-[1.3] drop-shadow-sm" />
              </div>
              <span className="text-2xl font-bold tracking-tight !text-white">BizPrimeHub</span>
            </Link>
            
            <p className="text-slate-300 font-medium text-sm leading-relaxed mb-6 max-w-sm">
              Discover and connect with trusted local businesses across Pakistan. Your ultimate guide to finding services, reading reviews, and growing your brand.
            </p>

            <div className="space-y-4 text-sm font-medium mb-8">
              <div className="flex items-center gap-3 text-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-blue-400" />
                </div>
                <span>Pakistan</span>
              </div>
              <a href="https://wa.me/923106131361" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 !text-slate-200 hover:!text-blue-400 transition-colors w-fit group">
                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-blue-900/50 flex items-center justify-center shrink-0 transition-colors">
                  <Phone size={14} className="text-blue-400" />
                </div>
                <span>+92 310 6131361</span>
              </a>
              <a href="mailto:ahsanalisarwar555@gmail.com" className="flex items-center gap-3 !text-slate-200 hover:!text-blue-400 transition-colors w-fit group">
                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-blue-900/50 flex items-center justify-center shrink-0 transition-colors">
                  <Mail size={14} className="text-blue-400" />
                </div>
                <span>ahsanalisarwar555@gmail.com</span>
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=61592662517265" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center !text-slate-300 hover:!text-white hover:bg-[#1877F2] transition-colors shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="https://wa.me/923106131361" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center !text-slate-300 hover:!text-white hover:bg-[#25D366] transition-colors shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center !text-slate-300 hover:!text-white hover:bg-[#E1306C] transition-colors shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center !text-slate-300 hover:!text-white hover:bg-[#1DA1F2] transition-colors shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.73 8L4 20h2.58l9.71-8L20 4h-2.58L9.71 12 4 4z"></path></svg>
              </a>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h4 className="!text-white font-semibold mb-6 tracking-wide uppercase text-sm border-b border-slate-800 pb-2 w-max">Company</h4>
            <ul className="space-y-3 text-sm font-medium">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact Support' },
                { href: '/add-business', label: 'Add Business' },
                { href: '/dashboard', label: 'Dashboard' }
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="!text-slate-300 hover:!text-white transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="lg:col-span-4">
            <h4 className="!text-white font-semibold mb-6 tracking-wide uppercase text-sm border-b border-slate-800 pb-2 w-max">Popular Categories</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-medium">
              {['IT & Services', 'Real Estate', 'Restaurants', 'Healthcare', 'Education', 'Automotive', 'Beauty', 'Retail'].map((cat) => (
                <Link key={cat} href={`/businesses?category=${encodeURIComponent(cat)}`} className="!text-slate-300 hover:!text-white transition-colors truncate pr-2 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-colors shrink-0"></span>
                  <span className="truncate">{cat}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-[#070a14]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="text-center md:text-left">
            <p>&copy; {currentYear} BizPrimeHub. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800 text-slate-300">
            <span>Made with care</span>
            <Heart size={13} className="text-red-500 fill-red-500" />
            <span>by <strong className="!text-white font-semibold">Ahsan Ali</strong></span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="!text-slate-400 hover:!text-slate-200 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="!text-slate-400 hover:!text-slate-200 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
