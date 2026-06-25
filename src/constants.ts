import { DripItem, HustleItem, UserProfile } from "./types";

// Strict 28-character Firebase/Supabase Crypto-UID string assigned to owner Vincent Marizon Chelsiah
export const ALLOWED_ADMIN_UID = "vmarizonchelsiah740admgenz28";

export const ADMIN_PROFILE: UserProfile = {
  uid: ALLOWED_ADMIN_UID,
  name: "Vincent Marizon Chelsiah",
  handle: "@vmarizon_admin",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  freeDripPostsUsed: 1,
  hasPremiumCard: true,
  isAdmin: true,
};

export const REGULAR_USER_PROFILE: UserProfile = {
  uid: "usr_kenyan_genz_9921_random0",
  name: "Brian 'Kariuki' Omondi",
  handle: "@brian_form_ni_gani",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  freeDripPostsUsed: 2, // 2 out of 3 used! Next post is 3rd (free), 4th will require KSh 200 Premium Card
  hasPremiumCard: false,
  isAdmin: false,
};

export const INITIAL_DRIP_ITEMS: DripItem[] = [
  {
    id: "drip_1",
    title: "Vintage Gikomba Racing Leather Bomber Jacket",
    priceKES: 1850,
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    originalSizeKB: 2450,
    compressedSizeKB: 78,
    sellerUid: "usr_992",
    sellerHandle: "@nairobi_thrifter",
    isPremiumPost: true,
    likes: 342,
    tags: ["#Thrifted", "#Streetwear", "#GikombaGem"]
  },
  {
    id: "drip_2",
    title: "Custom Upcycled Denim Cargo Pants (Nairobi Street Cut)",
    priceKES: 1200,
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80",
    originalSizeKB: 3100,
    compressedSizeKB: 81,
    sellerUid: "usr_kenyan_genz_9921_random0",
    sellerHandle: "@brian_form_ni_gani",
    isPremiumPost: false,
    likes: 189,
    tags: ["#Denim", "#RadaDrip", "#AlchemistVibe"]
  },
  {
    id: "drip_3",
    title: "Air Jordan 4 Retro 'Military Black' (Grade A Thrift)",
    priceKES: 4500,
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
    originalSizeKB: 1980,
    compressedSizeKB: 76,
    sellerUid: "usr_kicks",
    sellerHandle: "@kicks_kenya254",
    isPremiumPost: true,
    likes: 620,
    tags: ["#Sneakerhead", "#CBDKicks"]
  }
];

export const INITIAL_HUSTLE_ITEMS: HustleItem[] = [
  {
    id: "hustle_1",
    title: "iPhone 13 Pro Max (128GB, Sierra Blue - Campus Urgent Sale)",
    description: "Pristine condition 89% battery health. Comes with original Type-C braided cable. CBD or UoN Campus meetup only.",
    priceKES: 78000,
    escrowFeeKES: 100, // KSh 100 app transaction fee covered by buyer
    totalKES: 78100,
    imageUrl: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&auto=format&fit=crop&q=80",
    compressedSizeKB: 79,
    sellerUid: "usr_campus",
    sellerHandle: "@kamau_tech",
    category: "Gadget",
    escrowState: "available"
  },
  {
    id: "hustle_2",
    title: "DJ Set & Sound Engineering Gig for Campus & Alchemist Bashes 🎧",
    description: "Full Amapiano, Afrobeats, and Sheng Arbantone set. Includes 2 Pioneer CDJs and energetic MC hypeman.",
    priceKES: 15000,
    escrowFeeKES: 100,
    totalKES: 15100,
    imageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?w=600&auto=format&fit=crop&q=80",
    compressedSizeKB: 82,
    sellerUid: "usr_dj",
    sellerHandle: "@dj_spinn_nbo",
    category: "Gig",
    escrowState: "held_in_escrow",
    buyerPhone: "254712345678"
  },
  {
    id: "hustle_3",
    title: "UI/UX & Graphic Design Brand Package for Gen Z Hustles",
    description: "Logo, Instagram/TikTok templates, and Flet mobile app mockups delivered in 48 hours.",
    priceKES: 4500,
    escrowFeeKES: 100,
    totalKES: 4600,
    imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80",
    compressedSizeKB: 75,
    sellerUid: "usr_des",
    sellerHandle: "@creatives_254",
    category: "Freelance",
    escrowState: "available"
  }
];

export const RADA_SOURCES = [
  "Nairobi Gossip Club",
  "Mpasho",
  "ESPN",
  "BBC Sport",
  "Citizen Digital"
];
