import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext.jsx'
import { api } from '../lib/api.jsx'

const initialAddress = {
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US'
}

const Checkout = () => {
  const navigate = useNavigate()
  const { cart, total, clearCart } = useCart()
  const [address, setAddress] = useState(initialAddress)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const totals = useMemo(() => {
    const tax = total * 0.08
    const shipping = total > 50 ? 0 : 5.99
    return {
      subtotal: total,
      tax,
      shipping,
      total: total + tax + shipping
    }
  }, [total])

  const onChange = (event) => {
    setAddress((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const validate = () => {
    if (cart.length === 0) return 'Your cart is empty.'
    const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country']
    for (const field of requiredFields) {
      if (!address[field]?.trim()) {
        return 'Please complete all required shipping fields.'
      }
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        })),
        shippingAddress: address,
        paymentMethod
      }

      const response = await api.post('/orders', payload)
      setSuccess(`Order #${response.data.id} placed successfully.`)
      clearCart()
      setTimeout(() => navigate('/shop'), 1500)
    } catch (requestError) {
      setError(requestError.message || 'Failed to place order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-2">Checkout unavailable</h1>
          <p className="text-gray-600 mb-4">Your cart is empty. Add products before checkout.</p>
          <button onClick={() => navigate('/shop')} className="btn-primary">Back to shop</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold">Shipping information</h2>

            {error ? <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">{error}</div> : null}
            {success ? <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700">{success}</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input-field" name="fullName" placeholder="Full name" value={address.fullName} onChange={onChange} />
              <input className="input-field" name="addressLine1" placeholder="Address line 1" value={address.addressLine1} onChange={onChange} />
              <input className="input-field" name="addressLine2" placeholder="Address line 2 (optional)" value={address.addressLine2} onChange={onChange} />
              <input className="input-field" name="city" placeholder="City" value={address.city} onChange={onChange} />
              <input className="input-field" name="state" placeholder="State" value={address.state} onChange={onChange} />
              <input className="input-field" name="postalCode" placeholder="Postal code" value={address.postalCode} onChange={onChange} />
              <input className="input-field" name="country" placeholder="Country" value={address.country} onChange={onChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
              <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="card">Card</option>
                <option value="cash_on_delivery">Cash on delivery</option>
              </select>
            </div>

            <button className="btn-primary" disabled={submitting}>
              {submitting ? 'Placing order...' : 'Place order'}
            </button>
          </form>

          <aside className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Order summary</h2>
            <div className="space-y-2 text-sm text-gray-700 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${totals.tax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${totals.shipping.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-base"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Checkout
