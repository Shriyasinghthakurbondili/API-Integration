import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const BASE_URL = `${import.meta.env.VITE_API_URL || "https://apis-17.onrender.com"}/api/paymentRoutes`

async function safeBody(res) {
  try { return await res.json() }
  catch { return {} }
}

function authHeader(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

// ─── Load Razorpay SDK dynamically ───────────────────────────────────────────

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.id  = "razorpay-sdk"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

// STEP 1 — Create Razorpay order on backend → returns { orderId, amount, currency, keyId }
export const createPaymentOrder = createAsyncThunk(
  "payment/createOrder",
  async (amount, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${BASE_URL}/order`, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ amount }),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || data.error || "Payment route not found on backend")
      return data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to create payment order")
    }
  }
)

// STEP 2 — Verify payment signature on backend after Razorpay success callback
export const verifyPayment = createAsyncThunk(
  "payment/verify",
  async (paymentData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${BASE_URL}/verify`, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify(paymentData),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || data.error || "Payment verification failed")
      return data
    } catch (err) {
      return rejectWithValue(err?.message || "Payment verification failed")
    }
  }
)

// STEP 1+2 combined — opens Razorpay checkout and verifies on success
export const initiatePayment = createAsyncThunk(
  "payment/initiate",
  async ({ amount, userInfo }, { rejectWithValue }) => {
    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript()
      if (!loaded) return rejectWithValue("Failed to load Razorpay SDK")

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!razorpayKey || razorpayKey === "your_razorpay_key_id_here") {
        return rejectWithValue("Razorpay key not configured in .env")
      }

      // Razorpay test mode max is ₹50,000 — cap for testing
      const payableAmount = Math.min(amount, 50000)

      // Open Razorpay checkout directly (no backend order needed)
      return new Promise((resolve, reject) => {
        const options = {
          key:         razorpayKey,
          amount:      payableAmount * 100,   // paise
          currency:    "INR",
          name:        "LuxeShop",
          description: "Order Payment",
          prefill: {
            name:  userInfo?.name  || "",
            email: userInfo?.email || "",
          },
          theme: { color: "#7c6fff" },

          handler: (response) => {
            // Payment successful — resolve with payment ID
            resolve({ paymentId: response.razorpay_payment_id })
          },

          modal: {
            ondismiss: () => reject("Payment cancelled by user"),
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.on("payment.failed", (response) => {
          reject(response.error?.description || "Payment failed")
        })
        rzp.open()
      })
    } catch (err) {
      return rejectWithValue(typeof err === "string" ? err : err?.message || "Payment failed")
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    orderId:        null,   // Razorpay order ID from backend
    paymentId:      null,   // Razorpay payment ID after success
    loading:        false,
    success:        false,
    error:          null,
  },
  reducers: {
    clearPayment: (state) => {
      state.orderId   = null
      state.paymentId = null
      state.success   = false
      state.error     = null
      state.loading   = false
    },
    clearPaymentError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      // CREATE ORDER
      .addCase(createPaymentOrder.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(createPaymentOrder.fulfilled, (state, action) => { state.orderId = action.payload.orderId })
      .addCase(createPaymentOrder.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // VERIFY
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.paymentId = action.payload.paymentId || null
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

      // INITIATE (full flow)
      .addCase(initiatePayment.pending,   (state)         => { state.loading = true;  state.error = null; state.success = false })
      .addCase(initiatePayment.fulfilled, (state)         => { state.loading = false; state.success = true })
      .addCase(initiatePayment.rejected,  (state, action) => { state.loading = false; state.error = action.payload })
  },
})

export const { clearPayment, clearPaymentError } = paymentSlice.actions
export default paymentSlice.reducer
