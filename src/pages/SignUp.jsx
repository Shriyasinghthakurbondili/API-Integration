import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from "react-redux"
import { toast, Toaster } from "react-hot-toast"
import { registerUser } from '../Slices/authSlice'
import { useNavigate } from "react-router-dom"
import "./SignUp.css"

const SignUp = () => {
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!name || !email || !password) {
      return toast.error("Please fill all the details")
    }

    dispatch(registerUser({ name, email, password }))
  }

  // success
  useEffect(() => {
    if (user) {
      toast.success("Account created 🎉")
      setTimeout(() => {
        navigate("/login")
        
      }, 1000)
    }
  }, [user, navigate])

  // error
  useEffect(() => {
    if (error) {
      toast.error(error)
      

    }
  }, [error])

  return (
    <>
      <div className="signup-container">
        <Toaster />

        {/* LEFT IMAGE */}
        <div className="signup-left">
          <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&auto=format&fit=crop&q=80"
            alt="Premium Fashion"
          />
          <div className="signup-left-overlay">
            <h1>Discover Your<br />Style Today</h1>
            <p>Curated luxury. Timeless fashion.<br />Join thousands of happy shoppers.</p>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="signup-right">
          <div className="signup-box">

            {/* Brand */}
            <div className="signup-brand">
              <div className="signup-brand-icon">✨</div>
              <span className="signup-brand-name">LuxeShop</span>
            </div>

            <h2>Create Account</h2>
            <p>Join us and start shopping 🛍️</p>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={error ? "error-input" : ""}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              {error && <p className="error-text">{error}</p>}
            </form>

            <p className="login-text">
              Already have an account?{" "}
              <span onClick={() => navigate("/login")}>Sign In</span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignUp