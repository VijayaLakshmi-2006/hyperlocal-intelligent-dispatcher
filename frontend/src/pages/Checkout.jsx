// src/pages/Checkout.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { MapPin, User, Phone, FileText, Clock, ChevronRight, Truck, ArrowLeft } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import AddressPickerMap from '../components/AddressPickerMap'

const DELIVERY_INSTRUCTIONS = [
  'Leave at door',
  'Call when nearby',
  'Ring doorbell',
  'Hand it to me',
  'Leave with security',
]

export default function Checkout() {
  const { cartItems, subtotal, deliveryFee, platformFee, taxAmount, grandTotal } = useCart()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [flatNumber, setFlatNumber] = useState('')
  const [apartmentName, setApartmentName] = useState('')
  const [streetName, setStreetName] = useState('')
  const [landmark, setLandmark] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('Hyderabad')
  const [deliveryLocation, setDeliveryLocation] = useState(null)

  const getFullAddress = () => {
    return [flatNumber, apartmentName, streetName, landmark, area, city].filter(Boolean).join(', ')
  }
  const [instructions, setInstructions] = useState('')
  const [selectedInstruction, setSelectedInstruction] = useState('')
  const [contactName, setContactName] = useState(user?.name || '')
  const [contactPhone, setContactPhone] = useState(user?.phone || '')
  const [locating, setLocating] = useState(false)

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 pt-24">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some items from a store to checkout.</p>
        <Link to="/stores" className="btn-primary">Browse Stores</Link>
      </div>
    )
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/checkout' } })
    return null
  }

  const handleLocateAddress = async () => {
    const addressQuery = getFullAddress()
    if (!addressQuery.trim()) return toast.error('Please enter an address first.')
    setLocating(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`)
      const data = await response.json()
      if (data?.length > 0) {
        setDeliveryLocation({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) })
        toast.success('Location found on map!')
      } else {
        toast.error('Could not find address. Drop the pin manually.')
      }
    } catch {
      toast.error('Failed to geocode address.')
    } finally {
      setLocating(false)
    }
  }

  const handleProceedToPayment = (e) => {
    e.preventDefault()
    const fullAddress = getFullAddress()
    if (!fullAddress.trim() || !deliveryLocation) {
      return toast.error('Please select a delivery location on the map.')
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      return toast.error('Please fill in your contact details.')
    }

    const primaryStore = cartItems[0].store
    const orderPayload = {
      pickupLocation: {
        address: primaryStore?.address || 'Store location',
        latitude: primaryStore?.location?.coordinates[1] || 17.44,
        longitude: primaryStore?.location?.coordinates[0] || 78.39,
      },
      deliveryLocation: {
        address: fullAddress,
        fullAddress,
        flatNumber,
        apartmentName,
        streetName,
        landmark,
        area,
        city,
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
      },
      packageDetails: cartItems.map(i => `${i.quantity}x ${i.name} (from ${i.store?.shopName})`).join(', '),
      commerceItems: cartItems.map(item => ({
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        category: item.category || 'General'
      })),
      price: grandTotal,
      deliveryFee,
      platformFee,
      taxAmount,
      paymentMethod: 'online',
      shopId: primaryStore?._id,
      deliveryInstructions: selectedInstruction || instructions,
      contactName,
      contactPhone,
    }

    navigate('/payment', { state: { orderPayload } })
  }

  // Mock ETA
  const seed = cartItems[0]?.store?._id ? cartItems[0].store._id.charCodeAt(cartItems[0].store._id.length - 1) : 0
  const distance = ((seed % 35) / 10 + 0.5).toFixed(1)
  const eta = distance < 1 ? '8–12 mins' : distance < 2 ? '14–18 mins' : '20–28 mins'

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Back */}
        <Link to="/stores" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors w-fit">
          <ArrowLeft size={18} /> Continue Shopping
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Checkout</h1>
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <span className="flex items-center gap-1.5 text-primary-600 font-semibold">
            <span className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            Delivery Details
          </span>
          <div className="flex-1 h-0.5 bg-gray-200 rounded" />
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">2</span>
            Payment
          </span>
          <div className="flex-1 h-0.5 bg-gray-200 rounded" />
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">3</span>
            Track Order
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Delivery Address */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <MapPin size={18} className="text-primary-600" />
                1. Delivery Address
              </h2>

              <div className="h-[320px] mb-5 rounded-2xl overflow-hidden border border-gray-200">
                <AddressPickerMap defaultPosition={deliveryLocation} onPositionSelect={setDeliveryLocation} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-700">Detailed Address Info</h3>
                  <button
                    type="button"
                    onClick={handleLocateAddress}
                    disabled={locating}
                    className="text-sm text-primary-600 font-semibold hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    {locating ? 'Locating...' : '📍 Auto-Locate on Map'}
                  </button>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Flat / House No.</label>
                    <input type="text" value={flatNumber} onChange={e => setFlatNumber(e.target.value)} className="input-field py-2.5" placeholder="e.g. Flat 402" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Apartment / Building</label>
                    <input type="text" value={apartmentName} onChange={e => setApartmentName(e.target.value)} className="input-field py-2.5" placeholder="e.g. Green Valley Apts" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Street Name</label>
                    <input type="text" value={streetName} onChange={e => setStreetName(e.target.value)} className="input-field py-2.5" placeholder="e.g. 1st Main Road" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Landmark (Optional)</label>
                    <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} className="input-field py-2.5" placeholder="e.g. Near Apollo Hospital" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Area</label>
                    <input type="text" value={area} onChange={e => setArea(e.target.value)} className="input-field py-2.5" placeholder="e.g. Madhapur" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Delivery Instructions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                2. Delivery Instructions (Optional)
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {DELIVERY_INSTRUCTIONS.map(inst => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setSelectedInstruction(inst === selectedInstruction ? '' : inst)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                      selectedInstruction === inst
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="input-field"
                placeholder="Add custom instructions for your delivery partner..."
              />
            </motion.div>

            {/* 3. Contact Details */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-primary-600" />
                3. Contact Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="input-field"
                    placeholder="Your name"
                    id="contact-name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="input-field"
                    placeholder="+91 98765 43210"
                    id="contact-phone"
                    required
                  />
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24 space-y-5">

              {/* ETA Badge */}
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-4 flex items-center gap-3 border border-primary-100">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Clock size={20} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Estimated Delivery</p>
                  <p className="text-lg font-black text-gray-900">{eta}</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 pb-4 border-b border-gray-100">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item._id} className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-2 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity} • {item.store?.shopName}</p>
                    </div>
                    <p className="font-semibold text-gray-800 shrink-0">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <Truck size={12} className="text-gray-400" /> Delivery
                  </span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (5%)</span>
                  <span>₹{taxAmount}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-100 mt-2">
                  <span>Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!deliveryLocation || !getFullAddress() || !contactName || !contactPhone}
                id="proceed-to-payment"
                className="btn-primary w-full py-4 text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Payment
                <ChevronRight size={18} />
              </button>
              {!deliveryLocation && (
                <p className="text-xs text-red-500 text-center -mt-2">Please select delivery location on map</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
