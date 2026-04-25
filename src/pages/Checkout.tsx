import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Navigation, CreditCard, ChevronRight } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';

export default function Checkout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [address, setAddress] = useState(profile?.address || '');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  useEffect(() => {
    if (placedOrderId) return; // Don't redirect if we just placed an order
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) navigate('/shop');
    setCartItems(cart);
    if (profile?.address && !address) setAddress(profile.address);
  }, [navigate, profile, address, placedOrderId]);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const getMyLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert("Could not get location. Please allow location access or enter address manually.");
      }
    );
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login?redirect=checkout');
      return;
    }
    if (!address.trim()) {
      alert("Please provide a delivery address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Deduct stock for each item
      for (const item of cartItems) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock || 0;
          if (currentStock < item.quantity) {
            alert(`Sorry, ${item.name} is now out of stock or does not have enough units.`);
            setIsSubmitting(false);
            return;
          }
          await updateDoc(productRef, {
            stock: currentStock - item.quantity
          });
        }
      }

      const orderData = {
        userId: user.uid,
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color || null
        })),
        totalAmount: total,
        status: 'pending',
        paymentStatus: 'unpaid',
        shippingAddress: address,
        location: location || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      localStorage.removeItem('cart');
      setPlacedOrderId(docRef.id);
      // We stay on this page to show Choice of payment
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders/products');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizePayment = async (method: string) => {
    if (!placedOrderId) return;
    try {
      await updateDoc(doc(db, 'orders', placedOrderId), {
        paymentMethod: method,
        updatedAt: new Date().toISOString()
      });
      setSelectedMethod(method);
      if (method === 'UPI') {
        navigate(`/chatbot?orderId=${placedOrderId}&confirm=payment`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (placedOrderId) {
    return (
      <div className="max-w-7xl mx-auto px-10 py-20 min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="mb-20">
            <div className="editorial-uppercase mb-4 text-xs opacity-40">System Update // Order ID: #{placedOrderId.slice(-6)}</div>
            <h1 className="text-8xl font-serif italic tracking-tighter uppercase leading-none mb-10">Confirmed</h1>
            <p className="text-sm editorial-uppercase tracking-widest opacity-60 max-w-md mx-auto">Your archive request has been logged. please select a validation method to complete the transaction.</p>
          </div>

          {!selectedMethod ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
              <button 
                onClick={() => finalizePayment('UPI')}
                className="group p-10 border border-editorial-text hover:bg-editorial-text hover:text-editorial-bg transition-all flex flex-col items-center gap-6"
              >
                <div className="w-16 h-16 border border-current flex items-center justify-center">
                  <CreditCard size={32} strokeWidth={1} />
                </div>
                <div className="text-center">
                  <div className="font-serif italic text-2xl mb-1">UPI Transfer</div>
                  <div className="editorial-uppercase text-[9px] opacity-40 group-hover:opacity-100">Secure Digital Vault</div>
                </div>
              </button>

              <button 
                onClick={() => finalizePayment('COD')}
                className="group p-10 border border-editorial-text hover:bg-editorial-text hover:text-editorial-bg transition-all flex flex-col items-center gap-6"
              >
                <div className="w-16 h-16 border border-current flex items-center justify-center">
                  <span className="text-2xl font-black">₹</span>
                </div>
                <div className="text-center">
                  <div className="font-serif italic text-2xl mb-1">Cash on Delivery</div>
                  <div className="editorial-uppercase text-[9px] opacity-40 group-hover:opacity-100">Physical Registry Settlement</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="bg-editorial-muted p-10 border border-editorial-text mb-20">
               <div className="editorial-uppercase text-[10px] mb-6 font-black">Method: {selectedMethod} // Activated</div>
               {selectedMethod === 'COD' && (
                 <p className="font-medium text-sm leading-relaxed mb-8">Our concierge will settle the balance of {formatPrice(total)} upon delivery to {address}.</p>
               )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => navigate(`/chatbot?orderId=${placedOrderId}&intent=order_placed`)}
              className="px-12 py-6 bg-black text-white editorial-uppercase text-[11px] font-black tracking-widest hover:bg-editorial-bg hover:text-black border border-black transition-all flex items-center justify-center gap-3"
            >
              Consult StyleChat
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="px-12 py-6 bg-transparent text-black editorial-uppercase text-[11px] font-black tracking-widest hover:bg-black hover:text-white border border-black transition-all"
            >
              View Order Registry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-10 py-20 min-h-screen">
      <div className="mb-20 border-b border-editorial-text pb-10">
        <div className="editorial-uppercase mb-2">Checkout // Validation</div>
        <h1 className="text-8xl font-serif italic tracking-tighter uppercase leading-none">Process</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-12">
          <div className="bg-editorial-muted p-10 border border-editorial-text">
            <h2 className="editorial-uppercase mb-8 flex items-center gap-3">
              <MapPin size={16} strokeWidth={1.5} />
              Delivery Details
            </h2>
            
            <div className="space-y-8">
              <div className="group">
                <button 
                  onClick={getMyLocation}
                  disabled={isLocating}
                  className={`w-full py-6 flex items-center justify-center gap-3 border transition-all ${location ? 'bg-editorial-text text-editorial-bg border-editorial-text' : 'bg-transparent border-editorial-text/20 hover:border-editorial-text'}`}
                >
                  <Navigation size={16} className={isLocating ? 'animate-spin' : ''} />
                  <span className="editorial-uppercase">
                    {isLocating ? 'Locating Identity...' : location ? 'Location Pinned' : 'Use Current Location'}
                  </span>
                </button>

                {location && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 border border-editorial-text grayscale overflow-hidden aspect-video relative"
                  >
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                      className="grayscale contrast-125 brightness-90"
                    />
                    <div className="absolute top-4 left-4 bg-editorial-text text-editorial-bg text-[8px] editorial-uppercase px-2 py-1 flex items-center gap-2">
                       <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                       Live Coordinates Tracked
                    </div>
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank')}
                      className="absolute bottom-4 right-4 bg-editorial-text text-editorial-bg text-[8px] editorial-uppercase px-3 py-1.5 hover:opacity-80 transition-all font-black flex items-center gap-2"
                    >
                      Maximize Map
                      <Navigation size={8} />
                    </button>
                  </motion.div>
                )}
              </div>

              {profile?.addresses?.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-editorial-text/5">
                  <label className="editorial-uppercase text-[10px] opacity-40">Registry Records</label>
                  <div className="grid grid-cols-1 gap-4">
                    {profile.addresses.map((addr: string, i: number) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setAddress(addr);
                          setLocation(null);
                        }}
                        className={`p-6 text-left border transition-all ${address === addr && !location ? 'bg-editorial-text text-editorial-bg border-editorial-text' : 'bg-white border-editorial-text/10 hover:border-editorial-text'}`}
                      >
                        <div className="editorial-uppercase text-[8px] mb-2 opacity-60">Identity Record {i+1}</div>
                        <div className="text-xs font-semibold leading-relaxed">{addr}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="editorial-uppercase opacity-40">Full Delivery Address</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, Building, City, State, Zip"
                  className="w-full p-6 bg-white border border-editorial-text outline-none min-h-[120px] transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="bg-editorial-muted p-10 border border-editorial-text">
            <h2 className="editorial-uppercase mb-8 flex items-center gap-3">
              <CreditCard size={16} strokeWidth={1.5} />
              Payment Method
            </h2>
            <div className="p-6 bg-editorial-text text-editorial-bg border border-editorial-text flex items-center justify-between">
              <div>
                <div className="editorial-uppercase">UPI / QR SCAN</div>
                <p className="text-[10px] opacity-60 italic mt-1 font-serif">Verified & Secure via Style Concierge</p>
              </div>
              <div className="w-12 h-12 border border-editorial-bg/40 flex items-center justify-center">
                <CreditCard size={20} strokeWidth={1} />
              </div>
            </div>
            <p className="mt-6 text-[9px] uppercase font-bold tracking-widest opacity-40 italic">
              * Payment validation occurs post-placement via Concierge scan.
            </p>
          </div>
        </div>

        <div>
          <div className="bg-editorial-text text-editorial-bg p-10 sticky top-24 border border-editorial-text shadow-2xl">
            <h3 className="editorial-uppercase mb-10 border-b border-editorial-bg/20 pb-4">Bag Summary</h3>
            <div className="space-y-4 mb-10 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide border-b border-editorial-bg/20 pb-10">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-4 border-b border-editorial-bg/5 last:border-0">
                  <div>
                    <div className="font-serif italic text-lg leading-tight">{item.name}</div>
                    <div className="editorial-uppercase text-[8px] opacity-40 mt-1">
                      {item.size} {item.color && `/ ${item.color}`} x {item.quantity}
                    </div>
                  </div>
                  <div className="font-serif">{formatPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex justify-between text-[10px] editorial-uppercase opacity-60">
                <span>SUBTOTAL</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-[10px] editorial-uppercase opacity-60">
                <span>SHIPPING</span>
                <span className="underline underline-offset-4 font-bold">FREE</span>
              </div>
              <div className="flex justify-between items-end pt-8">
                <span className="editorial-uppercase">FINAL TOTAL</span>
                <span className="text-4xl font-serif italic">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-6 bg-editorial-bg text-editorial-text border border-editorial-bg font-serif italic text-2xl hover:opacity-90 disabled:opacity-20 transition-all"
              >
                {isSubmitting ? 'Processing...' : 'Place Order Now'}
              </button>
              <button 
                onClick={() => navigate('/chatbot?intent=cart_inquiry')}
                className="w-full py-4 border border-editorial-bg/20 text-editorial-bg editorial-uppercase text-[10px] font-black hover:bg-editorial-bg hover:text-editorial-text transition-all tracking-widest"
              >
                Inquire with Concierge
              </button>
            </div>
            <div className="mt-6 text-center text-[8px] editorial-uppercase opacity-40">System Release Protocol Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
