import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { logout } from "../Slices/authSlice"
import { fetchOrders } from "../Slices/orderSlice"
import TopNav from "../Components/TopNav"
import "./Profile.css"

const statusConfig = {
  pending:    { icon: "🕐", color: "#ffc94d", bg: "rgba(255,180,0,0.12)",   border: "rgba(255,180,0,0.3)"    },
  processing: { icon: "⚙️", color: "#b3acff", bg: "rgba(124,111,255,0.12)", border: "rgba(124,111,255,0.3)"  },
  shipped:    { icon: "🚚", color: "#6ec6ff", bg: "rgba(30,160,255,0.12)",  border: "rgba(30,160,255,0.3)"   },
  delivered:  { icon: "✅", color: "#2ecc9a", bg: "rgba(46,204,154,0.12)",  border: "rgba(46,204,154,0.3)"   },
  cancelled:  { icon: "❌", color: "#ff8fa3", bg: "rgba(255,77,109,0.12)",  border: "rgba(255,77,109,0.3)"   },
}

function formatDate(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function getInitials(email, name) {
  if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2)
  return email ? email[0].toUpperCase() : "U"
}

const Profile = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { user }  = useSelector((state) => state.auth)
  const { orders } = useSelector((state) => state.orders)
  const cartCount  = useSelector((state) =>
    state.cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0
  )

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  const totalSpent = orders.reduce((sum, o) => {
    return sum + (o.total ?? o.totalPrice ?? o.totalAmount ?? 0)
  }, 0)

  const recentOrders = [...orders].slice(0, 4)

  return (
    <div className="app-shell">
      <TopNav title="LuxeShop" />

      <main className="profile-page">
        <div className="container">

          {/* ── HERO ── */}
          <div className="profile-hero">
            <div className="profile-hero-bg" />
            <div className="profile-hero-content">

              <div className="profile-avatar">
                {getInitials(user?.email, user?.name)}
              </div>

              <div className="profile-user-info">
                <h1 className="profile-name">
                  {user?.name || user?.email?.split("@")[0] || "User"}
                </h1>
                <p className="profile-email">✉️ {user?.email || "—"}</p>
                <span className={`profile-role-badge ${user?.role === "admin" ? "role-admin" : "role-user"}`}>
                  {user?.role === "admin" ? "👑 Admin" : "🛍️ Member"}
                </span>
              </div>

              <button className="profile-logout-btn" onClick={handleLogout}>
                Logout
              </button>

            </div>
          </div>

          {/* ── STATS ── */}
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-icon stat-icon-orders">📦</div>
              <div className="stat-info">
                <div className="stat-value">{orders.length}</div>
                <div className="stat-label">Total Orders</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-cart">🛒</div>
              <div className="stat-info">
                <div className="stat-value">{cartCount}</div>
                <div className="stat-label">Cart Items</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-spent">💰</div>
              <div className="stat-info">
                <div className="stat-value">₹{(totalSpent / 1000).toFixed(1)}k</div>
                <div className="stat-label">Total Spent</div>
              </div>
            </div>
          </div>

          {/* ── MAIN LAYOUT ── */}
          <div className="profile-layout">

            {/* LEFT — Account Info + Quick Actions */}
            <div>

              {/* ACCOUNT INFO */}
              <div className="profile-card" style={{ marginBottom: 20 }}>
                <div className="profile-card-header">
                  <span className="profile-card-icon">👤</span>
                  <h3 className="profile-card-title">Account Info</h3>
                </div>
                <div className="profile-card-body">
                  <div className="profile-info-row">
                    <span className="profile-info-label">Name</span>
                    <span className="profile-info-value">
                      {user?.name || user?.email?.split("@")[0] || "—"}
                    </span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Email</span>
                    <span className="profile-info-value highlight">{user?.email || "—"}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">User ID</span>
                    <span className="profile-info-value" style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "rgba(255,255,255,0.35)" }}>
                      {user?._id || "—"}
                    </span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Role</span>
                    <span className={`profile-role-badge ${user?.role === "admin" ? "role-admin" : "role-user"}`}>
                      {user?.role === "admin" ? "👑 Admin" : "🛍️ Member"}
                    </span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Member Since</span>
                    <span className="profile-info-value">{formatDate(user?.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <span className="profile-card-icon">⚡</span>
                  <h3 className="profile-card-title">Quick Actions</h3>
                </div>
                <div className="profile-card-body">
                  <div className="profile-actions-grid">
                    <button className="profile-action-btn action-orders" onClick={() => navigate("/orders")}>
                      <span className="action-icon">📦</span>
                      My Orders
                    </button>
                    <button className="profile-action-btn action-cart" onClick={() => navigate("/cart")}>
                      <span className="action-icon">🛒</span>
                      My Cart
                    </button>
                    <button className="profile-action-btn action-shop" onClick={() => navigate("/home")}>
                      <span className="action-icon">🛍️</span>
                      Shop Now
                    </button>
                    <button className="profile-action-btn action-logout" onClick={handleLogout}>
                      <span className="action-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT — Recent Orders */}
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-icon">🕐</span>
                <h3 className="profile-card-title">Recent Orders</h3>
              </div>
              <div className="profile-card-body">
                {recentOrders.length === 0 ? (
                  <div className="profile-no-orders">
                    <span>📭</span>
                    No orders placed yet
                  </div>
                ) : (
                  recentOrders.map((order) => {
                    const rawStatus = (order.status || order.orderStatus || "pending").toLowerCase()
                    const { icon, color, bg, border } = statusConfig[rawStatus] || statusConfig.pending
                    const total = order.total ?? order.totalPrice ?? order.totalAmount ?? 0

                    return (
                      <div
                        key={order._id}
                        className="profile-recent-order"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        <div>
                          <div className="pro-order-id">#{order._id?.slice(-8).toUpperCase()}</div>
                          <div className="pro-order-date">{formatDate(order.createdAt)}</div>
                        </div>
                        <span
                          className="pro-order-status"
                          style={{ color, background: bg, border: `1px solid ${border}` }}
                        >
                          {icon} {rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)}
                        </span>
                        <span className="pro-order-total">₹ {Number(total).toLocaleString()}</span>
                      </div>
                    )
                  })
                )}

                {orders.length > 4 && (
                  <button
                    onClick={() => navigate("/orders")}
                    style={{
                      width: "100%", marginTop: 8, padding: "10px",
                      borderRadius: 10, border: "1px solid rgba(124,111,255,0.25)",
                      background: "rgba(124,111,255,0.08)", color: "#b3acff",
                      fontFamily: "Poppins, sans-serif", fontSize: "0.82rem",
                      fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    View all {orders.length} orders →
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile
