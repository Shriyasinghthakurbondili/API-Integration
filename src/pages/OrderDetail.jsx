import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useParams, useNavigate } from "react-router-dom"
import { fetchOrderById, clearSelectedOrder, cancelOrder } from "../Slices/orderSlice"
import { resolveImage, getFallbackImage } from "../Slices/productSlice"
import TopNav from "../Components/TopNav"
import { toast, Toaster } from "react-hot-toast"
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
  const { selectedOrder, orders, loading, error, actionLoading } = useSelector((state) => state.orders)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Use order from list if already loaded, otherwise use selectedOrder
  const order = orders.find((o) => o._id === id) || selectedOrder

  // Only show error if order not found anywhere
  const showError = error && !order

  useEffect(() => {
    dispatch(fetchOrderById(id))
    return () => dispatch(clearSelectedOrder())
  }, [dispatch, id])

  // ── LOADING — skip if order already found from list ──
  if (loading && !order) {
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
  if (showError || (!loading && !order)) {
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
      <Toaster />
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
                    const imgSrc   = resolveImage(isObj ? p.image : null, name)
                    const price    = item.price ?? (isObj ? p.price : 0) ?? 0
                    const qty      = item.quantity ?? item.qty ?? 1

                    return (
                      <div key={idx} className="od-item-row">
                        <img
                          className="od-item-img"
                          src={imgSrc}
                          alt={name}
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = getFallbackImage(name)
                          }}
                        />
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

                {/* ORDER INFO */}
                <div className="od-summary-row">
                  <span>Order ID</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#b3acff" }}>
                    #{order._id?.slice(-10).toUpperCase()}
                  </span>
                </div>
                <div className="od-summary-row">
                  <span>Order placed</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="od-summary-row">
                  <span>Time</span>
                  <span>{formatTime(order.createdAt)}</span>
                </div>
                <div className="od-summary-row">
                  <span>Payment</span>
                  <span style={{ color: "#2ecc9a", fontWeight: 600 }}>
                    ✅ {order.paymentMethod || "Razorpay"}
                  </span>
                </div>

                <div className="od-summary-divider" />

                {/* PRICE BREAKDOWN */}
                <div className="od-summary-row">
                  <span>Items ({orderItems.length})</span>
                  <span>₹ {Number(subtotal).toLocaleString()}</span>
                </div>
                <div className="od-summary-row">
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? "#2ecc9a" : "inherit" }}>
                    {shipping === 0 ? "🎉 Free" : `₹ ${shipping}`}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="od-summary-row">
                    <span>Discount</span>
                    <span style={{ color: "#2ecc9a" }}>− ₹ {Number(order.discount).toLocaleString()}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="od-summary-row">
                    <span>Tax (GST)</span>
                    <span>₹ {Number(order.tax).toLocaleString()}</span>
                  </div>
                )}

                <div className="od-summary-divider" />

                {/* TOTAL */}
                <div className="od-summary-total">
                  <span>Total Paid</span>
                  <span className="od-total-price">₹ {Number(total).toLocaleString()}</span>
                </div>

                {/* STATUS PILL */}
                <div
                  className="od-status-pill"
                  style={{ color, background: bg, border: `1px solid ${border}` }}
                >
                  {icon} {label}
                </div>
              </div>

              {/* NEED HELP */}
              <div className="od-help-card">
                <h4 className="od-help-title">Need Help?</h4>
                <div className="od-help-row" onClick={() => navigate("/orders")}>
                  <span>📦</span><span>Track your order</span>
                </div>
                <div className="od-help-row">
                  <span>↩️</span><span>Return & Refund policy</span>
                </div>
                <div className="od-help-row">
                  <span>💬</span><span>Contact support</span>
                </div>
              </div>

              <button className="od-shop-btn" onClick={() => navigate("/home")}>
                Continue Shopping →
              </button>

              {/* CANCEL ORDER — only for pending */}
              {rawStatus === "pending" && (
                <div style={{ marginTop: 12 }}>
                  {!showCancelConfirm ? (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      style={{
                        width: "100%", padding: "11px",
                        borderRadius: 12, border: "1px solid rgba(255,77,109,0.3)",
                        background: "rgba(255,77,109,0.08)", color: "#ff8fa3",
                        fontFamily: "Poppins,sans-serif", fontSize: "0.85rem",
                        fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      ❌ Cancel Order
                    </button>
                  ) : (
                    <div style={{
                      background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)",
                      borderRadius: 12, padding: "14px", textAlign: "center"
                    }}>
                      <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#ff8fa3", fontWeight: 600 }}>
                        Are you sure you want to cancel this order?
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          style={{
                            flex: 1, padding: "9px", borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "transparent", color: "rgba(255,255,255,0.6)",
                            fontFamily: "Poppins,sans-serif", fontSize: "0.82rem",
                            fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          Keep Order
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={async () => {
                            try {
                              await dispatch(cancelOrder(id)).unwrap()
                              toast.success("Order cancelled")
                              setShowCancelConfirm(false)
                            } catch (err) {
                              toast.error(err || "Failed to cancel order")
                              setShowCancelConfirm(false)
                            }
                          }}
                          style={{
                            flex: 1, padding: "9px", borderRadius: 10,
                            border: "none",
                            background: "linear-gradient(135deg,#ff4d6d,#ff6b8a)",
                            color: "#fff", fontFamily: "Poppins,sans-serif",
                            fontSize: "0.82rem", fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          {actionLoading ? "Cancelling..." : "Yes, Cancel"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default OrderDetail
