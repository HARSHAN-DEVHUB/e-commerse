import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api } from '../lib/api.jsx'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function fetchProfile() {
      try {
        const response = await api.get('/auth/profile')
        if (active) {
          setForm({
            name: response.data.name || '',
            email: response.data.email || ''
          })
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Failed to load profile')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchProfile()
    return () => {
      active = false
    }
  }, [])

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    const result = await updateProfile(form)
    if (result.success) {
      setMessage('Profile updated successfully')
    } else {
      setError(result.error || 'Failed to update profile')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen p-8 text-center">Loading profile...</div>
  }

  return (
    <div className="min-h-screen bg-[#f6efe2] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-sm text-gray-600 mb-6">Signed in as {user?.role}</p>

          {error ? <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div> : null}
          {message ? <div className="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-700">{message}</div> : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
              <input id="name" name="name" className="input-field" value={form.name} onChange={onChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input-field" value={form.email} onChange={onChange} />
            </div>
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile
