import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow pt-20"> {/* pt-20 accounts for fixed navbar */}
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
