import { useEffect } from "react"
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
import TopNav from "../Components/TopNav"
import "./Cart.css"

const Cart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { items, loading, actionLoading } = useSelector((state) => state.cart)
  const { loading: paymentLoading }       = useSelector((state) => state.payment)
  const { user }                          = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchCart())
  }, [dispatch])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = items.length > 0 ? 99 : 0
  const total    = subtotal + shipping

  const handleCheckout = async () => {
    try {
      await dispatch(initiatePayment({
        amount:   total,
        userInfo: { name: user?.name, email: user?.email },
      })).unwrap()

      toast.success("Payment successful! 🎉")

      // Clear cart instantly on frontend
      dispatch(resetCart())
      dispatch(clearCart())

      setTimeout(() => navigate("/home"), 1500)

    } catch (err) {
      if (err === "Payment cancelled by user") {
        toast.error("Payment cancelled")
      } else {
        toast.error(typeof err === "string" ? err : "Payment failed. Try again.")
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
                    {item.image ? (
                      <img className="cart-item-img" src={item.image} alt={item.name} />
                    ) : (
                      <div className="cart-item-img-placeholder">📦</div>
                    )}

                    {/* INFO */}
                    <div className="cart-item-info">
                      <h4 className="cart-item-title">{item.name}</h4>
                      <p className="cart-item-desc">₹ {item.price.toLocaleString()} each</p>
                      <div className="cart-item-price">
                        ₹ {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    {/* CONTROLS */}
                    <div className="cart-item-controls">
                      <div className="qty-row">
                        <button
                          className="qty-btn"
                          disabled={actionLoading}
                          onClick={() => dispatch(decrementQuantity(item.productId))}
                        >−</button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          disabled={actionLoading}
                          onClick={() => dispatch(incrementQuantity(item.productId))}
                        >+</button>
                      </div>
                      <button
                        className="cart-remove-btn"
                        disabled={actionLoading}
                        onClick={() => {
                          dispatch(removeFromCart(item.productId))
                          toast.error("Item removed")
                        }}
                      >
                        Remove
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

                <div className="summary-divider" />

                <div className="summary-total">
                  <span>Total</span>
                  <span className="summary-total-price">₹ {total.toLocaleString()}</span>
                </div>

                <button
                  className="checkout-btn"
                  disabled={actionLoading || paymentLoading}
                  onClick={handleCheckout}
                >
                  {paymentLoading ? "Opening Payment..." : "Proceed to Checkout →"}
                </button>

                <button
                  className="clear-cart-btn"
                  disabled={actionLoading}
                  onClick={() => {
                    dispatch(clearCart())
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
