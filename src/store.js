import { configureStore } from "@reduxjs/toolkit";

import authReducer    from "./Slices/authSlice"
import productReducer from "./Slices/productSlice"
import cartReducer    from "./Slices/cartSlice"
import orderReducer   from "./Slices/orderSlice"
import profileReducer from "./Slices/profileSlice"

import paymentReducer from "./Slices/paymentSlice"

var store = configureStore({
    reducer: {
        auth:     authReducer,
        products: productReducer,
        cart:     cartReducer,
        orders:   orderReducer,
        profile:  profileReducer,
        payment:  paymentReducer,
    }
})

export default store;