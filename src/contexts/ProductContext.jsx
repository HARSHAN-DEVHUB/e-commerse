import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api.jsx'

const ProductContext = createContext()

export const useProducts = () => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    category: '',
    priceRange: [0, 1000],
    search: '',
    sortBy: 'name'
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products?limit=100')
      const data = response.data || []
      setProducts(data.map((product) => ({
        ...product,
        image: product.imageUrl || product.image_url
      })))
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?limit=100')
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const getProductById = async (id) => {
    try {
      const response = await api.get(`/products/${id}`)
      const data = response.data
      return {
        ...data,
        image: data.imageUrl || data.image_url
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      return null
    }
  }

  const getFilteredProducts = () => {
    let filtered = [...products]

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category)
    }

    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    )

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      )
    }

    // Sort products
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      default:
        break
    }

    return filtered
  }

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      priceRange: [0, 1000],
      search: '',
      sortBy: 'name'
    })
  }

  const addProduct = async (productData) => {
    try {
      const response = await api.post('/products', productData)
      const newProduct = response.data
      setProducts((prev) => [...prev, newProduct])
      return { success: true, product: newProduct }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to add product' }
    }
  }

  const updateProduct = async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData)
      const updatedProduct = response.data
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? updatedProduct : product
        )
      )
      return { success: true, product: updatedProduct }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to update product' }
    }
  }

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`)
      setProducts((prev) => prev.filter((product) => product.id !== id))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to delete product' }
    }
  }

  const value = {
    products,
    loading,
    categories,
    filters,
    getFilteredProducts,
    updateFilters,
    clearFilters,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    fetchProducts
  }

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  )
} 