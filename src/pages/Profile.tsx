import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, Package, CreditCard, ChevronRight, MapPin, Upload, CheckCircle, X } from 'lucide-react';
import { formatPrice, generateInvoicePDF } from '../lib/utils';
import { motion } from 'motion/react';
import FileUpload from '../components/FileUpload';

export default function Profile() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  
  const [showAddressAdd, setShowAddressAdd] = useState(false);
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Orders archive quota exceeded.');
        } else {
          handleFirestoreError(err, OperationType.LIST, 'orders');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  const addAddress = async () => {
    if (!newAddress.trim() || !user) return;
    try {
      const currentAddresses = profile?.addresses || [];
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: [...currentAddresses, newAddress.trim()],
        updatedAt: new Date().toISOString()
      });
      setNewAddress('');
      setShowAddressAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const removeAddress = async (index: number) => {
    if (!user || !profile?.addresses) return;
    try {
      const newAddresses = profile.addresses.filter((_: any, i: number) => i !== index);
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: newAddresses,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleLogout = () => signOut(auth);

  const submitProof = async (orderId: string) => {
    if (!proofUrl) return;
    setSubmittingProof(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentProofUrl: proofUrl,
        paymentStatus: 'pending_verification',
        updatedAt: new Date().toISOString()
      });
      alert("Payment proof submitted! Admin will verify soon.");
      setSelectedOrder(null);
      // Refresh list
      const q = query(collection(db, 'orders'), where('userId', '==', user?.uid));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleDownloadInvoice = (order: any) => {
    const pdf = generateInvoicePDF(order, profile);
    pdf.save(`Invoice_StyleClothes_${order.id.slice(0, 8)}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-10 py-24 min-h-screen">
      <div className="flex flex-col md:flex-row gap-24">
        <div className="md:w-1/3">
          <div className="bg-editorial-text text-editorial-bg p-12 border border-editorial-text shadow-2xl">
            <div className="w-20 h-20 border border-editorial-bg/40 flex items-center justify-center text-4xl font-serif italic mb-8">
              {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <h2 className="text-3xl font-serif italic mb-2 leading-none">{profile?.displayName || 'Style Member'}</h2>
            <p className="editorial-uppercase opacity-40 mb-10 text-[9px]">{user?.email}</p>
            
            <div className="space-y-6 mb-16 border-t border-editorial-bg/10 pt-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <MapPin size={16} strokeWidth={1} />
                    <span className="editorial-uppercase text-[10px] opacity-40">Registry Addresses</span>
                  </div>
                  <button 
                    onClick={() => setShowAddressAdd(!showAddressAdd)}
                    className="editorial-uppercase text-[9px] hover:underline"
                  >
                    {showAddressAdd ? 'Cancel' : 'Add New'}
                  </button>
                </div>

                {showAddressAdd && (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Enter identity address..."
                      className="flex-grow bg-white/10 border border-editorial-bg/20 px-4 py-2 text-[10px] outline-none focus:border-editorial-bg"
                    />
                    <button 
                      onClick={addAddress}
                      className="bg-editorial-bg text-editorial-text px-4 py-2 text-[10px] font-black"
                    >
                      SAVE
                    </button>
                  </div>
                )}

                <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {profile?.addresses?.length > 0 ? (
                    profile.addresses.map((addr: string, idx: number) => (
                      <div key={idx} className="flex items-start justify-between group gap-4">
                        <span className="text-[11px] leading-relaxed opacity-80">{addr}</span>
                        <button 
                          onClick={() => removeAddress(idx)}
                          className="opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] leading-relaxed opacity-80">{profile?.address || 'Location profile pending set-up.'}</span>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full py-5 border border-red-900/40 text-red-500 editorial-uppercase hover:bg-red-500 hover:text-white transition-all"
            >
              End Session / Logout
            </button>
          </div>
        </div>

        <div className="md:w-2/3">
          <div className="flex items-end justify-between mb-16 border-b border-editorial-text pb-6">
            <h2 className="text-6xl font-serif italic tracking-tighter leading-none">Your Archives</h2>
            <div className="editorial-uppercase opacity-40 text-[9px]">{orders.length} Records found</div>
          </div>

          <div className="space-y-12">
            {loading ? (
              <div className="editorial-uppercase opacity-40 p-20 text-center animate-pulse tracking-widest">Querying Records...</div>
            ) : orders.length === 0 ? (
              <div className="p-20 bg-editorial-muted border border-editorial-text text-center">
                <Package size={48} strokeWidth={1} className="mx-auto opacity-20 mb-6" />
                <h3 className="font-serif italic text-2xl mb-4">No archives yet</h3>
                <Link to="/shop" className="editorial-uppercase underline underline-offset-4 hover:opacity-60">Begin Collection</Link>
              </div>
            ) : (
              orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                <div key={order.id} className="group border-b border-editorial-text pb-12 last:border-0">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-10">
                    <div>
                      <div className="editorial-uppercase text-gray-400 mb-2">Order SKU // {order.id.slice(0,8)}</div>
                      <div className="text-3xl font-serif italic leading-none">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <span className="editorial-uppercase px-4 py-1.5 border border-editorial-text/20">
                        Logistics: {order.status}
                      </span>
                      <span className="editorial-uppercase px-4 py-1.5 border border-editorial-text bg-editorial-text text-editorial-bg">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mb-10 space-y-3 font-sans text-xs tracking-wide opacity-70">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between uppercase">
                        <span>{item.name} ({item.size}) {item.color && `/ ${item.color}`} x {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    
                    {order.location && (
                      <div className="mt-4 pt-4 border-t border-editorial-text/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 opacity-60">
                          <MapPin size={12} />
                          <span className="editorial-uppercase text-[10px]">Pinned Coordinates // {order.location.lat.toFixed(4)}, {order.location.lng.toFixed(4)}</span>
                        </div>
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`, '_blank')}
                          className="editorial-uppercase text-[9px] underline underline-offset-4 hover:opacity-100 transition-opacity"
                        >
                          View Mapping
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-end justify-between gap-6">
                    <div className="text-4xl font-serif italic">{formatPrice(order.totalAmount)}</div>
                    <div className="flex gap-4 w-full sm:w-auto">
                      {order.paymentStatus === 'paid' && (
                        <button 
                          onClick={() => handleDownloadInvoice(order)}
                          className="flex-grow sm:flex-none border border-editorial-text editorial-uppercase px-8 h-14 hover:bg-editorial-text hover:text-editorial-bg transition-all"
                        >
                          Print Invoice
                        </button>
                      )}
                      {order.paymentStatus === 'unpaid' && (
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="flex-grow sm:flex-none bg-editorial-text text-editorial-bg border border-editorial-text editorial-uppercase px-10 h-14 hover:opacity-90 transition-all font-black"
                        >
                          Payment Scan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Submit Payment</h3>
            <p className="text-gray-500 mb-8 text-sm">Please upload a screenshot or enter the transaction URL of your payment.</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Transaction Proof (Screenshot/File)</label>
                <FileUpload 
                  onUpload={setProofUrl}
                  label="Upload Proof"
                  accept="image/*,.pdf"
                  className="rounded-[32px] bg-gray-50"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="flex-grow py-4 bg-gray-100 rounded-2xl font-bold text-sm"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => submitProof(selectedOrder.id)}
                  disabled={submittingProof || !proofUrl}
                  className="flex-grow py-4 bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50"
                >
                  {submittingProof ? 'SUBMITTING...' : 'SUBMIT PROOF'}
                  <Upload size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
