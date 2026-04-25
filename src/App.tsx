import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShoppingCart, User, Menu, X, MessageSquare, Bell, LogOut, Package, CreditCard, LayoutDashboard, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { cn } from './lib/utils';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Chatbot from './pages/Chatbot';
import Legal from './pages/Legal';
import { MarketingDisplay } from './components/MarketingDisplay';

const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Men', path: '/shop/men' },
    { name: 'Women', path: '/shop/women' },
    { name: 'Children', path: '/shop/children' },
    { name: 'About', path: '/legal/about' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#F9F7F2]/80 backdrop-blur-md border-b border-editorial-text">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="text-xl md:text-3xl font-serif font-black tracking-tighter uppercase italic">STYLECLOTHES</Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map(link => (
            <Link 
              key={link.name} 
              to={link.path} 
              className={cn("editorial-uppercase hover:line-through transition-all", 
                location.pathname === link.path ? "text-editorial-text" : "opacity-40")}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          <Link to="/cart" className="relative p-1 hover:opacity-60">
            <ShoppingCart size={20} strokeWidth={1.5} />
          </Link>
          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/profile" className="w-8 h-8 border border-editorial-text flex items-center justify-center font-serif italic text-lg hover:bg-editorial-text hover:text-white transition-colors">
                {user.email?.[0].toUpperCase()}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="editorial-uppercase border border-editorial-text px-3 py-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  ADMIN
                </Link>
              )}
            </div>
          ) : (
            <Link to="/login" className="hidden md:block editorial-uppercase hover:line-through">
              Login
            </Link>
          )}
          <button className="md:hidden p-2 hover:opacity-50 transition-opacity" onClick={() => setIsOpen(!isOpen)}>
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-editorial-text/20 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-[80%] bg-[#F9F7F2] z-[101] md:hidden shadow-2xl border-l border-editorial-text flex flex-col"
            >
              <div className="p-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-16">
                  <span className="text-xl font-serif italic font-black">STYLE</span>
                  <button onClick={() => setIsOpen(false)} className="p-2 border border-editorial-text rounded-full">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-8">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Link 
                        to={link.path} 
                        onClick={() => setIsOpen(false)}
                        className="block text-4xl font-serif italic hover:line-through transition-all decoration-1"
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto pt-10 border-t border-editorial-text/10 space-y-6">
                  {user ? (
                    <div className="space-y-4">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 editorial-uppercase text-xs"
                      >
                        <User size={16} /> Account
                      </Link>
                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 editorial-uppercase text-xs text-green-600"
                        >
                          <LayoutDashboard size={16} /> Admin Panel
                        </Link>
                      )}
                    </div>
                  ) : (
                    <Link 
                      to="/login" 
                      onClick={() => setIsOpen(false)}
                      className="block editorial-uppercase text-xs underline underline-offset-4"
                    >
                      Member Login
                    </Link>
                  )}
                  <Link to="/cart" onClick={() => setIsOpen(false)} className="flex items-center gap-3 editorial-uppercase text-xs">
                    <ShoppingCart size={16} /> Shopping Bag
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="border-t-editorial bg-editorial-bg py-10 px-10 mt-auto">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between editorial-uppercase gap-10">
      <div className="flex gap-10">
        <Link to="/legal/about" className="hover:line-through">About Us</Link>
        <Link to="/legal/terms" className="hover:line-through">T&C</Link>
        <Link to="/legal/privacy" className="hover:line-through">Privacy</Link>
      </div>
      <div className="text-center md:text-right">&copy; 2026 STYLECLOTHES OFFICIAL</div>
    </div>
  </footer>
);

const ChatbotToggle = () => (
  <Link 
    to="/chatbot" 
    className="fixed bottom-6 right-6 z-50 p-4 bg-editorial-text text-editorial-bg border border-editorial-bg shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 group"
  >
    <MessageSquare size={20} strokeWidth={1.5} />
    <span className="editorial-uppercase">StyleChat</span>
  </Link>
);

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setAnnouncement(snap.docs[0].data());
        }
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Announcements quota exceeded. Disabling banner.');
          setAnnouncement(null);
          return;
        }
        handleFirestoreError(err, OperationType.LIST, 'announcements');
      }
    };
    
    fetchAnnouncement();
  }, []);

  if (!announcement) return null;

  return (
    <div className="bg-editorial-text text-editorial-bg py-3 px-10 text-center relative overflow-hidden">
      <motion.div 
        animate={{ x: [1000, -1000] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="editorial-uppercase text-[10px] whitespace-nowrap tracking-[0.3em]"
      >
        +++ {announcement.message} +++ {announcement.message} +++ {announcement.message} +++
      </motion.div>
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-black selection:text-white">
      {!isAdminRoute && <AnnouncementBanner />}
      {!isAdminRoute && <Navbar />}
      <main className={cn("flex-grow", !isAdminRoute && "pt-16")}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:category?" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/legal/:page" element={<Legal />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ChatbotToggle />}
      {!isAdminRoute && <MarketingDisplay type="email" />}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
