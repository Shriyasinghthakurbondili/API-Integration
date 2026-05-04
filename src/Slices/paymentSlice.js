import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

// ─── Thunks ───────────────────────────────────────────────────────────────────

// STEP 1 — Create Razorpay order on backend
export const createPaymentOrder = createAsyncThunk(
  "payment/createOrder",
  async ({ amount, orderId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${API_URL}/api/payments/create-order`,
        { amount, orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log("Create order response:", res.data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to create order")
    }
  }
)

// STEP 2 — Verify payment on backend
export const verifyPayment = createAsyncThunk(
  "payment/verify",
  async (paymentData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${API_URL}/api/payments/verify`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log("Verify response:", res.data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Verification failed")
    }
  }
)

// FULL FLOW — create order → open Razorpay → verify
export const initiatePayment = createAsyncThunk(
  "payment/initiate",
  async ({ amount, orderId: appOrderId, userInfo }, { dispatch, rejectWithValue }) => {
    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!razorpayKey || razorpayKey === "your_razorpay_key_id_here") {
        return rejectWithValue("Razorpay key not configured in .env")
      }

      // STEP 1 — Create Razorpay order on backend
      const orderResult = await dispatch(createPaymentOrder({ amount, orderId: appOrderId })).unwrap()
      console.log("Order created:", orderResult)

      // Handle all possible response shapes from backend
      const razorpayOrderId = orderResult?.razorpayOrder?.id || orderResult?.id || orderResult?.orderId || orderResult?.order?.id
      const orderAmt        = orderResult?.razorpayOrder?.amount || orderResult?.amount || (amount * 100)
      const currency        = orderResult?.razorpayOrder?.currency || orderResult?.currency || "INR"

      if (!razorpayOrderId) {
        console.error("No order ID in response:", orderResult)
        return rejectWithValue("Backend did not return an order ID")
      }

      // STEP 2 — Open Razorpay
      return await new Promise((resolve, reject) => {
        const options = {
          key:         razorpayKey,
          order_id:    razorpayOrderId,
          amount:      orderAmt,
          currency,
          name:        "LuxeShop",
          description: "Order Payment",
          prefill: {
            name:  userInfo?.name  || "",
            email: userInfo?.email || "",
          },
          theme: { color: "#7c6fff" },

          handler: async (response) => {
            try {
              // STEP 3 — Verify on backend
              await dispatch(verifyPayment({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              })).unwrap()
              resolve({ paymentId: response.razorpay_payment_id })
            } catch (err) {
              reject(new Error(err?.message || "Verification failed"))
            }
          },

          modal: {
            ondismiss: () => reject(new Error("Payment cancelled by user")),
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.on("payment.failed", (response) => {
          reject(new Error(response.error?.description || "Payment failed"))
        })
        rzp.open()
      })
    } catch (err) {
      const msg = err?.message || String(err) || "Payment failed"
      return rejectWithValue(msg)
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    orderId:   null,
    paymentId: null,
    loading:   false,
    success:   false,
    error:     null,
  },
  reducers: {
    clearPayment: (state) => {
      state.orderId = null; state.paymentId = null
      state.success = false; state.error = null; state.loading = false
    },
    clearPaymentError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentOrder.pending,   (state) => { state.loading = true;  state.error = null })
      .addCase(createPaymentOrder.fulfilled, (state, action) => { state.orderId = action.payload?.id || null })
      .addCase(createPaymentOrder.rejected,  (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(verifyPayment.fulfilled,      (state, action) => { state.paymentId = action.payload?.paymentId || null })
      .addCase(verifyPayment.rejected,       (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(initiatePayment.pending,      (state) => { state.loading = true;  state.error = null; state.success = false })
      .addCase(initiatePayment.fulfilled,    (state) => { state.loading = false; state.success = true })
      .addCase(initiatePayment.rejected,     (state, action) => { state.loading = false; state.error = action.payload })
  },
})

export const { clearPayment, clearPaymentError } = paymentSlice.actions
export default paymentSlice.reducer
