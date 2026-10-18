'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: 'What is BizPrimeHub?',
    answer:
      'BizPrimeHub is a free online directory where you can find trusted local businesses in Pakistan, the UAE, and the USA — restaurants, banks, hotels, hospitals, and more.',
  },
  {
    question: 'How do I add my business?',
    answer:
      'Click "Add Business", fill in your business details, and submit. Your listing goes live after a quick review by our team. A small listing fee may apply depending on your region — the exact amount is shown before you submit.',
  },
  {
    question: 'How will customers find my business?',
    answer:
      'Visitors search by name or keyword and filter by country, city, and category — 17 categories to choose from. The more complete your listing (photos, opening hours, contact details), the easier it is to find.',
  },
  {
    question: 'Can customers leave reviews?',
    answer:
      'Yes. Customers can rate and review the businesses they visit. We remove spam and fake reviews so the ratings stay honest.',
  },
  {
    question: 'Is BizPrimeHub a shop? Can I buy things here?',
    answer:
      'No — we are a directory, not a marketplace. Any deal or payment happens directly between you and the business. BizPrimeHub is not responsible for transactions between visitors and businesses.',
  },
  {
    question: 'I found a wrong or fake listing. What should I do?',
    answer:
      'Message us on WhatsApp (the number is on our Contact page) with the business name and what is wrong. Our team reviews every report and removes listings that break the rules.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      className="section"
      style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9' }}
      aria-labelledby="faq-heading"
    >
      <div className="container-max max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2.5 border border-blue-100/60">
            <HelpCircle size={13} className="text-blue-600" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2
            id="faq-heading"
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '0.5rem',
            }}
          >
            Got Questions?
          </h2>
          <p style={{ color: '#6b7280', maxWidth: '36rem', margin: '0 auto', fontSize: '0.9375rem' }}>
            Find quick answers to common questions about discovering, adding, and reviewing local businesses.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-question-${index}`;
            const panelId = `faq-answer-${index}`;

            return (
              <div
                key={faq.question}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-blue-200 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  id={buttonId}
                  onClick={() => toggleAccordion(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer min-h-[44px] gap-3"
                >
                  <span className="text-sm sm:text-base leading-snug">{faq.question}</span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-blue-100 text-blue-600 rotate-180'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown size={16} />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-4 pb-4 sm:px-5 sm:pb-5 text-slate-600 text-sm sm:text-[0.9375rem] leading-relaxed border-t border-slate-100/80 pt-3"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
