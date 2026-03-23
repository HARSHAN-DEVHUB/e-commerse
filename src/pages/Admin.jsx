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

const tabs = ['overview', 'products', 'orders', 'categories', 'audit']

const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [summary, setSummary] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(false)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [bulkAction, setBulkAction] = useState('adjustStock')
  const [bulkValue, setBulkValue] = useState('')

  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [savingProduct, setSavingProduct] = useState(false)

  const [orders, setOrders] = useState([])
  const [orderPage, setOrderPage] = useState(1)
  const [orderTotalPages, setOrderTotalPages] = useState(1)
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [categoryName, setCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [savingCategory, setSavingCategory] = useState(false)

  const [logs, setLogs] = useState([])
  const [logPage, setLogPage] = useState(1)
  const [logTotalPages, setLogTotalPages] = useState(1)
  const [logEntity, setLogEntity] = useState('')
  const [logsLoading, setLogsLoading] = useState(false)

  const isEdit = useMemo(() => form.id !== null, [form.id])

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories?limit=200')
      setCategories(response.data || [])
    } catch (_err) {
      setCategories([])
    }
  }

  const loadProducts = async (nextPage = page) => {
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '8' })
      if (search.trim()) params.set('search', search.trim())
      if (category) params.set('category', category)

      const response = await api.get(`/products?${params.toString()}`)
      setProducts(response.data || [])
      setPage(response.meta?.page || nextPage)
      setTotalPages(response.meta?.totalPages || 1)
      setSelectedProductIds([])
    } catch (requestError) {
      setError(requestError.message || 'Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadOverview = async () => {
    setOverviewLoading(true)
    try {
      const [summaryResponse, lowStockResponse] = await Promise.all([
        api.get('/admin/dashboard/summary'),
        api.get('/admin/inventory/low-stock?threshold=5')
      ])

      setSummary(summaryResponse.data)
      setLowStock(lowStockResponse.data || [])
    } catch (requestError) {
      setError(requestError.message || 'Failed to load dashboard')
    } finally {
      setOverviewLoading(false)
    }
  }

  const loadOrders = async (nextPage = orderPage) => {
    setOrdersLoading(true)
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '10' })
      if (orderStatusFilter) params.set('status', orderStatusFilter)

      const response = await api.get(`/orders?${params.toString()}`)
      setOrders(response.data || [])
      setOrderPage(response.meta?.page || nextPage)
      setOrderTotalPages(response.meta?.totalPages || 1)
    } catch (requestError) {
      setError(requestError.message || 'Failed to load orders')
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadLogs = async (nextPage = logPage) => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '10' })
      if (logEntity) params.set('entity', logEntity)

      const response = await api.get(`/admin/audit-logs?${params.toString()}`)
      setLogs(response.data || [])
      setLogPage(response.meta?.page || nextPage)
      setLogTotalPages(response.meta?.totalPages || 1)
    } catch (requestError) {
      setError(requestError.message || 'Failed to load audit logs')
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts(1)
  }, [search, category])

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview()
    }
    if (activeTab === 'orders') {
      loadOrders(1)
    }
    if (activeTab === 'audit') {
      loadLogs(1)
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders(1)
    }
  }, [orderStatusFilter])

  useEffect(() => {
    if (activeTab === 'audit') {
      loadLogs(1)
    }
  }, [logEntity])

  const onFormChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setImageFile(null)
  }

  const onEditProduct = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.categoryId || '',
      image_url: product.imageUrl || '',
      stock: product.stock
    })
    setImageFile(null)
  }

  const validateForm = () => {
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters'
    if (form.description.trim().length < 10) return 'Description must be at least 10 characters'
    if (Number(form.price) <= 0) return 'Price must be greater than zero'
    if (!form.category_id) return 'Category is required'
    if (Number(form.stock) < 0) return 'Stock cannot be negative'
    return ''
  }

  const uploadProductImage = async (productId, file) => {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`/api/products/${productId}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
      credentials: 'include'
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.message || 'Failed to upload image')
    }
  }

  const onSubmitProduct = async (event) => {
    event.preventDefault()
    const validation = validateForm()
    if (validation) {
      setError(validation)
      return
    }

    setSavingProduct(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category_id: Number(form.category_id),
        image_url: form.image_url || undefined,
        stock: Number(form.stock)
      }

      let savedProduct
      if (isEdit) {
        const response = await api.put(`/products/${form.id}`, payload)
        savedProduct = response.data
      } else {
        const response = await api.post('/products', payload)
        savedProduct = response.data
      }

      if (imageFile) {
        await uploadProductImage(savedProduct.id, imageFile)
      }

      setNotice(isEdit ? 'Product updated successfully' : 'Product created successfully')
      resetForm()
      await loadProducts(page)
      await loadOverview()
    } catch (requestError) {
      setError(requestError.message || 'Failed to save product')
    } finally {
      setSavingProduct(false)
    }
  }

  const onDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return
    setNotice('')
    setError('')
    try {
      await api.delete(`/products/${productId}`)
      setNotice('Product deleted successfully')
      await loadProducts(page)
      await loadOverview()
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete product')
    }
  }

  const toggleSelectedProduct = (id) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSelectAllProducts = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([])
      return
    }
    setSelectedProductIds(products.map((product) => product.id))
  }

  const runBulkAction = async () => {
    if (selectedProductIds.length === 0) {
      setError('Select at least one product')
      return
    }

    const payload = {
      ids: selectedProductIds,
      action: bulkAction
    }

    if (bulkAction !== 'delete') {
      payload.value = Number(bulkValue)
    }

    setError('')
    setNotice('')
    try {
      await api.post('/products/bulk', payload)
      setNotice('Bulk action completed successfully')
      setBulkValue('')
      await loadProducts(page)
      await loadOverview()
    } catch (requestError) {
      setError(requestError.message || 'Bulk action failed')
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    setError('')
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      setNotice('Order status updated')
      await loadOrders(orderPage)
      await loadOverview()
      if (activeTab === 'audit') {
        await loadLogs(logPage)
      }
    } catch (requestError) {
      setError(requestError.message || 'Failed to update order status')
    }
  }

  const saveCategory = async (event) => {
    event.preventDefault()
    if (categoryName.trim().length < 2) {
      setError('Category name must be at least 2 characters')
      return
    }

    setSavingCategory(true)
    setError('')
    setNotice('')
    try {
      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, { name: categoryName.trim() })
        setNotice('Category updated successfully')
      } else {
        await api.post('/categories', { name: categoryName.trim() })
        setNotice('Category created successfully')
      }

      setCategoryName('')
      setEditingCategoryId(null)
      await loadCategories()
      await loadOverview()
      if (activeTab === 'audit') {
        await loadLogs(logPage)
      }
    } catch (requestError) {
      setError(requestError.message || 'Failed to save category')
    } finally {
      setSavingCategory(false)
    }
  }

  const editCategory = (item) => {
    setEditingCategoryId(item.id)
    setCategoryName(item.name)
  }

  const removeCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return
    setError('')
    setNotice('')
    try {
      await api.delete(`/categories/${id}`)
      setNotice('Category deleted successfully')
      await loadCategories()
      await loadOverview()
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete category')
    }
  }

  const renderOverview = () => {
    if (overviewLoading) {
      return <div className="py-16 text-center text-[#6c5a40]">Loading dashboard...</div>
    }

    if (!summary) {
      return <div className="py-16 text-center text-[#6c5a40]">No dashboard data found.</div>
    }

    const cards = [
      { label: 'Total Revenue', value: `$${Number(summary.metrics.totalRevenue || 0).toFixed(2)}` },
      { label: 'Revenue Today', value: `$${Number(summary.metrics.todayRevenue || 0).toFixed(2)}` },
      { label: 'Total Orders', value: summary.metrics.orders },
      { label: 'Orders Today', value: summary.metrics.ordersToday },
      { label: 'Products', value: summary.metrics.products },
      { label: 'Categories', value: summary.metrics.categories },
      { label: 'Customers', value: summary.metrics.customers },
      { label: 'Low Stock', value: summary.metrics.lowStockCount }
    ]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-[#d5bf95] bg-[#fff9ef] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-[#8a7553]">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold text-[#3b2b16]">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-lg border border-[#d5bf95] bg-white p-4">
            <h3 className="text-lg font-semibold text-[#35250f]">Top Selling Products</h3>
            <div className="mt-3 space-y-3">
              {summary.topProducts?.length ? summary.topProducts.map((item) => (
                <div key={item.productId} className="flex items-center justify-between border-b border-[#efe3cf] pb-2">
                  <div>
                    <div className="font-medium text-[#35250f]">{item.name}</div>
                    <div className="text-xs text-[#7f6a49]">Stock: {item.stock}</div>
                  </div>
                  <div className="text-sm text-[#5c4828]">Sold: {item.quantitySold}</div>
                </div>
              )) : <div className="text-sm text-[#7f6a49]">No sales data yet.</div>}
            </div>
          </section>

          <section className="rounded-lg border border-[#d5bf95] bg-white p-4">
            <h3 className="text-lg font-semibold text-[#35250f]">Low Stock Alerts</h3>
            <div className="mt-3 space-y-2">
              {lowStock.length ? lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded border border-[#efe3cf] p-2">
                  <div>
                    <div className="text-sm font-medium text-[#35250f]">{product.name}</div>
                    <div className="text-xs text-[#7f6a49]">{product.category}</div>
                  </div>
                  <span className="text-sm font-semibold text-red-600">Stock: {product.stock}</span>
                </div>
              )) : <div className="text-sm text-[#7f6a49]">No low-stock products.</div>}
            </div>
          </section>
        </div>
      </div>
    )
  }

  const renderProducts = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="xl:col-span-2 rounded-lg border border-[#d5bf95] bg-white p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-[#32230f]">Products</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input-field"
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="input-field" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
          <select className="input-field" value={bulkAction} onChange={(event) => setBulkAction(event.target.value)}>
            <option value="adjustStock">Bulk: Adjust Stock</option>
            <option value="setCategory">Bulk: Set Category</option>
            <option value="delete">Bulk: Delete</option>
          </select>

          {bulkAction === 'adjustStock' ? (
            <input
              className="input-field"
              type="number"
              placeholder="Stock delta (e.g. 5 or -3)"
              value={bulkValue}
              onChange={(event) => setBulkValue(event.target.value)}
            />
          ) : null}

          {bulkAction === 'setCategory' ? (
            <select className="input-field" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}>
              <option value="">Select category</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          ) : null}

          {bulkAction === 'delete' ? <div /> : null}

          <button className="btn-secondary" onClick={runBulkAction}>Apply To Selected ({selectedProductIds.length})</button>
        </div>

        {loadingProducts ? <div className="py-10 text-center text-[#6c5a40]">Loading products...</div> : null}
        {!loadingProducts && products.length === 0 ? <div className="py-10 text-center text-[#6c5a40]">No products found.</div> : null}

        {!loadingProducts && products.length > 0 ? (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#e8d5b7]">
                  <th className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedProductIds.length === products.length}
                      onChange={toggleSelectAllProducts}
                    />
                  </th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Stock</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-[#efe3cf]">
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleSelectedProduct(product.id)}
                      />
                    </td>
                    <td className="py-2 pr-3">{product.name}</td>
                    <td className="py-2 pr-3">{product.category}</td>
                    <td className="py-2 pr-3">${Number(product.price).toFixed(2)}</td>
                    <td className="py-2 pr-3">
                      <span className={product.stock <= 5 ? 'text-red-600 font-semibold' : ''}>{product.stock}</span>
                    </td>
                    <td className="py-2 space-x-2">
                      <button className="btn-secondary text-xs" onClick={() => onEditProduct(product)}>Edit</button>
                      <button className="text-red-600 text-xs" onClick={() => onDeleteProduct(product.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <button disabled={page <= 1} className="btn-secondary" onClick={() => loadProducts(page - 1)}>Prev</button>
          <span className="text-sm text-[#6c5a40]">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} className="btn-secondary" onClick={() => loadProducts(page + 1)}>Next</button>
        </div>
      </section>

      <section className="rounded-lg border border-[#d5bf95] bg-white p-5">
        <h2 className="text-xl font-semibold mb-4 text-[#32230f]">{isEdit ? 'Edit Product' : 'Create Product'}</h2>
        <form className="space-y-3" onSubmit={onSubmitProduct}>
          <input className="input-field" name="name" placeholder="Product name" value={form.name} onChange={onFormChange} />
          <textarea className="input-field" rows="4" name="description" placeholder="Description" value={form.description} onChange={onFormChange} />
          <input className="input-field" name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={onFormChange} />
          <select className="input-field" name="category_id" value={form.category_id} onChange={onFormChange}>
            <option value="">Select category</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input className="input-field" name="stock" type="number" placeholder="Stock" value={form.stock} onChange={onFormChange} />
          <input className="input-field" name="image_url" placeholder="Image URL" value={form.image_url} onChange={onFormChange} />
          <input className="input-field" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />

          <div className="flex gap-2">
            <button className="btn-primary" disabled={savingProduct}>{savingProduct ? 'Saving...' : isEdit ? 'Update' : 'Create'}</button>
            {isEdit ? <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button> : null}
          </div>
        </form>
      </section>
    </div>
  )

  const renderOrders = () => (
    <section className="rounded-lg border border-[#d5bf95] bg-white p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-[#32230f]">Order Management</h2>
        <select className="input-field max-w-xs" value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {ordersLoading ? <div className="py-12 text-center text-[#6c5a40]">Loading orders...</div> : null}
      {!ordersLoading && orders.length === 0 ? <div className="py-12 text-center text-[#6c5a40]">No orders found.</div> : null}

      {!ordersLoading && orders.length > 0 ? (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#e8d5b7]">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[#efe3cf]">
                  <td className="py-2 pr-3">#{order.id}</td>
                  <td className="py-2 pr-3">{order.user?.name || order.user?.email || 'N/A'}</td>
                  <td className="py-2 pr-3">${Number(order.total).toFixed(2)}</td>
                  <td className="py-2 pr-3">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-3 capitalize">{order.status}</td>
                  <td className="py-2">
                    <select className="input-field text-xs" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                      {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <button disabled={orderPage <= 1} className="btn-secondary" onClick={() => loadOrders(orderPage - 1)}>Prev</button>
        <span className="text-sm text-[#6c5a40]">Page {orderPage} of {orderTotalPages}</span>
        <button disabled={orderPage >= orderTotalPages} className="btn-secondary" onClick={() => loadOrders(orderPage + 1)}>Next</button>
      </div>
    </section>
  )

  const renderCategories = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section className="rounded-lg border border-[#d5bf95] bg-white p-5">
        <h2 className="text-xl font-semibold text-[#32230f]">Category Manager</h2>
        <form className="mt-4 space-y-3" onSubmit={saveCategory}>
          <input
            className="input-field"
            placeholder="Category name"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-primary" disabled={savingCategory}>
              {savingCategory ? 'Saving...' : editingCategoryId ? 'Update Category' : 'Create Category'}
            </button>
            {editingCategoryId ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingCategoryId(null)
                  setCategoryName('')
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-[#d5bf95] bg-white p-5">
        <h2 className="text-xl font-semibold text-[#32230f]">Existing Categories</h2>
        <div className="mt-4 space-y-2">
          {categories.map((item) => (
            <div key={item.id} className="flex items-center justify-between border border-[#efe3cf] rounded p-3">
              <div>
                <div className="font-medium text-[#35250f]">{item.name}</div>
                <div className="text-xs text-[#7f6a49]">Products: {item._count?.products || 0}</div>
              </div>
              <div className="space-x-2">
                <button className="btn-secondary text-xs" onClick={() => editCategory(item)}>Edit</button>
                <button className="text-red-600 text-xs" onClick={() => removeCategory(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )

  const renderAudit = () => (
    <section className="rounded-lg border border-[#d5bf95] bg-white p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-[#32230f]">Audit Log</h2>
        <select className="input-field max-w-xs" value={logEntity} onChange={(event) => setLogEntity(event.target.value)}>
          <option value="">All entities</option>
          <option value="order">Order</option>
          <option value="product">Product</option>
          <option value="category">Category</option>
        </select>
      </div>

      {logsLoading ? <div className="py-12 text-center text-[#6c5a40]">Loading logs...</div> : null}
      {!logsLoading && logs.length === 0 ? <div className="py-12 text-center text-[#6c5a40]">No log entries found.</div> : null}

      {!logsLoading && logs.length > 0 ? (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#e8d5b7]">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Entity</th>
                <th className="py-2 pr-3">By</th>
                <th className="py-2">Entity ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[#efe3cf]">
                  <td className="py-2 pr-3">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-3">{log.action}</td>
                  <td className="py-2 pr-3 capitalize">{log.entity}</td>
                  <td className="py-2 pr-3">{log.user?.name || log.user?.email || 'System'}</td>
                  <td className="py-2">{log.entityId || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <button disabled={logPage <= 1} className="btn-secondary" onClick={() => loadLogs(logPage - 1)}>Prev</button>
        <span className="text-sm text-[#6c5a40]">Page {logPage} of {logTotalPages}</span>
        <button disabled={logPage >= logTotalPages} className="btn-secondary" onClick={() => loadLogs(logPage + 1)}>Next</button>
      </div>
    </section>
  )

  return (
    <div className="min-h-screen bg-[#f6efe2] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <header className="rounded-lg border border-[#ccb184] bg-gradient-to-r from-[#fff3dc] to-[#f7ebd6] p-5">
          <h1 className="text-3xl font-bold text-[#2f1f0e]">Admin Control Center</h1>
          <p className="text-sm text-[#6f5a3e] mt-1">Operations dashboard for products, orders, categories, and activity monitoring.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'btn-primary capitalize' : 'btn-secondary capitalize'}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {notice ? <div className="rounded border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3">{notice}</div> : null}
        {error ? <div className="rounded border border-red-200 bg-red-50 text-red-700 px-4 py-3">{error}</div> : null}

        {activeTab === 'overview' ? renderOverview() : null}
        {activeTab === 'products' ? renderProducts() : null}
        {activeTab === 'orders' ? renderOrders() : null}
        {activeTab === 'categories' ? renderCategories() : null}
        {activeTab === 'audit' ? renderAudit() : null}
      </div>
    </div>
  )
}

export default Admin
