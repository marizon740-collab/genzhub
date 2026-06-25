import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client lazily
function getAiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
  });
}

// In-memory store for #Rada news scraped items
let radaNewsStore = [
  {
    id: "rada_1",
    title: "Gen Z Influencers Dominate Nairobi Streetwear Showcase at Alchemist 🔥",
    summary: "Thrifting gems from Gikomba took center stage as Nairobi's top fashion creators flaunted upcycled vintage jackets.",
    source: "Nairobi Gossip Club",
    category: "Entertainment",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    likes: 1420,
    status: "published"
  },
  {
    id: "rada_2",
    title: "EPL Drama: Arsenal Thrash Chelsea 3-1 in London Derby Thriller",
    summary: "Bukayo Saka stars with two brilliant assists as Gunners fans across Nairobi sports lounges celebrate late into the night.",
    source: "BBC Sport",
    category: "Sports",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    likes: 3890,
    status: "published"
  },
  {
    id: "rada_3",
    title: "Parliamentary Committee Reviews New Digital Nomad & Tech Gig Tax Amendments",
    summary: "Kenyan Gen Z freelancers and remote engineers voice strong opinions on the proposed digital service withholding fee.",
    source: "Citizen Digital",
    category: "Politics",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    likes: 2150,
    status: "published"
  },
  {
    id: "rada_4",
    title: "Top Kenyan Artist Drops Surprise Amapiano-Sheng Collaboration Track",
    summary: "The club anthem is already trending #1 on TikTok Kenya with over 500k dance challenge submissions in 24 hours.",
    source: "Mpasho",
    category: "Music",
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    likes: 5410,
    status: "published"
  },
  {
    id: "rada_5",
    title: "UEFA Champions League Quarterfinal Draw Sparks Heated Debates in Campus Hubs",
    summary: "Real Madrid vs Man City rematch confirmed. Kenyan university football fan clubs predict record viewership.",
    source: "ESPN",
    category: "Sports",
    timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    likes: 1980,
    status: "published"
  }
];

// API Route: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "GenZHub API", time: new Date().toISOString() });
});

// API Route: Get Scraped Rada News
app.get("/api/rada", (req, res) => {
  res.json({
    success: true,
    data: radaNewsStore.filter(n => n.status === "published"),
    pendingCount: radaNewsStore.filter(n => n.status === "pending_review").length,
    cachedAt: new Date().toISOString()
  });
});

// API Route: Get All Rada News (Admin Only Staging)
app.get("/api/rada/admin", (req, res) => {
  const uid = req.headers["x-admin-uid"];
  if (uid !== "vmarizonchelsiah740admgenz28") {
    return res.status(403).json({ success: false, error: "Unauthorized: Invalid Crypto-UID" });
  }
  res.json({ success: true, data: radaNewsStore });
});

// API Route: Trigger Automated Scraper
app.post("/api/rada/scrape", async (req, res) => {
  const uid = req.headers["x-admin-uid"];
  if (uid !== "vmarizonchelsiah740admgenz28") {
    return res.status(403).json({ success: false, error: "Unauthorized: Admin Access Required" });
  }

  const ai = getAiClient();
  let newArticles = [];

  if (ai) {
    try {
      const prompt = `You are an automated news scraper for Kenyan Gen Z app 'GenZHub'. 
Generate 3 realistic, exciting, brand new Kenyan news headlines & summaries trending right now in Nairobi.
You MUST strictly attribute each headline to one of these exact sources:
- Nairobi Gossip Club
- Mpasho
- ESPN
- BBC Sport
- Citizen Digital

Return strictly JSON array format:
[
  {
    "title": "...",
    "summary": "...",
    "source": "Nairobi Gossip Club",
    "category": "Trends"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text.trim());
      if (Array.isArray(parsed)) {
        newArticles = parsed.map((item: any, idx: number) => ({
          id: "rada_scraped_" + Date.now() + "_" + idx,
          title: item.title || "Fresh Nairobi Trend Alert",
          summary: item.summary || "Latest updates from Kenyan Gen Z hubs.",
          source: item.source || "Nairobi Gossip Club",
          category: item.category || "Trends",
          timestamp: new Date().toISOString(),
          likes: Math.floor(Math.random() * 500) + 50,
          status: "pending_review"
        }));
      }
    } catch (err) {
      console.error("Gemini scrape error, using fallback simulated scrape:", err);
    }
  }

  // Fallback if AI didn't generate
  if (newArticles.length === 0) {
    const topics = [
      { title: "Nairobi Tech Week 2026 Announces Free Entry for Campus Developers 🚀", summary: "Over 5,000 Kenyan students registered for workshops on Python, Flet, and Firebase architectures.", src: "Citizen Digital", cat: "Tech" },
      { title: "Kenyan Athlete Smashes City Marathon Record in Sensational Finish 🏃‍♂️", summary: "Nairobi streets erupted in cheers as the 21-year-old debutant claimed the KSh 2 Million grand prize.", src: "ESPN", cat: "Sports" },
      { title: "Viral Streetwear Designer Collaborates with Kibera Upcycling Guild 🧵", summary: "Limited edition denim jackets made from recycled textiles sold out in under 12 minutes on #Drip.", src: "Mpasho", cat: "Fashion" }
    ];
    const picked = topics[Math.floor(Math.random() * topics.length)];
    newArticles = [{
      id: "rada_sim_" + Date.now(),
      title: picked.title,
      summary: picked.summary,
      source: picked.src,
      category: picked.cat,
      timestamp: new Date().toISOString(),
      likes: 310,
      status: "pending_review"
    }];
  }

  radaNewsStore = [...newArticles, ...radaNewsStore];

  res.json({
    success: true,
    message: `Scraped ${newArticles.length} new articles into Admin Staging Room.`,
    scrapedCount: newArticles.length,
    articles: newArticles
  });
});

// API Route: Admin Publish or Delete Rada Post
app.patch("/api/rada/status", (req, res) => {
  const uid = req.headers["x-admin-uid"];
  if (uid !== "vmarizonchelsiah740admgenz28") {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }
  const { id, status } = req.body;
  radaNewsStore = radaNewsStore.map(item => item.id === id ? { ...item, status } : item);
  res.json({ success: true });
});

// API Route: Pesapal Handshake Simulation
app.post("/api/pesapal/handshake", (req, res) => {
  const { consumerKey, consumerSecret } = req.body;
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.pspl_sndbx_" + Date.now();
  res.json({
    success: true,
    environment: "Sandbox",
    token,
    expiresIn: 3600,
    status: "Pesapal API Handshake Verified Successfully 🟢"
  });
});

// API Route: Pesapal STK Push Simulation
app.post("/api/pesapal/stkpush", (req, res) => {
  const { phoneNumber, amount, purpose, itemTitle } = req.body;
  if (!phoneNumber || !amount) {
    return res.status(400).json({ success: false, error: "Phone number and amount required." });
  }

  const merchantRequestID = "GENZHUB-" + Math.floor(100000 + Math.random() * 900000);
  const checkoutRequestID = "ws_CO_" + Date.now();

  res.json({
    success: true,
    message: "STK Push Sent to " + phoneNumber,
    merchantRequestID,
    checkoutRequestID,
    amount,
    currency: "KES",
    purpose: purpose || "App Payment",
    itemTitle
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GenZHub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
