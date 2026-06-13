import { useState, useEffect, useRef } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc,
  query, orderBy, onSnapshot, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2RZlRNlTONf4xuxjPMcZgedc9wbIhj-4",
  authDomain: "axid-ai.firebaseapp.com",
  projectId: "axid-ai",
  storageBucket: "axid-ai.firebasestorage.app",
  messagingSenderId: "354519561790",
  appId: "1:354519561790:web:e2b25803bcd713aea4836f"
};

const GEMINI_KEY = "AIzaSyAb8RN6JNbpO8ho30lRkYVCDOrmU1eNjLHAf_DE-_WuomEEQ_xw";
const ADMIN_EMAIL = "muhammadbilalcp@gmail.com";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  bg: { minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 56, borderBottom: "1px solid #1a1a1a", background: "#000", position: "sticky", top: 0, zIndex: 100 },
  btn: (variant = "primary") => ({
    background: variant === "primary" ? "#fff" : "#1a1a1a",
    color: variant === "primary" ? "#000" : "#fff",
    border: "none", borderRadius: 12, padding: "12px 24px",
    fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%"
  }),
  input: { width: "100%", background: "#111", border: "1px solid #333", borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  card: { background: "#0a0a0a", border: "1px solid #222", borderRadius: 20, padding: "40px 40px" },
  label: { fontSize: 13, color: "#888", marginBottom: 6, display: "block" },
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, user, isAdmin }) {
  const links = ["Home", "About", "Chat", "Contact", "Feedback"];
  return (
    <nav style={S.nav}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15, cursor: "pointer" }} onClick={() => setPage("Home")}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
        Axid AI
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {links.map(l => (
          <button key={l} onClick={() => setPage(l)} style={{ background: "none", border: "none", color: page === l ? "#fff" : "#666", fontWeight: page === l ? 600 : 400, fontSize: 14, cursor: "pointer", padding: 0 }}>{l}</button>
        ))}
        {isAdmin && (
          <button onClick={() => setPage("Admin")} style={{ background: "none", border: "none", color: page === "Admin" ? "#f00" : "#f66", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0 }}>Admin</button>
        )}
        {user ? (
          <button onClick={() => signOut(auth)} style={{ background: "none", border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Sign out</button>
        ) : (
          <button onClick={() => setPage("Auth")} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 10, padding: "7px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Sign in</button>
        )}
      </div>
    </nav>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ setPage }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          name, email, uid: cred.user.uid, blocked: false, createdAt: serverTimestamp()
        });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", cred.user.uid));
        if (userDoc.exists() && userDoc.data().blocked) {
          await signOut(auth);
          setError("Your account has been blocked. Contact support.");
          setLoading(false); return;
        }
      }
      setPage("Chat");
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(auth.*\)/, ""));
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...S.card, width: "100%", maxWidth: 420 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h2>
        <p style={{ color: "#666", fontSize: 14, textAlign: "center", marginBottom: 32 }}>
          {mode === "signin" ? "Sign in to Axid AI" : "Join Axid AI today"}
        </p>

        {mode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Name</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submit()} />
        </div>

        {error && <div style={{ background: "#1a0000", border: "1px solid #500", borderRadius: 10, padding: "10px 14px", color: "#f88", fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <button onClick={submit} disabled={loading} style={S.btn()}>
          {loading ? "Loading..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <p style={{ textAlign: "center", color: "#666", fontSize: 13, marginTop: 20 }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "#fff", cursor: "pointer", fontWeight: 600 }} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>
            {mode === "signin" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ setPage }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 28 }}>
      <div style={{ border: "1px solid #333", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#aaa", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#aaa", display: "inline-block" }} />
        Now in early access
      </div>
      <h1 style={{ fontSize: 96, fontWeight: 300, color: "#d0d0d0", margin: 0, letterSpacing: -2, lineHeight: 1 }}>Axid AI</h1>
      <p style={{ fontSize: 20, color: "#888", margin: 0 }}>Your futuristic AI assistant for everything.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={() => setPage("Chat")} style={{ background: "#fff", color: "#000", border: "none", borderRadius: 12, padding: "14px 28px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Start Chatting →</button>
        <button onClick={() => setPage("About")} style={{ background: "none", border: "none", color: "#ccc", fontSize: 15, cursor: "pointer" }}>Learn more</button>
        <a href="https://youtube.com" style={{ color: "#ccc", fontSize: 15, textDecoration: "none" }}>▶ YouTube</a>
        <a href="https://instagram.com/axidaiofficial" style={{ color: "#ccc", fontSize: 15, textDecoration: "none" }}>◻ Instagram</a>
      </div>
    </div>
  );
}

// ─── About Page ───────────────────────────────────────────────────────────────
function AboutPage({ setPage }) {
  const features = [
    { title: "Learning", desc: "Summaries, study guides, flashcards, and clear explanations on any subject." },
    { title: "Chatting", desc: "Friendly conversation, brainstorming, and ideation whenever you need a partner." },
    { title: "Coding", desc: "Write, debug, refactor, and understand code across many languages." },
    { title: "Creativity", desc: "Movie ideas, stories, Roblox help, lyrics, image generation and more." },
    { title: "Everyday tasks", desc: "Plan trips, draft emails, organize to-dos, and answer quick questions." },
    { title: "Image generation", desc: "Just ask Axid to draw or generate an image — it handles the rest." },
  ];
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, color: "#fff", marginBottom: 16 }}>About Axid AI</h1>
      <p style={{ fontSize: 17, color: "#aaa", marginBottom: 40, lineHeight: 1.6 }}>
        Axid AI is your all-in-one futuristic AI assistant — designed to feel calm, professional, and fast. We help you think, build, learn, and create.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #222", borderRadius: 16, overflow: "hidden" }}>
        {features.map((f, i) => (
          <div key={f.title} style={{ padding: "28px", borderRight: i % 2 === 0 ? "1px solid #222" : "none", borderBottom: i < 4 ? "1px solid #222" : "none" }}>
            <div style={{ fontWeight: 600, color: "#fff", fontSize: 16, marginBottom: 8 }}>{f.title}</div>
            <div style={{ color: "#888", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setPage("Chat")} style={{ ...S.btn(), marginTop: 40, width: "auto", padding: "14px 28px" }}>Start chatting</button>
    </div>
  );
}

// ─── Chat Page ────────────────────────────────────────────────────────────────
function ChatPage({ user, setPage }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { if (!user) { setPage("Auth"); return; } loadSessions(); }, [user]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (activeSession) loadMessages(activeSession); }, [activeSession]);

  const loadSessions = async () => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "sessions"), orderBy("updatedAt", "desc"));
    onSnapshot(q, snap => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  };

  const loadMessages = async (sessionId) => {
    const q = query(collection(db, "users", user.uid, "sessions", sessionId, "messages"), orderBy("createdAt"));
    onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  };

  const newSession = async () => {
    const ref = await addDoc(collection(db, "users", user.uid, "sessions"), {
      title: "New chat", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    setActiveSession(ref.id);
    setMessages([]);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    if (!activeSession) { await newSession(); return; }

    const userText = input.trim();
    setInput("");

    // Save user message
    await addDoc(collection(db, "users", user.uid, "sessions", activeSession, "messages"), {
      role: "user", content: userText, createdAt: serverTimestamp()
    });

    // Update session title if first message
    if (messages.length === 0) {
      await updateDoc(doc(db, "users", user.uid, "sessions", activeSession), {
        title: userText.slice(0, 40), updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, "users", user.uid, "sessions", activeSession), { updatedAt: serverTimestamp() });
    }

    setLoading(true);
    try {
      // Build history for Gemini
      const history = messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
      history.push({ role: "user", parts: [{ text: userText }] });

      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are Axid AI, a futuristic AI assistant. Be helpful, concise, and professional." }] },
          contents: history
        })
      });
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't respond.";

      await addDoc(collection(db, "users", user.uid, "sessions", activeSession, "messages"), {
        role: "assistant", content: reply, createdAt: serverTimestamp()
      });
    } catch {
      await addDoc(collection(db, "users", user.uid, "sessions", activeSession, "messages"), {
        role: "assistant", content: "Something went wrong. Please try again.", createdAt: serverTimestamp()
      });
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 56px)" }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: "#080808", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 12 }}>
          <button onClick={newSession} style={{ ...S.btn("secondary"), borderRadius: 10, padding: "10px 16px", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
            + New chat
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#444", padding: "8px 16px", letterSpacing: 1 }}>HISTORY</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {sessions.map(s => (
            <div key={s.id} onClick={() => setActiveSession(s.id)}
              style={{ padding: "10px 16px", color: activeSession === s.id ? "#fff" : "#777", fontSize: 13, cursor: "pointer", background: activeSession === s.id ? "#1a1a1a" : "transparent", borderRadius: 8, margin: "2px 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ opacity: 0.5, fontSize: 12 }}>💬</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title || "New chat"}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #1a1a1a", padding: 16 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>{user.email}</div>
          <button onClick={() => signOut(auth)} style={{ background: "none", border: "none", color: "#666", fontSize: 13, cursor: "pointer", padding: 0 }}>Sign out</button>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 60px" }}>
          {!activeSession ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <h2 style={{ fontSize: 36, fontWeight: 600, color: "#fff", marginBottom: 12 }}>How can I help you today?</h2>
              <p style={{ color: "#555", fontSize: 15 }}>Start a new chat or select one from the sidebar.</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <h2 style={{ fontSize: 36, fontWeight: 600, color: "#fff", marginBottom: 12 }}>How can I help you today?</h2>
              <p style={{ color: "#555", fontSize: 15 }}>Ask anything. Axid AI is ready.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720, margin: "0 auto" }}>
              {messages.map(m => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginRight: 10, flexShrink: 0, marginTop: 4 }}>A</div>
                  )}
                  <div style={{
                    background: m.role === "user" ? "#1a1a1a" : "transparent",
                    border: m.role === "assistant" ? "1px solid #1e1e1e" : "none",
                    borderRadius: 16, padding: "12px 18px", maxWidth: "80%",
                    color: "#d0d0d0", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap"
                  }}>{m.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>A</div>
                  <div style={{ color: "#444", fontSize: 14 }}>Axid is thinking...</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        <div style={{ padding: "16px 60px 24px", borderTop: "1px solid #111" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#111", border: "1px solid #2a2a2a", borderRadius: 16, padding: "10px 16px", gap: 12, maxWidth: 720, margin: "0 auto" }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={activeSession ? "Message Axid AI..." : "Start a new chat first"}
              disabled={!activeSession}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 15 }} />
            <button onClick={send} disabled={loading || !input.trim() || !activeSession}
              style={{ background: input.trim() && activeSession ? "#fff" : "#222", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 14, color: input.trim() && activeSession ? "#000" : "#555", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Page ────────────────────────────────────────────────────────────
function FeedbackPage({ user }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!rating && !text) return;
    await addDoc(collection(db, "feedback"), {
      rating, text, email: user?.email || "anonymous", createdAt: serverTimestamp()
    });
    setSubmitted(true);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <h1 style={{ fontSize: 52, fontWeight: 700, marginBottom: 12 }}>Feedback</h1>
      <p style={{ color: "#888", fontSize: 16, marginBottom: 40 }}>Help us improve Axid AI by sharing your experience.</p>
      <div style={{ ...S.card, width: "100%", maxWidth: 580 }}>
        {submitted ? (
          <div style={{ textAlign: "center", fontSize: 20, padding: "20px 0" }}>Thank you for your feedback! 🎉</div>
        ) : (<>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ color: "#888", fontSize: 14, marginBottom: 14 }}>Your rating</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  style={{ fontSize: 30, cursor: "pointer", color: s <= (hover || rating) ? "#fff" : "#333" }}>★</span>
              ))}
            </div>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Write your feedback here..."
            style={{ ...S.input, minHeight: 140, resize: "vertical" }} />
          <button onClick={submit} style={{ ...S.btn(), marginTop: 16 }}>Submit Feedback</button>
        </>)}
      </div>
    </div>
  );
}

// ─── Contact Page ─────────────────────────────────────────────────────────────
function ContactPage() {
  const contacts = [
    { icon: "💬", title: "WhatsApp", sub: "Chat directly with us", btn: "Chat on WhatsApp", href: "https://wa.me/" },
    { icon: "✉️", title: "Email", sub: "muhammadbilalcp@gmail.com", btn: "Send an Email", href: "mailto:muhammadbilalcp@gmail.com" },
    { icon: "📷", title: "Instagram", sub: "@axidaiofficial", btn: "Open Instagram", href: "https://instagram.com/axidaiofficial" },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
      <h1 style={{ fontSize: 52, fontWeight: 700, marginBottom: 16 }}>Contact Axid AI</h1>
      <p style={{ color: "#888", fontSize: 16, marginBottom: 48, maxWidth: 520 }}>Need help, have feedback, or want to collaborate? Reach out through any of the methods below.</p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {contacts.map(c => (
          <div key={c.title} style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 16, padding: "32px 28px", width: 220, textAlign: "left" }}>
            <div style={{ width: 48, height: 48, background: "#1a1a1a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{c.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 6 }}>{c.title}</div>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>{c.sub}</div>
            <a href={c.href} target="_blank" rel="noreferrer">
              <button style={{ ...S.btn("secondary"), borderRadius: 10, padding: "11px 0", fontSize: 13 }}>{c.btn}</button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage({ user }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);

  useEffect(() => { loadUsers(); loadFeedback(); }, []);

  const loadUsers = () => {
    onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  };

  const loadFeedback = () => {
    onSnapshot(query(collection(db, "feedback"), orderBy("createdAt", "desc")), snap => {
      setFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  };

  const loadUserChats = async (uid) => {
    const q = query(collection(db, "users", uid, "sessions"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    setUserChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadSessionMessages = async (uid, sessionId) => {
    const q = query(collection(db, "users", uid, "sessions", sessionId, "messages"), orderBy("createdAt"));
    const snap = await getDocs(q);
    setSessionMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const toggleBlock = async (u) => {
    await updateDoc(doc(db, "users", u.id), { blocked: !u.blocked });
  };

  const tabStyle = (t) => ({
    background: tab === t ? "#fff" : "transparent",
    color: tab === t ? "#000" : "#888",
    border: "1px solid #333", borderRadius: 10,
    padding: "8px 20px", fontSize: 14, cursor: "pointer", fontWeight: 600
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>Admin Panel</h1>
          <p style={{ color: "#555", fontSize: 14, marginTop: 4 }}>Logged in as {user?.email}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={tabStyle("users")} onClick={() => { setTab("users"); setSelectedUser(null); setSelectedSession(null); }}>Users ({users.length})</button>
          <button style={tabStyle("feedback")} onClick={() => setTab("feedback")}>Feedback ({feedback.length})</button>
        </div>
      </div>

      {tab === "users" && !selectedUser && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>No users yet.</div>}
          {users.map(u => (
            <div key={u.id} style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 14, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name || "No name"}</div>
                <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>{u.email}</div>
                {u.blocked && <div style={{ color: "#f44", fontSize: 12, marginTop: 4 }}>● Blocked</div>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setSelectedUser(u); loadUserChats(u.id); }}
                  style={{ background: "#1a1a1a", border: "none", borderRadius: 8, color: "#fff", padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>View Chats</button>
                <button onClick={() => toggleBlock(u)}
                  style={{ background: u.blocked ? "#1a0000" : "#0a1a0a", border: `1px solid ${u.blocked ? "#500" : "#050"}`, borderRadius: 8, color: u.blocked ? "#f66" : "#6f6", padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
                  {u.blocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && selectedUser && !selectedSession && (
        <div>
          <button onClick={() => { setSelectedUser(null); setUserChats([]); }} style={{ background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>← Back to users</button>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Chats for {selectedUser.name || selectedUser.email}</h2>
          {userChats.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>No chats yet.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {userChats.map(s => (
              <div key={s.id} onClick={() => { setSelectedSession(s); loadSessionMessages(selectedUser.id, s.id); }}
                style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 12, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15 }}>{s.title || "Untitled chat"}</span>
                <span style={{ color: "#555", fontSize: 12 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && selectedUser && selectedSession && (
        <div>
          <button onClick={() => { setSelectedSession(null); setSessionMessages([]); }} style={{ background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>← Back to chats</button>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>{selectedSession.title}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sessionMessages.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ background: m.role === "user" ? "#1a1a1a" : "#0d0d0d", border: "1px solid #222", borderRadius: 14, padding: "12px 18px", maxWidth: "80%", color: "#d0d0d0", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{m.role === "user" ? selectedUser.name || "User" : "Axid AI"}</div>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "feedback" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {feedback.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>No feedback yet.</div>}
          {feedback.map(f => (
            <div key={f.id} style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#888", fontSize: 13 }}>{f.email}</span>
                <span style={{ color: "#f5c518", fontSize: 16 }}>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
              </div>
              <p style={{ color: "#ccc", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{f.text || <span style={{ color: "#555" }}>No written feedback.</span>}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [page, setPage] = useState("Home");
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Check if blocked
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists() && userDoc.data().blocked) {
            await signOut(auth);
            setUser(null);
          } else {
            setUser(u);
          }
        } catch {
          setUser(u);
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });
  }, []);

  if (!authReady) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#444", fontSize: 16 }}>Loading...</div>
    </div>
  );

  const pages = { Home: HomePage, About: AboutPage, Chat: ChatPage, Feedback: FeedbackPage, Contact: ContactPage, Auth: AuthPage, Admin: AdminPage };
  const Page = pages[page] || HomePage;

  // Guard admin page
  if (page === "Admin" && !isAdmin) return (
    <div style={S.bg}>
      <Navbar page={page} setPage={setPage} user={user} isAdmin={isAdmin} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#555", fontSize: 18 }}>Access denied.</div>
      </div>
    </div>
  );

  return (
    <div style={S.bg}>
      <Navbar page={page} setPage={setPage} user={user} isAdmin={isAdmin} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Page setPage={setPage} user={user} />
      </div>
    </div>
  );
}
