// src/pages/Checkout.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { MapPin, User, Phone, FileText, Clock, ChevronRight, Truck, ArrowLeft, Trash2, ShoppingBag } from 'lucide-react'
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

// Validation helper
const validate = (fields) => {
  const errors = {}
  if (!fields.flatNumber.trim()) errors.flatNumber = 'Flat / House No. is required'
  if (!fields.area.trim()) errors.area = 'Area is required'
  if (!fields.city.trim()) errors.city = 'City is required'
  if (!fields.contactName.trim()) errors.contactName = 'Full name is required'
  if (!fields.contactPhone.trim()) errors.contactPhone = 'Phone number is required'
  else if (!/^[6-9]\d{9}$/.test(fields.contactPhone.replace(/\s+/g, '')))
    errors.contactPhone = 'Enter a valid 10-digit Indian mobile number'
  return errors
}

export default function Checkout() {
  const { cartItems, subtotal, deliveryFee, platformFee, taxAmount, grandTotal, removeFromCart, updateQuantity } = useCart()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [flatNumber, setFlatNumber] = useState('')
  const [apartmentName, setApartmentName] = useState('')
  const [streetName, setStreetName] = useState('')
  const [landmark, setLandmark] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('Hyderabad')
  const [pincode, setPincode] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState(null)
  const [instructions, setInstructions] = useState('')
  const [selectedInstruction, setSelectedInstruction] = useState('')
  const [contactName, setContactName] = useState(user?.name || '')
  const [contactPhone, setContactPhone] = useState(user?.phone || '')
  const [locating, setLocating] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState('address')
  const [errors, setErrors] = useState({})

  /** Build the single-line address string */
  const buildFullAddress = () => {
    const parts = [flatNumber, apartmentName, streetName, landmark, area, city]
      .map(p => p.trim())
      .filter(Boolean)
    if (pincode.trim()) parts.push(`- ${pincode.trim()}`)
    return parts.join(', ')
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/checkout' } })
    return null
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 pt-24 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Start shopping to place an order.</p>
        <Link to="/stores" className="btn-primary">Continue Shopping</Link>
      </div>
    )
  }

  const handleLocateAddress = async () => {
    const addressQuery = buildFullAddress()
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

  const handleProceedToReview = (e) => {
    e.preventDefault()
    const fieldErrors = validate({ flatNumber, area, city, contactName, contactPhone })
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      toast.error('Please fix the highlighted fields.')
      return
    }
    if (!deliveryLocation) {
      toast.error('Please select your delivery location on the map.')
      return
    }
    setErrors({})
    setCheckoutStep('review')
  }

  const handleProceedToPayment = () => {
    const fullAddress = buildFullAddress()
    const primaryStore = cartItems[0].store

    const orderPayload = {
      pickupLocation: {
        address: primaryStore?.address || 'Store location',
        latitude: primaryStore?.location?.coordinates?.[1] || 17.44,
        longitude: primaryStore?.location?.coordinates?.[0] || 78.39,
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
        pincode,
        latitude: deliveryLocation?.latitude || null,
        longitude: deliveryLocation?.longitude || null,
      },
      packageDetails: cartItems.map(i => `${i.quantity}x ${i.name} (from ${i.store?.shopName})`).join(', '),
      commerceItems: cartItems.map(item => ({
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        category: item.category || 'General',
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

  const eta = '5–7 Minutes'
  const fullAddress = buildFullAddress()

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
          <span className={`flex items-center gap-1.5 font-semibold ${checkoutStep === 'address' ? 'text-primary-600' : 'text-emerald-600'}`}>
            <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold ${checkoutStep === 'address' ? 'bg-primary-600' : 'bg-emerald-600'}`}>
              {checkoutStep === 'address' ? '1' : '✓'}
            </span>
            Delivery Address
          </span>
          <div className={`flex-1 h-0.5 rounded ${checkoutStep === 'review' ? 'bg-emerald-600' : 'bg-gray-200'}`} />
          <span className={`flex items-center gap-1.5 ${checkoutStep === 'review' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${checkoutStep === 'review' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
            Review Order
          </span>
          <div className="flex-1 h-0.5 bg-gray-200 rounded" />
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">3</span>
            Payment
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {checkoutStep === 'address' ? (
                <motion.div key="address" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  {/* 1. Map */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <MapPin size={18} className="text-primary-600" />
                      1. Delivery Address
                    </h2>
                    <div className="h-[300px] mb-5 rounded-2xl overflow-hidden border border-gray-200">
                      <AddressPickerMap defaultPosition={deliveryLocation} onPositionSelect={setDeliveryLocation} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">Address Details</h3>
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
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Flat / House No. *</label>
                          <input
                            type="text" value={flatNumber} onChange={e => { setFlatNumber(e.target.value); setErrors(prev => ({ ...prev, flatNumber: undefined })) }}
                            className={`input-field py-2.5 ${errors.flatNumber ? 'border-red-400' : ''}`}
                            placeholder="e.g. Flat 402"
                            id="flat-number"
                          />
                          {errors.flatNumber && <p className="text-xs text-red-500 mt-1">{errors.flatNumber}</p>}
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
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Area *</label>
                          <input
                            type="text" value={area} onChange={e => { setArea(e.target.value); setErrors(prev => ({ ...prev, area: undefined })) }}
                            className={`input-field py-2.5 ${errors.area ? 'border-red-400' : ''}`}
                            placeholder="e.g. Madhapur"
                            id="area"
                          />
                          {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">City *</label>
                          <input
                            type="text" value={city} onChange={e => { setCity(e.target.value); setErrors(prev => ({ ...prev, city: undefined })) }}
                            className={`input-field py-2.5 ${errors.city ? 'border-red-400' : ''}`}
                            placeholder="e.g. Hyderabad"
                            id="city"
                          />
                          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">PIN Code</label>
                          <input type="text" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input-field py-2.5 font-mono" placeholder="e.g. 500081" maxLength={6} id="pincode" />
                        </div>
                      </div>

                      {/* Address preview */}
                      {fullAddress && (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-sm text-gray-700">
                          <span className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Preview: </span>
                          {fullAddress}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Delivery Instructions */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-primary-600" />
                      2. Delivery Instructions (Optional)
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {DELIVERY_INSTRUCTIONS.map(inst => (
                        <button
                          key={inst} type="button"
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
                      type="text" value={instructions} onChange={e => setInstructions(e.target.value)}
                      className="input-field" placeholder="Add custom instructions for your delivery partner..."
                    />
                  </div>

                  {/* 3. Contact Details */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User size={18} className="text-primary-600" />
                      3. Contact Details
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">Full Name *</label>
                        <input
                          type="text" value={contactName}
                          onChange={e => { setContactName(e.target.value); setErrors(prev => ({ ...prev, contactName: undefined })) }}
                          className={`input-field ${errors.contactName ? 'border-red-400' : ''}`}
                          placeholder="Your name" id="contact-name"
                        />
                        {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">Phone Number *</label>
                        <input
                          type="tel" value={contactPhone}
                          onChange={e => { setContactPhone(e.target.value); setErrors(prev => ({ ...prev, contactPhone: undefined })) }}
                          className={`input-field ${errors.contactPhone ? 'border-red-400' : ''}`}
                          placeholder="+91 98765 43210" id="contact-phone"
                        />
                        {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>

              ) : (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Review Your Order</h2>

                  {/* Delivery Summary */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-base">Delivering To</h3>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="font-bold text-gray-900">{contactName} <span className="font-normal text-gray-500 text-sm">• {contactPhone}</span></p>
                      <p className="text-gray-600 mt-1 text-sm leading-relaxed">{fullAddress}</p>
                      {(selectedInstruction || instructions) && (
                        <p className="text-sm text-gray-500 mt-2 flex items-start gap-1">
                          <FileText size={14} className="mt-0.5 shrink-0"/> {selectedInstruction || instructions}
                        </p>
                      )}
                      <button onClick={() => setCheckoutStep('address')} className="text-primary-600 text-sm font-semibold mt-3 hover:underline">
                        Edit Address
                      </button>
                    </div>
                  </div>

                  {/* Items with remove */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-base flex items-center gap-2">
                      Items <span className="bg-primary-100 text-primary-700 text-xs py-0.5 px-2 rounded-full">{cartItems.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {cartItems.map(item => (
                        <div key={item._id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl border border-gray-200 shrink-0">
                            {item.category === 'Dairy' ? '🥛' : item.category === 'Bakery' ? '🍞' : item.category === 'Fruits' ? '🍎' : item.category === 'Vegetables' ? '🥦' : item.category === 'Medicine' ? '💊' : '📦'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.store?.shopName}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <button
                                onClick={() => updateQuantity(item._id, -1)}
                                className="w-6 h-6 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-sm transition-colors"
                              >−</button>
                              <span className="text-sm font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._id, 1)}
                                className="w-6 h-6 rounded-lg bg-primary-100 hover:bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm transition-colors"
                              >+</button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="font-bold text-gray-900 text-sm">₹{item.price * item.quantity}</p>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24 space-y-5">

              {/* ETA Badge */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 flex items-center gap-3 border border-amber-200">
                <div className="text-2xl">⚡</div>
                <div>
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Estimated Delivery</p>
                  <p className="text-lg font-black text-amber-900">{eta}</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 pb-4 border-b border-gray-100">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 max-h-44 overflow-y-auto">
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
                  <span>Subtotal</span><span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1"><Truck size={12} className="text-gray-400" /> Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-semibold' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-gray-600"><span>Platform Fee</span><span>₹{platformFee}</span></div>
                <div className="flex justify-between text-gray-600"><span>GST (5%)</span><span>₹{taxAmount}</span></div>
                <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-100 mt-2">
                  <span>Total</span><span>₹{grandTotal}</span>
                </div>
              </div>

              {checkoutStep === 'address' ? (
                <button
                  onClick={handleProceedToReview}
                  id="proceed-to-review"
                  className="btn-primary w-full py-4 text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Review Order <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleProceedToPayment}
                  id="proceed-to-payment"
                  className="btn-primary w-full py-4 text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Proceed to Payment <ChevronRight size={18} />
                </button>
              )}

              {checkoutStep === 'address' && !deliveryLocation && (
                <p className="text-xs text-amber-600 text-center -mt-2">⚠ Please select delivery location on map</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
