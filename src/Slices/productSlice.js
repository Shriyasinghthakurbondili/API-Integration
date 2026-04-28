import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const API_URL = import.meta.env.VITE_API_URL || "https://apis-17.onrender.com"

const BASE_URL = `${API_URL}/api/productRoutes`

// Safe response parser
async function safeBody(res) {
  try {
    return await res.json()
  } catch {
    try {
      const text = await res.text()
      return { message: text }
    } catch {
      return {}
    }
  }
}

// Auth header
function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

//
// 🔹 GET ALL PRODUCTS
//
export const fetchProducts = createAsyncThunk(
  "products/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth

      const res = await fetch(`${BASE_URL}/products`, {
        headers: authHeader(token)
      })

      const data = await safeBody(res)

      if (!res.ok) {
        return rejectWithValue(
          data.message || data.error || data.msg || "Fetch failed"
        )
      }

      return data.products || data.data || []
    } catch (err) {
      return rejectWithValue(err?.message || "Fetch failed")
    }
  }
)

//
// 🔹 GET SINGLE PRODUCT
//
export const fetchSingleProduct = createAsyncThunk(
  "products/fetchSingle",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth

      const res = await fetch(`${BASE_URL}/products/${id}`, {
        headers: authHeader(token)
      })

      const data = await safeBody(res)

      if (!res.ok) {
        return rejectWithValue(
          data.message || data.error || data.msg || "Fetch failed"
        )
      }

      return data.singleProduct || data.product || data.data || null
    } catch (err) {
      return rejectWithValue(err?.message || "Fetch failed")
    }
  }
)

//
// 🔹 ADD PRODUCT
//
export const addProduct = createAsyncThunk(
  "products/add",
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth

      const res = await fetch(`${BASE_URL}/products`, {
        method: "POST",
        headers: authHeader(token), // don't set Content-Type manually for FormData
        body: formData
      })

      const data = await safeBody(res)

      if (!res.ok) {
        return rejectWithValue(
          data.message || data.error || data.msg || "Add failed"
        )
      }

      return data.product || data.data
    } catch (err) {
      return rejectWithValue(err?.message || "Add failed")
    }
  }
)

//
// 🔹 UPDATE PRODUCT
//
export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, formData }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth

      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: authHeader(token),
        body: formData
      })

      const data = await safeBody(res)

      if (!res.ok) {
        return rejectWithValue(
          data.message || data.error || data.msg || "Update failed"
        )
      }

      return data.product || data.updatedProduct || data.data
    } catch (err) {
      return rejectWithValue(err?.message || "Update failed")
    }
  }
)

//
// 🔹 DELETE PRODUCT
//
export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth

      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: authHeader(token)
      })

      const data = await safeBody(res)

      if (!res.ok) {
        return rejectWithValue(
          data.message || data.error || data.msg || "Delete failed"
        )
      }

      return id
    } catch (err) {
      return rejectWithValue(err?.message || "Delete failed")
    }
  }
)

//
// 🔹 SLICE
//
const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    singleProduct: null,
    loading: false,
    error: null
  },
  reducers: {
    clearSingleProduct: (state) => {
      state.singleProduct = null
    }
  },
  extraReducers: (builder) => {
    builder

      // GET ALL
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // GET SINGLE
      .addCase(fetchSingleProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSingleProduct.fulfilled, (state, action) => {
        state.loading = false
        state.singleProduct = action.payload
      })
      .addCase(fetchSingleProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // ADD
      .addCase(addProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items.push(action.payload)
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // UPDATE
      .addCase(updateProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.map((p) =>
          p._id === action.payload._id ? action.payload : p
        )
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // DELETE
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter(
          (p) => p._id !== action.payload
        )
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearSingleProduct } = productSlice.actions

export default productSlice.reducer