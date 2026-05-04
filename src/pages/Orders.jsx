import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { fetchOrders } from "../Slices/orderSlice"
import { resolveImage, getFallbackImage } from "../Slices/productSlice"
import TopNav from "../Components/TopNav"
import "./Orders.css"

// Map status string → CSS class + emoji
const statusConfig = {
  pending:    { cls: "status-pending",    icon: "🕐" },
  processing: { cls: "status-processing", icon: "⚙️" },
  shipped:    { cls: "status-shipped",    icon: "🚚" },
  delivered:  { cls: "status-delivered",  icon: "✅" },
  cancelled:  { cls: "status-cancelled",  icon: "❌" },
}

function formatDate(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function getStatus(order) {
  return (order.status || order.orderStatus || "pending").toLowerCase()
}

const Orders = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { orders, loading, error } = useSelector((state) => state.orders)

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

  return (
    <div className="app-shell">
      <TopNav title="LuxeShop" />

      <main className="orders-page">
        <div className="container">

          {/* HEADER */}
          <div className="orders-header">
            <h1 className="orders-title">My Orders 📦</h1>
            <p className="orders-subtitle">
              {loading ? "Fetching your orders..." : `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`}
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="orders-skeleton">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="order-skeleton-card">
                  <div className="skeleton-line" style={{ height: 16, width: "40%" }} />
                  <div className="skeleton-line" style={{ height: 12, width: "60%" }} />
                  <div className="skeleton-line" style={{ height: 56, width: "100%" }} />
                  <div className="skeleton-line" style={{ height: 14, width: "30%" }} />
                </div>
              ))}
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="orders-empty">
              <div className="orders-empty-icon">⚠️</div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button className="orders-shop-btn" onClick={() => dispatch(fetchOrders())}>
                Retry
              </button>
            </div>
          )}

          {/* EMPTY */}
          {!loading && !error && orders.length === 0 && (
            <div className="orders-empty">
              <div className="orders-empty-icon">📭</div>
              <h3>No orders yet</h3>
              <p>Looks like you haven&apos;t placed any orders. Start shopping!</p>
              <button className="orders-shop-btn" onClick={() => navigate("/home")}>
                Shop Now →
              </button>
            </div>
          )}

          {/* ORDER LIST */}
          {!loading && !error && orders.length > 0 && (
            <div className="orders-list">
              {orders.map((order) => {
                const status = getStatus(order)
                const { cls, icon } = statusConfig[status] || statusConfig.pending
                const orderItems = order.items || order.orderItems || []
                const total = order.total ?? order.totalPrice ?? order.totalAmount ?? 0

                return (
                  <div key={order._id} className="order-card" onClick={() => navigate(`/orders/${order._id}`)} style={{ cursor: "pointer" }}>

                    {/* HEADER */}
                    <div className="order-card-header">
                      <div className="order-id-block">
                        <span className="order-label">Order ID</span>
                        <span className="order-id">#{order._id?.slice(-10).toUpperCase()}</span>
                      </div>
                      <div className="order-meta">
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                        <span className={`order-status ${cls}`}>
                          {icon} {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS */}
                    {orderItems.length > 0 && (
                      <div className="order-items">
                        {orderItems.map((item, idx) => {
                          const p = item.product || item
                          const isObj = p && typeof p === "object"
                          const name  = isObj ? (p.title || p.name || "Product") : "Product"
                          const imgSrc = resolveImage(isObj ? p.image : null, name)
                          const price = item.price ?? (isObj ? p.price : 0) ?? 0
                          const qty   = item.quantity ?? item.qty ?? 1

                          return (
                            <div key={idx} className="order-item-row">
                              <img
                                className="order-item-img"
                                src={imgSrc}
                                alt={name}
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = getFallbackImage(name)
                                }}
                              />
                              <div className="order-item-info">
                                <p className="order-item-name">{name}</p>
                                <p className="order-item-qty">Qty: {qty}</p>
                              </div>
                              <span className="order-item-price">
                                ₹ {(price * qty).toLocaleString()}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* FOOTER */}
                    <div className="order-card-footer">
                      <span className="order-total-label">Order Total</span>
                      <span className="order-total-price">₹ {Number(total).toLocaleString()}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/track/${order._id}`) }}
                        style={{
                          marginLeft: "auto", padding: "6px 16px",
                          borderRadius: 8, border: "1px solid rgba(46,204,154,0.3)",
                          background: "rgba(46,204,154,0.1)", color: "#2ecc9a",
                          fontFamily: "Poppins,sans-serif", fontSize: "0.78rem",
                          fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        🗺️ Track
                      </button>
                    </div>

                  </div>
                )
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default Orders
