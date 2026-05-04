import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
const BASE_URL = `${API_URL}/api/products`

// Helper — resolve image URL from any backend format
// Helper — get a relevant Unsplash image based on product title/category
export function getFallbackImage(title = "", category = "") {
  const text = (title + " " + category).toLowerCase()

  const map = [
    { keys: ["washing machine", "washer"],                url: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop" },
    { keys: ["refrigerator", "fridge"],                   url: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&auto=format&fit=crop" },
    { keys: ["smart tv", "television", " tv "],           url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&auto=format&fit=crop" },
    { keys: ["laptop", "computer", "macbook", "dell xps", "dell"], url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop" },
    { keys: ["headphone", "earphone", "earbuds", "wireless headphone"], url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop" },
    { keys: ["mobile", "iphone", "smartphone", "samsung", "oneplus"], url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop" },
    { keys: ["camera", "dslr", "lens"],                   url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop" },
    { keys: ["wrist watch", "smartwatch", "watch"],       url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop" },
    { keys: ["adidas"],                                   url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&auto=format&fit=crop" },
    { keys: ["nike", "running shoe", "sneaker", "footwear", "shoe"], url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop" },
    { keys: ["t-shirt", "tshirt", "shirt", "clothing", "dress", "fashion", "cotton"], url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&auto=format&fit=crop" },
    { keys: ["bag", "backpack", "handbag"],               url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop" },
    { keys: ["sofa", "furniture", "chair", "table"],      url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop" },
    { keys: ["book", "novel"],                            url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop" },
    { keys: ["cycle", "bicycle", "bike"],                 url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop" },
    { keys: ["air conditioner", "ac", "cooler"],          url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&auto=format&fit=crop" },
    { keys: ["microwave", "oven"],                        url: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&auto=format&fit=crop" },
    { keys: ["speaker", "bluetooth"],                     url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&auto=format&fit=crop" },
    { keys: ["tablet", "ipad"],                           url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop" },
    { keys: ["keyboard", "mouse"],                        url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop" },
    { keys: ["electronics"],                              url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop" },
  ]

  // Use word-boundary matching to avoid "headphones" matching "phone"
  for (const item of map) {
    if (item.keys.some((k) => {
      const regex = new RegExp(`(^|\\s|-)${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|-|s|$)`, "i")
      return regex.test(text)
    })) return item.url
  }

  // Generic product fallback
  return `https://source.unsplash.com/400x300/?${encodeURIComponent(title.split(" ")[0] || "product")}`
}

// Helper — resolve image URL from any backend format
export function resolveImage(image, title = "", category = "") {
  if (!image) return getFallbackImage(title, category)

  // Already a full URL
  if (typeof image === "string" && (image.startsWith("http") || image.startsWith("https")))
    return image

  // Plain string path — fix Windows backslashes
  if (typeof image === "string" && image.trim() !== "") {
    const clean = image.replace(/\\/g, "/").replace(/^\//, "")
    return `${API_URL}/${clean}`
  }

  // Object with url field — fix Windows backslashes
  if (image?.url && typeof image.url === "string" && image.url.trim() !== "") {
    if (image.url.startsWith("http")) return image.url
    const clean = image.url.replace(/\\/g, "/").replace(/^\//, "")
    return `${API_URL}/${clean}`
  }

  // Cloudinary secure_url
  if (image?.secure_url) return image.secure_url

  // Object with path field
  if (image?.path) {
    const clean = image.path.replace(/\\/g, "/").replace(/^\//, "")
    return `${API_URL}/${clean}`
  }

  // Object with filename field
  if (image?.filename) return `${API_URL}/uploads/${image.filename}`

  return getFallbackImage(title, category)
}

// Auth header
function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

// GET ALL PRODUCTS — with pagination
export const fetchProducts = createAsyncThunk(
  "products/fetch",
  async ({ page = 1, limit = 6 } = {}, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const url = `${BASE_URL}/products?page=${page}&limit=${limit}`
      console.log("Fetching products from:", url)

      const res = await axios.get(url, { headers: authHeader(token) })
      console.log("Products response:", res.status, res.data)

      const data = res.data

      let products = []
      if (Array.isArray(data))              products = data
      else if (Array.isArray(data.products)) products = data.products
      else if (Array.isArray(data.data))     products = data.data
      else if (Array.isArray(data.result))   products = data.result

      console.log(`Loaded ${products.length} products — page ${page}`)

      return {
        products,
        totalProducts: data.totalProducts || data.total || products.length,
        totalPages:    data.totalPages    || data.pages || Math.ceil((data.totalProducts || products.length) / limit),
        currentPage:   page,
        limit,
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Fetch failed"
      return rejectWithValue(msg)
    }
  }
)

// GET SINGLE PRODUCT
export const fetchSingleProduct = createAsyncThunk(
  "products/fetchSingle",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await axios.get(`${BASE_URL}/products/${id}`, {
        headers: authHeader(token),
      })
      const data = res.data
      return data.singleProduct || data.product || data.data || data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Fetch failed")
    }
  }
)

// ADD PRODUCT
export const addProduct = createAsyncThunk(
  "products/add",
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await axios.post(`${BASE_URL}/products`, formData, {
        headers: { ...authHeader(token) }, // axios sets multipart automatically
      })
      return res.data.product || res.data.data || res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Add failed")
    }
  }
)

// UPDATE PRODUCT
export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, formData }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await axios.put(`${BASE_URL}/products/${id}`, formData, {
        headers: { ...authHeader(token) },
      })
      return res.data.product || res.data.updatedProduct || res.data.data || res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Update failed")
    }
  }
)

// DELETE PRODUCT
export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      await axios.delete(`${BASE_URL}/products/${id}`, {
        headers: authHeader(token),
      })
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Delete failed")
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    singleProduct: null,
    loading: false,
    error: null,
    totalProducts: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 6,
  },
  reducers: {
    clearSingleProduct: (state) => { state.singleProduct = null },
  },
  extraReducers: (builder) => {
    builder
      // GET ALL
      .addCase(fetchProducts.pending,   (state) => { state.loading = true; state.error = null })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading      = false
        state.items        = action.payload.products
        state.totalProducts = action.payload.totalProducts
        state.totalPages   = action.payload.totalPages
        state.currentPage  = action.payload.currentPage
        state.limit        = action.payload.limit
      })
      .addCase(fetchProducts.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // GET SINGLE
      .addCase(fetchSingleProduct.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(fetchSingleProduct.fulfilled, (state, action) => { state.loading = false; state.singleProduct = action.payload })
      .addCase(fetchSingleProduct.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // ADD
      .addCase(addProduct.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(addProduct.fulfilled, (state, action) => { state.loading = false; if (action.payload) state.items.push(action.payload) })
      .addCase(addProduct.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // UPDATE
      .addCase(updateProduct.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.map((p) => p._id === action.payload?._id ? action.payload : p)
      })
      .addCase(updateProduct.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // DELETE
      .addCase(deleteProduct.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(deleteProduct.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((p) => p._id !== action.payload) })
      .addCase(deleteProduct.rejected,  (state, action) => { state.loading = false; state.error = action.payload })
  },
})

export const { clearSingleProduct } = productSlice.actions
export default productSlice.reducer
