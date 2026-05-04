import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { fetchOrderById } from "../Slices/orderSlice"
import TopNav from "../Components/TopNav"
import "./OrderTracking.css"

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// Custom colored markers
const makeIcon = (color) => L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid #fff;
    transform:rotate(-45deg);
    box-shadow:0 4px 12px rgba(0,0,0,0.4)">
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

const warehouseIcon = makeIcon("#7c6fff")
const deliveryIcon  = makeIcon("#2ecc9a")
const homeIcon      = makeIcon("#ff4d6d")

// Simulated tracking route (warehouse → hub → delivery → home)
const ROUTE_POINTS = [
  { lat: 19.0760, lng: 72.8777, label: "Warehouse",       desc: "Mumbai Central Warehouse",  icon: warehouseIcon },
  { lat: 19.1136, lng: 72.8697, label: "Sorting Hub",     desc: "Andheri Sorting Facility",  icon: deliveryIcon  },
  { lat: 19.1663, lng: 72.8526, label: "Out for Delivery", desc: "Borivali Delivery Center",  icon: deliveryIcon  },
  { lat: 19.2183, lng: 72.9781, label: "Your Location",   desc: "Estimated delivery address", icon: homeIcon      },
]

const TRACKING_STEPS = [
  { id: 1, title: "Order Placed",      desc: "Your order has been confirmed",         icon: "✅", time: "Today, 9:00 AM"  },
  { id: 2, title: "Processing",        desc: "Order is being packed at warehouse",    icon: "📦", time: "Today, 10:30 AM" },
  { id: 3, title: "Shipped",           desc: "Order picked up by delivery partner",   icon: "🚚", time: "Today, 12:00 PM" },
  { id: 4, title: "Out for Delivery",  desc: "Your order is on the way",              icon: "🛵", time: "Today, 2:00 PM"  },
  { id: 5, title: "Delivered",         desc: "Package delivered successfully",        icon: "🏠", time: "Expected by 6 PM" },
]

const STATUS_STEP_MAP = {
  pending:    1,
  processing: 2,
  shipped:    3,
  delivered:  5,
  cancelled:  0,
}

// Auto-fit map to route
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, points])
  return null
}

const OrderTracking = () => {
  const { id }   = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { selectedOrder: order, loading } = useSelector((state) => state.orders)
  const [animStep, setAnimStep] = useState(0)

  useEffect(() => {
    if (id) dispatch(fetchOrderById(id))
  }, [dispatch, id])

  // Animate delivery marker along route
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimStep((prev) => (prev < ROUTE_POINTS.length - 1 ? prev + 1 : prev))
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const rawStatus  = (order?.status || order?.orderStatus || "processing").toLowerCase()
  const currentStep = STATUS_STEP_MAP[rawStatus] ?? 2
  const polyline   = ROUTE_POINTS.map((p) => [p.lat, p.lng])

  return (
    <div className="app-shell">
      <TopNav title="LuxeShop" />
      <main className="ot-page">
        <div className="container">

          <button className="ot-back-btn" onClick={() => navigate(-1)}>← Back</button>

          <h1 className="ot-title">Track Your Order 🚚</h1>
          <p className="ot-subtitle">
            {id ? `Order #${id.slice(-10).toUpperCase()}` : "Live order tracking"}
          </p>

          <div className="ot-layout">

            {/* MAP */}
            <div className="ot-map-card">
              <div className="ot-map-header">📍 Live Tracking Map</div>
              <div className="ot-map-container">
                <MapContainer
                  center={[19.1663, 72.8526]}
                  zoom={11}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <FitBounds points={ROUTE_POINTS} />

                  {/* Route line */}
                  <Polyline
                    positions={polyline}
                    pathOptions={{ color: "#7c6fff", weight: 3, dashArray: "8 6", opacity: 0.8 }}
                  />

                  {/* Markers */}
                  {ROUTE_POINTS.map((point, i) => (
                    <Marker key={i} position={[point.lat, point.lng]} icon={point.icon}>
                      <Popup>
                        <strong>{point.label}</strong><br />{point.desc}
                      </Popup>
                    </Marker>
                  ))}

                  {/* Animated delivery marker */}
                  <Marker
                    position={[ROUTE_POINTS[animStep].lat, ROUTE_POINTS[animStep].lng]}
                    icon={L.divIcon({
                      className: "",
                      html: `<div style="
                        width:36px;height:36px;border-radius:50%;
                        background:linear-gradient(135deg,#7c6fff,#b450ff);
                        border:3px solid #fff;
                        display:flex;align-items:center;justify-content:center;
                        font-size:16px;
                        box-shadow:0 0 20px rgba(124,111,255,0.6)">🛵</div>`,
                      iconSize: [36, 36],
                      iconAnchor: [18, 18],
                    })}
                  >
                    <Popup>Delivery Partner is here!</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            {/* TIMELINE + INFO */}
            <div>
              <div className="ot-timeline-card">
                <div className="ot-timeline-header">📋 Order Timeline</div>
                <div className="ot-timeline">
                  {TRACKING_STEPS.map((step, i) => {
                    const done    = step.id <= currentStep
                    const current = step.id === currentStep
                    return (
                      <div
                        key={step.id}
                        className={`ot-step ${done ? "ot-step-done" : ""} ${current ? "ot-step-current" : ""}`}
                      >
                        <div className="ot-step-dot">
                          {done ? step.icon : ""}
                        </div>
                        <div className="ot-step-info">
                          <p className="ot-step-title">{step.title}</p>
                          <p className="ot-step-desc">{step.desc}</p>
                          {done && <p className="ot-step-time">{step.time}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* DELIVERY INFO */}
              <div className="ot-delivery-card">
                <div className="ot-delivery-row">
                  <span>Delivery Partner</span>
                  <span>Ravi Kumar 🛵</span>
                </div>
                <div className="ot-delivery-row">
                  <span>Contact</span>
                  <span>+91 98765 43210</span>
                </div>
                <div className="ot-delivery-row">
                  <span>Vehicle</span>
                  <span>MH 02 AB 1234</span>
                </div>
                <div className="ot-delivery-row">
                  <span>ETA</span>
                  <span className="ot-eta">Today by 6:00 PM</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default OrderTracking
