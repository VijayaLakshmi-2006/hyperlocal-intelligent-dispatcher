// src/pages/Stores.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { shopService } from '../services/serviceFactory';
import StoreCard from '../components/StoreCard';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Grocery', 'Pharmacy', 'Electronics', 'Food'];
const SORT_OPTIONS = [
  { value: 'rating', label: '⭐ Rating' },
  { value: 'distance', label: '📍 Distance' },
  { value: 'eta', label: '⚡ Fastest' },
  { value: 'deliveryFee', label: '🚚 Delivery Fee' },
];
const PER_PAGE = 6;

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await shopService.getShops();
        setStores(res.data);
      } catch {
        toast.error('Failed to load stores');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Deterministic distance helper (same as StoreCard)
  const getDistance = (store) => {
    const seed = store._id ? store._id.charCodeAt(store._id.length - 1) : 0;
    return ((seed % 35) / 10 + 0.5);
  };

  const filtered = useMemo(() => {
    let result = [...stores];

    // Filter by category
    if (category !== 'All') {
      result = result.filter(s => s.category === category);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.shopName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.products?.some(p => p.name.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 4) - (a.rating || 4);
      if (sortBy === 'distance') return getDistance(a) - getDistance(b);
      if (sortBy === 'eta') return getDistance(a) - getDistance(b);
      if (sortBy === 'deliveryFee') return (a.deliveryFee || 0) - (b.deliveryFee || 0);
      return 0;
    });

    return result;
  }, [stores, search, category, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, category, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Stores Near You
            </h1>
            <p className="text-primary-200 text-lg mb-8">
              Explore {stores.length}+ local stores. Order in minutes, delivered to your door.
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search stores, products, categories..."
                id="store-search"
                className="w-full pl-12 pr-12 py-4 rounded-2xl text-gray-900 bg-white shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          {/* Category Pills */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                id={`filter-${cat.toLowerCase()}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  category === cat
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort + Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                id="store-sort"
                className="appearance-none bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <SlidersHorizontal size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">
            {loading ? 'Loading...' : (
              <>
                Showing <span className="font-bold text-gray-900">{paginated.length}</span> of{' '}
                <span className="font-bold text-gray-900">{filtered.length}</span> stores
                {category !== 'All' && <> in <span className="text-primary-600 font-bold">{category}</span></>}
              </>
            )}
          </p>
          {search && (
            <button
              onClick={() => { setSearch(''); setCategory('All'); }}
              className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[420px] rounded-3xl bg-white border border-gray-100 overflow-hidden">
                <div className="h-44 bg-gray-200 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 skeleton rounded" />
                  <div className="h-4 w-full bg-gray-100 skeleton rounded" />
                  <div className="h-12 w-full bg-gray-50 skeleton rounded-xl" />
                  <div className="h-12 w-full bg-gray-50 skeleton rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <motion.div
            key={`${category}-${sortBy}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {paginated.map((store, i) => (
              <motion.div
                key={store._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <StoreCard store={store} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or removing filters.</p>
            <button
              onClick={() => { setSearch(''); setCategory('All'); }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              id="prev-page"
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    p === page
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              id="next-page"
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
