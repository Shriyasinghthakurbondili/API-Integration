import GetAllProducts from '../Components/GetAllProducts'
import TopNav from "../Components/TopNav"

const Home = () => {
  return (
    <div className="app-shell">
      <TopNav title="Browse products" />
      <main className="page">
        <div className="container">
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Pick something you will love. Fast, clean, simple.</p>
          <GetAllProducts />
        </div>
      </main>
    </div>
  )
}

export default Home
