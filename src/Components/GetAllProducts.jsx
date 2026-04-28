import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { fetchProducts } from "../Slices/productSlice"
import { addToCart } from "../Slices/cartSlice"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"

import DeleteProduct from "./DeleteProduct"
import UpdateProduct from "./UpdateProducts"

const GetAllProducts = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const productState = useSelector((state) => state.products)
  const { user } = useSelector((state) => state.auth)
  const actionLoading = useSelector((state) => state.cart.actionLoading)

  const items = productState?.items || []
  const loading = productState?.loading
  const error = productState?.error

  // Debug — remove after confirming role field name
  console.log("USER OBJECT:", user)

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  if (loading) return <h2 style={{ color: "white" }}>Loading...</h2>
  if (error) return <h2 style={{ color: "red" }}>Error: {error}</h2>

  return (
    <div className="grid grid-products">
      {items.length === 0 ? (
        <h2 style={{ color: "white" }}>No Products Found</h2>
      ) : (
        items.map((product) => (
          <div key={product._id} className="card product-card">

            {/* IMAGE */}
            <div
              className="product-media"
              onClick={() => navigate(`/product/${product._id}`)}
            >
              {product.image?.url ? (
                <img src={product.image.url} alt={product.title} />
              ) : (
                <div style={{ color: "white" }}>No image</div>
              )}
            </div>

            {/* CONTENT */}
            <div className="card-body">
              <h3 className="product-title">{product.title}</h3>
              <p className="product-desc">{product.description}</p>

              <div className="price-row">
                <div className="price">₹ {product.price}</div>
                <button
                  className="btn"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  View
                </button>
              </div>

              {/* ADD TO CART */}
              <button
                className="btn-add-cart"
                disabled={actionLoading}
                onClick={() => {
                  dispatch(addToCart({ productId: product._id, quantity: 1 }))
                  toast.success("Added to cart 🛒")
                }}
              >
                🛒 Add to Cart
              </button>

              {/* ADMIN ACTIONS */}
              {user && (
                <div className="actions-row">
                  <UpdateProduct product={product} />
                  <DeleteProduct id={product._id} />
                </div>
              )}
            </div>

          </div>
        ))
      )}
    </div>
  )
}

export default GetAllProducts
