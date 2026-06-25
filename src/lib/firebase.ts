import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, setDoc, doc, getDocs } from "firebase/firestore";
import { INITIAL_DRIP_ITEMS, INITIAL_HUSTLE_ITEMS } from "../constants";
import { DripItem, HustleItem } from "../types";

const firebaseConfig = {
  projectId: "divine-attic-vwjrd",
  appId: "1:882420230616:web:ef88e95ee77a23dddbaaad",
  apiKey: "AIzaSyDKtjP63-XDHHqKmcVQ9qw5zuurkC4I5IQ",
  authDomain: "divine-attic-vwjrd.firebaseapp.com",
  storageBucket: "divine-attic-vwjrd.firebasestorage.app",
  messagingSenderId: "882420230616"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-1508f8b6-8d1c-4ccc-a0da-35358dc16dfb");

// Seed initial data if database is empty
export async function seedInitialFirebaseData() {
  try {
    const dripColl = collection(db, "drip");
    const dripSnapshot = await getDocs(dripColl);
    if (dripSnapshot.empty) {
      for (const item of INITIAL_DRIP_ITEMS) {
        await setDoc(doc(db, "drip", item.id), item);
      }
    }

    const hustleColl = collection(db, "hustle");
    const hustleSnapshot = await getDocs(hustleColl);
    if (hustleSnapshot.empty) {
      for (const item of INITIAL_HUSTLE_ITEMS) {
        await setDoc(doc(db, "hustle", item.id), item);
      }
    }
  } catch (err) {
    console.log("Seed note (might require auth or rules):", err);
  }
}

// Subscribe to real-time updates for Drip feed
export function subscribeToDripRealtime(callback: (items: DripItem[]) => void) {
  const dripColl = collection(db, "drip");
  return onSnapshot(dripColl, (snapshot) => {
    const items: DripItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as DripItem);
    });
    if (items.length > 0) {
      callback(items);
    }
  }, (err) => {
    console.log("Realtime drip snapshot fallback:", err);
  });
}

// Subscribe to real-time updates for Hustle feed
export function subscribeToHustleRealtime(callback: (items: HustleItem[]) => void) {
  const hustleColl = collection(db, "hustle");
  return onSnapshot(hustleColl, (snapshot) => {
    const items: HustleItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as HustleItem);
    });
    if (items.length > 0) {
      callback(items);
    }
  }, (err) => {
    console.log("Realtime hustle snapshot fallback:", err);
  });
}
