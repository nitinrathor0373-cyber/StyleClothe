import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, addDoc, query, where, orderBy, updateDoc, arrayUnion, getDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RefreshCcw, Star, MessageCircle, Send, Camera, X } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import FileUpload from '../components/FileUpload';
import { MarketingDisplay } from '../components/MarketingDisplay';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewImages, setNewReviewImages] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProductAndReviews = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'products', id);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as any;
          setProduct(data);

          // Interest Tracking
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, {
              interests: arrayUnion(data.category)
            }).catch(err => console.error('Interest tracking error:', err));
          }

          if (!selectedSize && data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[0]);
          if (!selectedColor && data.colors && data.colors.length > 0) setSelectedColor(data.colors[0]);
          
          setQuantity(prev => {
            if (data.stock <= 0) return 0;
            return Math.max(1, Math.min(prev, data.stock));
          });
        }

        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('productId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err: any) {
        if (!err.message?.includes('Quota exceeded')) {
          handleFirestoreError(err, OperationType.GET, `products/${id}`);
        } else {
          console.warn('Product/Reviews quota exceeded.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [id, user]);

  const submitReview = async () => {
    if (!user || !newReviewText.trim()) return;
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: user.uid,
        userName: profile?.displayName || user.email?.split('@')[0],
        text: newReviewText,
        rating: newReviewRating,
        images: newReviewImages,
        createdAt: new Date().toISOString()
      });
      setNewReviewText('');
      setNewReviewImages([]);
      setNewReviewRating(5);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => 
      item.id === product.id && 
      item.size === selectedSize && 
      item.color === selectedColor
    );
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...product, quantity, size: selectedSize, color: selectedColor });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/cart');
  };

  if (!loading && !product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const sizes = product?.sizes && product.sizes.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = product?.colors || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="editorial-uppercase mb-10 hover:line-through">
        [ Back to Collection ]
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        <div className="space-y-6">
          <div className="aspect-[4/5] bg-editorial-muted border border-editorial-text overflow-hidden">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : product.images?.[activeImage] ? (
              <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center editorial-uppercase opacity-20">No Image</div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square" />)
            ) : product.images && product.images.length > 1 && product.images.map((img: string, i: number) => (
              <div 
                key={i} 
                onClick={() => setActiveImage(i)}
                className={cn(
                  "aspect-square bg-editorial-muted border overflow-hidden group cursor-pointer transition-all",
                  activeImage === i ? "border-editorial-text" : "border-transparent hover:border-gray-200"
                )}
              >
                {img ? (
                  <img src={img} alt="" className={cn(
                    "w-full h-full object-cover transition-all",
                    activeImage === i ? "grayscale-0" : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                  )} />
                ) : (
                  <div className="w-full h-full bg-editorial-bg" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="editorial-uppercase text-gray-400 mb-4">
            {loading ? <Skeleton className="h-4 w-32" /> : `Collection / ${product.category}`}
          </div>
          {loading ? (
            <div className="space-y-4 mb-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-2/3" />
            </div>
          ) : (
            <h1 className="text-6xl md:text-7xl font-serif italic mb-6 tracking-tighter leading-none">{product.name}</h1>
          )}
          
          <div className="flex items-center gap-6 mb-10">
            {loading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-3xl font-serif">{formatPrice(product.price)}</div>
                <div className="editorial-uppercase opacity-40">
                  In Stock: {product.stock} units
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div className="space-y-2 mb-12">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed opacity-70 mb-12 max-w-md">{product.description}</p>
          )}

          {loading ? (
            <div className="mb-8">
              <Skeleton className="h-4 w-32 mb-6" />
              <div className="flex gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-12 h-12 rounded-full" />)}
              </div>
            </div>
          ) : colors.length > 0 && (
            <div className="mb-8">
              <div className="editorial-uppercase mb-6">Select Palette // 01</div>
              <div className="flex flex-wrap gap-4">
                {colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "group flex flex-col items-center gap-2",
                      selectedColor === color ? "opacity-100" : "opacity-40"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full border border-editorial-text/20 p-1 transition-all",
                      selectedColor === color && "ring-2 ring-editorial-text ring-offset-2"
                    )}>
                      <div className="w-full h-full rounded-full bg-editorial-text flex items-center justify-center text-[10px] text-white">
                        {color[0]}
                      </div>
                    </div>
                    <span className="editorial-uppercase text-[8px] font-black">{color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="mb-12">
              <Skeleton className="h-4 w-32 mb-6" />
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="w-16 h-16" />)}
              </div>
            </div>
          ) : (
            <div className="mb-12">
              <div className="editorial-uppercase mb-6">Select Size // 02</div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "w-16 h-16 flex items-center justify-center text-xs font-bold transition-all border",
                      selectedSize === size 
                        ? "bg-editorial-text text-editorial-bg border-editorial-text" 
                        : "bg-transparent text-editorial-text border-editorial-text/20 hover:border-editorial-text"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <Skeleton className="h-16 w-full mb-16" />
          ) : (
            <div className="flex items-center gap-4 mb-16">
              <div className="flex items-center border border-editorial-text h-16 px-6 gap-8">
                <button 
                  onClick={() => setQuantity(Math.max(product.stock > 0 ? 1 : 0, quantity - 1))} 
                  className="text-xl"
                  disabled={quantity <= (product.stock > 0 ? 1 : 0)}
                >-</button>
                <span className="w-4 text-center font-bold text-sm tracking-widest">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} 
                  className="text-xl"
                  disabled={quantity >= product.stock}
                >+</button>
              </div>
              <button 
                disabled={!selectedSize || (colors.length > 0 && !selectedColor) || product.stock <= 0}
                onClick={addToCart}
                className="flex-grow h-16 bg-editorial-text text-editorial-bg editorial-uppercase hover:opacity-90 disabled:opacity-20 transition-all font-black text-xs tracking-widest"
              >
                {product.stock <= 0 ? 'Out of Stock' : 'Confirm / Add to Cart'}
              </button>
              <button 
                onClick={() => navigate('/chatbot', { state: { productId: product.id, productName: product.name } })}
                className="w-16 h-16 border border-editorial-text flex items-center justify-center hover:bg-editorial-text hover:text-editorial-bg transition-all"
                title="Purchase via Chat"
              >
                <MessageCircle size={20} strokeWidth={1} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 border-t border-editorial-text/20 pt-10 gap-8">
            <div className="flex items-start gap-4">
              <div className="editorial-uppercase">01/</div>
              <div>
                <div className="editorial-uppercase text-[9px] mb-1">Shipping</div>
                <div className="text-xs opacity-60">Express worldwide delivery via StyleClothes Direct.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="editorial-uppercase">02/</div>
              <div>
                <div className="editorial-uppercase text-[9px] mb-1">Returns</div>
                <div className="text-xs opacity-60">Complimentary 30-day exchange window for all members.</div>
              </div>
            </div>
          </div>
          
          <MarketingDisplay type="affiliate" />
          <MarketingDisplay type="influencer" />
        </div>
      </div>

      {/* Review System UI */}
      <section className="mt-40 pt-20 border-t border-editorial-text">
        <div className="flex flex-col md:flex-row gap-20">
          <div className="md:w-1/3">
            <h2 className="text-4xl font-serif italic mb-10">Archive Records</h2>
            {user ? (
              <div className="bg-editorial-muted p-8 border border-editorial-text space-y-6">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setNewReviewRating(star)}>
                      <Star size={16} fill={star <= newReviewRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="LOG YOUR EXPERIENCE_"
                  className="w-full bg-transparent border-b border-editorial-text p-4 text-[10px] editorial-uppercase min-h-32 outline-none focus:border-editorial-text"
                />
                <div className="space-y-4">
                  <div className="editorial-uppercase text-[8px] opacity-40">Proof of Material</div>
                  <div className="grid grid-cols-4 gap-2">
                    {newReviewImages.map((img, i) => (
                      <div key={i} className="relative aspect-square border border-editorial-text">
                        <img src={img} className="w-full h-full object-cover grayscale" />
                        <button onClick={() => setNewReviewImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-editorial-text text-editorial-bg p-1">
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                    {newReviewImages.length < 4 && (
                      <FileUpload 
                        onUpload={(url) => setNewReviewImages(prev => [...prev, url])}
                        hideLabel
                        className="!aspect-square !min-h-0 border-editorial-text/20"
                      />
                    )}
                  </div>
                </div>
                <button 
                  onClick={submitReview}
                  disabled={isSubmittingReview || !newReviewText.trim()}
                  className="w-full py-4 bg-editorial-text text-editorial-bg editorial-uppercase text-[10px] font-black disabled:opacity-20"
                >
                  {isSubmittingReview ? 'Transmitting...' : 'Post to Archive'}
                </button>
              </div>
            ) : (
              <div className="p-8 border border-editorial-text border-dashed text-center">
                <p className="editorial-uppercase text-[10px] opacity-40 mb-4">Identity verification required for archive access.</p>
                <button onClick={() => navigate('/login')} className="editorial-uppercase text-[10px] font-bold underline">Login</button>
              </div>
            )}
          </div>

          <div className="md:w-2/3 space-y-16">
            {reviews.length === 0 ? (
              <div className="py-20 border-y border-dashed border-editorial-text editorial-uppercase opacity-20 text-center text-xs">No records found.</div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="border-b border-editorial-text/10 pb-16 last:border-0">
                  <div className="flex justify-between mb-6">
                    <div className="editorial-uppercase text-[10px] font-black">{review.userName}</div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={1} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-serif italic mb-8">{review.text}</p>
                  <div className="grid grid-cols-4 gap-4">
                    {review.images?.map((img: string, i: number) => (
                      <img key={i} src={img} className="aspect-square object-cover border border-editorial-text grayscale" />
                    ))}
                  </div>
                  <div className="mt-8 editorial-uppercase text-[8px] opacity-40">{new Date(review.createdAt).toLocaleDateString()} // SEQ {review.id.slice(0,6)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
