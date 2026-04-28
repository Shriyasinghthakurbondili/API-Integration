import { useState } from "react"
import { useDispatch } from "react-redux"
import { addProduct, fetchProducts } from "../Slices/productSlice"
import { toast } from "react-hot-toast"
import "./AddNewProduct.css"

const AddNewProduct = () => {
  const dispatch = useDispatch()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title || !description || !price) {
      return toast.error("Please fill all fields")
    }

    // Backend requires image (API responds: "Image file is required")
    if (!image) {
      return toast.error("Please select a product image")
    }

    const priceNumber = Number(price)
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      return toast.error("Please enter a valid price")
    }

    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("price", String(priceNumber))

    formData.append("image", image)

    try {
      await dispatch(addProduct(formData)).unwrap()
      toast.success("Product added")
      dispatch(fetchProducts())
      setTitle("")
      setDescription("")
      setPrice("")
      setImage(null)
    } catch (err) {
      toast.error(String(err || "Add failed"))
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          className="input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="input"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          className="file"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <div className="helper">Image is required by the backend.</div>
      </div>

      <div className="actions-row">
        <button className="btn btn-primary" type="submit">
          Add product
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => {
            setTitle("")
            setDescription("")
            setPrice("")
            setImage(null)
          }}
        >
          Clear
        </button>
      </div>
    </form>
  )
}

export default AddNewProduct