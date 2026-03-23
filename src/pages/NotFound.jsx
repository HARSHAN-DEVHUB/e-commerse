import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-600 mb-6">The page you requested does not exist or was moved.</p>
        <Link to="/" className="btn-primary inline-block">Go to Home</Link>
      </div>
    </div>
  )
}

export default NotFound
