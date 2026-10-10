import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Mail, Phone, MapPin } from 'lucide-react';
import ContactForm from '@/components/ui/ContactForm';

export const metadata = {
  title: 'Contact Us - BizPrimeHub',
  description: 'Get in touch with the BizPrimeHub support team.',
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="page-header" suppressHydrationWarning>
          <div className="container-max" suppressHydrationWarning>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>Contact Us</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              We'd love to hear from you. Get in touch with our team.
            </p>
          </div>
        </div>

        <section className="section" suppressHydrationWarning>
          <div className="container-max max-w-4xl" suppressHydrationWarning>
            <div className="grid md:grid-cols-2 gap-8" suppressHydrationWarning>
              
              {/* Contact Information */}
              <div className="space-y-6" suppressHydrationWarning>
                <div className="card p-6" suppressHydrationWarning>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '1.5rem' }}>Get in Touch</h2>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#374151' }}>Email Us</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>ahsanalisarwar555@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-50 text-green-600">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#374151' }}>Call Us</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>+92 310 6131361</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#374151' }}>Office Location</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pracha Street, opposite Kalyar Graphics, near BCG Chowk<br />Multan, 60600, Pakistan</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="card p-6" suppressHydrationWarning>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '1.5rem' }}>Send a Message</h2>
                <ContactForm />
              </div>

            </div>

            {/* Google Map */}
            <div className="mt-8 card p-2 overflow-hidden h-[400px]" suppressHydrationWarning>
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '0.5rem' }}
                loading="lazy"
                allowFullScreen
                src="https://maps.google.com/maps?q=BCG%20Chowk%20Multan,%20Pakistan&t=&z=15&ie=UTF8&iwloc=&output=embed"
              ></iframe>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
