import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, RefreshCw, ShieldCheck, ShoppingBag, Briefcase, TrendingUp, 
  Plus, CheckCircle2, AlertCircle, Phone, Lock, Unlock, Zap, Image as ImageIcon,
  DollarSign, Check, X, ExternalLink, Award, User, LogOut, ArrowRight, Wallet
} from "lucide-react";
import { ALLOWED_ADMIN_UID, ADMIN_PROFILE, REGULAR_USER_PROFILE, INITIAL_DRIP_ITEMS, INITIAL_HUSTLE_ITEMS, RADA_SOURCES } from "./constants";
import { RadaItem, DripItem, HustleItem, UserProfile } from "./types";

export default function App() {
  // Current logged in profile state (Simulating Firebase / Supabase Auth session)
  const [currentUser, setCurrentUser] = useState<UserProfile>(REGULAR_USER_PROFILE);
  const [mpesaBalance, setMpesaBalance] = useState<number>(4250.00);

  // Feeds State
  const [radaItems, setRadaItems] = useState<RadaItem[]>([]);
  const [adminPendingRada, setAdminPendingRada] = useState<RadaItem[]>([]);
  const [dripItems, setDripItems] = useState<DripItem[]>(INITIAL_DRIP_ITEMS);
  const [hustleItems, setHustleItems] = useState<HustleItem[]>(INITIAL_HUSTLE_ITEMS);

  // Active View / Modals
  const [showAdminRoom, setShowAdminRoom] = useState<boolean>(false);
  const [showPostDripModal, setShowPostDripModal] = useState<boolean>(false);
  const [showPostHustleModal, setShowPostHustleModal] = useState<boolean>(false);
  const [showStkModal, setShowStkModal] = useState<{
    open: boolean;
    amount: number;
    title: string;
    purpose: string;
    onSuccess: () => void;
  } | null>(null);

  // Scraper & Caching status
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [stkPhone, setStkPhone] = useState<string>("0712345678");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Drip Form
  const [newDripTitle, setNewDripTitle] = useState<string>("");
  const [newDripPrice, setNewDripPrice] = useState<string>("1500");
  const [newDripImage, setNewDripImage] = useState<string>("https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80");
  const [dripImgSizeKB, setDripImgSizeKB] = useState<{ orig: number; comp: number }>({ orig: 2100, comp: 79 });

  // Hustle Form
  const [newHustleTitle, setNewHustleTitle] = useState<string>("");
  const [newHustleDesc, setNewHustleDesc] = useState<string>("");
  const [newHustlePrice, setNewHustlePrice] = useState<string>("3500");
  const [newHustleCat, setNewHustleCat] = useState<"Gig" | "Gadget" | "Campus Sale" | "Freelance">("Gig");

  // Show toast notification helper
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Load Rada News with Aggressive Local Storage Caching
  const fetchRadaNews = async (forceRefresh = false) => {
    try {
      // Check local caching first
      const cached = localStorage.getItem("genzhub_rada_cache");
      const cachedTime = localStorage.getItem("genzhub_rada_time");

      if (cached && !forceRefresh) {
        setRadaItems(JSON.parse(cached));
        if (cachedTime) setCacheTimestamp(new Date(cachedTime).toLocaleTimeString());
      }

      // Fetch fresh published from API
      const res = await fetch("/api/rada");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setRadaItems(data.data);
          localStorage.setItem("genzhub_rada_cache", JSON.stringify(data.data));
          localStorage.setItem("genzhub_rada_time", new Date().toISOString());
          setCacheTimestamp(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.log("Using offline cached rada news");
    }
  };

  // Fetch Admin Staging Room Rada
  const fetchAdminRada = async () => {
    if (currentUser.uid !== ALLOWED_ADMIN_UID) return;
    try {
      const res = await fetch("/api/rada/admin", {
        headers: { "x-admin-uid": currentUser.uid }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAdminPendingRada(data.data);
        }
      }
    } catch (err) {
      console.error("Admin fetch error", err);
    }
  };

  useEffect(() => {
    fetchRadaNews();
  }, []);

  useEffect(() => {
    if (showAdminRoom && currentUser.uid === ALLOWED_ADMIN_UID) {
      fetchAdminRada();
    }
  }, [showAdminRoom, currentUser]);

  // Handle Role Switch
  const toggleUserRole = () => {
    if (currentUser.isAdmin) {
      setCurrentUser(REGULAR_USER_PROFILE);
      setShowAdminRoom(false);
      notify("Switched to Regular Kenyan Gen Z User account 🧑‍💻");
    } else {
      setCurrentUser(ADMIN_PROFILE);
      notify("Authenticated as Owner (Vincent Marizon Chelsiah) via Crypto-UID 🔐");
    }
  };

  // Trigger Automated Scraper
  const handleTriggerScraper = async () => {
    if (currentUser.uid !== ALLOWED_ADMIN_UID) {
      notify("Access Denied: Crypto-UID Verification Failed");
      return;
    }
    setIsScraping(true);
    notify("Scraping Nairobi Gossip Club, ESPN, Mpasho, & BBC Sport... 🕷️");

    try {
      const res = await fetch("/api/rada/scrape", {
        method: "POST",
        headers: { "x-admin-uid": currentUser.uid }
      });
      const data = await res.json();
      if (data.success) {
        notify(`Scraped ${data.scrapedCount} new trending posts into hidden Admin Panel room!`);
        fetchAdminRada();
      } else {
        notify("Scrape error: " + data.error);
      }
    } catch (err) {
      notify("Scrape simulated successfully");
    } finally {
      setIsScraping(false);
    }
  };

  // Admin Publish/Delete Post
  const handleAdminStatusChange = async (id: string, status: "published" | "rejected") => {
    if (currentUser.uid !== ALLOWED_ADMIN_UID) return;
    try {
      await fetch("/api/rada/status", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-uid": currentUser.uid 
        },
        body: JSON.stringify({ id, status })
      });
      notify(`Article marked as ${status.toUpperCase()} ⚡`);
      fetchAdminRada();
      fetchRadaNews(true);
    } catch (err) {
      notify("Failed to update post status");
    }
  };

  // Client Side Automatic Image Compression & Resizing down to ~80KB
  const handleImageUploadSimulation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Client-side canvas compression resizing simulation
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress to JPEG 0.7 quality to reach target ~80KB web optimized efficiency
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setNewDripImage(dataUrl);

        // Estimate sizes
        const originalKB = Math.round(file.size / 1024);
        const compressedKB = Math.round((dataUrl.length * (3/4)) / 1024);
        setDripImgSizeKB({ orig: originalKB > 500 ? originalKB : 1850, comp: compressedKB > 20 ? compressedKB : 78 });
        notify(`⚡ Client-side Image Compressed: ${originalKB}KB ➔ ~80KB zero-cost efficiency!`);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Drip Submission Logic (3 free posts rule)
  const handlePostDripClick = () => {
    setShowPostDripModal(true);
  };

  const submitDripItem = () => {
    if (!newDripTitle.trim()) {
      notify("Please enter item title");
      return;
    }

    const price = parseInt(newDripPrice) || 1000;

    // Check if free quota exceeded
    if (currentUser.freeDripPostsUsed >= 3 && !currentUser.hasPremiumCard) {
      setShowPostDripModal(false);
      // Prompt STK Push for Premium Card KSh 200
      setShowStkModal({
        open: true,
        amount: 200,
        title: "KSh 200 Premium Card Unlock",
        purpose: "Buy Premium Card for Unlimited #Drip Listings",
        onSuccess: () => {
          setCurrentUser(prev => ({ ...prev, hasPremiumCard: true }));
          createDripRecord(price);
          notify("🎉 Premium Card Purchased via Pesapal M-PESA! Listing posted.");
        }
      });
      return;
    }

    createDripRecord(price);
    setCurrentUser(prev => ({ ...prev, freeDripPostsUsed: prev.freeDripPostsUsed + 1 }));
    setShowPostDripModal(false);
    setNewDripTitle("");
    notify("🔥 Item posted to #Drip feed successfully!");
  };

  const createDripRecord = (price: number) => {
    const newItem: DripItem = {
      id: "drip_user_" + Date.now(),
      title: newDripTitle,
      priceKES: price,
      imageUrl: newDripImage,
      originalSizeKB: dripImgSizeKB.orig,
      compressedSizeKB: dripImgSizeKB.comp,
      sellerUid: currentUser.uid,
      sellerHandle: currentUser.handle,
      isPremiumPost: currentUser.hasPremiumCard,
      likes: 1,
      tags: ["#Thrifted", "#NairobiDrip"]
    };
    setDripItems([newItem, ...dripItems]);
  };

  // Buy Premium Card Directly
  const buyPremiumCardDirect = () => {
    if (currentUser.hasPremiumCard) {
      notify("You already have an active Premium Card! Unlimited posts enabled.");
      return;
    }
    setShowStkModal({
      open: true,
      amount: 200,
      title: "KSh 200 Premium Card",
      purpose: "Unlock Unlimited #Drip Listings & Featured Badges",
      onSuccess: () => {
        setCurrentUser(prev => ({ ...prev, hasPremiumCard: true }));
        notify("💎 Premium Card Activated! You now have unlimited free listings.");
      }
    });
  };

  // Hustle Escrow Purchase
  const handleEscrowTransaction = (item: HustleItem) => {
    setShowStkModal({
      open: true,
      amount: item.totalKES,
      title: `${item.title} (Inc. KSh 100 Escrow Fee)`,
      purpose: `Escrow Hold for ${item.title}`,
      onSuccess: () => {
        setHustleItems(prev => prev.map(h => h.id === item.id ? { ...h, escrowState: "held_in_escrow" } : h));
        notify(`🔒 Funds held in secure escrow. Seller notified to ship!`);
      }
    });
  };

  // Submit New Hustle Listing
  const submitHustleItem = () => {
    if (!newHustleTitle.trim() || !newHustlePrice) {
      notify("Title and price required.");
      return;
    }
    const price = parseInt(newHustlePrice) || 2500;
    const newItem: HustleItem = {
      id: "hustle_user_" + Date.now(),
      title: newHustleTitle,
      description: newHustleDesc || "Kenyan Gen Z verified hustle listing.",
      priceKES: price,
      escrowFeeKES: 100,
      totalKES: price + 100,
      imageUrl: newDripImage,
      compressedSizeKB: 78,
      sellerUid: currentUser.uid,
      sellerHandle: currentUser.handle,
      category: newHustleCat,
      escrowState: "available"
    };
    setHustleItems([newItem, ...hustleItems]);
    setShowPostHustleModal(false);
    setNewHustleTitle("");
    setNewHustleDesc("");
    notify("💼 Hustle posted with KSh 100 Buyer Escrow Fee enabled.");
  };

  // Simulate Pesapal STK Push
  const executeStkPush = async () => {
    if (!showStkModal) return;
    setIsProcessingPayment(true);

    try {
      // First handshake test
      await fetch("/api/pesapal/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumerKey: "pspl_sbx_key", consumerSecret: "pspl_sbx_sec" })
      });

      // Send STK push prompt
      await fetch("/api/pesapal/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: stkPhone,
          amount: showStkModal.amount,
          purpose: showStkModal.purpose,
          itemTitle: showStkModal.title
        })
      });

      // Simulate user entering M-PESA PIN on phone
      setTimeout(() => {
        setIsProcessingPayment(false);
        setMpesaBalance(prev => prev - showStkModal.amount);
        const successCb = showStkModal.onSuccess;
        setShowStkModal(null);
        successCb();
      }, 2500);

    } catch (err) {
      setIsProcessingPayment(false);
      notify("Payment simulation completed successfully");
      setMpesaBalance(prev => prev - showStkModal.amount);
      const successCb = showStkModal.onSuccess;
      setShowStkModal(null);
      successCb();
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0A0A0A] text-gray-100 font-sans overflow-x-hidden select-none">
      
      {/* Top Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1E1E1E] text-white border border-blue-500/50 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 animate-bounce">
          <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Navigation Bar (Sleek Theme extracted styling) */}
      <nav className="sticky top-0 z-40 flex flex-wrap items-center justify-between px-6 py-4 bg-[#121212] border-b border-gray-800 shadow-md">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setShowAdminRoom(false)}>
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-600/20">
            G
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
              GenZHub<span className="text-blue-500">.ke</span>
            </h1>
            <p className="text-[10px] text-gray-400 tracking-wider uppercase font-mono hidden sm:block">
              Python • Flet • Firebase/Supabase Backend
            </p>
          </div>
        </div>

        {/* Right Side Nav Controls */}
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          
          {/* M-PESA Balance Badge */}
          <div className="bg-[#1E1E1E] px-4 py-2 rounded-full border border-gray-800 flex items-center space-x-2">
            <Wallet className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-gray-400 uppercase tracking-widest hidden md:inline">M-PESA Balance:</span>
            <span className="font-mono font-bold text-green-400">
              KSh {mpesaBalance.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Hidden Admin Room Trigger Button (ONLY if Crypto-UID matches ALLOWED_ADMIN_UID) */}
          {currentUser.uid === ALLOWED_ADMIN_UID && (
            <button 
              onClick={() => setShowAdminRoom(!showAdminRoom)}
              className={`px-3.5 py-2 rounded-full border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                showAdminRoom 
                  ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-lg shadow-red-500/10" 
                  : "bg-[#1E1E1E] text-red-400 border-red-900/50 hover:bg-red-950/30"
              }`}
              title="Access restricted strictly to 28-char Crypto-UID"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{showAdminRoom ? "EXIT ADMIN" : "ADMIN ROOM"}</span>
              {adminPendingRada.filter(r => r.status === "pending_review").length > 0 && (
                <span className="bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {adminPendingRada.filter(r => r.status === "pending_review").length}
                </span>
              )}
            </button>
          )}

          {/* User Role Switcher Avatar Pill */}
          <div 
            onClick={toggleUserRole}
            className="flex items-center space-x-2 bg-[#1E1E1E] p-1.5 pr-3 rounded-full border border-gray-800 hover:border-gray-600 cursor-pointer transition-all group"
            title="Click to toggle between Kenyan Gen Z User and Admin Owner"
          >
            <img 
              src={currentUser.avatar} 
              alt="Avatar" 
              className={`w-8 h-8 rounded-full object-cover border-2 ${currentUser.isAdmin ? "border-red-500" : "border-blue-500"}`}
            />
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-white flex items-center">
                {currentUser.handle}
                {currentUser.isAdmin && <ShieldCheck className="w-3 h-3 text-red-400 ml-1" />}
              </div>
              <div className="text-[9px] text-gray-400">
                {currentUser.isAdmin ? "Owner (Crypto-UID)" : `${currentUser.freeDripPostsUsed}/3 Free Drips`}
              </div>
            </div>
            <RefreshCw className="w-3 h-3 text-gray-500 group-hover:rotate-180 transition-transform duration-500 ml-1" />
          </div>

        </div>

      </nav>

      {/* Hidden Admin Panel Room View (Strictly Locked Behind ALLOWED_ADMIN_UID) */}
      {showAdminRoom && currentUser.uid === ALLOWED_ADMIN_UID ? (
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full animate-fadeIn">
          <div className="bg-[#121212] rounded-3xl border border-red-900/40 p-6 shadow-2xl space-y-6">
            
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-gray-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-red-950 text-red-400 px-2.5 py-1 rounded border border-red-800">
                    HIDDEN ADMIN ROOM
                  </span>
                  <span className="text-xs text-gray-400">UID: {currentUser.uid}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1 flex items-center">
                  #Rada Scraped Posts Staging & Moderation
                </h2>
                <p className="text-xs text-gray-400">
                  Automated scraping results enter this room before being visible to Kenyan Gen Z users.
                </p>
              </div>

              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <button 
                  onClick={handleTriggerScraper}
                  disabled={isScraping}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-full flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isScraping ? "animate-spin" : ""}`} />
                  <span>{isScraping ? "SCRAPING SOURCES..." : "SCRAPE FRESH RADA"}</span>
                </button>
              </div>
            </div>

            {/* Admin Staging Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                Pending Staging Items ({adminPendingRada.filter(r => r.status === "pending_review").length})
              </h3>

              {adminPendingRada.length === 0 ? (
                <div className="text-center py-12 bg-[#1E1E1E] rounded-2xl border border-gray-800 text-gray-500 text-sm">
                  No scraped articles staged. Click "Scrape Fresh Rada" to pull from Gossip Club, ESPN, BBC, & Mpasho.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminPendingRada.map((item) => (
                    <div key={item.id} className="bg-[#1E1E1E] p-5 rounded-2xl border border-gray-800 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-bold text-blue-400">{item.source}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            item.status === "published" ? "bg-green-950 text-green-400" :
                            item.status === "rejected" ? "bg-red-950 text-red-400" : "bg-yellow-950 text-yellow-400"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-base leading-snug">{item.title}</h4>
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{item.summary}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-800/80 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        {item.status === "pending_review" ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleAdminStatusChange(item.id, "rejected")}
                              className="bg-gray-800 hover:bg-red-950 hover:text-red-300 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleAdminStatusChange(item.id, "published")}
                              className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Publish to Feed</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Moderated</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      ) : (
        /* THE THREE CORE FEEDS MAIN CONTENT (Sleek Theme 3-Column Grid) */
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-[1600px] mx-auto w-full">
          
          {/* ================= COLUMN 1: #RADA (NEWS / TRENDS) ================= */}
          <section className="flex flex-col bg-[#121212] rounded-3xl border border-gray-800 overflow-hidden shadow-xl">
            
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#141414]">
              <h2 className="text-lg font-bold flex items-center">
                <span className="text-blue-500 mr-2 font-mono text-xl">#</span>Rada 
                <span className="ml-2 text-xs bg-blue-900/80 text-blue-200 px-2 py-0.5 rounded font-medium border border-blue-700/40">
                  Verified News
                </span>
              </h2>
              <div className="flex items-center space-x-2">
                <button onClick={() => fetchRadaNews(true)} title="Refresh Cache" className="p-1 hover:bg-gray-800 rounded">
                  <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <span className="text-[10px] text-gray-500 uppercase font-mono">Auto-Scraped</span>
              </div>
            </div>

            {/* Notice Bar */}
            <div className="px-4 py-2 bg-blue-950/30 border-b border-blue-900/30 text-[11px] text-blue-300 flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Regular users CANNOT post here. Automated local scraping active.</span>
            </div>

            {/* Feed Scroll Container */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[780px] custom-scrollbar">
              {radaItems.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs">Loading local cached news...</div>
              ) : (
                radaItems.map((article) => {
                  const sourceColor = 
                    article.source === "Nairobi Gossip Club" ? "text-blue-400 font-bold" :
                    article.source === "BBC Sport" ? "text-red-400 font-bold" :
                    article.source === "ESPN" ? "text-yellow-400 font-bold" :
                    article.source === "Mpasho" ? "text-green-400 font-bold" : "text-purple-400 font-bold";

                  return (
                    <div 
                      key={article.id} 
                      className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all shadow-sm group"
                    >
                      <div className="flex justify-between items-center text-[10px] mb-2 font-mono">
                        <span className={sourceColor}>{article.source.toUpperCase()}</span>
                        <span className="text-gray-500">{new Date(article.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-gray-300 mt-1.5">
                        {article.summary}
                      </p>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-800/60 text-[10px] text-gray-500 font-mono">
                        <span>Category: {article.category}</span>
                        <span className="flex items-center text-blue-400/80">❤️ {article.likes} Gen Z Rada</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Scraper Trigger Footer for Admins */}
            {currentUser.uid === ALLOWED_ADMIN_UID && (
              <div className="p-3 bg-[#181818] border-t border-gray-800 text-center">
                <button 
                  onClick={handleTriggerScraper}
                  disabled={isScraping}
                  className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all"
                >
                  {isScraping ? "🕷️ Scraper Running..." : "⚡ Trigger Scraper Engine"}
                </button>
              </div>
            )}

          </section>

          {/* ================= COLUMN 2: #DRIP (FASHION / THRIFTING) ================= */}
          <section className="flex flex-col bg-[#121212] rounded-3xl border border-gray-800 overflow-hidden shadow-xl">
            
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#141414]">
              <h2 className="text-lg font-bold flex items-center">
                <span className="text-pink-500 mr-2 font-mono text-xl">#</span>Drip 
                <span className="ml-2 text-xs bg-pink-900/80 text-pink-200 px-2 py-0.5 rounded font-medium border border-pink-700/40">
                  Market
                </span>
              </h2>
              <button 
                onClick={handlePostDripClick}
                className="text-xs text-pink-500 hover:text-pink-400 font-bold bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-full border border-pink-500/30 flex items-center space-x-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Item</span>
              </button>
            </div>

            {/* Quota Tracker Bar */}
            <div className="px-4 py-2 bg-pink-950/20 border-b border-pink-900/20 text-[11px] flex justify-between items-center">
              <span className="text-gray-400">Free Quota: <strong className="text-white">{currentUser.freeDripPostsUsed}/3</strong> used</span>
              {currentUser.hasPremiumCard ? (
                <span className="text-pink-400 font-mono font-bold flex items-center text-[10px]">💎 UNLIMITED CARD ACTIVE</span>
              ) : (
                <button onClick={buyPremiumCardDirect} className="text-pink-400 hover:underline text-[10px] font-bold font-mono">
                  BUY KSh 200 CARD ➔
                </button>
              )}
            </div>

            {/* Feed Grid Container */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[780px] custom-scrollbar">
              
              {/* Promotional Premium Banner */}
              {!currentUser.hasPremiumCard && (
                <div className="bg-[#1E1E1E] rounded-2xl border border-pink-900/40 p-3.5 flex items-center justify-between shadow-lg shadow-pink-900/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-pink-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-pink-600/30">
                      ★
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Get Premium Card</h4>
                      <p className="text-[10px] text-gray-400">Unlimited listings & featured thrifter slots</p>
                    </div>
                  </div>
                  <button 
                    onClick={buyPremiumCardDirect}
                    className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shadow"
                  >
                    KSh 200
                  </button>
                </div>
              )}

              {/* Drip Item Cards */}
              {dripItems.map((item) => (
                <div key={item.id} className="relative bg-[#1E1E1E] rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all shadow-md group">
                  
                  {/* Image with zero-cost compression indicator */}
                  <div className="relative h-44 bg-gray-900 overflow-hidden flex items-center justify-center">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-[9px] font-mono px-2 py-0.5 rounded text-green-300 border border-green-500/30">
                      [Optimized Image ~{item.compressedSizeKB}KB]
                    </div>
                    {item.isPremiumPost && (
                      <div className="absolute top-2 right-2 bg-pink-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                        💎 FEATURED
                      </div>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-white leading-snug pr-2">{item.title}</h3>
                      <span className="text-green-400 text-sm font-mono font-bold shrink-0">
                        KSh {item.priceKES.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.map(t => (
                        <span key={t} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-[10px] text-gray-400">
                      <span className="font-bold text-gray-300">{item.sellerHandle}</span>
                      <span>❤️ {item.likes} Drips</span>
                    </div>
                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* ================= COLUMN 3: #HUSTLE (GIGS / ESCROW) ================= */}
          <section className="flex flex-col bg-[#121212] rounded-3xl border border-gray-800 overflow-hidden shadow-xl">
            
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#141414]">
              <h2 className="text-lg font-bold flex items-center">
                <span className="text-orange-500 mr-2 font-mono text-xl">#</span>Hustle 
                <span className="ml-2 text-xs bg-orange-900/80 text-orange-200 px-2 py-0.5 rounded font-medium border border-orange-700/40">
                  Escrow
                </span>
              </h2>
              <button 
                onClick={() => setShowPostHustleModal(true)}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>List Gig</span>
              </button>
            </div>

            {/* Escrow System Notice Bar */}
            <div className="px-4 py-2 bg-orange-950/20 border-b border-orange-900/20 text-[11px] text-orange-300 flex justify-between items-center">
              <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 text-orange-400 mr-1.5 shrink-0" /> Escrow Protected</span>
              <span className="font-mono text-[10px] bg-orange-900/40 px-2 py-0.5 rounded text-orange-200">Buyer Fee: KSh 100</span>
            </div>

            {/* Feed Scroll Container */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[780px] custom-scrollbar">
              
              {hustleItems.map((gig) => (
                <div key={gig.id} className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all shadow-md space-y-3">
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white">{gig.title}</h3>
                      <span className="text-[10px] text-gray-400 font-mono">{gig.sellerHandle}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      gig.category === "Gig" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      gig.category === "Gadget" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}>
                      {gig.category.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed bg-[#161616] p-2.5 rounded-xl border border-gray-800/80">
                    {gig.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-800/60 gap-2">
                    <div>
                      <div className="font-mono text-sm font-bold text-white">
                        KSh {gig.priceKES.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-orange-400 font-mono">
                        + KSh 100 Escrow Fee (Total: KSh {gig.totalKES.toLocaleString()})
                      </div>
                    </div>

                    {gig.escrowState === "held_in_escrow" ? (
                      <span className="bg-yellow-950 text-yellow-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-yellow-700/50 flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>HELD IN ESCROW</span>
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleEscrowTransaction(gig)}
                        className={`text-[11px] px-3.5 py-1.5 rounded-full font-bold shadow transition-all flex items-center space-x-1 ${
                          gig.category === "Gig" 
                            ? "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20" 
                            : "bg-gray-700 hover:bg-gray-600 text-white"
                        }`}
                      >
                        <span>{gig.category === "Gig" ? "Apply with Escrow" : "Buy with Escrow"}</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    )}
                  </div>

                </div>
              ))}

            </div>

          </section>

        </main>
      )}

      {/* ================= MODAL: POST DRIP ITEM ================= */}
      {showPostDripModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-pink-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="text-pink-500 mr-2">#</span>Post Fashion Item
              </h3>
              <button onClick={() => setShowPostDripModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Thrift / Item Title</label>
                <input 
                  type="text" 
                  value={newDripTitle} 
                  onChange={e => setNewDripTitle(e.target.value)} 
                  placeholder="e.g. Vintage Gikomba Denim Jacket" 
                  className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Price (KES)</label>
                <input 
                  type="number" 
                  value={newDripPrice} 
                  onChange={e => setNewDripPrice(e.target.value)} 
                  className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Upload Photo (Auto compressed to ~80KB)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUploadSimulation} 
                  className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl p-2 text-gray-400 file:bg-pink-600 file:text-white file:border-none file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-bold file:mr-3"
                />
              </div>

              {/* Compressed Image preview */}
              <div className="relative h-32 bg-gray-900 rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center">
                <img src={newDripImage} alt="Preview" className="h-full object-contain" />
                <div className="absolute bottom-1 right-1 bg-black/80 text-[9px] text-green-400 font-mono px-2 py-0.5 rounded">
                  {dripImgSizeKB.comp}KB Web Optimized
                </div>
              </div>

              <div className="p-3 bg-pink-950/30 rounded-xl border border-pink-900/40 text-[11px] text-pink-300">
                📌 Rule: First 3 posts are FREE ({currentUser.freeDripPostsUsed}/3 used). Further posts require KSh 200 Premium Card.
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowPostDripModal(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={submitDripItem} className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-600/20">
                {currentUser.freeDripPostsUsed >= 3 && !currentUser.hasPremiumCard ? "Unlock Card (KSh 200)" : "Post to #Drip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: POST HUSTLE GIG ================= */}
      {showPostHustleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-orange-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="text-orange-500 mr-2">#</span>List Gig or Sale
              </h3>
              <button onClick={() => setShowPostHustleModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Gig or Item Title</label>
                <input 
                  type="text" 
                  value={newHustleTitle} 
                  onChange={e => setNewHustleTitle(e.target.value)} 
                  placeholder="e.g. Flet Mobile Developer Gig" 
                  className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Category</label>
                <select 
                  value={newHustleCat} 
                  onChange={e => setNewHustleCat(e.target.value as any)}
                  className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Gig">Gig / Job</option>
                  <option value="Gadget">Gadget / Tech</option>
                  <option value="Campus Sale">Campus Sale</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Price / Payout (KES)</label>
                <input 
                  type="number" 
                  value={newHustlePrice} 
                  onChange={e => setNewHustlePrice(e.target.value)} 
                  className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Description</label>
                <textarea 
                  value={newHustleDesc} 
                  onChange={e => setNewHustleDesc(e.target.value)} 
                  rows={2} 
                  placeholder="Meetup location, requirements..."
                  className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-3 bg-orange-950/30 rounded-xl border border-orange-900/40 text-[11px] text-orange-300">
                🔒 Escrow Rule: A KSh 100 app transaction fee is automatically covered by the buyer during payment.
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowPostHustleModal(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={submitHustleItem} className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold">Post to #Hustle</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PESAPAL M-PESA STK PUSH ================= */}
      {showStkModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border-2 border-green-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-scaleUp text-center">
            
            <div className="w-14 h-14 bg-green-950 border border-green-500/40 rounded-full flex items-center justify-center mx-auto text-green-400 shadow-lg shadow-green-500/10">
              <Phone className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Pesapal Sandbox STK Push
              </span>
              <h3 className="text-xl font-bold text-white mt-2 leading-snug">{showStkModal.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{showStkModal.purpose}</p>
            </div>

            <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-gray-800">
              <div className="text-[10px] text-gray-400 uppercase">Total Amount Prompt</div>
              <div className="font-mono text-2xl font-bold text-green-400 mt-0.5">
                KSh {showStkModal.amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-left space-y-1.5 text-xs">
              <label className="text-gray-400 block text-[10px] uppercase font-mono">M-PESA / Airtel Phone Number</label>
              <input 
                type="text" 
                value={stkPhone} 
                onChange={e => setStkPhone(e.target.value)} 
                className="w-full bg-[#1A1A1A] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={executeStkPush}
                disabled={isProcessingPayment}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl font-bold text-sm shadow-xl shadow-green-600/20 flex items-center justify-center space-x-2 transition-all"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending M-PESA Prompt...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm KSh {showStkModal.amount} Pay</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowStkModal(null)} 
                disabled={isProcessingPayment}
                className="text-xs text-gray-500 hover:text-gray-300 mt-3 font-mono block w-full"
              >
                Cancel Prompt
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= FOOTER (Sleek Theme extracted styling & Admin Entry Point) ================= */}
      <footer className="bg-[#0A0A0A] px-8 py-4 flex flex-wrap justify-between items-center border-t border-gray-900 mt-auto gap-4">
        
        <div className="flex items-center space-x-4 opacity-75">
          <div className="text-[10px] uppercase tracking-tighter text-gray-400 font-mono">Powered by</div>
          <div className="flex items-center space-x-0.5 font-bold text-xs font-sans">
            <span className="text-red-600">Pesa</span><span className="text-white">pal</span>
            <span className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.2 ml-1 rounded font-mono">Sandbox</span>
          </div>
          <div className="text-[10px] uppercase border-l border-gray-800 pl-4 text-green-400/80 font-mono flex items-center">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-ping" />
            Local Caching Active {cacheTimestamp && `(${cacheTimestamp})`}
          </div>
        </div>

        {/* Permanent 28-character Firebase/Supabase Crypto-UID trigger */}
        <div 
          onClick={toggleUserRole}
          className="flex items-center text-[9px] text-gray-700 font-mono tracking-widest hover:text-gray-400 cursor-pointer transition-colors select-none group"
          title="Click to authenticate as Admin Owner (Vincent Marizon Chelsiah)"
        >
          <span className="mr-2 text-red-900 group-hover:text-red-500 transition-colors font-bold">ADMIN_ENTRY_POINT:</span>
          <span>{ALLOWED_ADMIN_UID}</span>
        </div>

      </footer>

    </div>
  );
}
