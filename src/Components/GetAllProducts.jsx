import { useEffect, useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { fetchProducts, resolveImage } from "../Slices/productSlice"
// eslint-disable-next-line no-unused-vars
import { getFallbackImage } from "../Slices/productSlice"
import { addToCart } from "../Slices/cartSlice"
import { toggleWishlist } from "../Slices/wishlistSlice"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import DeleteProduct from "./DeleteProduct"
import UpdateProduct from "./UpdateProducts"
import "./GetAllProducts.css"

const SORT_OPTIONS = [
  { value: "default",    label: "Default"         },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name-asc",   label: "Name: A → Z"      },
  { value: "name-desc",  label: "Name: Z → A"      },
]

const GetAllProducts = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const productState  = useSelector((state) => state.products)
  const { user }      = useSelector((state) => state.auth)
  const actionLoading = useSelector((state) => state.cart.actionLoading)
  const wishlistItems = useSelector((state) => state.wishlist.items)

  const items        = productState?.items        || []
  const loading      = productState?.loading
  const error        = productState?.error
  const totalPages   = productState?.totalPages   || 1
  const currentPage  = productState?.currentPage  || 1
  const totalProducts = productState?.totalProducts || items.length
  const limit        = productState?.limit        || 6

  // ── Filter / Search state ──────────────────────
  const [search,   setSearch]   = useState("")
  const [sort,     setSort]     = useState("default")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [category, setCategory] = useState("all")

  useEffect(() => { dispatch(fetchProducts({ page: currentPage, limit })) }, [dispatch])

  // Derive unique categories from products
  const categories = useMemo(() => {
    const cats = items
      .map((p) => p.category || p.type || "")
      .filter(Boolean)
    return ["all", ...new Set(cats)]
  }, [items])

  // Price range bounds
  const prices = items.map((p) => Number(p.price) || 0)
  const maxBound = prices.length ? Math.max(...prices) : 100000

  // ── Filtered + sorted products ─────────────────
  const filtered = useMemo(() => {
    let result = [...items]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      )
    }

    // Category
    if (category !== "all") {
      result = result.filter(
        (p) => (p.category || p.type || "").toLowerCase() === category.toLowerCase()
      )
    }

    // Price range
    if (minPrice !== "") result = result.filter((p) => Number(p.price) >= Number(minPrice))
    if (maxPrice !== "") result = result.filter((p) => Number(p.price) <= Number(maxPrice))

    // Sort
    switch (sort) {
      case "price-asc":  result.sort((a, b) => Number(a.price) - Number(b.price));  break
      case "price-desc": result.sort((a, b) => Number(b.price) - Number(a.price));  break
      case "name-asc":   result.sort((a, b) => a.title?.localeCompare(b.title));    break
      case "name-desc":  result.sort((a, b) => b.title?.localeCompare(a.title));    break
      default: break
    }

    return result
  }, [items, search, category, minPrice, maxPrice, sort])

  const clearFilters = () => {
    setSearch("")
    setSort("default")
    setMinPrice("")
    setMaxPrice("")
    setCategory("all")
  }

  const goToPage = (page) => {
    dispatch(fetchProducts({ page, limit }))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const hasActiveFilters = search || sort !== "default" || minPrice || maxPrice || category !== "all"

  // ── States ─────────────────────────────────────
  if (loading) return (
    <div className="state-card">
      <div style={{ fontSize: "2rem", marginBottom: 12 }}>⏳</div>
      <p style={{ margin: 0 }}>Loading products...</p>
    </div>
  )

  if (error) return (
    <div className="state-card">
      <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚠️</div>
      <p style={{ margin: "0 0 6px", color: "#ff8fa3", fontWeight: 600 }}>
        {error.includes("Network") ? "Server is not running" : `Error: ${error}`}
      </p>
      <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
        Make sure your backend is running on http://localhost:3000
      </p>
      <button
        onClick={() => dispatch(fetchProducts())}
        style={{
          padding: "10px 24px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg,#7c6fff,#b450ff)",
          color: "#fff", fontFamily: "Poppins,sans-serif",
          fontWeight: 600, fontSize: "0.88rem", cursor: "pointer"
        }}
      >
        🔄 Retry
      </button>
    </div>
  )

  return (
    <div>

      {/* ── SEARCH + FILTER BAR ── */}
      <div className="filter-bar">

        {/* SEARCH */}
        <div className="filter-search-wrap">
          <span className="filter-search-icon">🔍</span>
          <input
            className="filter-search"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="filter-clear-x" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* CATEGORY */}
        {categories.length > 1 && (
          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        )}

        {/* SORT */}
        <select
          className="filter-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* PRICE RANGE */}
        <div className="filter-price-wrap">
          <input
            className="filter-price-input"
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            min={0}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="filter-price-sep">—</span>
          <input
            className="filter-price-input"
            type="number"
            placeholder={`Max ₹${maxBound.toLocaleString()}`}
            value={maxPrice}
            min={0}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        {/* CLEAR ALL */}
        {hasActiveFilters && (
          <button className="filter-clear-btn" onClick={clearFilters}>
            ✕ Clear
          </button>
        )}

      </div>

      {/* RESULTS COUNT */}
      <div className="filter-results-row">
        <span className="filter-results-count">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {hasActiveFilters && ` found`}
        </span>
        {hasActiveFilters && (
          <span className="filter-active-tag">Filters active</span>
        )}
      </div>

      {/* ── PRODUCT GRID ── */}
      {filtered.length === 0 ? (
        <div className="state-card">
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</div>
          <p style={{ margin: "0 0 12px" }}>No products match your filters.</p>
          <button
            onClick={clearFilters}
            style={{
              padding: "9px 22px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#7c6fff,#b450ff)",
              color: "#fff", fontFamily: "Poppins,sans-serif",
              fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-products">
          {filtered.map((product) => (
            <div key={product._id} className="card product-card">

              {/* IMAGE */}
              <div
                className="product-media"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <img
                  src={resolveImage(product.image, product.title, product.category)}
                  alt={product.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getFallbackImage(product.title, product.category)
                  }}
                />

                {/* WISHLIST HEART */}
                <button
                  className={`btn-wishlist ${wishlistItems.find((i) => i._id === product._id) ? "wishlisted" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    dispatch(toggleWishlist(product))
                    const isWishlisted = wishlistItems.find((i) => i._id === product._id)
                    toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist 🤍", {
                      icon: isWishlisted ? "💔" : "🤍",
                    })
                  }}
                >
                  {wishlistItems.find((i) => i._id === product._id) ? "❤️" : "🤍"}
                </button>
              </div>

              {/* CONTENT */}
              <div className="card-body">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-desc">{product.description}</p>

                <div className="price-row">
                  <div className="price">₹ {Number(product.price).toLocaleString()}</div>
                  <button className="btn" onClick={() => navigate(`/product/${product._id}`)}>
                    View
                  </button>
                </div>

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

                {user && (
                  <div className="actions-row">
                    <UpdateProduct product={product} />
                    <DeleteProduct id={product._id} />
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── PAGINATION ── */}
      {totalPages > 1 && !hasActiveFilters && (
        <div className="pagination">
          <button
            className="page-btn page-btn-nav"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1
            // Show first, last, current and neighbours
            if (
              page === 1 || page === totalPages ||
              Math.abs(page - currentPage) <= 1
            ) {
              return (
                <button
                  key={page}
                  className={`page-btn ${page === currentPage ? "active" : ""}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              )
            }
            if (Math.abs(page - currentPage) === 2) {
              return <span key={page} className="page-info">…</span>
            }
            return null
          })}

          <button
            className="page-btn page-btn-nav"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>

          <span className="page-info">
            {totalProducts} products
          </span>
        </div>
      )}

    </div>
  )
}

export default GetAllProducts
