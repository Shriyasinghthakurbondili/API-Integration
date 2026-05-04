import { createSlice } from "@reduxjs/toolkit"

function loadWishlist() {
  try {
    const raw = localStorage.getItem("wishlist")
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveWishlist(items) {
  try { localStorage.setItem("wishlist", JSON.stringify(items)) }
  catch {}
}

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: loadWishlist(),
  },
  reducers: {
    toggleWishlist: (state, action) => {
      const exists = state.items.find((i) => i._id === action.payload._id)
      if (exists) {
        state.items = state.items.filter((i) => i._id !== action.payload._id)
      } else {
        state.items.push(action.payload)
      }
      saveWishlist(state.items)
    },

    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((i) => i._id !== action.payload)
      saveWishlist(state.items)
    },

    clearWishlist: (state) => {
      state.items = []
      saveWishlist([])
    },
  },
})

export const { toggleWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
