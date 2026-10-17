'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, BLOG_CATEGORIES } from '@/data/blogPosts';
import { Search, Calendar, Clock, ArrowRight, Tag, BookOpen } from 'lucide-react';

interface BlogClientProps {
  initialPosts: BlogPost[];
}

export default function BlogClient({ initialPosts }: BlogClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Filter and sort posts based on search query, category, and date (newest first)
  const filteredPosts = useMemo(() => {
    return initialPosts
      .filter((post) => {
        const matchesSearch =
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'All' || post.category.toLowerCase() === selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [initialPosts, searchQuery, selectedCategory]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * postsPerPage;
    return filteredPosts.slice(start, start + postsPerPage);
  }, [filteredPosts, currentPage, postsPerPage]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        
        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search business tips & guides..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => handleCategoryClick('All')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Topics ({initialPosts.length})
              </button>
              {BLOG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
              <BookOpen size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No articles found</h3>
            <p className="text-slate-500 text-sm mb-6">
              Try adjusting your search terms or selecting a different topic category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map((post) => (
                <article
                  key={post.slug}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
                >
                  {/* Cover Image */}
                  <Link href={`/blog/${post.slug}`} className="block relative h-52 overflow-hidden bg-slate-100">
                    <img
                      src={post.coverImage}
                      alt={post.coverImageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-blue-700 shadow-sm backdrop-blur-sm">
                        <Tag size={11} /> {post.category}
                      </span>
                    </div>
                  </Link>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta bar */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} /> {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} /> {post.readTime}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>

                      {/* Excerpt */}
                      <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Author & Read More */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-8 h-8 rounded-full border border-slate-200"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{post.author.name}</div>
                          <div className="text-[11px] text-slate-400">{post.author.role}</div>
                        </div>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform"
                      >
                        Read <ArrowRight size={13} />
                      </Link>
                    </div>

                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1 px-3 text-xs font-semibold text-slate-500">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
