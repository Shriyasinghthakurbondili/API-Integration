import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useParams, useNavigate } from "react-router-dom"
import { fetchOrderById, clearSelectedOrder } from "../Slices/orderSlice"
import TopNav from "../Components/TopNav"
import "./OrderDetail.css"

const statusConfig = {
  pending:    { cls: "od-status-pending",    icon: "🕐", label: "Pending",    color: "#ffc94d", bg: "rgba(255,180,0,0.12)",   border: "rgba(255,180,0,0.3)"    },
  processing: { cls: "od-status-processing", icon: "⚙️", label: "Processing", color: "#b3acff", bg: "rgba(124,111,255,0.12)", border: "rgba(124,111,255,0.3)"  },
  shipped:    { cls: "od-status-shipped",    icon: "🚚", label: "Shipped",    color: "#6ec6ff", bg: "rgba(30,160,255,0.12)",  border: "rgba(30,160,255,0.3)"   },
  delivered:  { cls: "od-status-delivered",  icon: "✅", label: "Delivered",  color: "#2ecc9a", bg: "rgba(46,204,154,0.12)",  border: "rgba(46,204,154,0.3)"   },
  cancelled:  { cls: "od-status-cancelled",  icon: "❌", label: "Cancelled",  color: "#ff8fa3", bg: "rgba(255,77,109,0.12)",  border: "rgba(255,77,109,0.3)"   },
}

const steps = ["pending", "processing", "shipped", "delivered"]

function formatDate(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  })
}

const OrderDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { selectedOrder: order, loading, error } = useSelector((state) => state.orders)

  useEffect(() => {
    dispatch(fetchOrderById(id))
    return () => dispatch(clearSelectedOrder())
  }, [dispatch, id])

  // ── LOADING ──────────────────────────────────
  if (loading) {
    return (
      <div className="app-shell">
        <TopNav title="LuxeShop" />
        <main className="od-page">
          <div className="container">
            <div className="od-skeleton">
              <div className="od-sk-line skeleton" style={{ width: "30%", height: 14 }} />
              <div className="od-sk-line skeleton" style={{ width: "55%", height: 28 }} />
              <div className="od-sk-block skeleton" style={{ height: 120 }} />
              <div className="od-sk-block skeleton" style={{ height: 200 }} />
              <div className="od-sk-block skeleton" style={{ height: 100 }} />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── ERROR / NOT FOUND ─────────────────────────
  if (error || !order) {
    return (
      <div className="app-shell">
        <TopNav title="LuxeShop" />
        <main className="od-page">
          <div className="container">
            <div className="od-state-card">
              <div className="od-state-icon">{error ? "⚠️" : "🔍"}</div>
              <h3>{error ? "Something went wrong" : "Order not found"}</h3>
              <p>{error || "This order doesn't exist or was removed."}</p>
              <button className="od-back-btn" onClick={() => navigate("/orders")}>
                ← Back to Orders
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const rawStatus = (order.status || order.orderStatus || "pending").toLowerCase()
  const { cls, icon, label, color, bg, border } = statusConfig[rawStatus] || statusConfig.pending
  const orderItems = order.items || order.orderItems || []
  const subtotal   = order.subtotal ?? orderItems.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0)
  const shipping   = order.shippingCost ?? order.shipping ?? 0
  const total      = order.total ?? order.totalPrice ?? order.totalAmount ?? (subtotal + shipping)
  const stepIndex  = steps.indexOf(rawStatus)

  return (
    <div className="app-shell">
      <TopNav title="LuxeShop" />
      <main className="od-page">
        <div className="container">

          {/* BACK */}
          <button className="od-back-btn" onClick={() => navigate("/orders")}>
            ← Back to Orders
          </button>

          {/* PAGE TITLE ROW */}
          <div className="od-title-row">
            <div>
              <h1 className="od-title">Order Details</h1>
              <p className="od-id">#{order._id?.toUpperCase()}</p>
            </div>
            <span
              className="od-status-badge"
              style={{ color, background: bg, border: `1px solid ${border}` }}
            >
              {icon} {label}
            </span>
          </div>

          {/* PROGRESS TRACKER — only for non-cancelled */}
          {rawStatus !== "cancelled" && (
            <div className="od-tracker">
              {steps.map((step, i) => {
                const done    = i <= stepIndex
                const current = i === stepIndex
                return (
                  <div key={step} className={`od-step ${done ? "od-step-done" : ""} ${current ? "od-step-current" : ""}`}>
                    <div className="od-step-dot">
                      {done ? (current ? statusConfig[step]?.icon : "✓") : ""}
                    </div>
                    <span className="od-step-label">
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </span>
                    {i < steps.length - 1 && (
                      <div className={`od-step-line ${i < stepIndex ? "od-step-line-done" : ""}`} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="od-layout">

            {/* LEFT COLUMN */}
            <div className="od-left">

              {/* ORDER ITEMS */}
              <div className="od-section">
                <h3 className="od-section-title">Items Ordered</h3>
                <div className="od-items">
                  {orderItems.map((item, idx) => {
                    const p        = item.product || item
                    const isObj    = p && typeof p === "object"
                    const name     = isObj ? (p.title || p.name || "Product") : "Product"
                    const img      = isObj ? (p.image?.url || p.image || "") : ""
                    const price    = item.price ?? (isObj ? p.price : 0) ?? 0
                    const qty      = item.quantity ?? item.qty ?? 1

                    return (
                      <div key={idx} className="od-item-row">
                        {img ? (
                          <img className="od-item-img" src={img} alt={name} />
                        ) : (
                          <div className="od-item-img-placeholder">📦</div>
                        )}
                        <div className="od-item-info">
                          <p className="od-item-name">{name}</p>
                          <p className="od-item-meta">Qty: {qty}  ×  ₹ {price.toLocaleString()}</p>
                        </div>
                        <span className="od-item-total">
                          ₹ {(price * qty).toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SHIPPING ADDRESS */}
              {(order.shippingAddress || order.address) && (
                <div className="od-section">
                  <h3 className="od-section-title">Shipping Address</h3>
                  <div className="od-address-card">
                    <span className="od-address-icon">📍</span>
                    <div>
                      {Object.values(order.shippingAddress || order.address)
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN — SUMMARY */}
            <div className="od-right">

              <div className="od-summary-card">
                <h3 className="od-summary-title">Order Summary</h3>

                <div className="od-summary-row">
                  <span>Order placed</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="od-summary-row">
                  <span>Time</span>
                  <span>{formatTime(order.createdAt)}</span>
                </div>
                <div className="od-summary-row">
                  <span>Items</span>
                  <span>{orderItems.length}</span>
                </div>

                <div className="od-summary-divider" />

                <div className="od-summary-row">
                  <span>Subtotal</span>
                  <span>₹ {Number(subtotal).toLocaleString()}</span>
                </div>
                <div className="od-summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹ ${shipping}`}</span>
                </div>

                <div className="od-summary-divider" />

                <div className="od-summary-total">
                  <span>Total</span>
                  <span className="od-total-price">₹ {Number(total).toLocaleString()}</span>
                </div>

                <div
                  className="od-status-pill"
                  style={{ color, background: bg, border: `1px solid ${border}` }}
                >
                  {icon} {label}
                </div>
              </div>

              <button className="od-shop-btn" onClick={() => navigate("/home")}>
                Continue Shopping →
              </button>

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default OrderDetail
