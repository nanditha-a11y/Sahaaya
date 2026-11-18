import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResource, getResources, recordStockMovement } from '../api/client'
import StatusBanner from '../components/StatusBanner'
import { useRole } from '../contexts/RoleContext'

export default function Resources() {
  const { dbRole } = useRole()
  const queryClient = useQueryClient()
  const canManage = dbRole === 'SUPER_ADMIN' || dbRole === 'STAFF'

  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('name')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Education')
  const [unit, setUnit] = useState('units')
  const [stock, setStock] = useState('25')
  const [lowThreshold, setLowThreshold] = useState('10')

  const [moveResourceId, setMoveResourceId] = useState('')
  const [moveType, setMoveType] = useState<'INCOMING' | 'OUTGOING' | 'ADJUSTMENT'>('INCOMING')
  const [moveQty, setMoveQty] = useState('5')
  const [moveReason, setMoveReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const resourcesQuery = useQuery({
    queryKey: ['resources', { lowStockOnly }],
    queryFn: () => getResources({ lowStock: lowStockOnly }),
  })

  const createMutation = useMutation({
    mutationFn: createResource,
    onSuccess: (created) => {
      setName('')
      setFormError(null)
      setFeedback(`Added "${created.name}" (${created.stock} ${created.unit}) to inventory.`)
      void queryClient.invalidateQueries({ queryKey: ['resources'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to add resource.')
    },
  })

  const movementMutation = useMutation({
    mutationFn: ({
      resourceId,
      payload,
    }: {
      resourceId: string
      payload: { type: 'INCOMING' | 'OUTGOING' | 'ADJUSTMENT'; quantity: number; reason: string }
    }) => recordStockMovement(resourceId, payload),
    onSuccess: (res) => {
      setMoveReason('')
      setFormError(null)
      setFeedback(
        `Recorded ${res.movement.type} (${res.movement.quantity}) for ${res.resource.name}.`
      )
      void queryClient.invalidateQueries({ queryKey: ['resources'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to record stock movement.')
    },
  })

  const items = useMemo(() => {
    const raw = resourcesQuery.data ?? []
    const q = search.trim().toLowerCase()
    const filtered = q
      ? raw.filter(
          (r) =>
            r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
        )
      : raw

    return [...filtered].sort((a, b) => {
      if (sortBy === 'stock') return a.stock - b.stock
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      return a.name.localeCompare(b.name)
    })
  }, [resourcesQuery.data, search, sortBy])

  function handleCreateItem(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    if (!name.trim()) {
      setFormError('Enter a resource item name.')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim() || 'units',
      stock: Number(stock),
      lowThreshold: Number(lowThreshold),
    })
  }

  function handleStockMovement(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const targetId = moveResourceId || items[0]?.id
    if (!targetId || !moveReason.trim()) {
      setFormError('Select a resource and enter a reason for the stock movement.')
      return
    }

    movementMutation.mutate({
      resourceId: targetId,
      payload: {
        type: moveType,
        quantity: Number(moveQty),
        reason: moveReason.trim(),
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl handwritten" style={{ color: '#6b4c3b' }}>
            Inventory & Resources
          </h2>
          <p className="text-sm" style={{ color: '#7a5a44' }}>
            Track essential supplies, low-stock alerts, and audit-logged stock movements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or category…"
            className="p-2 rounded border text-sm"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'stock' | 'category')}
            className="p-2 rounded border text-sm"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
          >
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock (Low→High)</option>
            <option value="category">Sort: Category</option>
          </select>
          <label className="flex items-center gap-2 text-sm handwritten" style={{ color: '#5c4132' }}>
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            Low stock only
          </label>
        </div>
      </div>

      <StatusBanner
        loading={resourcesQuery.isLoading}
        loadingText="Loading inventory items…"
        error={
          formError ??
          (resourcesQuery.isError
            ? resourcesQuery.error instanceof Error
              ? resourcesQuery.error.message
              : 'Failed to load inventory.'
            : null)
        }
        success={feedback}
        onDismissSuccess={() => setFeedback(null)}
      />

      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form onSubmit={handleCreateItem} className="glass-card p-4 rounded-xl space-y-3 paper-edge">
            <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
              Add New Inventory Item
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Initial Stock"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <input
                type="number"
                min="0"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(e.target.value)}
                placeholder="Alert Threshold"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit (boxes, kits, pairs)"
                className="p-2 rounded border text-sm w-44"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary handwritten text-sm disabled:opacity-60"
              >
                {createMutation.isPending ? 'Adding…' : 'Add Item'}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleStockMovement}
            className="glass-card p-4 rounded-xl space-y-3 paper-edge"
          >
            <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
              Record Stock Movement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={moveResourceId || items[0]?.id || ''}
                onChange={(e) => setMoveResourceId(e.target.value)}
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              >
                {items.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.stock} {r.unit})
                  </option>
                ))}
              </select>
              <select
                value={moveType}
                onChange={(e) => setMoveType(e.target.value as any)}
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              >
                <option value="INCOMING">Incoming (+)</option>
                <option value="OUTGOING">Outgoing (-)</option>
                <option value="ADJUSTMENT">Set Exact Count</option>
              </select>
              <input
                type="number"
                min="1"
                value={moveQty}
                onChange={(e) => setMoveQty(e.target.value)}
                placeholder="Qty"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
            </div>
            <div className="flex gap-2">
              <input
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                placeholder="Reason (e.g., Monthly school distribution)"
                className="p-2 rounded border text-sm flex-1"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <button
                type="submit"
                disabled={movementMutation.isPending}
                className="btn-primary handwritten text-sm disabled:opacity-60"
              >
                {movementMutation.isPending ? 'Updating…' : 'Update Stock'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.id} className="glass-card p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold handwritten" style={{ color: '#5c4132' }}>
                  {it.name}
                </div>
                {it.isLowStock && (
                  <span className="vintage-badge text-[11px] font-semibold text-red-900">
                    Low Stock
                  </span>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8a6b54' }}>
                {it.category}
              </div>
              <div className="text-sm mt-2" style={{ color: '#7a5a44' }}>
                In stock: <strong>{it.stock}</strong> {it.unit} (alert ≤ {it.lowThreshold})
              </div>
            </div>

            {it.movements && it.movements.length > 0 && (
              <div className="mt-3 pt-2 border-t text-xs" style={{ borderColor: '#e6d7c3', color: '#6b4c3b' }}>
                Last: {it.movements[0].type} ({it.movements[0].quantity}) — {it.movements[0].reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}