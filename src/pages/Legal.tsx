import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';

export default function Legal() {
  const { page } = useParams();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLegal = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'legal'), where('type', '==', page));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setContent(snap.docs[0].data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLegal();
  }, [page]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-10 py-40 min-h-screen flex items-center justify-center">
        <div className="editorial-uppercase opacity-40 animate-pulse tracking-widest text-[10px]">Retrieving Document...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto px-10 py-40 min-h-screen text-center">
        <div className="font-serif italic text-3xl opacity-20 mb-8">Document Not Found</div>
        <div className="editorial-uppercase opacity-40 text-[10px]">The requested page has not been published to the registry.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-10 py-40 min-h-screen">
      <div className="mb-20 border-b border-editorial-text pb-10">
        <div className="editorial-uppercase mb-2">Legal // Charter</div>
        <h1 className="text-8xl font-serif italic tracking-tighter uppercase leading-none">{content.type}</h1>
      </div>
      
      <div className="markdown-body prose prose-invert max-w-none prose-p:text-editorial-text prose-p:opacity-80 prose-headings:font-serif prose-headings:italic prose-headings:text-editorial-text">
        <ReactMarkdown>{content.content}</ReactMarkdown>
      </div>

      <div className="mt-20 pt-10 border-t border-editorial-text/10 editorial-uppercase opacity-20 text-[9px]">
        Last Updated: {new Date(content.updatedAt).toLocaleDateString()} // StyleClothes Compliance
      </div>
    </div>
  );
}
