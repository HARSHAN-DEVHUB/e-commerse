import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const pageContent = {
  '/about': {
    title: 'About StyleHub',
    body: 'StyleHub is a modern storefront focused on clean style, quality basics, and dependable shopping.'
  },
  '/contact': {
    title: 'Contact Us',
    body: 'Need help with an order or product? Reach us anytime and we will assist you as quickly as possible.'
  },
  '/shipping': {
    title: 'Shipping Information',
    body: 'Orders are processed quickly, and shipping timelines depend on destination and selected delivery method.'
  },
  '/returns': {
    title: 'Returns & Exchanges',
    body: 'If an item is not the right fit, you can request a return or exchange under our return policy.'
  },
  '/size-guide': {
    title: 'Size Guide',
    body: 'Use the product measurements and fit notes to choose the right size before checkout.'
  },
  '/faq': {
    title: 'Frequently Asked Questions',
    body: 'Find answers to common questions about orders, payments, shipping, and account management.'
  },
  '/privacy': {
    title: 'Privacy Policy',
    body: 'We process personal data responsibly and only for purposes needed to deliver our services.'
  },
  '/terms': {
    title: 'Terms of Service',
    body: 'By using this site, you agree to the terms that define responsibilities, usage, and service limits.'
  },
  '/cookies': {
    title: 'Cookie Policy',
    body: 'Cookies are used to improve site functionality, analytics, and user experience preferences.'
  }
}

const InfoPage = () => {
  const { pathname } = useLocation()
  const content = pageContent[pathname] || {
    title: 'Information',
    body: 'Requested page content is not available.'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>
          <p className="text-gray-700 leading-relaxed mb-6">{content.body}</p>
          <Link to="/" className="btn-primary inline-block">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

export default InfoPage
