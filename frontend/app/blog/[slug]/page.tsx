import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { getPostBySlug, getRelatedPosts, getAllPosts } from '@/data/blogPosts';
import { Calendar, Clock, ArrowLeft, Tag, Share2, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | BizPrimeHub',
    };
  }

  const postUrl = `https://bizprimehub.vercel.app/blog/${post.slug}`;

  return {
    title: `${post.metaTitle} | BizPrimeHub`,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: postUrl,
      siteName: 'BizPrimeHub',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [
        {
          url: post.coverImage,
          alt: post.coverImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.coverImage],
    },
  };
}

// Helper function to format markdown inline links [text](url), **bold**, and *italic*
function formatInlineText(text: string) {
  const tokens: (string | React.ReactNode)[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }
    if (match[1] && match[2]) {
      const linkText = match[1];
      const href = match[2];
      if (href.startsWith('/')) {
        tokens.push(
          <Link key={match.index} href={href} className="text-blue-600 hover:underline font-medium">
            {linkText}
          </Link>
        );
      } else {
        tokens.push(
          <a
            key={match.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            {linkText}
          </a>
        );
      }
    } else if (match[3]) {
      tokens.push(<strong key={match.index} className="font-semibold text-slate-900">{match[3]}</strong>);
    } else if (match[4]) {
      tokens.push(<em key={match.index}>{match[4]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post.slug, post.category, 2);

  // JSON-LD Structured Data (Article Schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [post.coverImage],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'BizPrimeHub',
      url: 'https://bizprimehub.vercel.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bizprimehub.vercel.app/logo-transparent.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://bizprimehub.vercel.app/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="bg-slate-50 min-h-screen py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-8">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-800 truncate max-w-xs">{post.category}</span>
          </nav>

          {/* Article Header Card */}
          <header className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <Tag size={12} /> {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={13} /> {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={13} /> {post.readTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 font-normal">
              {post.excerpt}
            </p>

            {/* Author Profile */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-11 h-11 rounded-full border border-slate-200"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900">{post.author.name}</div>
                  <div className="text-xs text-slate-500">{post.author.role}</div>
                </div>
              </div>

              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={14} /> Back to all articles
              </Link>
            </div>
          </header>

          {/* Featured Image */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 mb-10 bg-slate-100">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt}
              className="w-full h-auto max-h-[460px] object-cover"
              loading="eager"
            />
          </div>

          {/* Main Article Content */}
          <article className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-12 mb-12">
            <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed space-y-6">
              {post.content.split('\n\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                // Handle H2 Headings
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2
                      key={index}
                      className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2.5"
                    >
                      {trimmed.replace('## ', '')}
                    </h2>
                  );
                }

                // Handle H3 Headings
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3
                      key={index}
                      className="text-lg sm:text-xl font-bold text-slate-800 mt-6 mb-2"
                    >
                      {trimmed.replace('### ', '')}
                    </h3>
                  );
                }

                // Handle Horizontal Rule
                if (trimmed === '---') {
                  return <hr key={index} className="my-8 border-slate-200" />;
                }

                // Handle Bullet Points
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                  const items = trimmed.split('\n').filter((line) => line.trim());
                  return (
                    <ul key={index} className="list-disc pl-6 space-y-2 text-slate-700">
                      {items.map((item, idx) => (
                        <li key={idx}>
                          {formatInlineText(item.replace(/^[*|-]\s+/, ''))}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Handle Callout / Blockquote
                if (trimmed.startsWith('> ')) {
                  return (
                    <blockquote
                      key={index}
                      className="border-l-4 border-blue-600 bg-blue-50/70 p-4 rounded-r-xl italic text-slate-700 text-sm sm:text-base my-4"
                    >
                      {formatInlineText(trimmed.replace('> ', ''))}
                    </blockquote>
                  );
                }

                // Default paragraph with internal links conversion
                return (
                  <p key={index} className="text-slate-700 text-sm sm:text-base leading-relaxed">
                    {formatInlineText(trimmed)}
                  </p>
                );
              })}
            </div>

            {/* Direct Action Callout inside Blog */}
            <div className="mt-12 bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Want to list your shop on BizPrimeHub?</h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-md">
                  Join hundreds of verified Pakistani businesses. Create your free directory profile and start connecting with local customers today.
                </p>
              </div>
              <Link
                href="/add-business"
                className="shrink-0 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md"
              >
                List Your Business Free
              </Link>
            </div>
          </article>

          {/* Related Articles Section */}
          {relatedPosts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={20} /> Related Guides & Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 block">
                        {related.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {related.title}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                        {related.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs font-medium text-slate-400">
                      <span>{related.readTime}</span>
                      <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Read Guide <ChevronRight size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
