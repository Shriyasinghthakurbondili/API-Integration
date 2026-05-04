import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast, Toaster } from "react-hot-toast"
import { removeFromWishlist, clearWishlist } from "../Slices/wishlistSlice"
import { addToCart } from "../Slices/cartSlice"
import { resolveImage, getFallbackImage } from "../Slices/productSlice"
import TopNav from "../Components/TopNav"
import "./Wishlist.css"

const Wishlist = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { items }     = useSelector((state) => state.wishlist)
  const actionLoading = useSelector((state) => state.cart.actionLoading)

  const handleAddToCart = (product) => {
    dispatch(addToCart({ productId: product._id, quantity: 1 }))
    toast.success(`${product.title} added to cart 🛒`)
  }

  const handleRemove = (product) => {
    dispatch(removeFromWishlist(product._id))
    toast.error(`${product.title} removed from wishlist`)
  }

  const handleClear = () => {
    dispatch(clearWishlist())
    toast.success("Wishlist cleared")
  }

  return (
    <div className="app-shell">
      <Toaster />
      <TopNav title="LuxeShop" />

      <main className="wl-page">
        <div className="container">

          {/* HEADER */}
          <div className="wl-header">
            <div>
              <h1 className="wl-title">My Wishlist ❤️</h1>
              <p className="wl-subtitle">
                {items.length === 0
                  ? "Your wishlist is empty"
                  : `${items.length} item${items.length > 1 ? "s" : ""} saved`}
              </p>
            </div>
            {items.length > 0 && (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={{
                    padding: "10px 18px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg,#7c6fff,#b450ff)",
                    color: "#fff", fontFamily: "Poppins,sans-serif",
                    fontSize: "0.85rem", fontWeight: 700, cursor: "pointer"
                  }}
                  disabled={actionLoading}
                  onClick={() => {
                    items.forEach((p) => dispatch(addToCart({ productId: p._id, quantity: 1 })))
                    toast.success(`${items.length} items added to cart 🛒`)
                  }}
                >
                  🛒 Add All to Cart
                </button>
                <button className="wl-clear-btn" onClick={handleClear}>
                  🗑️ Clear All
                </button>
              </div>
            )}
          </div>

          {/* EMPTY */}
          {items.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon">🤍</div>
              <h3>Nothing saved yet</h3>
              <p>Tap the heart on any product to save it here.</p>
              <button className="wl-shop-btn" onClick={() => navigate("/home")}>
                Browse Products →
              </button>
            </div>
          ) : (
            <div className="wl-grid">
              {items.map((product) => {
                const imgSrc = resolveImage(product.image, product.title, product.category)
                return (
                  <div key={product._id} className="wl-card">

                    {/* IMAGE */}
                    <div
                      className="wl-media"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      <img
                        src={imgSrc}
                        alt={product.title}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = getFallbackImage(product.title, product.category)
                        }}
                      />

                      {/* CATEGORY BADGE */}
                      {product.category && (
                        <span className="wl-category-badge">{product.category}</span>
                      )}

                      {/* REMOVE HEART */}
                      <button
                        className="wl-heart-btn"
                        onClick={(e) => { e.stopPropagation(); handleRemove(product) }}
                        title="Remove from wishlist"
                      >
                        ❤️
                      </button>
                    </div>

                    {/* BODY */}
                    <div className="wl-card-body">
                      <h3 className="wl-product-title">{product.title}</h3>
                      <p className="wl-product-desc">{product.description}</p>

                      <div className="wl-price-row">
                        <span className="wl-price">₹ {Number(product.price).toLocaleString()}</span>
                        <button
                          className="wl-view-btn"
                          onClick={() => navigate(`/product/${product._id}`)}
                        >
                          View →
                        </button>
                      </div>

                      <button
                        className="wl-cart-btn"
                        disabled={actionLoading}
                        onClick={() => handleAddToCart(product)}
                      >
                        🛒 Add to Cart
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

export default Wishlist
