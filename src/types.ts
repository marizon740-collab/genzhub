export type FeedType = "rada" | "drip" | "hustle" | "admin";

export interface RadaItem {
  id: string;
  title: string;
  summary: string;
  source: "Nairobi Gossip Club" | "Mpasho" | "ESPN" | "BBC Sport" | "Citizen Digital" | string;
  category: string;
  timestamp: string;
  likes: number;
  status: "published" | "pending_review" | "rejected";
}

export interface DripItem {
  id: string;
  title: string;
  priceKES: number;
  imageUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  sellerUid: string;
  sellerHandle: string;
  isPremiumPost: boolean;
  likes: number;
  tags: string[];
}

export interface HustleItem {
  id: string;
  title: string;
  description: string;
  priceKES: number;
  escrowFeeKES: number; // Always KSh 100 covered by buyer
  totalKES: number;
  imageUrl: string;
  compressedSizeKB: number;
  sellerUid: string;
  sellerHandle: string;
  category: "Gig" | "Gadget" | "Campus Sale" | "Freelance";
  escrowState: "available" | "held_in_escrow" | "shipped" | "delivered" | "released";
  buyerPhone?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  handle: string;
  avatar: string;
  freeDripPostsUsed: number; // Max 3 free
  hasPremiumCard: boolean; // KSh 200 unlock
  isAdmin: boolean;
}

export interface PesapalHandshake {
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  status: string;
  isSandbox: boolean;
}
