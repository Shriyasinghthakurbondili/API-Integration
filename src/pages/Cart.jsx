import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast, Toaster } from "react-hot-toast"
import {
  fetchCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  resetCart,
} from "../Slices/cartSlice"
import { initiatePayment } from "../Slices/paymentSlice"
import { placeOrder } from "../Slices/orderSlice"
import { fetchAddresses } from "../Slices/addressSlice"
import { toggleWishlist } from "../Slices/wishlistSlice"
import { resolveImage, getFallbackImage } from "../Slices/productSlice"
import TopNav from "../Components/TopNav"
import "./Cart.css"

const Cart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { items, loading, actionLoading } = useSelector((state) => state.cart)
  const loadingItems                      = useSelector((state) => state.cart.loadingItems || {})
  const { loading: paymentLoading }       = useSelector((state) => state.payment)
  const { user }                          = useSelector((state) => state.auth)
  const addresses                         = useSelector((state) => state.address.addresses)
  const defaultAddress                    = addresses.find((a) => a.isDefault) || addresses[0] || null
  const wishlistItems                     = useSelector((state) => state.wishlist.items)

  const [coupon,       setCoupon]       = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [discount,     setDiscount]     = useState(0)

  useEffect(() => {
    dispatch(fetchCart())
    dispatch(fetchAddresses())
  }, [dispatch])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = items.length > 0 ? 99 : 0
  const total    = subtotal + shipping - discount

  // Items where quantity exceeds available stock
  const outOfStockItems = items.filter((item) => item.quantity > item.stock)
  const hasStockIssue   = outOfStockItems.length > 0

  // Demo coupons — replace with real backend validation
  const COUPONS = { SAVE10: 0.10, SAVE20: 0.20, LUXE50: 0.50 }

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase()
    if (COUPONS[code]) {
      const disc = Math.round(subtotal * COUPONS[code])
      setDiscount(disc)
      setCouponApplied(true)
      toast.success(`Coupon applied! You save ₹${disc.toLocaleString()} 🎉`)
    } else {
      toast.error("Invalid coupon code")
    }
  }

  const removeCoupon = () => {
    setCoupon("")
    setDiscount(0)
    setCouponApplied(false)
    toast("Coupon removed", { icon: "🗑️" })
  }

  const handleCheckout = async () => {
    // Guard — must have a saved address
    if (!defaultAddress) {
      toast.error("Please add a delivery address first")
      navigate("/address")
      return
    }

    // Guard — stock check before hitting the backend
    if (hasStockIssue) {
      const names = outOfStockItems.map((i) => i.name).join(", ")
      toast.error(`Insufficient stock for: ${names}`)
      return
    }

    try {
      // STEP 1 — Create an order in the database first
      const orderPayload = {
        items: items.map((item) => ({
          product:  item.productId,   // backend expects "product" key
          quantity: item.quantity,
        })),
        addressId: defaultAddress.id, // real MongoDB _id from backend
      }
      const createdOrder = await dispatch(placeOrder(orderPayload)).unwrap()
      const orderId = createdOrder?._id || createdOrder?.id

      // STEP 2 — Initiate Razorpay payment with the order ID
      await dispatch(initiatePayment({
        amount:   total,
        orderId,
        userInfo: { name: user?.name, email: user?.email },
      })).unwrap()

      // Clear cart immediately on frontend first
      dispatch(resetCart())

      toast.success("Payment successful! 🎉")

      // Clear cart on backend in background
      dispatch(clearCart()).catch(() => {})

      setTimeout(() => navigate("/orders"), 1500)

    } catch (err) {
      const msg = err?.message || String(err) || "Payment failed"
      if (msg.toLowerCase().includes("cancel")) {
        toast.error("Payment cancelled")
      } else {
        toast.error(msg)
      }
    }
  }

  return (
    <div className="app-shell">
      <Toaster />
      <TopNav title="LuxeShop" />

      <main className="cart-page">
        <div className="container">

          {/* HEADER */}
          <div className="cart-header">
            <h1 className="cart-title">Your Cart 🛒</h1>
            <p className="cart-subtitle">
              {loading
                ? "Loading your cart..."
                : items.length === 0
                ? "Your cart is empty"
                : `${items.length} item${items.length > 1 ? "s" : ""} in your cart`}
            </p>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">⏳</div>
              <h3>Loading cart...</h3>
            </div>

          ) : items.length === 0 ? (
            /* EMPTY STATE */
            <div className="cart-empty">
              <div className="cart-empty-icon">🛍️</div>
              <h3>Nothing here yet</h3>
              <p>Browse our collection and add something you love.</p>
              <button className="cart-shop-btn" onClick={() => navigate("/home")}>
                Shop Now →
              </button>
            </div>

          ) : (
            <div className="cart-layout">

              {/* LEFT — ITEMS */}
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.productId} className="cart-item">

                    {/* IMAGE */}
                    <img
                      className="cart-item-img"
                      src={resolveImage(item.image, item.name)}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = getFallbackImage(item.name)
                      }}
                    />

                    {/* INFO */}
                    <div className="cart-item-info">
                      <h4 className="cart-item-title">{item.name}</h4>
                      <p className="cart-item-desc">₹ {item.price.toLocaleString()} each</p>
                      <div className="cart-item-price">
                        ₹ {(item.price * item.quantity).toLocaleString()}
                      </div>
                      {item.stock === 0 && (
                        <span style={{ fontSize: "0.72rem", color: "#ff4d6d", fontWeight: 600 }}>
                          ❌ Out of stock
                        </span>
                      )}
                      {item.stock > 0 && item.quantity > item.stock && (
                        <span style={{ fontSize: "0.72rem", color: "#ff8fa3", fontWeight: 600 }}>
                          ⚠️ Only {item.stock} in stock
                        </span>
                      )}
                    </div>

                    {/* CONTROLS */}
                    <div className="cart-item-controls">
                      <div className="qty-row">
                        <button
                          className="qty-btn"
                          disabled={!!loadingItems[item.productId]}
                          onClick={() => dispatch(decrementQuantity(item.productId))}
                        >−</button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          disabled={!!loadingItems[item.productId] || item.quantity >= item.stock}
                          onClick={() => dispatch(incrementQuantity(item.productId))}
                        >+</button>
                      </div>
                      <button
                        className="cart-remove-btn"
                        disabled={!!loadingItems[item.productId]}
                        onClick={() => {
                          dispatch(removeFromCart(item.productId))
                          toast.error("Item removed")
                        }}
                      >
                        {loadingItems[item.productId] ? "..." : "Remove"}
                      </button>
                      <button
                        style={{
                          background: "transparent", border: "none",
                          color: "rgba(255,255,255,0.35)", fontSize: "0.75rem",
                          cursor: "pointer", padding: "4px 0", fontFamily: "Poppins,sans-serif",
                          transition: "color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.color = "#ff8fa3"}
                        onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.35)"}
                        onClick={() => {
                          // Build a product-shaped object for the wishlist
                          dispatch(toggleWishlist({
                            _id:         item.productId,
                            title:       item.name,
                            price:       item.price,
                            image:       item.image,
                            description: "",
                          }))
                          dispatch(removeFromCart(item.productId))
                          toast("Moved to wishlist 🤍", { icon: "💜" })
                        }}
                      >
                        🤍 Wishlist
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* RIGHT — SUMMARY */}
              <div className="cart-summary">
                <h3 className="cart-summary-title">Order Summary</h3>

                <div className="summary-row">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹ {subtotal.toLocaleString()}</span>
                </div>

                <div className="summary-row">
                  <span>Shipping</span>
                  <span>₹ {shipping}</span>
                </div>

                {discount > 0 && (
                  <div className="summary-row">
                    <span style={{ color: "#2ecc9a" }}>Discount</span>
                    <span style={{ color: "#2ecc9a" }}>− ₹ {discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-divider" />

                {/* COUPON CODE */}
                <div style={{ marginBottom: 16 }}>
                  {!couponApplied ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        style={{
                          flex: 1, padding: "9px 12px", borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.05)", color: "#fff",
                          fontFamily: "Poppins,sans-serif", fontSize: "0.82rem",
                          outline: "none"
                        }}
                      />
                      <button
                        onClick={applyCoupon}
                        style={{
                          padding: "9px 14px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg,#7c6fff,#b450ff)",
                          color: "#fff", fontFamily: "Poppins,sans-serif",
                          fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 12px", borderRadius: 10,
                      background: "rgba(46,204,154,0.1)", border: "1px solid rgba(46,204,154,0.3)"
                    }}>
                      <span style={{ fontSize: "0.82rem", color: "#2ecc9a", fontWeight: 600 }}>
                        🎉 {coupon.toUpperCase()} applied
                      </span>
                      <button
                        onClick={removeCoupon}
                        style={{
                          background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                          cursor: "pointer", fontSize: "0.8rem", fontFamily: "Poppins,sans-serif"
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                  <p style={{ margin: "6px 0 0", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>
                    Try: SAVE10 · SAVE20 · LUXE50
                  </p>
                </div>

                <div className="summary-total">
                  <span>Total</span>
                  <span className="summary-total-price">₹ {total.toLocaleString()}</span>
                </div>

                <button
                  className="checkout-btn"
                  disabled={actionLoading || paymentLoading || hasStockIssue}
                  onClick={handleCheckout}
                  title={hasStockIssue ? "Some items exceed available stock" : ""}
                >
                  {paymentLoading ? "Opening Payment..." : "Proceed to Checkout →"}
                </button>

                {hasStockIssue && (
                  <p style={{ fontSize: "0.75rem", color: "#ff8fa3", margin: "8px 0 0", textAlign: "center" }}>
                    ⚠️ Reduce quantity for out-of-stock items
                  </p>
                )}

                {defaultAddress && (
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", margin: "8px 0 0", textAlign: "center" }}>
                    📍 Delivering to: {defaultAddress.city}, {defaultAddress.state}
                  </p>
                )}
                {!defaultAddress && (
                  <p style={{ fontSize: "0.75rem", color: "#ff8fa3", margin: "8px 0 0", textAlign: "center", cursor: "pointer" }}
                    onClick={() => navigate("/address")}
                  >
                    ⚠️ Add a delivery address to checkout
                  </p>
                )}

                <button
                  className="clear-cart-btn"
                  disabled={actionLoading}
                  onClick={() => {
                    dispatch(resetCart())   // instant UI clear
                    dispatch(clearCart())   // sync backend
                    toast.success("Cart cleared")
                  }}
                >
                  Clear Cart
                </button>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default Cart
