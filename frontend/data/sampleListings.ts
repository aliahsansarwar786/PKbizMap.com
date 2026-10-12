export interface BusinessListing {
  id: string;
  name: string;
  tagline: string;
  category: 'Restaurants' | 'IT Services' | 'Real Estate' | 'Health' | 'Education';
  city: 'Lahore' | 'Karachi' | 'Islamabad';
  fullAddress: string;
  phone: string;
  WhatsApp: string;
  email: string;
  rating: number;
  verified: boolean;
  description: string;
  isSample: boolean;
  coverImage?: string;
  logo?: string;
}

/**
 * 10 Sample Business Listings for development, UI demonstrations, and offline testing.
 * Strictly marked with isSample: true and verified: false.
 * These records represent illustrative local enterprises across Lahore, Karachi, and Islamabad.
 */
export const SAMPLE_BUSINESS_LISTINGS: BusinessListing[] = [
  {
    id: "sample-rest-01",
    name: "Zauq-e-Punjab Restaurant",
    tagline: "Authentic desi culinary experience and charcoal barbecue in Gulberg.",
    category: "Restaurants",
    city: "Lahore",
    fullAddress: "Plot 42-B, Main Boulevard, Gulberg III, Lahore, Punjab, Pakistan",
    phone: "+92 42 35780001",
    WhatsApp: "+92 300 1234567",
    email: "contact@zauqepunjab.sample.pk",
    rating: 4.8,
    verified: false,
    isSample: true,
    description: "Zauq-e-Punjab delivers an authentic taste of traditional Lahori dishes prepared with time-honored recipes. Guests enjoy a family-friendly ambiance complete with live barbecue grills and fresh tandoori bread. The establishment caters to corporate lunch gatherings as well as lively weekend dinners.",
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-rest-02",
    name: "Karachi Spice Trail Bistro",
    tagline: "Coastal flavors, fragrant biryani, and artisanal roadside chai.",
    category: "Restaurants",
    city: "Karachi",
    fullAddress: "Street 8, Block 4, Clifton, Karachi, Sindh, Pakistan",
    phone: "+92 21 35870002",
    WhatsApp: "+92 321 7654321",
    email: "info@karachispicetrail.sample.pk",
    rating: 4.6,
    verified: false,
    isSample: true,
    description: "Karachi Spice Trail Bistro serves iconic coastal delicacies and spiced curries cooked fresh every afternoon. Diners appreciate the seaside aesthetic and attentive table service for afternoon gatherings and late dinners. The kitchen sources regional produce and freshly caught seafood to preserve authentic local zest.",
    coverImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-it-01",
    name: "Margalla Cloud & Web Systems",
    tagline: "Enterprise cloud integrations and bespoke web platform engineering.",
    category: "IT Services",
    city: "Islamabad",
    fullAddress: "Floor 4, Evacuee Trust Complex, Sector F-5/1, Islamabad, Pakistan",
    phone: "+92 51 2820003",
    WhatsApp: "+92 333 9876543",
    email: "support@margallacloud.sample.pk",
    rating: 4.9,
    verified: false,
    isSample: true,
    description: "Margalla Cloud specializes in scalable cloud migrations, automated DevOps pipelines, and robust modern web architectures. Their seasoned engineering squad assists startups and mid-market enterprises across Pakistan with reliable digital infrastructure. Clients receive end-to-end technical consulting coupled with round-the-clock maintenance agreements.",
    coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-it-02",
    name: "NexGen Byte Software Studio",
    tagline: "Custom mobile apps, SaaS development, and smart e-commerce portals.",
    category: "IT Services",
    city: "Lahore",
    fullAddress: "Suite 302, Arfa Software Technology Park, Ferozepur Road, Lahore, Pakistan",
    phone: "+92 42 35990004",
    WhatsApp: "+92 301 4567890",
    email: "hello@nexgenbyte.sample.pk",
    rating: 4.7,
    verified: false,
    isSample: true,
    description: "NexGen Byte builds production-grade cross-platform mobile applications and scalable e-commerce storefronts for regional brands. The agency follows agile sprints ensuring prompt delivery milestones and transparent code reviews for every client. Their solutions prioritize high conversion speeds, clean user interfaces, and secure transaction workflows.",
    coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-re-01",
    name: "Capital Apex Real Estate Advisory",
    tagline: "Verified property consultations and modern apartment leasing in Islamabad.",
    category: "Real Estate",
    city: "Islamabad",
    fullAddress: "Office 14, Blue Area Commercial Arcade, Sector G-7, Islamabad, Pakistan",
    phone: "+92 51 2270005",
    WhatsApp: "+92 345 5551234",
    email: "advisory@capitalapex.sample.pk",
    rating: 4.8,
    verified: false,
    isSample: true,
    description: "Capital Apex guides prospective buyers and investors through legal verifications for residential plots and corporate corporate towers. The agency maintains an updated catalog of vetted listings across high-demand sectors in the federal capital. Their seasoned agents deliver transparent documentation analysis along with honest valuation assessments.",
    coverImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-re-02",
    name: "Sindh Prime Properties & Builders",
    tagline: "Commercial real estate acquisitions and residential luxury housing in Karachi.",
    category: "Real Estate",
    city: "Karachi",
    fullAddress: "Mezzanine Floor, Shahrah-e-Faisal Commercial Zone, Karachi, Pakistan",
    phone: "+92 21 34550006",
    WhatsApp: "+92 334 6667788",
    email: "sales@sindhprime.sample.pk",
    rating: 4.5,
    verified: false,
    isSample: true,
    description: "Sindh Prime Properties facilitates corporate relocations and residential acquisitions throughout DHA and Bahria communities in Karachi. Their real estate consultants verify title deeds and building approvals thoroughly prior to finalizing any sale contract. Clients count on their honest market insights and clear fee schedules for all property transactions.",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-health-01",
    name: "Shifa Noor Dental & PolyClinic",
    tagline: "Gentle family dentistry, modern orthodontics, and preventive health checks.",
    category: "Health",
    city: "Lahore",
    fullAddress: "Plaza 18, Commercial Broadway, DHA Phase 5, Lahore, Pakistan",
    phone: "+92 42 37180007",
    WhatsApp: "+92 312 8889900",
    email: "care@shifanoorclinic.sample.pk",
    rating: 4.9,
    verified: false,
    isSample: true,
    description: "Shifa Noor PolyClinic provides comprehensive dental care and basic outpatient diagnostic services under rigid sterile standards. The center features digital X-ray facilities along with certified specialists who focus on comfortable patient experiences. Families trust their transparent appointment schedules and dedicated preventive care sessions.",
    coverImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-health-02",
    name: "Sehat Medical Diagnostic Lab",
    tagline: "Fast accurate pathology reports and home sample collection services.",
    category: "Health",
    city: "Karachi",
    fullAddress: "Shop 4, University Road, Gulshan-e-Iqbal Block 6, Karachi, Pakistan",
    phone: "+92 21 34980008",
    WhatsApp: "+92 331 2223344",
    email: "reports@sehatlab.sample.pk",
    rating: 4.6,
    verified: false,
    isSample: true,
    description: "Sehat Diagnostic Lab delivers precision laboratory testing utilizing computerized analyzers and automated reporting systems. Certified phlebotomists offer convenient home sample collection across major residential neighborhoods in Karachi. Patients can access digital test reports securely via WhatsApp and web portals within same-day turnarounds.",
    coverImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-edu-01",
    name: "Quaid Apex Institute of Tech Skills",
    tagline: "Career-focused coding bootcamps, digital marketing, and design courses.",
    category: "Education",
    city: "Lahore",
    fullAddress: "77 Garden Town, Near Kalma Chowk, Lahore, Punjab, Pakistan",
    phone: "+92 42 35850009",
    WhatsApp: "+92 302 7778899",
    email: "admissions@quaidapex.sample.pk",
    rating: 4.8,
    verified: false,
    isSample: true,
    description: "Quaid Apex Institute equips students and mid-career professionals with practical software engineering and freelancing skills. Practical workshops emphasize portfolio development, modern web toolkits, and client communication fundamentals. Alumni receive structured mentorship that streamlines career placement in local and remote technology companies.",
    coverImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sample-edu-02",
    name: "Margalla Global Languages Academy",
    tagline: "IELTS preparation, spoken English fluency, and foreign language certification.",
    category: "Education",
    city: "Islamabad",
    fullAddress: "Sector I-8 Markaz, Executive Arcade 2nd Floor, Islamabad, Pakistan",
    phone: "+92 51 4860010",
    WhatsApp: "+92 340 1122334",
    email: "info@margallalanguages.sample.pk",
    rating: 4.7,
    verified: false,
    isSample: true,
    description: "Margalla Global Languages Academy conducts interactive language coaching tailored for higher study admissions and corporate communication. Qualified trainers utilize multimedia labs and realistic test simulations to boost students speaking confidence. Flexible morning and evening schedules accommodate both university attendees and working executives.",
    coverImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    logo: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=200&q=80"
  }
];
