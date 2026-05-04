import { useState, useRef, useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import "./ChatBot.css"

// ── Knowledge base ────────────────────────────────────────────────────────────
const KB = [
  {
    patterns: ["hello", "hi", "hey", "hii", "helo", "namaste"],
    reply: (name) => `Hey ${name ? name : "there"}! 👋 I'm LuxeBot, your shopping assistant. How can I help you today?`,
    quick: ["Track my order", "Return policy", "Payment help", "Contact support"],
  },
  {
    patterns: ["order", "track", "tracking", "where is my order", "delivery status"],
    reply: () => "You can track your order from the **Orders** page. Click on any order to see live tracking with map! 🗺️",
    quick: ["Go to Orders", "Shipping time", "Cancel order"],
    action: "orders",
  },
  {
    patterns: ["return", "refund", "exchange", "replace", "money back"],
    reply: () => "We offer a **7-day easy return** policy. 📦\n\n• Items must be unused and in original packaging\n• Refund processed in 5-7 business days\n• Contact support to initiate a return",
    quick: ["Contact support", "Track my order", "Payment help"],
  },
  {
    patterns: ["payment", "pay", "razorpay", "upi", "card", "failed", "not working"],
    reply: () => "We accept **UPI, Cards, Net Banking & Wallets** via Razorpay. 💳\n\nIf payment failed:\n• Check your bank balance\n• Try a different payment method\n• Contact your bank if issue persists",
    quick: ["Contact support", "Track my order"],
  },
  {
    patterns: ["shipping", "delivery time", "how long", "when will i get"],
    reply: () => "🚚 **Delivery Timeline:**\n\n• Metro cities: 2-3 days\n• Other cities: 4-5 days\n• Remote areas: 5-7 days\n\nFree shipping on orders above ₹999!",
    quick: ["Track my order", "Return policy"],
  },
  {
    patterns: ["cancel", "cancellation", "cancel order"],
    reply: () => "Orders can be cancelled **before they are shipped**. 🚫\n\nGo to Orders → Select order → Cancel.\n\nOnce shipped, you'll need to initiate a return after delivery.",
    quick: ["Return policy", "Contact support", "Track my order"],
  },
  {
    patterns: ["discount", "coupon", "promo", "offer", "sale", "deal"],
    reply: () => "🎉 **Current Offers:**\n\n• First order: 10% off with code **FIRST10**\n• Free shipping above ₹999\n• Seasonal sales on festivals\n\nCheck the home page for latest deals!",
    quick: ["Shop now", "Track my order"],
  },
  {
    patterns: ["contact", "support", "help", "customer care", "phone", "email", "call"],
    reply: () => "📞 **Contact Support:**\n\n• Email: support@luxeshop.com\n• Phone: +91 98765 43210\n• Hours: Mon-Sat, 9AM - 6PM\n\nWe typically respond within 2 hours!",
    quick: ["Return policy", "Track my order"],
  },
  {
    patterns: ["wishlist", "saved", "favourite", "favorite"],
    reply: () => "Your wishlist is accessible from the **🤍 icon** in the top navigation. Tap the heart on any product to save it! ❤️",
    quick: ["Shop now", "Track my order"],
  },
  {
    patterns: ["cart", "add to cart", "checkout"],
    reply: () => "Your cart is accessible from the **🛒 icon** in the top navigation. You can update quantities, remove items, and proceed to checkout from there!",
    quick: ["Payment help", "Track my order"],
  },
  {
    patterns: ["account", "profile", "password", "login", "signup", "register"],
    reply: () => "You can manage your account from the **👤 Profile** page. Update your name, email, and saved addresses there.",
    quick: ["Contact support", "Track my order"],
  },
  {
    patterns: ["address", "delivery address", "change address"],
    reply: () => "You can manage your delivery addresses from the **📍 Address** page in the navigation. Add, edit, or set a default address anytime!",
    quick: ["Track my order", "Contact support"],
  },
  {
    patterns: ["thank", "thanks", "thankyou", "thank you", "great", "awesome", "good"],
    reply: (name) => `You're welcome${name ? `, ${name}` : ""}! 😊 Happy shopping at LuxeShop! Is there anything else I can help you with?`,
    quick: ["Track my order", "Return policy", "Contact support"],
  },
  {
    patterns: ["bye", "goodbye", "see you", "ok bye", "cya"],
    reply: (name) => `Goodbye${name ? `, ${name}` : ""}! 👋 Have a great day and happy shopping! 🛍️`,
    quick: [],
  },
]

const FALLBACK_REPLIES = [
  "I'm not sure about that. Can you rephrase? 🤔",
  "Hmm, I didn't quite get that. Try asking about orders, returns, or payments!",
  "I'm still learning! For complex queries, please contact our support team. 😊",
]

function getBotReply(input, userName) {
  const lower = input.toLowerCase().trim()
  for (const entry of KB) {
    if (entry.patterns.some((p) => lower.includes(p))) {
      return {
        text: entry.reply(userName),
        quick: entry.quick || [],
        action: entry.action || null,
      }
    }
  }
  return {
    text: FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)],
    quick: ["Track my order", "Return policy", "Contact support"],
    action: null,
  }
}

function now() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

// ── Component ─────────────────────────────────────────────────────────────────
const ChatBot = () => {
  const navigate  = useNavigate()
  const { user }  = useSelector((state) => state.auth)
  const userName  = user?.name || user?.email?.split("@")[0] || ""

  const [open,    setOpen]    = useState(false)
  const [input,   setInput]   = useState("")
  const [typing,  setTyping]  = useState(false)
  const [unread,  setUnread]  = useState(1)
  const [quickReplies, setQuickReplies] = useState(["Track my order", "Return policy", "Payment help", "Contact support"])

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: `Hey ${userName ? userName : "there"}! 👋 I'm **LuxeBot**, your LuxeShop assistant.\n\nHow can I help you today?`,
      time: now(),
    },
  ])

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  const sendMessage = (text) => {
    const userText = text || input.trim()
    if (!userText) return
    setInput("")

    const userMsg = { id: Date.now(), role: "user", text: userText, time: now() }
    setMessages((prev) => [...prev, userMsg])
    setTyping(true)
    setQuickReplies([])

    setTimeout(() => {
      const reply = getBotReply(userText, userName)
      setTyping(false)

      // Handle navigation actions
      if (reply.action === "orders") {
        setTimeout(() => navigate("/orders"), 1200)
      }
      if (userText.toLowerCase().includes("go to orders")) {
        navigate("/orders")
      }
      if (userText.toLowerCase().includes("shop now")) {
        navigate("/home")
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: reply.text, time: now() },
      ])
      setQuickReplies(reply.quick || [])
    }, 900 + Math.random() * 600)
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Render markdown-like bold
  const renderText = (text) =>
    text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ))

  return (
    <>
      {/* TOGGLE BUTTON */}
      <button className="chat-toggle" onClick={() => setOpen((o) => !o)} aria-label="Open chat">
        {open ? "✕" : "💬"}
        {!open && unread > 0 && <span className="chat-badge">{unread}</span>}
      </button>

      {/* CHAT WINDOW */}
      {open && (
        <div className="chat-window">

          {/* HEADER */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">🤖</div>
              <div>
                <p className="chat-name">LuxeBot</p>
                <p className="chat-status">Online • Always here to help</p>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* MESSAGES */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg ${msg.role}`}>
                {msg.role === "bot" && (
                  <div className="chat-msg-avatar">🤖</div>
                )}
                <div>
                  <div className="chat-bubble">{renderText(msg.text)}</div>
                  <div className="chat-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {/* TYPING INDICATOR */}
            {typing && (
              <div className="chat-msg bot">
                <div className="chat-msg-avatar">🤖</div>
                <div className="chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* QUICK REPLIES */}
          {quickReplies.length > 0 && !typing && (
            <div className="chat-quick-replies">
              {quickReplies.map((q) => (
                <button key={q} className="chat-quick-btn" onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* INPUT */}
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              className="chat-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
            >
              ➤
            </button>
          </div>

        </div>
      )}
    </>
  )
}

export default ChatBot
