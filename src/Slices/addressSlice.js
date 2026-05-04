import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const API_URL      = import.meta.env.VITE_API_URL || "http://localhost:3000"
const ADDRESS_URL  = `${API_URL}/api/addresses`
const ADDRESS_BY_ID = (id) => `${API_URL}/api/addresses/${id}`

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

export const fetchAddresses = createAsyncThunk(
  "address/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(ADDRESS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch addresses")
      return data.addresses || data.data || data || []
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch addresses")
    }
  }
)

export const addAddress = createAsyncThunk(
  "address/add",
  async (addressData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(ADDRESS_URL, {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify(addressData),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to add address")
      return data.address || data.data || data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to add address")
    }
  }
)

export const updateAddress = createAsyncThunk(
  "address/update",
  async ({ id, ...addressData }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(ADDRESS_BY_ID(id), {
        method: "PUT",
        headers: authHeader(token),
        body: JSON.stringify(addressData),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to update address")
      return data.address || data.data || data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update address")
    }
  }
)

export const deleteAddress = createAsyncThunk(
  "address/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(ADDRESS_BY_ID(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to delete address")
      return id
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to delete address")
    }
  }
)

export const setDefaultAddress = createAsyncThunk(
  "address/setDefault",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${ADDRESS_BY_ID(id)}/default`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to set default")
      // Re-fetch all addresses to get updated isDefault flags
      const allRes = await fetch(ADDRESS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const allData = await safeBody(allRes)
      return allData.addresses || allData.data || allData || []
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to set default address")
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

// Normalize address from backend (_id → id)
function normalize(addr) {
  if (!addr) return addr
  return {
    ...addr,
    id: addr._id || addr.id,
  }
}

const addressSlice = createSlice({
  name: "address",
  initialState: {
    addresses:      [],
    loading:        false,
    actionLoading:  false,
    error:          null,
  },
  reducers: {
    clearAddressError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchAddresses ─────────────────────────────────────────────────────
      .addCase(fetchAddresses.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading   = false
        state.addresses = action.payload.map(normalize)
      })
      .addCase(fetchAddresses.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // ── addAddress ─────────────────────────────────────────────────────────
      .addCase(addAddress.pending,   (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.actionLoading = false
        const newAddr = normalize(action.payload)
        // First address is default
        if (state.addresses.length === 0) newAddr.isDefault = true
        state.addresses.push(newAddr)
      })
      .addCase(addAddress.rejected,  (state, action) => { state.actionLoading = false; state.error = action.payload })

      // ── updateAddress ──────────────────────────────────────────────────────
      .addCase(updateAddress.pending,   (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = normalize(action.payload)
        const idx = state.addresses.findIndex((a) => a.id === updated.id)
        if (idx !== -1) state.addresses[idx] = { ...state.addresses[idx], ...updated }
      })
      .addCase(updateAddress.rejected,  (state, action) => { state.actionLoading = false; state.error = action.payload })

      // ── deleteAddress ──────────────────────────────────────────────────────
      .addCase(deleteAddress.pending,   (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.actionLoading = false
        state.addresses = state.addresses.filter((a) => a.id !== action.payload)
        // If deleted was default, make first one default
        if (state.addresses.length > 0 && !state.addresses.find((a) => a.isDefault)) {
          state.addresses[0].isDefault = true
        }
      })
      .addCase(deleteAddress.rejected,  (state, action) => { state.actionLoading = false; state.error = action.payload })

      // ── setDefaultAddress ──────────────────────────────────────────────────
      .addCase(setDefaultAddress.pending,   (state)         => { state.actionLoading = true;  state.error = null })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.actionLoading = false
        // If backend returned updated list
        if (Array.isArray(action.payload)) {
          state.addresses = action.payload.map(normalize)
        }
      })
      .addCase(setDefaultAddress.rejected,  (state, action) => {
        // If backend doesn't have a /default endpoint, fall back to local toggle
        state.actionLoading = false
        const id = action.meta.arg
        state.addresses = state.addresses.map((a) => ({ ...a, isDefault: a.id === id }))
      })
  },
})

export const { clearAddressError } = addressSlice.actions
export default addressSlice.reducer
