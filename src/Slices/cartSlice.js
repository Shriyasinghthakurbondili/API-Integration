import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

const CART_URL        = `${API_URL}/api/cart`
const CART_REMOVE_URL = (id) => `${API_URL}/api/cart/${id}`  // DELETE :productId in URL params

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

// Always get the freshest token — Redux state first, localStorage fallback
function getToken(getState) {
  return getState().auth.token || localStorage.getItem("token") || null
}

async function refetchCart(token) {
  const t = token || localStorage.getItem("token")
  const res = await fetch(CART_URL, {
    headers: { Authorization: `Bearer ${t}` },
  })
  const data = await safeBody(res)
  if (!res.ok) throw new Error(data.message || "Failed to fetch cart")
  const rawItems = data.cart?.items ?? data.items ?? []
  return rawItems.map((item) => {
    const p = item.product
    const isPopulated = p && typeof p === "object" && !Array.isArray(p)
    return {
      productId: isPopulated ? (p._id || p.id) : String(p),
      name:      isPopulated ? (p.title || p.name || "Product") : "Product",
      price:     isPopulated ? (p.price ?? 0) : 0,
      image:     isPopulated ? (p.image?.url || p.image) : null,
      stock:     isPopulated ? (p.stock ?? 999) : 999,
      quantity:  item.quantity ?? 1,
    }
  })
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      return await refetchCart(getToken(getState))
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch cart")
    }
  }
)

export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ productId, quantity = 1 }, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState)
      const res = await fetch(CART_URL, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ productId, quantity }),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to add to cart")
      return await refetchCart(token)
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to add to cart")
    }
  }
)

export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async (productId, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState)
      const res = await fetch(CART_REMOVE_URL(productId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to remove item")
      return await refetchCart(token)
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to remove item")
    }
  }
)

export const incrementQuantity = createAsyncThunk(
  "cart/increment",
  async (productId, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState)
      const res = await fetch(CART_URL, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to update quantity")
      return await refetchCart(token)
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update quantity")
    }
  }
)

export const decrementQuantity = createAsyncThunk(
  "cart/decrement",
  async (productId, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState)
      const { items } = getState().cart
      const item = items.find((i) => i.productId === productId)
      const currentQty = item?.quantity || 1

      if (currentQty <= 1) {
        const res = await fetch(CART_REMOVE_URL(productId), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await safeBody(res)
        if (!res.ok) return rejectWithValue(data.message || "Failed to remove item")
        return await refetchCart(token)
      }

      const res = await fetch(CART_URL, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ productId, quantity: -1 }),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to update quantity")
      return await refetchCart(token)
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update quantity")
    }
  }
)

export const clearCart = createAsyncThunk(
  "cart/clear",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState)
      const res = await fetch(CART_URL, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to clear cart")
      return []
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to clear cart")
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    loading: false,
    actionLoading: false,   // for checkout / clear cart
    loadingItems: {},       // { [productId]: true } — per-item loading
    error: null,
  },
  reducers: {
    clearCartError: (state) => { state.error = null },
    resetCart:      (state) => { state.items = []; state.loadingItems = {} },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchCart ──────────────────────────────────────────────────────────
      .addCase(fetchCart.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(fetchCart.fulfilled, (state, action) => { state.loading = false; state.items = action.payload })
      .addCase(fetchCart.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // ── addToCart ──────────────────────────────────────────────────────────
      .addCase(addToCart.pending,   (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(addToCart.fulfilled, (state, action) => { state.actionLoading = false; state.items = action.payload })
      .addCase(addToCart.rejected,  (state, action) => { state.actionLoading = false; state.error = action.payload })

      // ── removeFromCart ─────────────────────────────────────────────────────
      .addCase(removeFromCart.pending,   (state, action) => {
        state.loadingItems[action.meta.arg] = true
        state.error = null
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        delete state.loadingItems[action.meta.arg]
        state.items = action.payload
      })
      .addCase(removeFromCart.rejected,  (state, action) => {
        delete state.loadingItems[action.meta.arg]
        state.error = action.payload
      })

      // ── incrementQuantity ──────────────────────────────────────────────────
      .addCase(incrementQuantity.pending,   (state, action) => {
        state.loadingItems[action.meta.arg] = true
        state.error = null
      })
      .addCase(incrementQuantity.fulfilled, (state, action) => {
        delete state.loadingItems[action.meta.arg]
        state.items = action.payload
      })
      .addCase(incrementQuantity.rejected,  (state, action) => {
        delete state.loadingItems[action.meta.arg]
        state.error = action.payload
      })

      // ── decrementQuantity ──────────────────────────────────────────────────
      .addCase(decrementQuantity.pending,   (state, action) => {
        state.loadingItems[action.meta.arg] = true
        state.error = null
      })
      .addCase(decrementQuantity.fulfilled, (state, action) => {
        delete state.loadingItems[action.meta.arg]
        state.items = action.payload
      })
      .addCase(decrementQuantity.rejected,  (state, action) => {
        delete state.loadingItems[action.meta.arg]
        state.error = action.payload
      })

      // ── clearCart ──────────────────────────────────────────────────────────
      .addCase(clearCart.pending,   (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(clearCart.fulfilled, (state, action) => { state.actionLoading = false; state.items = action.payload })
      .addCase(clearCart.rejected,  (state, action) => { state.actionLoading = false; state.error = action.payload })
  },
})

export const { clearCartError, resetCart } = cartSlice.actions
export default cartSlice.reducer
