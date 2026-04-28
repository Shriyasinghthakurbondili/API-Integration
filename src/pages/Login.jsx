import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from "react-redux"
import { toast, Toaster } from "react-hot-toast"
import { loginUser } from '../Slices/authSlice'
import { useNavigate } from "react-router-dom"
import "./Login.css"

const Login = () => {
  const dispatch = useDispatch()
  const { loading, error, token, user } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error("Fill email and password")
    dispatch(loginUser({ email, password }))
  }

  useEffect(() => {
    if (token) {
      toast.success("Login successful 🎉")
      setTimeout(() => {
        navigate(user?.role === "admin" ? "/dashboard" : "/home")
        setEmail("")
        setPassword("")
      }, 1000)
    }
  }, [token, user, navigate])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="login-container">
      <Toaster />

      {/* LEFT IMAGE */}
      <div className="login-left">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80"
          alt="Premium Shopping"
        />
        <div className="login-left-overlay">
          <h1>Shop the<br />Latest Trends</h1>
          <p>Exclusive collections. Premium quality.<br />Delivered to your door.</p>
        </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="login-right">
        <div className="login-box">

          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">🛍️</div>
            <span className="login-brand-name">LuxeShop</span>
          </div>

          <h2>Welcome Back 👋</h2>
          <p>Sign in to your account to continue</p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="forgot-password">
              <span>Forgot password?</span>
            </div>

            <button type="submit">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-divider">
            <span>New to LuxeShop?</span>
          </div>

          <p className="signup-text">
            Don&apos;t have an account?{" "}
            <span onClick={() => navigate("/")}>Create one free</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
