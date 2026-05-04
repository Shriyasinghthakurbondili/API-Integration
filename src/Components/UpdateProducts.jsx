import { useState } from "react"
import { createPortal } from "react-dom"
import { useDispatch } from "react-redux"
import { updateProduct, fetchProducts, resolveImage } from "../Slices/productSlice"
import { toast } from "react-hot-toast"
import "./UpdateProduct.css"

const UpdateProduct = ({ product }) => {
  const dispatch = useDispatch()

  const getPreview = () => resolveImage(product.image, product.title, product.category)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description)
  const [price, setPrice] = useState(product.price)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleClose = () => {
    setOpen(false)
    setImage(null)
    setPreview(null)
    setTitle(product.title)
    setDescription(product.description)
    setPrice(product.price)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title || !description || !price)
      return toast.error("Please fill all fields")

    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("price", price)
    if (image) formData.append("image", image)

    try {
      setLoading(true)
      await dispatch(updateProduct({ id: product._id, formData })).unwrap()
      dispatch(fetchProducts())
      toast.success("Product updated")
      setOpen(false)
    } catch (err) {
      toast.error(String(err || "Update failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="edit-btn" onClick={() => setOpen(true)}>
        ✏️ Edit
      </button>

      {open && createPortal(
        <div className="up-overlay" onClick={handleClose}>
          <div className="up-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="up-modal-header">
              <div className="up-modal-title-block">
                <div className="up-modal-icon">✏️</div>
                <div>
                  <h2 className="up-heading">Edit Product</h2>
                  <p className="up-subheading">Update the details below</p>
                </div>
              </div>
              <button className="up-close-btn" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            <form className="up-form" onSubmit={handleSubmit}>

              {/* Image upload */}
              <label className="up-upload-zone" htmlFor="up-file-input">
                {(preview || getPreview()) ? (
                  <>
                    <img
                      src={preview || getPreview()}
                      alt="preview"
                      className="up-preview"
                      onError={(e) => { e.target.style.display = "none" }}
                    />
                    <div className="up-upload-overlay">🖼️ Change image</div>
                  </>
                ) : (
                  <div className="up-upload-placeholder">
                    <span className="up-upload-icon">🖼️</span>
                    <span className="up-upload-label">Click to change image</span>
                  </div>
                )}
                <input
                  id="up-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  style={{ display: "none" }}
                />
              </label>

              {/* Fields */}
              <div className="up-fields">
                <div className="up-field">
                  <label className="up-label" htmlFor="up-title">Title</label>
                  <input
                    id="up-title"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Product title"
                    maxLength={120}
                  />
                </div>

                <div className="up-field">
                  <label className="up-label" htmlFor="up-desc">Description</label>
                  <textarea
                    id="up-desc"
                    className="textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Product description"
                    maxLength={500}
                  />
                </div>

                <div className="up-field">
                  <label className="up-label" htmlFor="up-price">Price (₹)</label>
                  <input
                    id="up-price"
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="up-actions">
                <button type="button" className="update-btn" onClick={handleClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="update-btn update-btn-save" disabled={loading}>
                  {loading ? <span className="up-spinner" /> : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default UpdateProduct