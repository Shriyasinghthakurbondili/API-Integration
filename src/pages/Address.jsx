import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { createPortal } from "react-dom"
import { toast, Toaster } from "react-hot-toast"
import {
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../Slices/addressSlice"
import TopNav from "../Components/TopNav"
import "./Address.css"

const EMPTY_FORM = {
  type:     "Home",
  name:     "",
  phone:    "",
  line1:    "",
  line2:    "",
  city:     "",
  state:    "",
  pincode:  "",
  country:  "India",
}

const Address = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const addresses        = useSelector((state) => state.address.addresses)
  const { actionLoading } = useSelector((state) => state.address)

  useEffect(() => {
    dispatch(fetchAddresses())
  }, [dispatch])

  const [modalOpen, setModalOpen] = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [errors,    setErrors]    = useState({})

  const openAdd = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (addr) => {
    setEditId(addr.id)
    setForm({
      type:    addr.type    || "Home",
      name:    addr.name    || "",
      phone:   addr.phone   || "",
      line1:   addr.line1   || "",
      line2:   addr.line2   || "",
      city:    addr.city    || "",
      state:   addr.state   || "",
      pincode: addr.pincode || "",
      country: addr.country || "India",
    })
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setErrors({})
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = "Name is required"
    if (!form.phone.trim())   e.phone   = "Phone is required"
    if (!form.line1.trim())   e.line1   = "Address is required"
    if (!form.city.trim())    e.city    = "City is required"
    if (!form.state.trim())   e.state   = "State is required"
    if (!form.pincode.trim()) e.pincode = "Pincode is required"
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    try {
      if (editId) {
        await dispatch(updateAddress({ id: editId, ...form })).unwrap()
        toast.success("Address updated ✅")
      } else {
        await dispatch(addAddress(form)).unwrap()
        toast.success("Address added ✅")
      }
      closeModal()
    } catch (err) {
      toast.error(err || "Failed to save address")
    }
  }

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteAddress(id)).unwrap()
      toast.error("Address removed")
    } catch (err) {
      toast.error(err || "Failed to delete address")
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await dispatch(setDefaultAddress(id)).unwrap()
      toast.success("Default address updated")
    } catch {
      toast.success("Default address updated")
    }
  }

  return (
    <div className="app-shell">
      <Toaster />
      <TopNav title="LuxeShop" />

      <main className="addr-page">
        <div className="container">

          {/* HEADER */}
          <div className="addr-header">
            <div>
              <h1 className="addr-title">My Addresses 📍</h1>
              <p className="addr-subtitle">
                {addresses.length === 0
                  ? "No addresses saved yet"
                  : `${addresses.length} address${addresses.length > 1 ? "es" : ""} saved`}
              </p>
            </div>
            <button className="addr-add-btn" onClick={openAdd}>
              + Add New Address
            </button>
          </div>

          {/* EMPTY */}
          {addresses.length === 0 ? (
            <div className="addr-empty">
              <div className="addr-empty-icon">📭</div>
              <h3>No addresses yet</h3>
              <p>Add a delivery address to use during checkout.</p>
              <button className="addr-add-btn" onClick={openAdd}>
                + Add Address
              </button>
            </div>
          ) : (
            <div className="addr-grid">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`addr-card ${addr.isDefault ? "addr-card-default" : ""}`}
                >
                  {addr.isDefault && (
                    <div className="addr-default-badge">⭐ Default</div>
                  )}

                  <div className="addr-card-body">
                    <div className="addr-type">
                      {addr.type === "Home" ? "🏠" : addr.type === "Work" ? "💼" : "📍"} {addr.type}
                    </div>
                    <p className="addr-name">{addr.name}</p>
                    <p className="addr-line">{addr.line1}</p>
                    {addr.line2 && <p className="addr-line">{addr.line2}</p>}
                    <p className="addr-line">{addr.city}, {addr.state} — {addr.pincode}</p>
                    <p className="addr-line">{addr.country}</p>
                    <p className="addr-phone">📞 {addr.phone}</p>
                  </div>

                  <div className="addr-card-footer">
                    <button className="addr-btn" onClick={() => openEdit(addr)}>
                      ✏️ Edit
                    </button>
                    {!addr.isDefault && (
                      <button
                        className="addr-btn addr-btn-default"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        ⭐ Set Default
                      </button>
                    )}
                    <button
                      className="addr-btn addr-btn-delete"
                      onClick={() => handleDelete(addr.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* MODAL */}
      {modalOpen && createPortal(
        <div className="addr-overlay" onClick={closeModal}>
          <div className="addr-modal" onClick={(e) => e.stopPropagation()}>

            <div className="addr-modal-header">
              <h3 className="addr-modal-title">
                {editId ? "Edit Address" : "Add New Address"}
              </h3>
              <button className="addr-modal-close" onClick={closeModal}>✕</button>
            </div>

            <form className="addr-form" onSubmit={handleSubmit}>

              {/* TYPE */}
              <div className="addr-field">
                <label className="addr-label">Address Type</label>
                <select
                  name="type"
                  className="addr-select"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </div>

              {/* NAME + PHONE */}
              <div className="addr-form-row">
                <div className="addr-field">
                  <label className="addr-label">Full Name</label>
                  <input
                    name="name"
                    className="addr-input"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <span style={{ color: "#ff8fa3", fontSize: "0.72rem" }}>{errors.name}</span>}
                </div>
                <div className="addr-field">
                  <label className="addr-label">Phone</label>
                  <input
                    name="phone"
                    className="addr-input"
                    placeholder="+91 9999999999"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <span style={{ color: "#ff8fa3", fontSize: "0.72rem" }}>{errors.phone}</span>}
                </div>
              </div>

              {/* ADDRESS LINE 1 */}
              <div className="addr-field">
                <label className="addr-label">Address Line 1</label>
                <input
                  name="line1"
                  className="addr-input"
                  placeholder="House no, Street, Area"
                  value={form.line1}
                  onChange={handleChange}
                />
                {errors.line1 && <span style={{ color: "#ff8fa3", fontSize: "0.72rem" }}>{errors.line1}</span>}
              </div>

              {/* ADDRESS LINE 2 */}
              <div className="addr-field">
                <label className="addr-label">Address Line 2 (Optional)</label>
                <input
                  name="line2"
                  className="addr-input"
                  placeholder="Landmark, Apartment"
                  value={form.line2}
                  onChange={handleChange}
                />
              </div>

              {/* CITY + STATE */}
              <div className="addr-form-row">
                <div className="addr-field">
                  <label className="addr-label">City</label>
                  <input
                    name="city"
                    className="addr-input"
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={handleChange}
                  />
                  {errors.city && <span style={{ color: "#ff8fa3", fontSize: "0.72rem" }}>{errors.city}</span>}
                </div>
                <div className="addr-field">
                  <label className="addr-label">State</label>
                  <input
                    name="state"
                    className="addr-input"
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={handleChange}
                  />
                  {errors.state && <span style={{ color: "#ff8fa3", fontSize: "0.72rem" }}>{errors.state}</span>}
                </div>
              </div>

              {/* PINCODE + COUNTRY */}
              <div className="addr-form-row">
                <div className="addr-field">
                  <label className="addr-label">Pincode</label>
                  <input
                    name="pincode"
                    className="addr-input"
                    placeholder="400001"
                    value={form.pincode}
                    onChange={handleChange}
                    maxLength={6}
                  />
                  {errors.pincode && <span style={{ color: "#ff8fa3", fontSize: "0.72rem" }}>{errors.pincode}</span>}
                </div>
                <div className="addr-field">
                  <label className="addr-label">Country</label>
                  <input
                    name="country"
                    className="addr-input"
                    placeholder="India"
                    value={form.country}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* ACTIONS */}
              <div className="addr-form-actions">
                <button type="button" className="addr-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="addr-save-btn">
                  {editId ? "Update Address" : "Save Address"}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Address
