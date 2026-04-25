import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, doc, updateDoc, increment, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, ExternalLink, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface AdConfig {
  id: string;
  type: string;
  enabled: boolean;
  title: string;
  description: string;
  url: string;
  mediaUrl?: string;
}

export const MarketingDisplay = ({ type }: { type: string }) => {
  const [ad, setAd] = useState<AdConfig | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const trackedRef = useRef<string | null>(null);

  const trackImpression = async (adId: string) => {
    if (trackedRef.current === adId) return;
    try {
      await updateDoc(doc(db, 'ads', adId), {
        impressions: increment(1)
      });
      trackedRef.current = adId;
    } catch (err) {
      console.error("Failed to track impression:", err);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      await updateDoc(doc(db, 'ads', adId), {
        clicks: increment(1)
      });
    } catch (err) {
      console.error("Failed to track click:", err);
    }
  };

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const q = query(collection(db, 'ads'), where('type', '==', type), where('enabled', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const randomIndex = Math.floor(Math.random() * snap.size);
          const docSnap = snap.docs[randomIndex];
          const adData = { id: docSnap.id, ...docSnap.data() } as AdConfig;
          setAd(adData);
          trackImpression(adData.id);
        } else {
          setAd(null);
        }
      } catch (error: any) {
        if (error.message?.includes('Quota exceeded')) {
          console.warn('Marketing ads quota exceeded. Disabling ads display for this session.');
          setAd(null);
          return;
        }
        handleFirestoreError(error, OperationType.LIST, 'ads');
      }
    };
    
    fetchAd();
  }, [type]);

  if (!ad || !isVisible) return null;

  // Map old imageUrl to new mediaUrl for backward compatibility/consistency
  const activeMedia = ad.mediaUrl || (ad as any).imageUrl;

  if (type === 'display') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-editorial-text text-editorial-bg p-12 my-20 border border-editorial-text"
      >
        <div className="flex flex-col md:flex-row gap-10 items-center justify-between">
          <div className="max-w-xl">
            <div className="editorial-uppercase text-[10px] opacity-40 mb-4 flex items-center gap-2">
              <Megaphone size={12} /> Sponsored // Spotlight
            </div>
            <h3 className="text-4xl md:text-5xl font-serif italic mb-6 leading-tight">{ad.title}</h3>
            <p className="text-sm opacity-70 mb-8">{ad.description}</p>
            <a 
              href={ad.url} 
              target="_blank" 
              rel="noreferrer"
              onClick={() => trackClick(ad.id)}
              className="inline-flex items-center gap-2 editorial-uppercase text-[10px] font-black border-b border-editorial-bg pb-1 hover:opacity-60 transition-all"
            >
              Explore Collection <ExternalLink size={12} />
            </a>
          </div>
          <div className="w-full md:w-1/3 aspect-[4/5] bg-editorial-muted/10 border border-editorial-bg/10 flex items-center justify-center relative overflow-hidden">
            {activeMedia ? (
              <img src={activeMedia} className="w-full h-full object-cover grayscale opacity-50" />
            ) : (
              <div className="italic text-4xl opacity-20">[Visual.Asset]</div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'native') {
    return (
      <div className="border border-dashed border-editorial-text/20 p-8 my-10 bg-editorial-muted/5 group">
        <div className="editorial-uppercase text-[8px] opacity-20 mb-4">Content Partner // Analysis</div>
        <h4 onClick={() => trackClick(ad.id)} className="font-serif italic text-2xl mb-4 group-hover:underline cursor-pointer">
          <a href={ad.url} target="_blank" rel="noreferrer" onClick={() => trackClick(ad.id)}>{ad.title}</a>
        </h4>
        <p className="text-xs opacity-60 leading-relaxed mb-6">{ad.description}</p>
        <a href={ad.url} target="_blank" rel="noreferrer" onClick={() => trackClick(ad.id)} className="editorial-uppercase text-[9px] font-black hover:line-through">READ FULL RECORD_</a>
      </div>
    );
  }

  // Floating notification / Email / Influencer / Social style
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed bottom-10 right-10 z-50 w-80 bg-white border border-editorial-text shadow-2xl p-6"
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-3 -right-3 w-8 h-8 bg-editorial-text text-editorial-bg flex items-center justify-center rounded-full hover:scale-110 transition-transform"
        >
          <X size={14} />
        </button>
        <div className="editorial-uppercase text-[8px] opacity-40 mb-4 flex items-center gap-2">
          <Megaphone size={10} /> {type.toUpperCase()} TRANSMISSION
        </div>
        <h5 className="font-serif italic text-lg mb-4">{ad.title}</h5>
        <p className="text-[10px] editorial-uppercase opacity-60 mb-6 leading-relaxed">{ad.description}</p>
        <a 
          href={ad.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackClick(ad.id)}
          className="block w-full py-3 bg-editorial-text text-editorial-bg text-center editorial-uppercase text-[10px] font-black hover:opacity-90 transition-opacity"
        >
          View Transmission
        </a>
      </motion.div>
    </AnimatePresence>
  );
};
