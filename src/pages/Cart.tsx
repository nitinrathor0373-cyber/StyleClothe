import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard, ChevronRight } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  }, []);

  const updateQuantity = (idx: number, delta: number) => {
    const newCart = [...cartItems];
    newCart[idx].quantity = Math.max(1, newCart[idx].quantity + delta);
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = (idx: number) => {
    const newCart = cartItems.filter((_, i) => i !== idx);
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-black mb-2 uppercase">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Ready to start your style journey?</p>
        <Link to="/shop" className="bg-black text-white px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform">
          GO TO SHOP
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-10 py-20 min-h-screen">
      <div className="mb-20 border-b border-editorial-text pb-10">
        <div className="editorial-uppercase mb-2">Cart // Inventory</div>
        <h1 className="text-8xl font-serif italic tracking-tighter uppercase leading-none">Your Bag</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
        <div className="lg:col-span-2 border-t border-editorial-text">
          <AnimatePresence>
            {cartItems.map((item, idx) => (
              <motion.div 
                key={`${item.id}-${item.size}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col sm:flex-row gap-10 border-b border-editorial-text py-10"
              >
                <div className="w-full sm:w-48 aspect-[4/5] bg-editorial-muted border border-editorial-text overflow-hidden flex-shrink-0">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center editorial-uppercase opacity-20">No Image</div>
                  )}
                </div>
                
                <div className="flex-grow flex flex-col justify-between py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="editorial-uppercase text-gray-400 mb-1">{item.category} / SKU {item.id.slice(0,4)}</div>
                      <h3 className="text-3xl font-serif italic mb-4">{item.name}</h3>
                      <div className="flex flex-wrap gap-4">
                        <div className="editorial-uppercase px-3 py-1 border border-editorial-text/20">SIZE: {item.size}</div>
                        {item.color && (
                          <div className="editorial-uppercase px-3 py-1 border border-editorial-text/20">COLOR: {item.color}</div>
                        )}
                        <div className="editorial-uppercase px-3 py-1 border border-editorial-text/20">{formatPrice(item.price)} ea</div>
                      </div>
                    </div>
                    <button onClick={() => removeItem(idx)} className="editorial-uppercase hover:line-through opacity-40">
                      Remove
                    </button>
                  </div>

                  <div className="mt-10 flex items-center justify-between">
                    <div className="flex items-center gap-6 border border-editorial-text p-1">
                      <button onClick={() => updateQuantity(idx, -1)} className="w-10 h-10 flex items-center justify-center hover:bg-editorial-muted transition-colors">-</button>
                      <span className="editorial-uppercase">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, 1)} className="w-10 h-10 flex items-center justify-center hover:bg-editorial-muted transition-colors">+</button>
                    </div>
                    <div className="text-3xl font-serif">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-editorial-text text-editorial-bg p-10 sticky top-24 border border-editorial-text">
            <h3 className="editorial-uppercase mb-10 border-b border-editorial-bg/20 pb-4">Order Summary</h3>
            <div className="space-y-6 mb-10 text-sm">
              <div className="flex justify-between items-center opacity-60">
                <span>SUBTOTAL</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between items-center opacity-60">
                <span>DELIVERY</span>
                <span className="font-bold underline underline-offset-4">FREE</span>
              </div>
              <div className="pt-6 border-t border-editorial-bg/20 flex justify-between items-end">
                <span className="editorial-uppercase">TOTAL</span>
                <span className="text-4xl font-serif italic">{formatPrice(total)}</span>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col gap-4">
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full py-6 bg-editorial-bg text-editorial-text border border-editorial-bg font-serif italic text-2xl hover:opacity-90 transition-all"
              >
                Checkout Now
              </button>
              <button 
                onClick={() => navigate('/chatbot?intent=cart_inquiry')}
                className="w-full py-4 border border-editorial-bg/20 text-editorial-bg editorial-uppercase text-[10px] font-black hover:bg-editorial-bg hover:text-editorial-text transition-all tracking-widest"
              >
                Consult Concierge
              </button>
            </div>
            <div className="mt-6 text-center text-[8px] editorial-uppercase opacity-40">Verified Secure Connection</div>
          </div>
        </div>
      </div>
    </div>
  );
}
