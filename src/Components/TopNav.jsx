import { useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { logout } from "../Slices/authSlice"
import "./TopNav.css"

const TopNav = ({ title = "Ecommerce" }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { token } = useSelector((state) => state.auth || {})

  const cartCount = useSelector((state) =>
    state.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0
  )

  const wishlistCount = useSelector((state) =>
    state.wishlist?.items?.length || 0
  )

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  return (
    <div className="nav">
      <div className="container nav-inner">

        {/* LEFT */}
        <div className="brand">
          <div className="brand-badge"></div>
          <span>{title}</span>
        </div>

        {/* RIGHT */}
        <div className="nav-actions">

          <button className="btn btn-ghost" onClick={() => navigate("/home")}>
            Home
          </button>

          {/* WISHLIST */}
          {token && (
            <button className="btn btn-cart" onClick={() => navigate("/wishlist")}>
              🤍 Wishlist
              {wishlistCount > 0 && (
                <span className="cart-badge" style={{ background: "linear-gradient(135deg,#ff4d6d,#ff6b8a)" }}>
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* CART */}
          {token && (
            <button className="btn btn-cart" onClick={() => navigate("/cart")}>
              🛒 Cart
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
          )}

          {token && (
            <button className="btn btn-ghost" onClick={() => navigate("/orders")}>
              📦 Orders
            </button>
          )}

          {token && (
            <button className="btn btn-ghost" onClick={() => navigate("/profile")}>
              👤 Profile
            </button>
          )}

          {token && (
            <button className="btn btn-ghost" onClick={() => navigate("/address")}>
              📍 Address
            </button>
          )}

          {token && (
            <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
          )}

          {token && (
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          )}

        </div>
      </div>
    </div>
  )
}

export default TopNav
