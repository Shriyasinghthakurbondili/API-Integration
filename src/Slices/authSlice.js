import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

const BASE_URL =
  import.meta.env.VITE_API_URL || "https://apis-17.onrender.com"

function decodeJwt(token) {
  try {
    if (!token || typeof token !== "string") return null
    const parts = token.split(".")
    if (parts.length < 2) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    )

    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function userFromToken(token) {
  const payload = decodeJwt(token)
  if (!payload) return null

  return {
    _id: payload.userId,
    email: payload.email,
    role: payload.role
  }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const storedToken = localStorage.getItem("token") || null
const storedUser = readStoredUser()
const derivedStoredUser = storedUser || userFromToken(storedToken)

//
// 🔹 REGISTER
//
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/api/userRoutes/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        return rejectWithValue(data.message || "Registration failed")
      }

      return data
    } catch (err) {
      return rejectWithValue(
        err?.message || `Cannot reach API server at ${BASE_URL}`
      )
    }
  }
)

//
// 🔹 LOGIN
//
export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/api/userRoutes/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        return rejectWithValue(data.message || "Login failed")
      }

      return data
    } catch (err) {
      return rejectWithValue(
        err?.message || `Cannot reach API server at ${BASE_URL}`
      )
    }
  }
)

//
// 🔹 SLICE
//
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: derivedStoredUser,
    token: storedToken,
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },
  extraReducers: (builder) => {
    builder

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false

        const token =
          action.payload.token || action.payload.webToken || null

        state.token = token

        const apiUser = action.payload.user
        const derivedUser = userFromToken(token)

        state.user = apiUser || derivedUser

        if (token) localStorage.setItem("token", token)
        if (state.user)
          localStorage.setItem("user", JSON.stringify(state.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user || null

        if (state.user) {
          localStorage.setItem("user", JSON.stringify(state.user))
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { logout } = authSlice.actions
export default authSlice.reducer