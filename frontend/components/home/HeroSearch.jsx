'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe } from 'lucide-react';
import SearchableCombobox from '@/components/ui/SearchableCombobox';
import { COUNTRIES, getCities } from '@/data/locations';

export default function HeroSearch({ categories = [] }) {
  const router = useRouter();
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');

  const cityOptions = country ? getCities(country) : [];

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    setCity(''); // Reset dependent city when country changes
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (country && country !== 'All') params.set('country', country);
    if (city && city !== 'All') params.set('city', city);
    if (category && category !== 'All') params.set('category', category);

    const qs = params.toString();
    router.push(qs ? `/businesses?${qs}` : '/businesses');
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <h2 className="text-xl font-bold text-gray-900 mb-5 text-center sm:text-left">
        Search Local Businesses
      </h2>
      <form
        onSubmit={handleSearch}
        className="w-full flex flex-col md:flex-row gap-3 items-stretch md:items-center"
        aria-label="Business search form"
      >
        {/* Keyword Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white text-gray-900 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
            aria-label="Search by business name or keyword"
          />
        </div>

        {/* Country Dropdown */}
        <div className="w-full md:w-44 relative">
          <Globe
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
          />
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white text-gray-900 pl-9 pr-8 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none cursor-pointer appearance-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
            }}
            aria-label="Select Country"
          >
            <option value="">All Countries</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Dependent Searchable City Combobox */}
        <div className="w-full md:w-52">
          <SearchableCombobox
            value={city}
            onChange={setCity}
            options={cityOptions}
            disabled={!country}
            placeholder="Search City..."
            disabledPlaceholder="Select country first"
            ariaLabel="Search City"
            emptyMessage="No city found"
          />
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-48 relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white text-gray-900 px-4 pr-8 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none cursor-pointer appearance-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
            }}
            aria-label="Filter by Category"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => {
              const name = typeof cat === 'string' ? cat : cat.name;
              return (
                <option key={name} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Search Submit Button */}
        <button
          type="submit"
          className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-md md:w-32 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search size={16} />
          Search
        </button>
      </form>

      <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginTop: '1rem', textAlign: 'center' }}>
        Popular searches: IT in Karachi · Restaurants in Dubai · Real Estate in New York
      </p>
    </div>
  );
}
