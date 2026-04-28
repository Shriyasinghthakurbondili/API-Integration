import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const BASE_URL = `${import.meta.env.VITE_API_URL || "https://apis-17.onrender.com"}/api/orderRoutes`

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

// ─── Thunks ───────────────────────────────────────────────────────────────────

// GET all orders for the logged-in user
export const fetchOrders = createAsyncThunk(
  "orders/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      // Try both common route patterns
      const res = await fetch(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      console.log("FETCH ORDERS response:", res.status, data)
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch orders")
      return data.orders || data.data || data.order || []
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch orders")
    }
  }
)

// POST — place a new order from cart
export const placeOrder = createAsyncThunk(
  "orders/place",
  async (orderData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify(orderData),
      })
      const data = await safeBody(res)
      console.log("PLACE ORDER response:", res.status, data)
      if (!res.ok) return rejectWithValue(data.message || "Failed to place order")
      return data.order || data.data || data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to place order")
    }
  }
)

// GET single order by ID
export const fetchOrderById = createAsyncThunk(
  "orders/fetchById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${BASE_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch order")
      return data.order || data.data || data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch order")
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    selectedOrder: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearOrderError:   (state) => { state.error = null },
    clearSelectedOrder:(state) => { state.selectedOrder = null },
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL
      .addCase(fetchOrders.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(fetchOrders.fulfilled, (state, action) => { state.loading = false; state.orders = action.payload })
      .addCase(fetchOrders.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // PLACE ORDER
      .addCase(placeOrder.pending,    (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(placeOrder.fulfilled,  (state, action) => {
        state.actionLoading = false
        if (action.payload) state.orders.unshift(action.payload)
      })
      .addCase(placeOrder.rejected,   (state, action) => { state.actionLoading = false; state.error = action.payload })

      // FETCH BY ID
      .addCase(fetchOrderById.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(fetchOrderById.fulfilled, (state, action) => { state.loading = false; state.selectedOrder = action.payload })
      .addCase(fetchOrderById.rejected,  (state, action) => { state.loading = false; state.error = action.payload })
  },
})

export const { clearOrderError, clearSelectedOrder } = orderSlice.actions
export default orderSlice.reducer
