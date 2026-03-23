import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.jsx'

const emptyForm = {
  id: null,
  name: '',
  description: '',
  price: '',
  category_id: '',
  image_url: '',
  stock: ''
}

const Admin = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const isEdit = useMemo(() => form.id !== null, [form.id])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?limit=100')
      setCategories(response.data || [])
    } catch (_error) {
      setCategories([])
    }
  }

  const fetchProducts = async (nextPage = page) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '8' })
      if (search.trim()) params.set('search', search.trim())
      if (category) params.set('category', category)
      const response = await api.get(`/products?${params.toString()}`)
      setProducts(response.data || [])
      setPage(response.meta?.page || nextPage)
      setTotalPages(response.meta?.totalPages || 1)
    } catch (requestError) {
      setError(requestError.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts(1)
  }, [search, category])

  const onFormChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
  }

  const onEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.categoryId || '',
      image_url: product.imageUrl || '',
      stock: product.stock
    })
  }

  const validateForm = () => {
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters'
    if (form.description.trim().length < 10) return 'Description must be at least 10 characters'
    if (Number(form.price) <= 0) return 'Price must be greater than zero'
    if (!form.category_id) return 'Category is required'
    if (Number(form.stock) < 0) return 'Stock cannot be negative'
    return ''
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const validation = validateForm()
    if (validation) {
      setError(validation)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category_id: Number(form.category_id),
        image_url: form.image_url || undefined,
        stock: Number(form.stock)
      }

      if (isEdit) {
        await api.put(`/products/${form.id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      resetForm()
      await fetchProducts(page)
    } catch (requestError) {
      setError(requestError.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${productId}`)
      await fetchProducts(page)
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete product')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="input-field"
                placeholder="Search products"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select className="input-field" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error ? <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div> : null}

          {loading ? <div className="py-10 text-center text-gray-600">Loading products...</div> : null}
          {!loading && products.length === 0 ? <div className="py-10 text-center text-gray-600">No products found.</div> : null}

          {!loading && products.length > 0 ? (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Price</th>
                    <th className="py-2 pr-3">Stock</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="py-2 pr-3">{product.name}</td>
                      <td className="py-2 pr-3">{product.category}</td>
                      <td className="py-2 pr-3">${Number(product.price).toFixed(2)}</td>
                      <td className="py-2 pr-3">{product.stock}</td>
                      <td className="py-2 space-x-2">
                        <button className="btn-secondary text-xs" onClick={() => onEdit(product)}>Edit</button>
                        <button className="text-red-600 text-xs" onClick={() => onDelete(product.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            <button disabled={page <= 1} className="btn-secondary" onClick={() => fetchProducts(page - 1)}>Prev</button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} className="btn-secondary" onClick={() => fetchProducts(page + 1)}>Next</button>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{isEdit ? 'Edit Product' : 'Create Product'}</h2>
          <form className="space-y-3" onSubmit={onSubmit}>
            <input className="input-field" name="name" placeholder="Product name" value={form.name} onChange={onFormChange} />
            <textarea className="input-field" rows="4" name="description" placeholder="Description" value={form.description} onChange={onFormChange} />
            <input className="input-field" name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={onFormChange} />
            <select className="input-field" name="category_id" value={form.category_id} onChange={onFormChange}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input-field" name="stock" type="number" placeholder="Stock" value={form.stock} onChange={onFormChange} />
            <input className="input-field" name="image_url" placeholder="Image URL" value={form.image_url} onChange={onFormChange} />

            <div className="flex gap-2">
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}</button>
              {isEdit ? <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button> : null}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Admin
