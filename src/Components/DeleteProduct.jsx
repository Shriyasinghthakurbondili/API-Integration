import { useDispatch } from "react-redux"
import { deleteProduct, fetchProducts } from "../Slices/productSlice"
import "./DeleteProduct.css"

const DeleteProduct = ({ id }) => {
  const dispatch = useDispatch()

  const handleDelete = () => {
    const confirmDelete = window.confirm("Are you sure?")

    if (confirmDelete) {
      dispatch(deleteProduct(id))
        .then(() => {
          dispatch(fetchProducts()) // refresh UI
        })
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="btn btn-danger"
    >
      Delete
    </button>
  )
}

export default DeleteProduct