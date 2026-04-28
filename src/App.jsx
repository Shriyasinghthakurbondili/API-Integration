import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useSelector } from "react-redux"

import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import Cart from "./pages/Cart"
import Orders from "./pages/Orders"
import OrderDetail from "./pages/OrderDetail"
import Profile from "./pages/Profile"
import GetSingleProducts from "./Components/GetSingleProducts"

const App = () => {
  const { user, token } = useSelector((state) => state.auth || {})

  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/"       element={<SignUp />} />
        <Route path="/login"  element={<Login />} />

        {/* Protected Routes */}
        <Route path="/home"         element={token ? <Home />               : <Navigate to="/login" />} />
        <Route path="/cart"         element={token ? <Cart />               : <Navigate to="/login" />} />
        <Route path="/orders"       element={token ? <Orders />             : <Navigate to="/login" />} />
        <Route path="/orders/:id"   element={token ? <OrderDetail />        : <Navigate to="/login" />} />
        <Route path="/profile"      element={token ? <Profile />            : <Navigate to="/login" />} />
        <Route path="/product/:id"  element={token ? <GetSingleProducts />  : <Navigate to="/login" />} />
        <Route path="/dashboard"    element={token ? <Dashboard />          : <Navigate to="/login" />} />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App