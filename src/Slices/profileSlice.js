import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const BASE_URL = `${import.meta.env.VITE_API_URL || "https://apis-17.onrender.com"}/api/userRoutes`

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

// GET logged-in user profile
export const fetchProfile = createAsyncThunk(
  "profile/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch profile")
      return data.user || data.data || data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to fetch profile")
    }
  }
)

// PUT — update profile (name, email)
export const updateProfile = createAsyncThunk(
  "profile/update",
  async (updates, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${BASE_URL}/profile`, {
        method: "PUT",
        headers: authHeader(token),
        body: JSON.stringify(updates),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to update profile")
      return data.user || data.data || data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update profile")
    }
  }
)

// PUT — change password
export const changePassword = createAsyncThunk(
  "profile/changePassword",
  async ({ currentPassword, newPassword }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth
      const res = await fetch(`${BASE_URL}/change-password`, {
        method: "PUT",
        headers: authHeader(token),
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await safeBody(res)
      if (!res.ok) return rejectWithValue(data.message || "Failed to change password")
      return data
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to change password")
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    profile:       null,
    loading:       false,
    updateLoading: false,
    passwordLoading: false,
    error:         null,
    updateSuccess: false,
    passwordSuccess: false,
  },
  reducers: {
    clearProfileError:   (state) => { state.error = null },
    clearUpdateSuccess:  (state) => { state.updateSuccess = false },
    clearPasswordSuccess:(state) => { state.passwordSuccess = false },
  },
  extraReducers: (builder) => {
    builder
      // FETCH PROFILE
      .addCase(fetchProfile.pending,   (state)         => { state.loading = true;  state.error = null })
      .addCase(fetchProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload })
      .addCase(fetchProfile.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // UPDATE PROFILE
      .addCase(updateProfile.pending,   (state)         => { state.updateLoading = true;  state.error = null; state.updateSuccess = false })
      .addCase(updateProfile.fulfilled, (state, action) => { state.updateLoading = false; state.profile = action.payload; state.updateSuccess = true })
      .addCase(updateProfile.rejected,  (state, action) => { state.updateLoading = false; state.error = action.payload })

      // CHANGE PASSWORD
      .addCase(changePassword.pending,   (state)         => { state.passwordLoading = true;  state.error = null; state.passwordSuccess = false })
      .addCase(changePassword.fulfilled, (state)         => { state.passwordLoading = false; state.passwordSuccess = true })
      .addCase(changePassword.rejected,  (state, action) => { state.passwordLoading = false; state.error = action.payload })
  },
})

export const {
  clearProfileError,
  clearUpdateSuccess,
  clearPasswordSuccess,
} = profileSlice.actions

export default profileSlice.reducer
