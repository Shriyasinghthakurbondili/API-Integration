import { useState } from "react"
import AddNewProduct from "../Components/AddNewProduct"
import GetAllProducts from "../Components/GetAllProducts"
import TopNav from "../Components/TopNav"

const Dashboard = () => {
  const [open, setOpen] = useState(false)

  return (
    <div className="app-shell">
      <TopNav title="Admin" />

      <main className="page">
        <div className="container">

          {/* HEADER ROW */}
          <div className="dashboard-header">
            <div>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">
                Manage products efficiently
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setOpen(true)}
            >
              + Add Product
            </button>
          </div>

          {/* PRODUCTS */}
          <div className="section">
            <h2 className="section-title">Catalog</h2>
            <GetAllProducts />
          </div>

          {/* MODAL */}
          {open && (
            <div className="modal-overlay" onClick={() => setOpen(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                  <h2>Add Product</h2>
                  <button className="close-btn" onClick={() => setOpen(false)}>
                    ✕
                  </button>
                </div>

                <AddNewProduct close={() => setOpen(false)} />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default Dashboard