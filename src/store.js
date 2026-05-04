import { configureStore } from "@reduxjs/toolkit";

import authReducer    from "./Slices/authSlice"
import productReducer from "./Slices/productSlice"
import cartReducer    from "./Slices/cartSlice"
import orderReducer   from "./Slices/orderSlice"
import profileReducer from "./Slices/profileSlice"
import paymentReducer from "./Slices/paymentSlice"
import addressReducer from "./Slices/addressSlice"
import wishlistReducer from "./Slices/wishlistSlice"

var store = configureStore({
    reducer: {
        auth:     authReducer,
        products: productReducer,
        cart:     cartReducer,
        orders:   orderReducer,
        profile:  profileReducer,
        payment:  paymentReducer,
        address:  addressReducer,
        wishlist: wishlistReducer,
    }
})

export default store;