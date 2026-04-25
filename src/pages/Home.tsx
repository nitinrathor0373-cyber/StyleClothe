import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ShieldCheck, Truck, Zap } from 'lucide-react';
import { MarketingDisplay } from '../components/MarketingDisplay';

const FEATURED_CATEGORIES = [
  { name: 'Men', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80', path: '/shop/men' },
  { name: 'Women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80', path: '/shop/women' },
  { name: 'Children', image: 'https://images.unsplash.com/photo-1519233073523-633003a3d541?auto=format&fit=crop&q=80', path: '/shop/children' },
];

const Hero = () => (
  <section className="relative px-10 py-20 flex flex-col items-start min-h-[90vh]">
    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
      <img 
        src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80" 
        alt="Hero Background" 
        className="w-full h-full object-cover grayscale"
      />
    </div>
    
    <div className="relative z-10 w-full h-full flex flex-col justify-between flex-1">
      <div className="max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="editorial-uppercase mb-8"
        >
          New Arrivals // Collection '26
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[12vw] leading-[0.9] font-serif italic mb-10 tracking-tighter"
        >
          The Modern <br /> Standard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-xs text-sm leading-relaxed opacity-80 mb-12"
        >
          Curated essentials for the urban wanderer. High-quality fabrics meet architectural silhouettes in our latest seasonal edit.
        </motion.p>
      </div>

      <div className="flex flex-col md:flex-row items-end justify-between w-full border-t border-editorial-text pt-10">
        <Link 
          to="/shop" 
          className="text-2xl font-serif italic underline underline-offset-8 hover:opacity-60 transition-opacity mb-8 md:mb-0"
        >
          Shop Collection
        </Link>
        <div className="editorial-uppercase opacity-40">
          Scroll to Explore / 01
        </div>
      </div>
    </div>
  </section>
);

const Features = () => (
  <section className="border-t border-editorial-text flex overflow-hidden">
    {[
      { label: 'Free Delivery', desc: 'Express shipping worldwide' },
      { label: 'Secure Pay', desc: 'Verified UPI & QR system' },
      { label: 'StyleChat', desc: '24/7 AI-powered assistance' },
      { label: 'Premium', desc: 'Timeless artisan quality' },
    ].map((f, i) => (
      <div key={i} className="flex-1 p-10 border-r border-editorial-text last:border-r-0 hover:bg-editorial-muted transition-colors">
        <div className="editorial-uppercase mb-4">{f.label}</div>
        <p className="text-[10px] opacity-60 leading-relaxed uppercase tracking-widest">{f.desc}</p>
      </div>
    ))}
  </section>
);

const Categories = () => (
  <section className="grid grid-cols-1 md:grid-cols-3 border-t border-b border-editorial-text">
    {FEATURED_CATEGORIES.map((cat, idx) => (
      <Link 
        key={cat.name} 
        to={cat.path} 
        className="group relative h-[700px] border-r border-editorial-text last:border-r-0 overflow-hidden flex flex-col justify-end p-10"
      >
        <div className="absolute inset-0 z-0">
          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000" />
        </div>
        <div className="relative z-10">
          <div className="editorial-uppercase text-white/60 mb-2">Category / 0{idx+1}</div>
          <h2 className="text-6xl font-serif italic text-white mb-6 transform group-hover:-translate-y-2 transition-transform">{cat.name}</h2>
          <div className="editorial-uppercase text-white underline underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity">
            Explore now
          </div>
        </div>
      </Link>
    ))}
  </section>
);

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <MarketingDisplay type="video" />
      <Features />
      <MarketingDisplay type="shopping" />
      <Categories />
      <MarketingDisplay type="retargeting" />
    </div>
  );
}
