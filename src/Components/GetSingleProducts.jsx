import { useEffect } from 'react'
import { useDispatch, useSelector } from "react-redux"
import { useParams, useNavigate } from "react-router-dom"
import { fetchSingleProduct } from '../Slices/ProductSlice'
import { addToCart } from '../Slices/cartSlice'
import { toast } from "react-hot-toast"
import TopNav from "./TopNav"
import "./GetSingleProducts.css"

const GetSingleProducts = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { singleProduct, loading, error } = useSelector((state) => state.products)
  const actionLoading = useSelector((state) => state.cart.actionLoading)

  useEffect(() => {
    dispatch(fetchSingleProduct(id))
  }, [dispatch, id])

  // ── States ──────────────────────────────────
  if (loading) {
    return (
      <div className="app-shell">
        <TopNav title="LuxeShop" />
        <main className="sp-page">
          <div className="container">
            <div className="sp-skeleton">
              <div className="sp-skeleton-img skeleton" />
              <div className="sp-skeleton-body">
                <div className="skeleton" style={{ height: 18, width: "40%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 32, width: "70%", borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 14, width: "90%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 14, width: "75%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 48, width: "100%", borderRadius: 12, marginTop: 16 }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !singleProduct) {
    return (
      <div className="app-shell">
        <TopNav title="LuxeShop" />
        <main className="sp-page">
          <div className="container">
            <div className="sp-state-card">
              <div className="sp-state-icon">{error ? "⚠️" : "🔍"}</div>
              <h3>{error ? "Something went wrong" : "Product not found"}</h3>
              <p>{error || "This product doesn't exist or was removed."}</p>
              <button className="sp-back-btn" onClick={() => navigate("/home")}>
                ← Back to Shop
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const handleAddToCart = () => {
    dispatch(addToCart({ productId: singleProduct._id, quantity: 1 }))
    toast.success("Added to cart 🛒")
  }

  return (
    <div className="app-shell">
      <TopNav title="LuxeShop" />
      <main className="sp-page">
        <div className="container">

          {/* BACK */}
          <button className="sp-back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>

          {/* MAIN CARD */}
          <div className="sp-card">

            {/* LEFT — IMAGE */}
            <div className="sp-image-side">
              {singleProduct.image?.url ? (
                <img src={singleProduct.image.url} alt={singleProduct.title} />
              ) : (
                <div className="sp-no-image">📦</div>
              )}
            </div>

            {/* RIGHT — DETAILS */}
            <div className="sp-details-side">

              <span className="sp-badge">✦ In Stock</span>

              <h1 className="sp-title">{singleProduct.title}</h1>
              <p className="sp-desc">{singleProduct.description}</p>

              <div className="sp-divider" />

              <div className="sp-price-row">
                <div className="sp-price">
                  <span>₹</span>{Number(singleProduct.price).toLocaleString()}
                </div>
                <span className="sp-secure">🔒 Secure checkout</span>
              </div>

              <div className="sp-actions">
                <button
                  className="sp-cart-btn"
                  disabled={actionLoading}
                  onClick={handleAddToCart}
                >
                  {actionLoading ? "Adding..." : "🛒 Add to Cart"}
                </button>
                <button
                  className="sp-buy-btn"
                  onClick={() => {
                    handleAddToCart()
                    navigate("/cart")
                  }}
                >
                  Buy Now →
                </button>
              </div>

              <div className="sp-perks">
                <div className="sp-perk">🚚 Free delivery on orders over ₹999</div>
                <div className="sp-perk">↩️ Easy 7-day returns</div>
                <div className="sp-perk">⭐ Premium quality guaranteed</div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default GetSingleProducts
