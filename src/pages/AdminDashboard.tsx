import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, onSnapshot, orderBy, where, setDoc } from 'firebase/firestore';
import { 
  BarChart3, Box, ShoppingCart, Users, Settings, Plus, Edit2, Trash2, 
  CheckCircle, AlertTriangle, Clock, MapPin, Receipt, MessageCircle, FileText,
  ArrowLeft, Menu, X, Bell, Eye, Megaphone, Camera
} from 'lucide-react';
import { formatPrice, cn, generateInvoicePDF } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import FileUpload from '../components/FileUpload';

// Sub-components
const MediaGallery = () => {
  const [images, setImages] = useState<string[]>([]);
  const [vaultMedia, setVaultMedia] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'vault' | 'products'>('vault');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // Vault media collection
        const vaultSnap = await getDocs(collection(db, 'media'));
        setVaultMedia(vaultSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Product images scrape
        const productsSnap = await getDocs(collection(db, 'products'));
        const allImages: string[] = [];
        productsSnap.docs.forEach(doc => {
          const data = doc.data() as any;
          if (data.images) allImages.push(...data.images);
        });
        setImages(Array.from(new Set(allImages)));
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Media Vault quota exceeded.');
        } else {
          handleFirestoreError(err, OperationType.LIST, 'media');
        }
      }
    };

    fetchMedia();
  }, []);

  const handleVaultUpload = async () => {
    if (!uploadPreview) return;
    try {
      await addDoc(collection(db, 'media'), {
        url: uploadPreview,
        name: `Asset_${Date.now()}`,
        type: 'image',
        createdAt: new Date().toISOString()
      });
      setUploadPreview(null);
      setIsUploading(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'media');
    }
  };

  const deleteFromVault = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'media', id));
      setIsDeletingId(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `media/${id}`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end border-b border-editorial-text pb-6">
        <div>
          <div className="editorial-uppercase mb-2">Vault // Assets</div>
          <h2 className="text-6xl font-serif italic tracking-tighter leading-none">Media Manager</h2>
        </div>
        <button 
          onClick={() => setIsUploading(true)}
          className="bg-black text-white px-8 py-4 font-black editorial-uppercase text-[10px] flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg"
        >
          <Plus size={14} /> Deposit Asset
        </button>
      </div>

      <div className="flex gap-10 border-b border-gray-100">
        {[
          { id: 'vault', label: 'Media Vault', count: vaultMedia.length },
          { id: 'products', label: 'Product Assets', count: images.length }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
              activeTab === tab.id ? "text-black" : "text-gray-300 hover:text-black"
            )}
          >
            {tab.label} ({tab.count})
            {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
          </button>
        ))}
      </div>
      
      {activeTab === 'products' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1">
          {images.map((img, i) => (
            <div key={i} className="group aspect-square relative bg-white border border-gray-100 overflow-hidden">
              {img && <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Product asset" />}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <button 
                  onClick={() => { navigator.clipboard.writeText(img); alert("Asset link stored."); }}
                  className="bg-white text-editorial-text font-black uppercase text-[7px] tracking-widest px-4 py-2 hover:bg-black hover:text-white transition-colors"
                >
                  Retrieve Link
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence>
            {vaultMedia.map((m) => (
              <motion.div 
                layout
                key={m.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group aspect-square relative bg-white border border-editorial-text shadow-sm overflow-hidden"
              >
                <img src={m.url} className="w-full h-full object-cover grayscale transition-transform group-hover:scale-110" alt={m.name} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(m.url); alert("Link copied!"); }}
                    className="bg-white text-editorial-text editorial-uppercase text-[8px] px-4 py-2 hover:bg-black hover:text-white transition-all"
                  >
                    Copy Link
                  </button>
                  <button 
                    onClick={() => setIsDeletingId(m.id)}
                    className="bg-red-500 text-white editorial-uppercase text-[8px] px-4 py-2 hover:bg-red-600 transition-all"
                  >
                    Purge
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {vaultMedia.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30 editorial-uppercase italic tracking-widest">
              Vault is empty. Deposit assets to begin.
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white max-w-xl w-full p-12 shadow-2xl relative"
          >
            <button onClick={() => setIsUploading(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 transition-all">
              <X size={20} />
            </button>
            <h3 className="text-3xl font-serif italic mb-8 border-b pb-6">Deposit Asset</h3>
            
            <div className="space-y-8">
              <FileUpload 
                onUpload={setUploadPreview}
                label="Select Storage Media"
                className="aspect-video"
              />
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsUploading(false)}
                  className="flex-1 py-4 border border-editorial-text editorial-uppercase text-[10px] font-black tracking-widest hover:bg-editorial-muted transition-all"
                >
                  Abandon
                </button>
                <button 
                  onClick={handleVaultUpload}
                  disabled={!uploadPreview}
                  className="flex-1 py-4 bg-black text-white editorial-uppercase text-[10px] font-black tracking-widest disabled:opacity-20 hover:bg-gray-800 transition-all"
                >
                  Verify & Deposit
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {isDeletingId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-sm w-full p-12 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-serif italic mb-4">Purge Asset?</h3>
            <p className="text-[10px] editorial-uppercase opacity-40 mb-8 leading-relaxed">This action will permanently remove the media asset from the central vault storage.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeletingId(null)}
                className="flex-1 py-4 border border-editorial-text editorial-uppercase text-[10px] font-black tracking-widest hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteFromVault(isDeletingId)}
                className="flex-1 py-4 bg-red-600 text-white editorial-uppercase text-[10px] font-black tracking-widest hover:bg-red-700"
              >
                Confirm Purge
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('User management quota exceeded.');
        } else {
          handleFirestoreError(err, OperationType.LIST, 'users');
        }
      }
    };
    fetchUsers();
  }, []);

  const toggleAdmin = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateDoc(doc(db, 'users', id), { role: newRole });
  };

  return (
    <div className="space-y-8">
      <div className="mb-12 border-b border-editorial-text pb-6">
        <div className="editorial-uppercase mb-2">Registry // Members</div>
        <h2 className="text-6xl font-serif italic tracking-tighter leading-none">User Management</h2>
      </div>
      
      <div className="bg-white border border-editorial-text overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-editorial-text text-editorial-bg editorial-uppercase text-[10px]">
            <tr>
              <th className="px-8 py-5">Member</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5">Joined</th>
              <th className="px-8 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-6">
                  <div className="font-serif italic text-lg">{u.displayName || 'Unnamed Member'}</div>
                  <div className="editorial-uppercase opacity-40 text-[9px]">{u.email}</div>
                </td>
                <td className="px-8 py-6 text-xs font-black uppercase text-gray-400">
                   <span className={cn(
                    "px-3 py-1 bg-gray-100 rounded-full",
                    u.role === 'admin' && "bg-black text-white"
                  )}>{u.role}</span>
                </td>
                <td className="px-8 py-6 text-xs">{new Date(u.joinedAt).toLocaleDateString()}</td>
                <td className="px-8 py-6">
                  <button 
                    onClick={() => toggleAdmin(u.id, u.role)}
                    className="editorial-uppercase text-[10px] underline underline-offset-4 hover:opacity-60"
                  >
                    {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminChat = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'conversations'), (snap) => {
      setConversations(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
    }, (err) => {
      if (!err.message?.includes('Quota exceeded')) {
        handleFirestoreError(err, OperationType.LIST, 'conversations');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      const unsub = onSnapshot(
        query(collection(db, `conversations/${selectedConv.id}/messages`), orderBy('timestamp', 'asc')),
        (snap) => {
          setMessages(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
        },
        (err) => {
          if (!err.message?.includes('Quota exceeded')) {
            handleFirestoreError(err, OperationType.LIST, `conversations/${selectedConv.id}/messages`);
          }
        }
      );
      return () => unsub();
    }
  }, [selectedConv]);

  const toggleManual = async (conv: any) => {
    await updateDoc(doc(db, 'conversations', conv.id), { isManualMode: !conv.isManualMode });
  };

  const sendReply = async (fileUrl?: string, fileType?: string) => {
    if ((!reply.trim() && !fileUrl) || !selectedConv) return;
    
    const messageData: any = {
      text: reply,
      role: 'admin',
      timestamp: new Date().toISOString()
    };

    if (fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.fileType = fileType;
    }

    await addDoc(collection(db, `conversations/${selectedConv.id}/messages`), messageData);
    
    await updateDoc(doc(db, 'conversations', selectedConv.id), {
      lastMessage: reply || (fileType === 'image' ? 'Sent an image' : 'Sent a document'),
      lastUpdatedAt: new Date().toISOString(),
      needsAttention: false // Reset attention flag on reply
    });
    setReply('');
  };

  return (
    <div className="flex h-[calc(100vh-160px)] gap-10">
      <div className="w-1/3 bg-white border border-editorial-text overflow-y-auto">
        <div className="p-6 border-b border-editorial-text editorial-uppercase text-[10px] bg-editorial-muted">Active Conversations</div>
        {conversations.map(conv => (
          <div 
            key={conv.id} 
            onClick={() => setSelectedConv(conv)}
            className={cn(
              "p-8 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50",
              selectedConv?.id === conv.id && "bg-editorial-muted"
            )}
          >
            <div className="font-serif italic text-xl mb-2 flex items-center gap-2">
              {conv.userId.slice(0, 8)}...
              {conv.needsAttention && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="editorial-uppercase opacity-40 text-[9px] truncate">{conv.lastMessage}</div>
            <div className="flex items-center gap-2 mt-4">
              <div className={cn(
                "text-[8px] editorial-uppercase px-2 py-1 inline-block border",
                conv.isManualMode ? "border-green-500 text-green-500" : "border-gray-200 text-gray-400"
              )}>
                {conv.isManualMode ? 'Manual Control' : 'Auto AI'}
              </div>
              {conv.needsAttention && (
                <span className="text-[7px] font-black uppercase text-red-500 bg-red-50 px-2 py-1 tracking-tight">Requires Action</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-grow flex flex-col bg-white border border-editorial-text overflow-hidden">
        {selectedConv ? (
          <>
            <div className="p-8 border-b border-editorial-text flex justify-between items-center bg-editorial-muted">
              <div>
                <div className="font-serif italic text-2xl">Conversation with {selectedConv.userId.slice(0, 8)}</div>
                <div className="editorial-uppercase opacity-40 text-[9px]">Status: Active Record</div>
              </div>
              <button 
                onClick={() => toggleManual(selectedConv)}
                className={cn(
                  "editorial-uppercase text-[10px] px-6 py-2 border transition-all",
                  selectedConv.isManualMode ? "bg-green-500 text-white border-green-500" : "border-editorial-text hover:bg-editorial-text hover:text-editorial-bg"
                )}
              >
                {selectedConv.isManualMode ? 'Disable Manual' : 'Enable Manual Mode'}
              </button>
            </div>
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-12 space-y-10">
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "max-w-[70%] p-6 border",
                    msg.role === 'user' ? "bg-gray-50 border-gray-200" : "bg-editorial-text text-editorial-bg border-editorial-text"
                  )}>
                    {msg.fileUrl && (
                      <div className="mb-4">
                        {msg.fileType === 'image' ? (
                          <img 
                            src={msg.fileUrl} 
                            className="max-w-full h-auto border border-editorial-bg/20 grayscale hover:grayscale-0 transition-all cursor-zoom-in" 
                            onClick={() => window.open(msg.fileUrl, '_blank')} 
                            alt="Shared" 
                          />
                        ) : (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-editorial-bg/5 border border-editorial-bg/10 hover:bg-white/10 transition-all">
                            <FileText size={20} strokeWidth={1} />
                            <span className="editorial-uppercase text-[10px]">Registry Asset</span>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                    <div className="editorial-uppercase opacity-30 mt-4 text-[8px]">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 border-t border-editorial-text bg-gray-50">
              <div className="flex gap-4 items-center">
                <div className="p-2 border border-gray-200 bg-white rounded-lg opacity-40 hover:opacity-100 transition-opacity">
                  <FileUpload 
                    onUpload={(url) => sendReply(url, 'image')}
                    hideLabel
                    className="!p-0 !min-h-0 border-none bg-transparent"
                  />
                </div>
                <input 
                  type="text" 
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  disabled={!selectedConv.isManualMode}
                  placeholder={selectedConv.isManualMode ? "Type reply..." : "Enable manual mode to reply"}
                  className="flex-grow bg-white border border-gray-200 px-6 py-4 outline-none text-xs disabled:opacity-20 transition-all focus:border-editorial-text"
                />
                <button 
                  onClick={() => sendReply()}
                  disabled={!reply.trim() || !selectedConv.isManualMode}
                  className="bg-black text-white px-10 py-4 font-bold editorial-uppercase text-[10px] disabled:opacity-20 transition-all hover:bg-gray-800"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center bg-editorial-muted">
            <div className="text-center">
              <MessageCircle size={48} strokeWidth={1} className="mx-auto mb-6 opacity-20" />
              <div className="font-serif italic text-2xl opacity-40">Select a thread to respond</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminLegal = () => {
  const [legalContent, setLegalContent] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const snap = await getDocs(collection(db, 'legal'));
        setLegalContent(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Legal pages quota exceeded.');
        } else {
          handleFirestoreError(err, OperationType.LIST, 'legal');
        }
      }
    };
    fetchLegal();
  }, []);

  const saveLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const lData = {
      content: data.get('content'),
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'legal', editing.id), lData);
    setEditing(null);
  };

  return (
    <div className="space-y-12">
       <div className="mb-12 border-b border-editorial-text pb-6">
        <div className="editorial-uppercase mb-2">Charter // Governance</div>
        <h2 className="text-6xl font-serif italic tracking-tighter leading-none">System Content</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {legalContent.map(l => (
          <div key={l.id} className="bg-white border border-editorial-text p-10 flex flex-col items-center text-center">
            <FileText size={48} strokeWidth={1} className="mb-8 opacity-20" />
            <h3 className="font-serif italic text-3xl mb-4 uppercase">{l.type}</h3>
            <div className="editorial-uppercase opacity-40 text-[9px] mb-10">Last Revised: {new Date(l.updatedAt).toLocaleDateString()}</div>
            <button 
              onClick={() => setEditing(l)}
              className="w-full py-4 border border-editorial-text editorial-uppercase text-[10px] hover:bg-editorial-text hover:text-editorial-bg transition-all"
            >
              Modify Document
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[40px] p-12 max-w-4xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-6">
              <h3 className="text-3xl font-serif italic tracking-tighter uppercase">Edit {editing.type}</h3>
              <button onClick={() => setEditing(null)} className="editorial-uppercase text-[9px] opacity-40 hover:opacity-100">Dismiss</button>
            </div>
            <form onSubmit={saveLegal} className="space-y-10">
              <textarea 
                name="content" 
                defaultValue={editing.content} 
                className="w-full h-[50vh] p-8 bg-gray-50 border border-gray-200 font-sans text-sm leading-relaxed outline-none focus:border-editorial-text transition-all"
                placeholder="Markdown supported..."
              />
              <div className="flex justify-end gap-6">
                 <button type="button" onClick={() => setEditing(null)} className="px-10 py-5 editorial-uppercase text-[10px] border border-gray-200">Cancel</button>
                 <button type="submit" className="px-12 py-5 bg-editorial-text text-editorial-bg editorial-uppercase text-[10px] font-black">Publish Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminOverview = ({ stats }: { stats: any }) => {
  const [announcement, setAnnouncement] = useState('');

  const seedStore = async () => {
    const samples = [
      { name: 'ARCHIVE T-SHIRT 01', price: 1200, category: 'men', color: 'Bone', stock: 50, description: 'Premium cotton oversized t-shirt in bone white.', images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80'] },
      { name: 'SILK MIDI DRESS', price: 4500, category: 'women', color: 'Midnight', stock: 20, description: 'Hand-woven silk dress with architectural silhouette.', images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80'] },
      { name: 'KIDS ARCHIVE HOODIE', price: 1800, category: 'children', color: 'Slate', stock: 15, description: 'Miniature version of our signature heavy-weight hoodie.', images: ['https://images.unsplash.com/photo-1519233073523-633003a3d541?auto=format&fit=crop&q=80'] },
      { name: 'LINEN TROUSERS', price: 2800, category: 'men', color: 'Sand', stock: 30, description: 'Structured linen trousers with tapered fit.', images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80'] },
      { name: 'MINIMALIST TRENCH', price: 8500, category: 'women', color: 'Khaki', stock: 10, description: 'Water-resistant técnico trench coat.', images: ['https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&q=80'] }
    ];

    try {
      for (const s of samples) {
        await addDoc(collection(db, 'products'), {
          ...s,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      alert("Store seeded with 5 archive samples.");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const seedAds = async () => {
    const adSamples = [
      { type: 'display', enabled: true, title: 'THE MONOCHROME EDIT', description: 'Exploring the boundary between structure and fluidity. A collection of essential silhouettes.', url: '/shop', mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80' },
      { type: 'search', enabled: true, title: 'SEARCHING FOR PERFECTION', description: 'The archives are open. Discover timeless pieces.', url: '/shop', mediaUrl: '' },
      { type: 'native', enabled: true, title: 'THE FUTURE OF ARCHIVAL FASHION', description: 'A deep dive into sustainable luxury and why the archive matters in 2026.', url: '/legal', mediaUrl: '' },
      { type: 'social', enabled: true, title: 'JOIN THE REGISTRY', description: 'Follow our digital footprint for early access to collection drops.', url: 'https://instagram.com', mediaUrl: '' }
    ];

    try {
      for (const ad of adSamples) {
        await addDoc(collection(db, 'ads'), {
          ...ad,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      alert("System Ads initialized.");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'ads');
    }
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;
    await addDoc(collection(db, 'announcements'), {
      message: announcement,
      timestamp: new Date().toISOString()
    });
    setAnnouncement('');
    alert("Announcement published!");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: BarChart3, color: 'text-blue-500' },
          { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'text-green-500' },
          { label: 'Total Customers', value: stats.users, icon: Users, color: 'text-purple-500' },
          { label: 'Active Products', value: stats.products, icon: Box, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className={cn("p-3 rounded-2xl bg-gray-50 mb-6 inline-block", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{stat.label}</div>
            <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            Inventory Alerts
          </h3>
          <div className="space-y-4">
            {stats.lowStockItems.length === 0 ? (
              <p className="text-gray-400 text-sm">All products are healthy.</p>
            ) : (
              stats.lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl">
                  <div>
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-xs text-orange-600 font-bold">Only {item.stock} remaining!</div>
                  </div>
                  <Link to="/admin/products" className="text-xs font-black uppercase underline">Update Stock</Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-8 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings size={20} className="text-gray-500" />
              System Initialization
            </span>
            <div className="flex gap-4">
              <button 
                onClick={seedStore}
                className="editorial-uppercase text-[9px] underline underline-offset-4 opacity-40 hover:opacity-100 transition-opacity"
              >
                Seed Archives
              </button>
              <button 
                onClick={seedAds}
                className="editorial-uppercase text-[9px] underline underline-offset-4 opacity-40 hover:opacity-100 transition-opacity"
              >
                Seed Ads
              </button>
            </div>
          </h3>
          <p className="text-[10px] editorial-uppercase opacity-40 leading-relaxed">Utility system for rapid stock injection. Use only for base archive population.</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <Bell size={20} className="text-blue-500" />
            Platform Announcements
          </h3>
          <div className="space-y-4">
            <textarea 
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Write a message to all members..."
              className="w-full p-6 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-black transition-all text-sm min-h-[120px]"
            />
            <button 
              onClick={sendAnnouncement}
              disabled={!announcement.trim()}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase text-xs disabled:opacity-20 transition-all hover:bg-gray-800"
            >
              Publish Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminAds = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [showMediaPicker, setShowMediaPicker] = useState<string | null>(null);
  const [isUploadingToVault, setIsUploadingToVault] = useState(false);
  const [pickerTab, setPickerTab] = useState<'browse' | 'upload'>('browse');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const adTypes = [
    'display', 'search', 'social', 'video', 'native', 
    'shopping', 'retargeting', 'affiliate', 'influencer', 'email'
  ];

  useEffect(() => {
    const fetchAdsData = async () => {
      try {
        const adsSnap = await getDocs(query(collection(db, 'ads'), orderBy('createdAt', 'desc')));
        setAds(adsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const mediaSnap = await getDocs(collection(db, 'media'));
        setMedia(mediaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Ad manager quota exceeded.');
        } else {
          handleFirestoreError(err, OperationType.LIST, 'ads');
        }
      }
    };
    fetchAdsData();
  }, []);

  const handlePickerUpload = async (url: string) => {
    if (!showMediaPicker) return;
    setIsUploadingToVault(true);
    try {
      const mediaRef = await addDoc(collection(db, 'media'), {
        url,
        name: `Asset_${Date.now()}`,
        type: 'image',
        createdAt: new Date().toISOString()
      });
      
      // Auto-link to the ad being edited
      await updateDoc(doc(db, 'ads', showMediaPicker), { 
        mediaUrl: url,
        updatedAt: new Date().toISOString()
      });
      
      setShowMediaPicker(null);
      setPickerTab('browse');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'media');
    } finally {
      setIsUploadingToVault(false);
    }
  };

  const createAd = async () => {
    await addDoc(collection(db, 'ads'), {
      type: selectedType === 'all' ? 'display' : selectedType,
      enabled: false,
      title: 'NEW CAMPAIGN',
      description: 'Campaign copy records...',
      url: 'https://stylechat.app',
      mediaUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsAdding(false);
  };

  const toggleAd = async (id: string, enabled: boolean) => {
    await updateDoc(doc(db, 'ads', id), { enabled: !enabled, updatedAt: new Date().toISOString() });
  };

  const updateAd = async (id: string, updates: any) => {
    await updateDoc(doc(db, 'ads', id), { ...updates, updatedAt: new Date().toISOString() });
  };

  const deleteAd = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ads', id));
      setIsDeletingId(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `ads/${id}`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end border-b border-editorial-text pb-6">
        <div>
          <div className="editorial-uppercase mb-2">Omnichannel // Campaigns</div>
          <h2 className="text-6xl font-serif italic tracking-tighter leading-none">Ad Manager</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-8 py-4 font-black editorial-uppercase text-[10px] flex items-center gap-2 hover:bg-gray-800 transition-all"
        >
          <Plus size={14} /> Initialize Campaign
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {['all', ...adTypes].map(type => (
          <button 
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
              selectedType === type ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-editorial-muted p-8 border border-editorial-text">
          <div className="editorial-uppercase text-[8px] opacity-40 mb-4 font-black">Total impressions</div>
          <div className="text-4xl font-serif italic">{ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0).toLocaleString()}</div>
        </div>
        <div className="bg-editorial-muted p-8 border border-editorial-text">
          <div className="editorial-uppercase text-[8px] opacity-40 mb-4 font-black">Total Clicks</div>
          <div className="text-4xl font-serif italic">{ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0).toLocaleString()}</div>
        </div>
        <div className="bg-editorial-muted p-8 border border-editorial-text">
          <div className="editorial-uppercase text-[8px] opacity-40 mb-4 font-black">Avg. CTR</div>
          <div className="text-4xl font-serif italic">
            {((ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0) / (ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0) || 1)) * 100).toFixed(2)}%
          </div>
        </div>
        <div className="bg-editorial-muted p-8 border border-editorial-text">
          <div className="editorial-uppercase text-[8px] opacity-40 mb-4 font-black">Active nodes</div>
          <div className="text-4xl font-serif italic">{ads.filter(a => a.enabled).length} / {ads.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {ads.filter(a => selectedType === 'all' || a.type === selectedType).map(ad => {
            const ctr = ((ad.clicks || 0) / (ad.impressions || 1)) * 100;
            return (
              <motion.div 
                layout
                key={ad.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-editorial-text p-8 relative group"
              >
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 border border-editorial-text", ad.enabled ? "bg-black text-white" : "bg-gray-50 text-gray-400")}>
                      <Megaphone size={16} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest">{ad.type}</div>
                        <div className="text-[8px] opacity-40 uppercase font-bold">CTR: {ctr.toFixed(2)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleAd(ad.id, ad.enabled)} className={cn("w-10 h-5 rounded-full relative transition-colors", ad.enabled ? "bg-green-500" : "bg-gray-200")}>
                      <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", ad.enabled ? "left-5.5" : "left-0.5")} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDeletingId(ad.id);
                      }} 
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-gray-100">
                    <div>
                        <div className="editorial-uppercase text-[7px] opacity-40 mb-1">Impressions</div>
                        <div className="font-serif italic text-xl">{(ad.impressions || 0).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="editorial-uppercase text-[7px] opacity-40 mb-1">Clicks</div>
                        <div className="font-serif italic text-xl">{(ad.clicks || 0).toLocaleString()}</div>
                    </div>
                </div>

                <div className="space-y-6">
                <input 
                  defaultValue={ad.title}
                  onBlur={(e) => updateAd(ad.id, { title: e.target.value })}
                  className="w-full bg-transparent border-b border-gray-100 py-2 text-sm font-black uppercase outline-none focus:border-black"
                  placeholder="CAMPAIGN_TITLE"
                />
                <textarea 
                  defaultValue={ad.description}
                  onBlur={(e) => updateAd(ad.id, { description: e.target.value })}
                  className="w-full bg-gray-50 p-4 text-[10px] editorial-uppercase min-h-24 outline-none border border-transparent focus:border-black"
                  placeholder="COPYWRITING_RECORD"
                />
                
                <div 
                  onClick={() => setShowMediaPicker(ad.id)}
                  className="aspect-video bg-editorial-muted/50 border border-dashed border-editorial-text/20 cursor-pointer overflow-hidden flex items-center justify-center relative group/media"
                >
                  {ad.mediaUrl ? (
                    <>
                      <img src={ad.mediaUrl} className="w-full h-full object-cover grayscale group-hover/media:grayscale-0 transition-all" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 flex items-center justify-center text-[10px] text-white font-black uppercase">Change Asset</div>
                    </>
                  ) : (
                    <div className="text-[10px] editorial-uppercase opacity-30 flex flex-col items-center gap-2">
                       <Camera size={20} strokeWidth={1} />
                       Link Media Records
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[500] flex items-center justify-center p-8" onClick={() => setShowMediaPicker(null)}>
          <div className="bg-white max-w-4xl w-full p-12 overflow-y-auto max-h-[80vh] relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowMediaPicker(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 transition-all">
              <X size={20} />
            </button>
            
            <div className="flex justify-between items-end mb-10 border-b border-gray-100 pb-6">
              <div>
                <div className="editorial-uppercase mb-1 opacity-40">Campaign // Media Selection</div>
                <h3 className="text-4xl font-serif italic tracking-tighter">Central Media Vault</h3>
              </div>
              <div className="flex gap-8">
                {['browse', 'upload'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setPickerTab(tab as any)}
                    className={cn(
                      "pb-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
                      pickerTab === tab ? "text-black" : "text-gray-300 hover:text-black"
                    )}
                  >
                    {tab === 'browse' ? 'Select Asset' : 'Deposit New'}
                    {pickerTab === tab && <motion.div layoutId="picker-tab-bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
                  </button>
                ))}
              </div>
            </div>

            {pickerTab === 'browse' ? (
              <div className="grid grid-cols-4 gap-6">
                {media.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => {
                      updateAd(showMediaPicker, { mediaUrl: m.url });
                      setShowMediaPicker(null);
                    }}
                    className="aspect-square bg-gray-100 cursor-pointer border border-transparent hover:border-black transition-all relative group overflow-hidden"
                  >
                    <img src={m.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white text-editorial-text editorial-uppercase text-[8px] px-3 py-1 font-black">Link Record</div>
                    </div>
                  </div>
                ))}
                {media.length === 0 && (
                  <div className="col-span-4 py-20 text-center opacity-40 editorial-uppercase italic tracking-widest border border-dashed border-gray-200">
                    Vault is empty. Utilize deposit system.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10">
                {isUploadingToVault ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    <div className="editorial-uppercase text-[10px] font-black tracking-widest animate-pulse">Syncing with Cloud Vault...</div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gray-50 border border-editorial-text p-8">
                       <FileUpload 
                        onUpload={handlePickerUpload}
                        label="Drag & Drop Asset for Immediate Campaign Linking"
                        className="aspect-video"
                      />
                    </div>
                    <div className="bg-editorial-muted p-6 border-l-4 border-editorial-text">
                      <div className="editorial-uppercase text-[9px] font-black mb-2">Vault Policy</div>
                      <p className="text-[10px] opacity-60 leading-relaxed uppercase">Uploaded assets are automatically registered in the global media records and linked to campaign sequence ID: <span className="font-black text-black">{showMediaPicker}</span>.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Ad Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-[500] flex items-center justify-center p-4">
          <div className="bg-white p-12 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-serif italic mb-8">Initialize Campaign</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] editorial-uppercase mb-2 block">Select Channel</label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full border border-editorial-text p-4 text-[10px] editorial-uppercase outline-none"
                >
                  {adTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 border border-editorial-text editorial-uppercase text-[10px]">Cancel</button>
                <button onClick={createAd} className="flex-1 py-4 bg-black text-white editorial-uppercase text-[10px]">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {isDeletingId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-sm w-full p-12 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-serif italic mb-4">Purge Campaign?</h3>
            <p className="text-[10px] editorial-uppercase opacity-40 mb-8 leading-relaxed">This action will permanently remove the advertisement record from the omnichannel registry.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeletingId(null)}
                className="flex-1 py-4 border border-editorial-text editorial-uppercase text-[10px] font-black tracking-widest hover:bg-gray-50"
              >
                Retain
              </button>
              <button 
                onClick={() => deleteAd(isDeletingId)}
                className="flex-1 py-4 bg-red-600 text-white editorial-uppercase text-[10px] font-black tracking-widest hover:bg-red-700"
              >
                Confirm Purge
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};


const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [variantColors, setVariantColors] = useState<string[]>([]);
  const [variantSizes, setVariantSizes] = useState<string[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Products management quota exceeded.');
        } else {
          handleFirestoreError(err, OperationType.LIST, 'products');
        }
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isEditing) {
      setProductImages(isEditing.images || []);
      setVariantColors(isEditing.colors || []);
      setVariantSizes(isEditing.sizes || []);
    } else {
      setProductImages([]);
      setVariantColors([]);
      setVariantSizes([]);
    }
  }, [isEditing, showAdd]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const pData = {
      name: data.get('name'),
      price: Number(data.get('price')),
      category: data.get('category'),
      stock: Number(data.get('stock')),
      description: data.get('description'),
      images: productImages.filter(img => img !== ''),
      colors: variantColors,
      sizes: variantSizes,
      updatedAt: new Date().toISOString()
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'products', isEditing.id), pData);
      } else {
        await addDoc(collection(db, 'products'), { ...pData, createdAt: new Date().toISOString() });
      }
      setIsEditing(null);
      setShowAdd(false);
      setProductImages([]);
      setVariantColors([]);
      setVariantSizes([]);
    } catch (err) {
      handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, isEditing ? `products/${isEditing.id}` : 'products');
    }
  };

  const toggleStockStatus = async (id: string, currentStock: number) => {
    const newStock = currentStock > 0 ? 0 : 50;
    try {
      await updateDoc(doc(db, 'products', id), { stock: newStock, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setIsDeletingId(null);
    } catch (err) {
      console.error("Delete failed:", err);
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Products</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-100 p-4 rounded-2xl text-[10px] uppercase font-black tracking-widest outline-none focus:border-black transition-all shadow-sm"
          >
            <option value="all">ALL CATEGORIES</option>
            <option value="men">MEN</option>
            <option value="women">WOMEN</option>
            <option value="children">CHILDREN</option>
          </select>
          <div className="relative flex-grow">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS_" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs outline-none focus:border-black transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-black text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 text-xs flex-shrink-0"
          >
            <Plus size={16} /> ADD PRODUCT
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
            <tr>
              <th className="px-8 py-4">Product</th>
              <th className="px-8 py-4">Category</th>
              <th className="px-8 py-4">Price</th>
              <th className="px-8 py-4">Inventory Status</th>
              <th className="px-8 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-4">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400">NO IMG</div>
                    )}
                    <span className="font-bold text-sm">{p.name}</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-xs font-black uppercase text-gray-400">{p.category}</td>
                <td className="px-8 py-4 font-black">{formatPrice(p.price)}</td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1 min-w-[120px]">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase inline-block w-fit tracking-widest",
                        p.stock === 0 ? "bg-red-500 text-white" : p.stock <= 5 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                      )}>
                        {p.stock === 0 ? "OUT OF STOCK" : p.stock <= 5 ? `LOW STOCK: ${p.stock}` : `IN STOCK: ${p.stock}`}
                      </span>
                      <span className="text-[10px] opacity-40 italic">Inventory Count</span>
                    </div>

                    <button 
                      onClick={() => toggleStockStatus(p.id, p.stock)}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none border border-editorial-text/10",
                        p.stock > 0 ? "bg-green-500" : "bg-gray-200"
                      )}
                    >
                      <motion.div 
                        animate={{ x: p.stock > 0 ? 24 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(p);
                      }} 
                      className="p-2 hover:bg-gray-200 rounded-lg"
                      title="Edit Product"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsDeletingId(p.id);
                      }} 
                      className="p-2 hover:bg-red-100 hover:text-red-500 rounded-lg group"
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isDeletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Discard Product?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">This action will permanently remove this item from the store records. This cannot be undone.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeletingId(null)} 
                className="flex-grow py-4 bg-gray-100 rounded-2xl font-bold uppercase text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteProduct(isDeletingId)} 
                className="flex-grow py-4 bg-red-500 text-white rounded-2xl font-bold uppercase text-xs hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex justify-end">
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-black text-white px-10 py-5 rounded-[24px] font-bold flex items-center gap-3 hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
        >
          <Plus size={20} />
          <span className="uppercase tracking-widest text-xs">Save New Product</span>
        </button>
      </div>

      {(showAdd || isEditing) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter">{isEditing ? 'Edit Product' : 'Save New Product'}</h3>
            <form onSubmit={saveProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="editorial-uppercase text-[10px] opacity-40">Basic Info</label>
                  <input name="name" defaultValue={isEditing?.name} placeholder="Product Name" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-black" required />
                  <div className="grid grid-cols-2 gap-4">
                    <input name="price" type="number" defaultValue={isEditing?.price} placeholder="Price" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-black" required />
                    <input name="stock" type="number" defaultValue={isEditing?.stock} placeholder="Initial Stock" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-black" required />
                  </div>
                  <select name="category" defaultValue={isEditing?.category} className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-black">
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="children">Children</option>
                  </select>
                  <textarea name="description" defaultValue={isEditing?.description} placeholder="Description" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-black h-32" />
                </div>

                <div className="space-y-4">
                  <label className="editorial-uppercase text-[10px] opacity-40">Variants & Media</label>
                  
                  {/* Colors */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="new-color"
                        placeholder="Add Color (e.g. Noir)" 
                        className="flex-grow p-4 bg-gray-50 rounded-2xl outline-none border focus:border-black text-xs transition-all" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !variantColors.includes(val)) {
                              setVariantColors([...variantColors, val]);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('new-color') as HTMLInputElement;
                          const val = input.value.trim();
                          if (val && !variantColors.includes(val)) {
                            setVariantColors([...variantColors, val]);
                            input.value = '';
                          }
                        }}
                        className="bg-black text-white p-4 rounded-2xl aspect-square flex items-center justify-center hover:bg-gray-800 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {variantColors.map(c => (
                        <motion.span 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={c} 
                          className="pl-4 pr-2 py-2 bg-editorial-text text-editorial-bg rounded-full text-[9px] font-black uppercase flex items-center gap-3 tracking-widest border border-editorial-text"
                        >
                          {c}
                          <button type="button" onClick={() => setVariantColors(variantColors.filter(x => x !== c))} className="p-1 hover:bg-white/20 rounded-full"><X size={12} /></button>
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="new-size"
                        placeholder="Add Size (e.g. XL)" 
                        className="flex-grow p-4 bg-gray-50 rounded-2xl outline-none border focus:border-black text-xs transition-all" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !variantSizes.includes(val)) {
                              setVariantSizes([...variantSizes, val]);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('new-size') as HTMLInputElement;
                          const val = input.value.trim();
                          if (val && !variantSizes.includes(val)) {
                            setVariantSizes([...variantSizes, val]);
                            input.value = '';
                          }
                        }}
                        className="bg-black text-white p-4 rounded-2xl aspect-square flex items-center justify-center hover:bg-gray-800 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {variantSizes.map(s => (
                        <motion.span 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={s} 
                          className="pl-4 pr-2 py-2 border-2 border-editorial-text rounded-full text-[9px] font-black uppercase flex items-center gap-3 tracking-widest"
                        >
                          {s}
                          <button type="button" onClick={() => setVariantSizes(variantSizes.filter(x => x !== s))} className="p-1 hover:bg-editorial-text/10 rounded-full"><X size={12} /></button>
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Multiple Images */}
                  <div className="space-y-4">
                    <FileUpload 
                      onUpload={(url) => setProductImages([...productImages, url])} 
                      label="Add Product Photo"
                      className="rounded-2xl"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {productImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          {img && <img src={img} className="w-full h-full object-cover rounded-xl border border-gray-100" />}
                          <button 
                            type="button"
                            onClick={() => setProductImages(productImages.filter((_, i) => i !== idx))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsEditing(null); setShowAdd(false); }} className="flex-grow py-4 bg-gray-100 rounded-2xl font-bold uppercase text-xs">Cancel</button>
                <button type="submit" className="flex-grow py-4 bg-black text-white rounded-2xl font-bold uppercase text-xs">Save Product</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Orders management quota exceeded.');
        } else {
          handleFirestoreError(err, OperationType.LIST, 'orders');
        }
      }
    };
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'orders', id), { status, updatedAt: new Date().toISOString() });
  };

  const verifyPayment = async (id: string) => {
    await updateDoc(doc(db, 'orders', id), { paymentStatus: 'paid', status: 'processing', updatedAt: new Date().toISOString() });
  };

  const handleDownloadInvoice = (order: any) => {
    const pdf = generateInvoicePDF(order);
    pdf.save(`Invoice_StyleClothes_${order.id.slice(0, 8)}.pdf`);
  };

  const handleBulkDownload = () => {
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    selectedOrders.forEach((o, index) => {
      // Delay to prevent browser blocking multiple downloads
      setTimeout(() => {
        const pdf = generateInvoicePDF(o);
        pdf.save(`Invoice_StyleClothes_${o.id.slice(0, 8)}.pdf`);
      }, index * 500);
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items?.some((item: any) => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Orders</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          {selectedOrderIds.length > 0 && (
            <button 
              onClick={handleBulkDownload}
              className="bg-black text-white px-6 py-4 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl shadow-black/10 transition-transform active:scale-95"
            >
              <FileText size={16} /> DOWNLOAD {selectedOrderIds.length} INVOICES
            </button>
          )}
          
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-100 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all shadow-sm"
            >
              <option value="all">ALL STATUS</option>
              <option value="pending">PENDING</option>
              <option value="processing">PROCESSING</option>
              <option value="shipped">SHIPPED</option>
              <option value="delivered">DELIVERED</option>
              <option value="cancelled">CANCELLED</option>
            </select>

            <select 
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-white border border-gray-100 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all shadow-sm"
            >
              <option value="all">ALL PAYMENT</option>
              <option value="pending">UNPAID</option>
              <option value="pending_verification">VERIFYING</option>
              <option value="paid">PAID</option>
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search Order ID / Item / Email" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs outline-none focus:border-black transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
            <tr>
              <th className="px-8 py-4 w-10">
                <input 
                  type="checkbox" 
                  checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0} 
                  onChange={toggleSelectAll} 
                  className="w-4 h-4 rounded border-gray-300"
                />
              </th>
              <th className="px-8 py-4">Order ID</th>
              <th className="px-8 py-4">Total</th>
              <th className="px-8 py-4">Details & Status</th>
              <th className="px-8 py-4">Payment</th>
              <th className="px-8 py-4">Proof</th>
              <th className="px-8 py-4">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(o => (
                <tr key={o.id} className={cn("hover:bg-gray-50/50 transition-colors", selectedOrderIds.includes(o.id) && "bg-blue-50/30")}>
                <td className="px-8 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedOrderIds.includes(o.id)} 
                    onChange={() => toggleSelect(o.id)} 
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </td>
                <td className="px-8 py-4">
                  <div 
                    onClick={() => setViewingOrder(o)}
                    className="text-xs font-mono cursor-pointer hover:underline text-blue-600 font-bold"
                  >
                    {o.id}
                  </div>
                  <div className="text-[9px] opacity-40 mt-1">{new Date(o.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-8 py-4 font-black">{formatPrice(o.totalAmount)}</td>
                <td className="px-8 py-4">
                  <div className="text-[10px] space-y-1 mb-2">
                    {o.items?.map((item: any, i: number) => (
                      <div key={i} className="bg-gray-50 p-2 rounded border border-gray-100 font-bold uppercase tracking-widest text-[8px] opacity-60">
                         {item.name} | {item.size} {item.color && `/ ${item.color}`} | QTY: {item.quantity}
                      </div>
                    ))}
                  </div>
                   <select 
                    value={o.status} 
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="bg-white border text-xs font-bold p-2 rounded-lg outline-none w-full"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-8 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block",
                    o.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : o.paymentStatus === 'pending_verification' ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"
                  )}>{o.paymentStatus}</span>
                </td>
                <td className="px-8 py-4">
                  {(o.paymentProofUrl || o.paymentProof) ? (
                    <button 
                      onClick={() => setSelectedProof(o.paymentProofUrl || o.paymentProof)}
                      className="text-blue-500 font-black text-[10px] hover:underline flex items-center gap-1 uppercase tracking-widest"
                    >
                      <Eye size={12} /> View Proof
                    </button>
                  ) : <span className="text-gray-300 text-xs">-</span>}
                </td>
                <td className="px-8 py-4">
                  <div className="flex flex-col gap-2">
                    {o.paymentStatus === 'pending_verification' && (
                      <button onClick={() => verifyPayment(o.id)} className="bg-green-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2">
                         <CheckCircle size={14} /> VERIFY
                      </button>
                    )}
                    <button 
                      onClick={() => handleDownloadInvoice(o)}
                      className="border border-editorial-text p-2 rounded-lg hover:bg-gray-100 transition-colors flex justify-center"
                      title="Download Invoice"
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-8 py-20 text-center opacity-20 font-black text-[10px] uppercase tracking-widest leading-relaxed">
                No orders found matching your search criteria.
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedProof && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-20" onClick={() => setSelectedProof(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
            >
              <button 
                onClick={() => setSelectedProof(null)}
                className="absolute -top-12 right-12 text-white flex items-center gap-2 editorial-uppercase text-[10px] font-black tracking-widest hover:line-through shadow-xl"
              >
                Dismiss <X size={20} />
              </button>
              <img 
                src={selectedProof} 
                alt="Payment Proof" 
                className="max-w-full max-h-[85vh] object-contain shadow-2xl border-2 border-white/5 shadow-white/5 rounded-sm" 
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </div>
        )}

        {viewingOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setViewingOrder(null)}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Order Snapshot</h3>
                <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-10 mb-10">
                <div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Registry Details</div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[9px] font-bold opacity-30 uppercase">Order ID</div>
                      <div className="text-xs font-mono">{viewingOrder.id}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold opacity-30 uppercase">Time Record</div>
                      <div className="text-sm font-medium">{new Date(viewingOrder.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold opacity-30 uppercase">Status</div>
                      <div className="text-sm font-bold text-orange-600 uppercase tracking-widest">{viewingOrder.status}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Delivery Archive</div>
                  <div className="text-xs leading-relaxed font-medium">
                    {viewingOrder.shippingAddress || 'No address provided in registry.'}
                  </div>
                  {viewingOrder.location && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                      <MapPin size={16} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase">Live Location Pinned</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-10">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Inventory Breakdown</div>
                <div className="space-y-3">
                  {viewingOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-[10px] opacity-40 uppercase font-black">{item.size} {item.color && `/ ${item.color}`}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-xs opacity-40 uppercase">x{item.quantity}</div>
                        <div className="font-black text-sm">{formatPrice(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-end pt-10 border-t border-gray-100">
                <div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Financial Record</div>
                  <div className="text-4xl font-black tracking-tighter">{formatPrice(viewingOrder.totalAmount)}</div>
                </div>
                <button 
                  onClick={() => handleDownloadInvoice(viewingOrder)}
                  className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
                >
                  <FileText size={18} /> DOWNLOAD INVOICE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<any>({
    revenue: 0,
    orders: 0,
    users: 0,
    products: 0,
    lowStockItems: []
  });
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    const q = query(collection(db, 'conversations'), where('needsAttention', '==', true));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUnreadChatCount(snap.size);
    }, (err) => {
      if (!err.message?.includes('Quota exceeded')) {
        console.error("Unread chat count listener error:", err);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const productsSnap = await getDocs(collection(db, 'products'));
        const usersSnap = await getDocs(collection(db, 'users'));

        const revenue = ordersSnap.docs.reduce((acc, doc) => {
          const data = doc.data();
          return data.paymentStatus === 'paid' ? acc + data.totalAmount : acc;
        }, 0);

        const lowStockItems = productsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((p: any) => p.stock <= 5);

        setStats({
          revenue,
          orders: ordersSnap.size,
          users: usersSnap.size,
          products: productsSnap.size,
          lowStockItems
        });
      } catch (err: any) {
        if (err.message?.includes('Quota exceeded')) {
          console.warn('Admin stats fetch quota exceeded.');
          // Provide some static or empty stats instead of crashing
          setStats({
            revenue: 0,
            orders: 0,
            users: 0,
            products: 0,
            lowStockItems: [],
            isQuotaExceeded: true
          });
        } else {
          handleFirestoreError(err, OperationType.LIST, 'admin_stats');
        }
      }
    };
    fetchData();
  }, []);

  const menuItems = [
    { name: 'Overview', icon: BarChart3, path: '/admin' },
    { name: 'Products', icon: Box, path: '/admin/products' },
    { name: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { name: 'Media Vault', icon: FileText, path: '/admin/media' },
    { name: 'Communications', icon: MessageCircle, path: '/admin/chat' },
    { name: 'Campaigns', icon: Megaphone, path: '/admin/ads' },
    { name: 'Legal Pages', icon: Settings, path: '/admin/legal' },
    { name: 'Users', icon: Users, path: '/admin/users' },
  ];


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return <div>Checking authorization...</div>;
  if (!isAdmin) return null;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Mobile/Tablet/Laptop Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[35] xl:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile/Tablet/Laptop Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="xl:hidden fixed bottom-6 left-6 z-[60] p-4 bg-black text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "w-72 bg-white border-r border-gray-100 flex flex-col p-8 fixed h-full z-[40] transition-transform xl:translate-x-0 duration-300 ease-in-out shadow-2xl xl:shadow-none",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-xl font-black tracking-tight">STYLE ADMIN</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="xl:hidden opacity-40 hover:opacity-100">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-2 flex-grow overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <Link 
              key={item.name} 
              to={item.path} 
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                "flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-sm transition-all",
                location.pathname === item.path ? "bg-black text-white shadow-xl shadow-black/10" : "text-gray-400 hover:bg-gray-50 hover:text-black"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} />
                {item.name}
              </div>
              {item.name === 'Communications' && unreadChatCount > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-red-500/20">
                  {unreadChatCount}
                </span>
              )}
            </Link>
          ))}
        </div>
        <button onClick={() => navigate('/')} className="text-gray-400 font-bold text-sm flex items-center gap-2 px-6 py-4 mt-auto">
          <ArrowLeft size={18} /> Back to Store
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow xl:ml-72 p-6 md:p-12 min-h-screen">
        <Routes>
          <Route index element={<AdminOverview stats={stats} />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="media" element={<MediaGallery />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="legal" element={<AdminLegal />} />
          <Route path="users" element={<AdminUsers />} />
        </Routes>

      </div>
    </div>
  );
}
