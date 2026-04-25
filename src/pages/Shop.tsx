import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ShoppingBag, Star, Filter, Heart, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import { MarketingDisplay } from '../components/MarketingDisplay';

export default function Shop() {
  const { category } = useParams();
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [showFilters, setShowFilters] = useState(false);

  const interests = profile?.interests || [];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef); // Fetch all and filter locally for case-insensitivity
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as any));
        setProducts(data);
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Product archive quota exceeded.');
          // You could set an error state here to show a nice message
        } else {
          console.error("Firestore error in Shop:", err);
          try {
            handleFirestoreError(err, OperationType.LIST, 'products');
          } catch (e) {
            console.error(e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const colors = Array.from(new Set(products.map(p => p.color).filter(Boolean))) as string[];
  const categories = Array.from(new Set(products.map(p => p.category?.toLowerCase()).filter(Boolean))) as string[];

  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // URL Category Filter
    const matchesUrlCategory = !category || p.category?.toLowerCase() === category.toLowerCase();
    
    // Filter Matrix Category
    const matchesSelectedCategory = !selectedCategory || p.category?.toLowerCase() === selectedCategory.toLowerCase();

    // Color Filter
    const matchesColor = !selectedColor || p.color?.toLowerCase() === selectedColor.toLowerCase();

    // Price Filter
    const matchesPrice = (p.price || 0) <= maxPrice;
    
    return matchesSearch && matchesUrlCategory && matchesSelectedCategory && matchesColor && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
    // newest
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedColor(null);
    setSelectedCategory(null);
    setSortBy('newest');
    setMaxPrice(15000);
  };

  // Separate products into recommended and others
  const recommendedProducts = filteredProducts.filter(p => 
    interests.some(interest => interest.toLowerCase() === p.category?.toLowerCase())
  );
  const otherProducts = filteredProducts.filter(p => 
    !interests.some(interest => interest.toLowerCase() === p.category?.toLowerCase())
  );

  return (
    <div id="shop-main-container" className="max-w-7xl mx-auto px-10 py-20 min-h-screen">
      <MarketingDisplay type="search" />
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10 border-b border-editorial-text pb-10">
        <div>
          <div className="editorial-uppercase mb-2">Collection // {category || 'All'}</div>
          <h1 className="text-8xl font-serif italic tracking-tighter leading-none uppercase">
            {category || 'Shop'}
          </h1>
        </div>
        <div className="flex flex-col gap-4 items-end">
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 editorial-uppercase text-[10px] font-black tracking-widest border border-editorial-text px-4 py-2 hover:bg-black hover:text-white transition-all",
                (selectedColor || maxPrice < 15000 || showFilters) && "bg-black text-white"
              )}
            >
              <SlidersHorizontal size={12} />
              {showFilters ? 'Hide Parameters' : 'Edit Parameters'}
            </button>
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder="SEARCH ARCHIVES_" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-b border-editorial-text p-2 editorial-uppercase text-[10px] outline-none focus:placeholder-transparent transition-all placeholder:text-editorial-text placeholder:opacity-30"
              />
            </div>
          </div>
          <div className="editorial-uppercase opacity-40 text-[10px]">
            {loading ? <Skeleton className="h-4 w-32" /> : `Displaying ${filteredProducts.length} of ${products.length} entries`}
          </div>
        </div>
      </div>

      {/* Filter Matrix */}
      <motion.div 
        initial={false}
        animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
        className="overflow-hidden mb-20 border-b border-editorial-text"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 py-10">
          {!category && (
            <div>
              <div className="editorial-uppercase text-[9px] font-black opacity-40 mb-6">Archive // Section</div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "editorial-uppercase text-[10px] px-3 py-1 border transition-all",
                    selectedCategory === null ? "bg-black text-white border-black" : "border-gray-200 opacity-40 hover:opacity-100"
                  )}
                >
                  All Depts
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "editorial-uppercase text-[10px] px-3 py-1 border transition-all",
                      selectedCategory === cat ? "bg-black text-white border-black" : "border-gray-200 opacity-40 hover:opacity-100"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="editorial-uppercase text-[9px] font-black opacity-40 mb-6">Chroma // Registry</div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setSelectedColor(null)}
                className={cn(
                  "editorial-uppercase text-[10px] px-3 py-1 border transition-all",
                  selectedColor === null ? "bg-black text-white border-black" : "border-gray-200 opacity-40 hover:opacity-100"
                )}
              >
                All Hues
              </button>
              {colors.map(color => (
                <button 
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "editorial-uppercase text-[10px] px-3 py-1 border transition-all",
                    selectedColor === color ? "bg-black text-white border-black" : "border-gray-200 opacity-40 hover:opacity-100"
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="editorial-uppercase text-[9px] font-black opacity-40 mb-6">Order // Sequence</div>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'newest', label: 'Archival Date' },
                { id: 'price-asc', label: 'Value: Low' },
                { id: 'price-desc', label: 'Value: High' }
              ].map(sort => (
                <button 
                  key={sort.id}
                  onClick={() => setSortBy(sort.id as any)}
                  className={cn(
                    "editorial-uppercase text-[10px] px-3 py-1 border transition-all",
                    sortBy === sort.id ? "bg-black text-white border-black" : "border-gray-200 opacity-40 hover:opacity-100"
                  )}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <div className="editorial-uppercase text-[9px] font-black opacity-40 mb-6">Valuation // Upper Bound</div>
            <div className="space-y-4">
              <input 
                type="range" 
                min="0" 
                max="15000" 
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-black grayscale appearance-none h-[1px] bg-editorial-text"
              />
              <div className="flex justify-between editorial-uppercase text-[10px] opacity-60">
                <span>0</span>
                <span className="font-black text-black">Under {formatPrice(maxPrice)}</span>
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  onClick={resetFilters}
                  className="editorial-uppercase text-[10px] underline underline-offset-8 decoration-1 opacity-40 hover:opacity-100 transition-opacity"
                >
                  Reset Parameters
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 border-l border-t border-editorial-text">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-10 border-r border-b border-editorial-text">
              <Skeleton className="aspect-[4/5] mb-6 border border-editorial-text" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-editorial-text/10">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-40">
          {products.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-editorial-text/20">
              <div className="editorial-uppercase opacity-30 text-xs mb-4">Archives // Status: Empty</div>
              <h2 className="text-4xl font-serif italic opacity-20">The database contains no item records.</h2>
              <div className="mt-12 flex flex-col items-center gap-6">
                <p className="text-[10px] editorial-uppercase opacity-40 max-w-sm mx-auto">Please initialize the archives via the admin dashboard or ensure connectivity to the Firestore instance.</p>
                <Link to="/admin" className="px-8 py-3 bg-black text-white editorial-uppercase text-[10px] font-black tracking-widest">
                  Admin System
                </Link>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-editorial-text/20">
              <div className="editorial-uppercase opacity-30 text-xs mb-4">Search // Result: Null</div>
              <h2 className="text-4xl font-serif italic opacity-20">No matches found for "{searchQuery}".</h2>
              <button 
                onClick={resetFilters}
                className="mt-8 editorial-uppercase underline underline-offset-8 text-[10px] hover:opacity-60"
              >
                Reset Archive Filters
              </button>
            </div>
          ) : (
            <div className="space-y-40">
              {/* Category-wise Display when in main shop view (no specific category or search) */}
              {!category && !searchQuery ? (
                <>
                  {['men', 'women', 'children'].map((cat) => {
                    const catProducts = filteredProducts.filter(p => p.category?.toLowerCase() === cat);
                    if (catProducts.length === 0) return null;
                    return (
                      <section key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-10 pb-4 border-b border-editorial-text/10">
                          <div className="editorial-uppercase text-[10px] font-black tracking-widest">{cat} Archives // Collection Edit</div>
                          <Link to={`/shop/${cat}`} className="editorial-uppercase text-[9px] underline opacity-40 hover:opacity-100 transition-opacity">View All {cat}</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-l border-t border-editorial-text">
                          {catProducts.slice(0, 4).map((product) => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  
                  {/* Any other categories */}
                  {Array.from(new Set(filteredProducts.map(p => p.category?.toLowerCase() || 'unassigned')))
                    .filter(cat => cat && !['men', 'women', 'children'].includes(cat))
                    .map(cat => {
                      const catProducts = filteredProducts.filter(p => (p.category?.toLowerCase() || 'unassigned') === cat);
                      return (
                        <section key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                          <div className="flex items-center justify-between mb-10 pb-4 border-b border-editorial-text/10">
                            <div className="editorial-uppercase text-[10px] font-black tracking-widest">{cat} // Miscellaneous</div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-l border-t border-editorial-text">
                            {catProducts.map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        </section>
                      );
                    })
                  }
                </>
              ) : (
                <>
                  {/* Specific Listing mode (Category Archives or Search Results) */}
                  {recommendedProducts.length > 0 && !category && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-4 mb-10 editorial-uppercase text-[10px] font-black">
                        <Heart size={12} fill="currentColor" />
                        <span>Curated for Your Aesthetic // Analysis Match</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-editorial-text">
                        {recommendedProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </section>
                  )}
                  
                  <MarketingDisplay type="display" />

                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="editorial-uppercase text-[10px] font-black mb-10 opacity-40">
                      {category ? `Category Archive // ${category}` : 'General Archives // Full Collection'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-l border-t border-editorial-text">
                      {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          <MarketingDisplay type="native" />
          <MarketingDisplay type="social" />
        </div>
      )}
    </div>
  );
}

const ProductCard = ({ product }: { product: any }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    className="group p-10 border-r border-b border-editorial-text flex flex-col justify-between hover:bg-editorial-muted transition-colors"
  >
    <Link to={`/product/${product.id}`} className="block mb-8 relative overflow-hidden aspect-[4/5] bg-editorial-muted border border-editorial-text">
      {product.images?.[0] ? (
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
        />
      ) : (
        <img 
          src="https://via.placeholder.com/400x500?text=No+Image" 
          alt="No Image Available" 
          className="w-full h-full object-cover grayscale"
        />
      )}
      {product.stock <= 0 && (
        <div className="absolute inset-0 bg-editorial-bg/80 flex items-center justify-center p-4">
          <span className="editorial-uppercase text-red-600 border border-red-600 px-4 py-2">Out of Stock</span>
        </div>
      )}
    </Link>
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="editorial-uppercase text-gray-400 mb-1">{product.category} / SKU {product.id.slice(0,4)}</div>
          <h3 className="text-2xl font-serif italic leading-tight">{product.name}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-6 border-t border-editorial-text/10">
        <span className="font-serif italic text-xl">{formatPrice(product.price)}</span>
        <Link to={`/product/${product.id}`} className="editorial-uppercase hover:line-through">Details</Link>
      </div>
    </div>
  </motion.div>
);
