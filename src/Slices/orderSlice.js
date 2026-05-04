import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

// Single source of truth for order URLs
const ORDERS_URL = `${API_URL}/api/orders`              // GET all / POST
const ORDER_URL  = (id) => `${API_URL}/api/orders/${id}` // GET by ID

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

export const fetchOrders = createAsyncThunk(
  "orders/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      console.log("Fetching orders from:", ORDERS_URL)
      const res = await fetch(ORDERS_URL, {
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

export const placeOrder = createAsyncThunk(
  "orders/place",
  async (orderData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(ORDERS_URL, {
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

export const fetchOrderById = createAsyncThunk(
  "orders/fetchById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(ORDER_URL(id), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      if (res.status === 404) return null
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch order")
      return data.order || data.data || data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch order")
    }
  }
)

export const cancelOrder = createAsyncThunk(
  "orders/cancel",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${ORDER_URL(id)}/cancel`, {
        method: "PATCH",
        headers: authHeader(token),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to cancel order")
      return data.order || data.data || { _id: id, status: "cancelled" }
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to cancel order")
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
    clearOrderError:    (state) => { state.error = null },
    clearSelectedOrder: (state) => { state.selectedOrder = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(fetchOrders.fulfilled, (state, action) => { state.loading = false; state.orders = action.payload })
      .addCase(fetchOrders.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(placeOrder.pending,    (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(placeOrder.fulfilled,  (state, action) => {
        state.actionLoading = false
        if (action.payload) state.orders.unshift(action.payload)
      })
      .addCase(placeOrder.rejected,   (state, action) => { state.actionLoading = false; state.error = action.payload })

      .addCase(fetchOrderById.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(fetchOrderById.fulfilled, (state, action) => { state.loading = false; state.selectedOrder = action.payload })
      .addCase(fetchOrderById.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(cancelOrder.pending,   (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload
        // Update in orders list
        const idx = state.orders.findIndex((o) => o._id === updated._id)
        if (idx !== -1) state.orders[idx] = { ...state.orders[idx], ...updated }
        // Update selectedOrder
        if (state.selectedOrder?._id === updated._id) {
          state.selectedOrder = { ...state.selectedOrder, ...updated }
        }
      })
      .addCase(cancelOrder.rejected,  (state, action) => { state.actionLoading = false; state.error = action.payload })
  },
})

export const { clearOrderError, clearSelectedOrder } = orderSlice.actions
export default orderSlice.reducer
