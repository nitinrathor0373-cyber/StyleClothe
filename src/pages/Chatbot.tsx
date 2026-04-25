import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User as UserIcon, Bot, Package, CreditCard, ChevronRight, FileText } from 'lucide-react';
import { getChatResponse } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn, formatPrice } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import FileUpload from '../components/FileUpload';

import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, getDoc, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface Message {
  id: string;
  role: 'user' | 'model' | 'admin';
  text: string;
  timestamp: string;
  type?: 'payment' | 'order_info' | 'product_recommendation' | 'receipt' | 'product_details';
  orderId?: string;
  productId?: string;
  productIds?: string[];
  fileUrl?: string;
  fileType?: string;
}

const ProductDetails = ({ productId, onCheckout }: { productId: string, onCheckout: () => void }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, 'products', productId));
      if (snap.exists()) {
        setProduct({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  if (loading) return <div className="h-20 w-full animate-pulse bg-editorial-bg/5 border border-editorial-bg/10 mt-4" />;
  if (!product) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-6 border border-editorial-bg/30 bg-editorial-bg/5 p-6"
    >
      <div className="flex gap-6 mb-6">
        <img src={product.images?.[0]} className="w-24 h-24 object-cover grayscale" alt="" />
        <div className="flex-grow">
          <div className="editorial-uppercase text-[8px] opacity-40 font-black mb-1">{product.category}</div>
          <div className="font-serif italic text-2xl tracking-tight leading-tight mb-2">{product.name}</div>
          <div className="font-serif text-lg">{formatPrice(product.price)}</div>
        </div>
      </div>
      <p className="text-[10px] leading-relaxed opacity-60 mb-6">{product.description}</p>
      <button 
        onClick={onCheckout}
        className="w-full py-4 bg-editorial-bg text-editorial-text editorial-uppercase text-[10px] font-black hover:opacity-80 transition-all flex items-center justify-center gap-2"
      >
        Proceed to Checkout
        <ChevronRight size={10} />
      </button>
    </motion.div>
  );
};

const PaymentPortal = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        setOrder(snap.data());
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="h-40 w-full animate-pulse bg-white/5 border border-white/10 mt-4 rounded-xl" />;
  if (!order) return null;

  const upiUrl = `upi://pay?pa=vipin721764@oksbi&pn=VIPIN+Rathore&am=${order.totalAmount}&cu=INR&mode=02&purpose=00`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-8 bg-white text-black border-editorial flex flex-col items-center text-center shadow-2xl relative overflow-hidden group rounded-2xl"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      <div className="mb-8 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm group-hover:shadow-md transition-shadow">
        <QRCodeSVG value={upiUrl} size={220} includeMargin={true} level="H" />
      </div>
      
      <div className="editorial-uppercase mb-3 text-[10px] font-black tracking-[0.3em] text-gray-400">SECURE UPI GATEWAY // ARCHIVE SETTLEMENT</div>
      
      <div className="flex flex-col items-center gap-1 mb-8">
        <div className="font-serif italic text-2xl text-black">VIPIN Rathore</div>
        <div className="text-[10px] opacity-40 font-bold">MERCHANT ID: vipin721764@oksbi</div>
      </div>

      <div className="w-full bg-gray-50 border border-gray-100 p-6 rounded-2xl mb-8">
        <div className="flex justify-between items-center mb-2">
           <span className="editorial-uppercase text-[9px] opacity-40">Request Amount</span>
           <span className="font-serif italic text-2xl">{formatPrice(order.totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center">
           <span className="editorial-uppercase text-[9px] opacity-40">Record Reference</span>
           <span className="font-mono text-[10px] bg-white px-2 py-1 border border-gray-100 rounded">ORD-{orderId.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      <div className="font-mono text-xs bg-black text-white px-8 py-4 mb-8 select-all cursor-pointer hover:bg-gray-900 transition-colors rounded-xl flex items-center gap-3 w-full justify-center group/copy">
         <CreditCard size={14} className="group-hover/copy:scale-110 transition-transform" />
         vipin721764@oksbi
      </div>

      <div className="text-[10px] text-gray-400 mb-8 leading-relaxed max-w-[240px] italic">
        GUIDE: Scan with any UPI application (GPay, PhonePe, Paytm). The amount ₹{order.totalAmount} is pre-configured. Once complete, upload your settlement proof below.
      </div>

      <button 
        onClick={() => navigate('/profile')}
        className="w-full py-5 bg-black text-white editorial-uppercase text-[11px] font-black tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all flex items-center justify-center gap-3 rounded-xl"
      >
        Submit Settlement Proof
        <ChevronRight size={14} />
      </button>
    </motion.div>
  );
};

const OrderReceipt = ({ orderId, onAction }: { orderId: string, onAction: (action: 'pay' | 'track' | 'help' | 'buy_new') => void }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        setOrder(snap.data());
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="h-20 w-full animate-pulse bg-editorial-bg/5 border border-editorial-bg/10 mt-4" />;
  if (!order) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-6 border border-editorial-bg/30 bg-editorial-bg/5 p-6"
    >
      <div className="flex justify-between items-start mb-6 border-b border-editorial-bg/10 pb-4">
        <div>
          <div className="editorial-uppercase text-[8px] opacity-40 font-black mb-1">Receipt // Record</div>
          <div className="font-serif italic text-xl tracking-tight leading-none">Order #{orderId.slice(-6)}</div>
        </div>
        <div className={cn(
          "editorial-uppercase text-[8px] px-2 py-1 border font-black",
          order.status === 'pending' ? "border-editorial-bg/20 opacity-40" : "bg-editorial-bg text-editorial-text border-editorial-bg"
        )}>
          {order.status}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {order.items?.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-xs font-medium">
            <span className="opacity-60">{item.quantity}x {item.name.slice(0, 20)}...</span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-editorial-bg/10">
        <div>
          <div className="editorial-uppercase text-[7px] opacity-40 mb-1">Validation Mode</div>
          <div className="text-[10px] font-black uppercase tracking-widest">{order.paymentMethod || 'Unselected'}</div>
        </div>
        <div>
          <div className="editorial-uppercase text-[7px] opacity-40 mb-1">Destination</div>
          <div className="text-[10px] font-medium leading-tight line-clamp-1">{order.shippingAddress}</div>
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-editorial-bg/10">
        <div className="editorial-uppercase text-[9px] opacity-40">Settlement Total</div>
        <div className="font-serif italic text-2xl">{formatPrice(order.totalAmount)}</div>
      </div>
    </motion.div>
  );
};

export default function Chatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isManual, setIsManual] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch products for context
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Chatbot product fetch quota exceeded.');
          return;
        }
        handleFirestoreError(err, OperationType.LIST, 'products');
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!user) return;

    const convId = user.uid;
    const convRef = doc(db, 'conversations', convId);

    // Ensure conversation exists
    getDoc(convRef).then(snap => {
      if (!snap.exists()) {
        setDoc(convRef, {
          userId: user.uid,
          lastMessage: 'Conversation started',
          lastUpdatedAt: new Date().toISOString(),
          isManualMode: false
        }).catch(err => {
          if (!err.message?.includes('Quota exceeded')) {
            handleFirestoreError(err, OperationType.WRITE, `conversations/${convId}`);
          }
        });
      }
    }).catch(err => {
      if (!err.message?.includes('Quota exceeded')) {
        handleFirestoreError(err, OperationType.GET, `conversations/${convId}`);
      }
    });

    // Listen to manual mode
    const unscubscribeConv = onSnapshot(convRef, (snap) => {
      if (snap.exists()) {
        setIsManual(snap.data().isManualMode);
      }
    }, (err) => {
      if (err.message.includes('Quota exceeded')) return;
      handleFirestoreError(err, OperationType.GET, `conversations/${convId}`);
    });

    // Listen to messages
    const q = query(collection(db, `conversations/${convId}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribeMsgs = onSnapshot(q, (snap) => {
      try {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        if (msgs.length === 0) {
          // Initial bot message if none exist
          const initialMsg = {
            text: "Hello! I'm StyleChat, your StyleClothes Assistant. How can I help you today? I can assist with product queries, order tracking, or payment info.",
            role: 'model',
            timestamp: new Date().toISOString()
          };
          addDoc(collection(db, `conversations/${convId}/messages`), initialMsg)
            .catch(err => {
              if (!err.message?.includes('Quota exceeded')) {
                handleFirestoreError(err, OperationType.CREATE, `conversations/${convId}/messages`);
              }
            });
        } else {
          setMessages(msgs);
        }
      } catch (e) {
        console.error("Error processing messages snapshot:", e);
      }
    }, (err) => {
      if (err.message.includes('Quota exceeded')) {
        console.warn('Chatbot messages quota exceeded.');
        return;
      }
      handleFirestoreError(err, OperationType.LIST, `conversations/${convId}/messages`);
    });

    // Handle initial product inquiry from state
    const state = location.state as { productId?: string; productName?: string } | null;
    if (state?.productId && state?.productName) {
      const convId = user.uid;
      
      const sendInitial = async () => {
        await addDoc(collection(db, `conversations/${convId}/messages`), {
          text: `I'm interested in viewing details for the ${state.productName}.`,
          role: 'user',
          timestamp: new Date().toISOString()
        });
        
        await addDoc(collection(db, `conversations/${convId}/messages`), {
          text: `Certainly. Here are the archive records for the ${state.productName}. You can proceed to checkout directly or ask me any questions about the material.`,
          role: 'model',
          type: 'product_details',
          productId: state.productId,
          timestamp: new Date().toISOString()
        });
      };
      
      sendInitial();
      // Clear state so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: {} });
    }

    return () => {
      unscubscribeConv();
      unsubscribeMsgs();
    };
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    const confirm = params.get('confirm');
    const intent = params.get('intent');
    
    if (user && orderId && messages.length > 0) {
      const convId = user.uid;
      
      // Handle direct payment confirmation request
      if (confirm === 'payment') {
        const alreadySent = messages.some(m => m.orderId === orderId && m.type === 'payment');
        if (!alreadySent) {
          addDoc(collection(db, `conversations/${convId}/messages`), {
            text: `Requesting payment portal for Order #${orderId.slice(-6)}`,
            role: 'user',
            timestamp: new Date().toISOString()
          });
          addDoc(collection(db, `conversations/${convId}/messages`), {
            text: `I've initialized the payment portal for your Order #${orderId.slice(-6)}. You can scan the QR code below to complete your transfer. Once paid, please upload your receipt.`,
            role: 'model',
            type: 'payment',
            orderId: orderId,
            timestamp: new Date().toISOString()
          });
          navigate(location.pathname, { replace: true });
        }
      } 
      // Handle general "order placed" landing
      else if (intent === 'order_placed') {
        const alreadySent = messages.some(m => m.orderId === orderId && m.type === 'receipt');
        if (!alreadySent) {
          addDoc(collection(db, `conversations/${convId}/messages`), {
            text: `I've just finalized my selection for Order #${orderId.slice(-6)}.`,
            role: 'user',
            timestamp: new Date().toISOString()
          });
          addDoc(collection(db, `conversations/${convId}/messages`), {
            text: `Transmission received. I've logged your archive request for Order #${orderId.slice(-6)}. Below are the details of the products currently being prepared for dispatch.`,
            role: 'model',
            type: 'receipt',
            orderId: orderId,
            timestamp: new Date().toISOString()
          });
          navigate(location.pathname, { replace: true });
        }
      }
      // Handle cart inquiry
      else if (intent === 'cart_inquiry') {
        const alreadySent = messages.some(m => m.type === 'order_info' && m.timestamp.slice(0, 16) === new Date().toISOString().slice(0, 16));
        if (!alreadySent) {
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          if (cart.length > 0) {
            addDoc(collection(db, `conversations/${convId}/messages`), {
              text: `I'm considering these items in my bag. Can you tell me more about them?`,
              role: 'user',
              timestamp: new Date().toISOString()
            });
            addDoc(collection(db, `conversations/${convId}/messages`), {
              text: `I see you have an excellent selection in your bag. Here are the archive details for your current selection. You can proceed to checkout when ready.`,
              role: 'model',
              type: 'product_recommendation',
              productIds: cart.map((p: any) => p.id),
              timestamp: new Date().toISOString()
            });
          }
          navigate(location.pathname, { replace: true });
        }
      }
    }
  }, [user, location.search, messages, navigate, location.pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (fileUrl?: string, fileType?: string) => {
    if ((!input.trim() && !fileUrl) || isTyping || !user) return;

    const convId = user.uid;
    const text = input;
    setInput('');

    const messageData: any = {
      text,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    if (fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.fileType = fileType;
    }

    // Add user message to firestore
    await addDoc(collection(db, `conversations/${convId}/messages`), messageData);

    // Update conversation metadata and notify admin
    await setDoc(doc(db, 'conversations', convId), {
      lastMessage: text || (fileType === 'image' ? 'Sent an image' : 'Sent a document'),
      lastUpdatedAt: new Date().toISOString(),
      needsAttention: true // Notify admin
    }, { merge: true });

    if (!isManual && !fileUrl) {
      setIsTyping(true);

      // Construct additional context with products and orders
      let additionalContext = "\n\n[AVAILABLE PRODUCTS IN STORE:\n";
      products.forEach((p, i) => {
        additionalContext += `${i+1}. ${p.name} (ID: ${p.id}, Category: ${p.category}, Price: ₹${p.price}, Stock: ${p.stock})\n`;
      });
      additionalContext += "]\n";

      // Check for order tracking intent
      let orderTrackingContext = "";
      if (text.toLowerCase().includes("track") || text.toLowerCase().includes("order") || text.toLowerCase().includes("where") || text.toLowerCase().includes("status") || text.toLowerCase().includes("item")) {
        try {
          const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
          const ordersSnap = await getDocs(ordersQuery);
          if (!ordersSnap.empty) {
            let context = "\n\n[REAL-TIME ORDER HISTORY CONTEXT:\n";
            ordersSnap.docs.forEach((doc, index) => {
              const data = doc.data();
              context += `Order #${index + 1} (ID: ${doc.id}):\n`;
              context += ` - Status: ${data.status}\n`;
              context += ` - Payment: ${data.paymentStatus}\n`;
              context += ` - Total: ₹${data.totalAmount}\n`;
              context += ` - Items:\n`;
              data.items?.forEach((item: any) => {
                context += `   * ${item.name} (Qty: ${item.quantity}, Price: ₹${item.price})\n`;
              });
            });
            context += "]";
            orderTrackingContext = context;
          } else {
            orderTrackingContext = "\n\n[REAL-TIME ORDER CONTEXT: User has no orders in the system.]";
          }
        } catch (err) {
          console.error("Error fetching orders for context:", err);
        }
      }

      const history = messages.slice(-10).map(m => ({
        role: m.role === 'admin' ? 'model' : m.role,
        parts: [{ text: m.text }]
      }));

      try {
        const responseText = await getChatResponse(text + orderTrackingContext, history, additionalContext);
        
        let type: Message['type'];
        let productIds: string[] = [];
        let orderId: string | undefined;

        if (responseText.toLowerCase().includes('payment') || responseText.toLowerCase().includes('upi') || responseText.toLowerCase().includes('qrcode')) {
          type = 'payment';
          // Try to find the latest order for this user to attach as context
          try {
            const latestOrderQuery = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
            const latestOrderSnap = await getDocs(latestOrderQuery);
            if (!latestOrderSnap.empty) {
              orderId = latestOrderSnap.docs[0].id;
            }
          } catch (err) {
            console.error("Error fetching latest order for payment type:", err);
          }
        } else {
          // Detect mentioned products
          products.forEach(p => {
            if (responseText.toLowerCase().includes(p.name.toLowerCase())) {
              productIds.push(p.id);
            }
          });
          if (productIds.length > 0) {
            type = 'product_recommendation';
          }
        }

        const botMsg: any = {
          text: responseText,
          role: 'model',
          timestamp: new Date().toISOString(),
        };

        if (type) {
          botMsg.type = type;
        }
        if (orderId) {
          botMsg.orderId = orderId;
        }
        if (productIds.length > 0) {
          botMsg.productIds = productIds;
        }

        await addDoc(collection(db, `conversations/${convId}/messages`), botMsg);
      } catch (err) {
        console.error(err);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const triggerQuickAction = async (action: 'pay' | 'track' | 'help' | 'buy_new', contextId?: string) => {
    if (!user) return;
    const convId = user.uid;

    if (action === 'pay' && contextId) {
      await addDoc(collection(db, `conversations/${convId}/messages`), {
        text: "I want to pay for this order now.",
        role: 'user',
        timestamp: new Date().toISOString()
      });
      await addDoc(collection(db, `conversations/${convId}/messages`), {
        text: `Initializing secure settlement module for Record #${contextId.slice(-6)}. Please scan the QR below.`,
        role: 'model',
        type: 'payment',
        orderId: contextId,
        timestamp: new Date().toISOString()
      });
    } else if (action === 'track' && contextId) {
      await addDoc(collection(db, `conversations/${convId}/messages`), {
        text: `Where is my order #${contextId.slice(-6)}?`,
        role: 'user',
        timestamp: new Date().toISOString()
      });
      // Bot logic will handle tracking context automatically through Gemini in handleSend 
      // but let's force a Gemini trigger or manual message
      setInput(`Status update for #${contextId.slice(-6)}?`);
      handleSend();
    } else if (action === 'help') {
      await addDoc(collection(db, `conversations/${convId}/messages`), {
        text: "I need help with my payment.",
        role: 'user',
        timestamp: new Date().toISOString()
      });
      setInput("How do I complete my payment?");
      handleSend();
    } else if (action === 'buy_new') {
      navigate('/shop');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-editorial-muted pt-10 px-10">
      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col bg-editorial-text text-editorial-bg border-editorial shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-editorial-bg/20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 border border-editorial-bg/40 flex items-center justify-center">
              <Bot size={24} strokeWidth={1} />
            </div>
            <div>
              <h1 className="font-serif italic text-2xl tracking-tight">StyleChat</h1>
              <div className="editorial-uppercase opacity-60 text-[9px]">Assisting Style Member</div>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="editorial-uppercase hover:line-through opacity-60">
            Exit
          </button>
        </div>

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-10 space-y-10 scrollbar-hide font-sans text-sm">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] p-6 border transition-all",
                msg.role === 'user' 
                  ? "bg-editorial-bg text-editorial-text border-editorial-bg" 
                  : "bg-editorial-bg/10 text-editorial-bg border-editorial-bg/20"
              )}>
                {msg.fileUrl && (
                  <div className="mb-4">
                    {msg.fileType === 'image' ? (
                      <img src={msg.fileUrl} className="max-w-full h-auto border border-editorial-bg/20 grayscale hover:grayscale-0 transition-all cursor-zoom-in" onClick={() => window.open(msg.fileUrl, '_blank')} alt="Shared media" />
                    ) : (
                      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-editorial-bg/5 border border-editorial-bg/10 hover:bg-editorial-bg/10 transition-all">
                        <FileText size={20} strokeWidth={1} />
                        <span className="editorial-uppercase text-[10px]">View Document</span>
                      </a>
                    )}
                  </div>
                )}
                {msg.text && <p className="leading-relaxed tracking-wide whitespace-pre-wrap">{msg.text}</p>}

                {msg.type === 'receipt' && msg.orderId && (
                  <OrderReceipt orderId={msg.orderId} onAction={(action) => triggerQuickAction(action, msg.orderId)} />
                )}

                {msg.type === 'product_details' && msg.productId && (
                  <ProductDetails productId={msg.productId} onCheckout={() => navigate('/cart')} />
                )}

                {(msg.type === 'receipt' || msg.type === 'payment' || msg.type === 'product_details' || msg.role === 'model') && (
                  <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-editorial-bg/10">
                    {!msg.type && (
                       <button onClick={() => triggerQuickAction('buy_new')} className="px-3 py-1.5 border border-editorial-bg/30 text-[8px] editorial-uppercase hover:bg-editorial-bg hover:text-editorial-text transition-all font-black">Archive Store</button>
                    )}
                    {msg.productId && msg.type === 'product_details' && (
                       <>
                         <button onClick={() => navigate(`/checkout`)} className="px-3 py-1.5 bg-editorial-bg text-editorial-text text-[8px] editorial-uppercase hover:opacity-80 transition-all font-black flex items-center gap-2">
                           Checkout Product
                         </button>
                         <button onClick={() => triggerQuickAction('help')} className="px-3 py-1.5 border border-editorial-bg/30 text-[8px] editorial-uppercase hover:bg-editorial-bg hover:text-editorial-text transition-all font-black flex items-center gap-2">
                            Payment Info
                         </button>
                       </>
                    )}
                    {msg.orderId && msg.type === 'receipt' && (
                       <>
                         <button onClick={() => triggerQuickAction('pay', msg.orderId)} className="px-3 py-1.5 bg-editorial-bg text-editorial-text text-[8px] editorial-uppercase hover:opacity-80 transition-all font-black flex items-center gap-2">
                           <CreditCard size={8} /> View Payment Details
                         </button>
                         <button onClick={() => triggerQuickAction('track', msg.orderId)} className="px-3 py-1.5 border border-editorial-bg/30 text-[8px] editorial-uppercase hover:bg-editorial-bg hover:text-editorial-text transition-all font-black flex items-center gap-2">
                           <Package size={8} /> Track Shipment
                         </button>
                       </>
                    )}
                    {(msg.type === 'payment' || (msg.text.toLowerCase().includes('pay') && msg.role === 'model')) && (
                      <button onClick={() => triggerQuickAction('help')} className="px-3 py-1.5 border border-editorial-bg/30 text-[8px] editorial-uppercase hover:bg-editorial-bg hover:text-editorial-text transition-all font-black">Payment Help</button>
                    )}
                  </div>
                )}
                
                {msg.type === 'product_recommendation' && msg.productIds && (
                  <div className="mt-6 flex flex-col gap-4">
                    {msg.productIds.slice(0, 3).map(pid => {
                      const p = products.find(prod => prod.id === pid);
                      if (!p) return null;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={pid} 
                          className="bg-editorial-bg text-editorial-text p-4 border border-editorial-text/20 flex gap-4 cursor-pointer hover:bg-editorial-muted transition-colors"
                          onClick={() => navigate(`/product/${pid}`)}
                        >
                          <img src={p.images?.[0]} className="w-16 h-16 object-cover grayscale" alt="" />
                          <div className="flex-grow">
                            <div className="editorial-uppercase text-[10px] opacity-40">{p.category}</div>
                            <div className="font-serif italic text-lg leading-tight">{p.name}</div>
                            <div className="font-bold text-xs mt-1">{formatPrice(p.price)}</div>
                          </div>
                          <ChevronRight size={16} className="self-center opacity-40" />
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {msg.type === 'payment' && msg.orderId && (
                  <PaymentPortal orderId={msg.orderId} />
                )}
                <div className="editorial-uppercase opacity-20 mt-4 text-[8px]">
                  SENT {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="editorial-uppercase opacity-40 animate-pulse tracking-widest text-[9px]">Assistant is writing...</div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-editorial-bg/20">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 border border-editorial-bg/40 p-1">
              <div className="px-4 border-r border-editorial-bg/20">
                <FileUpload 
                  onUpload={(url) => handleSend(url, 'image')} // Default to image for now, or detect
                  hideLabel
                  className="!p-0 !min-h-0 border-none bg-transparent"
                />
              </div>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message StyleChat..."
                className="flex-grow bg-transparent px-6 py-4 outline-none text-xs font-medium placeholder:opacity-30"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() && !isTyping}
                className="h-14 w-14 bg-editorial-bg text-editorial-text flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-20"
              >
                <Send size={18} strokeWidth={1} />
              </button>
            </div>
            <div className="flex justify-between items-center text-[8px] editorial-uppercase opacity-20 px-2">
              <span>Secure Encrypted Record</span>
              <span>StyleClothes Identity System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
