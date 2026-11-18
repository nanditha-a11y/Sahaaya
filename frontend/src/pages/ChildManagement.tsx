import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveChild,
  Child,
  createChild,
  getChildrenPage,
  NewChild,
  updateChild,
} from '../api/client'
import StatusBanner from '../components/StatusBanner'
import { useRole } from '../contexts/RoleContext'

const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=60'

export default function ChildManagement() {
  const { dbRole } = useRole()
  const queryClient = useQueryClient()
  const canManage = dbRole === 'SUPER_ADMIN' || dbRole === 'STAFF'

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'admissionDate' | 'code'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [education, setEducation] = useState('')
  const [health, setHealth] = useState('Good')
  const [photo, setPhoto] = useState(DEFAULT_PHOTO)

  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const childrenQuery = useQuery({
    queryKey: ['children', { search, sortBy, sortOrder, page, pageSize }],
    queryFn: () =>
      getChildrenPage({
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
        page,
        limit: pageSize,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: NewChild) => createChild(payload),
    onSuccess: (created) => {
      setName('')
      setAge('')
      setEducation('')
      setHealth('Good')
      setPhoto(DEFAULT_PHOTO)
      setFormError(null)
      setFeedback(`Added ${created.name} (${created.code ?? 'New'}) to Sahaaya records.`)
      void queryClient.invalidateQueries({ queryKey: ['children'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to save child profile.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NewChild> }) =>
      updateChild(id, updates),
    onSuccess: (updated) => {
      setEditingChild(null)
      setFormError(null)
      setFeedback(`Updated profile for ${updated.name}.`)
      void queryClient.invalidateQueries({ queryKey: ['children'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to update child profile.')
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveChild(id),
    onSuccess: () => {
      setFormError(null)
      setFeedback('Child profile archived.')
      void queryClient.invalidateQueries({ queryKey: ['children'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to archive child profile.')
    },
  })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const parsedAge = Number(age)
    if (!name.trim() || !education.trim() || !Number.isInteger(parsedAge) || parsedAge < 0) {
      setFormError('Please enter a valid name, non-negative integer age, and education level.')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      age: parsedAge,
      education: education.trim(),
      health: health.trim() || 'Good',
      photo: photo.trim() || DEFAULT_PHOTO,
    })
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingChild) return
    setFormError(null)
    setFeedback(null)
    updateMutation.mutate({
      id: editingChild.id,
      updates: {
        name: editingChild.name.trim(),
        age: Number(editingChild.age),
        education: editingChild.education.trim(),
        health: editingChild.health.trim(),
        photo: editingChild.photo.trim() || DEFAULT_PHOTO,
      },
    })
  }

  const data = childrenQuery.data
  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const totalCount = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl handwritten" style={{ color: '#6b4c3b' }}>
            Child Management
          </h2>
          <p className="text-sm" style={{ color: '#7a5a44' }}>
            {totalCount} active profiles in Sahaaya care registry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Search children"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search name, code, grade…"
            className="p-2 rounded border text-sm"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
          />
          <select
            aria-label="Sort children by"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as 'name' | 'age' | 'admissionDate' | 'code')
              setPage(1)
            }}
            className="p-2 rounded border text-sm"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
          >
            <option value="name">Sort: Name</option>
            <option value="age">Sort: Age</option>
            <option value="code">Sort: Code</option>
            <option value="admissionDate">Sort: Admission</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              setPage(1)
            }}
            className="px-3 py-2 rounded border text-xs handwritten"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6', color: '#5c4132' }}
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      <StatusBanner
        loading={childrenQuery.isLoading}
        loadingText="Loading child profiles…"
        error={
          formError ??
          (childrenQuery.isError
            ? childrenQuery.error instanceof Error
              ? childrenQuery.error.message
              : 'Failed to load children.'
            : null)
        }
        success={feedback}
        onDismissSuccess={() => setFeedback(null)}
      />

      {canManage && (
        <form onSubmit={handleAdd} className="glass-card p-4 rounded-xl space-y-3 paper-edge">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="p-2 rounded border"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              type="number"
              min="0"
              placeholder="Age"
              className="p-2 rounded border"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Education (e.g. Grade 5)"
              className="p-2 rounded border"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <input
              value={health}
              onChange={(e) => setHealth(e.target.value)}
              placeholder="Health status"
              className="p-2 rounded border"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary handwritten disabled:opacity-60"
            >
              {createMutation.isPending ? 'Saving…' : 'Add Child'}
            </button>
          </div>
          <input
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="Photo URL"
            className="w-full p-2 rounded border text-xs"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
          />
        </form>
      )}

      {editingChild && (
        <form
          onSubmit={handleSaveEdit}
          className="glass-card p-4 rounded-xl space-y-3 paper-edge border-2"
          style={{ borderColor: '#c69b6d' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="handwritten text-xl" style={{ color: '#6b4c3b' }}>
              Edit Profile: {editingChild.code}
            </h3>
            <button
              type="button"
              onClick={() => setEditingChild(null)}
              className="text-xs underline"
              style={{ color: '#6b4c3b' }}
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={editingChild.name}
              onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
              className="p-2 rounded border"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <input
              type="number"
              min="0"
              value={editingChild.age}
              onChange={(e) => setEditingChild({ ...editingChild, age: Number(e.target.value) })}
              className="p-2 rounded border"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <input
              value={editingChild.education}
              onChange={(e) => setEditingChild({ ...editingChild, education: e.target.value })}
              className="p-2 rounded border"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <input
              value={editingChild.health}
              onChange={(e) => setEditingChild({ ...editingChild, health: e.target.value })}
              className="p-2 rounded border"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary handwritten disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Updating…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((c) => (
          <div key={c.id} className="polaroid p-4 rounded-xl flex flex-col justify-between gap-3">
            <div className="flex items-center gap-4">
              <img src={c.photo} alt={c.name} className="w-16 h-16 rounded-full object-cover" />
              <div>
                <div className="font-semibold handwritten" style={{ color: '#5c4132' }}>
                  {c.name}{' '}
                  {c.code && (
                    <span className="text-xs font-normal" style={{ color: '#8a6b54' }}>
                      ({c.code})
                    </span>
                  )}
                </div>
                <div className="text-sm" style={{ color: '#7a5a44' }}>
                  Age {c.age} • {c.education}
                </div>
                <div className="text-xs mt-1" style={{ color: '#8a6b54' }}>
                  Health: {c.health}
                </div>
              </div>
            </div>

            {canManage && (
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#e6d7c3' }}>
                <button
                  type="button"
                  onClick={() => setEditingChild(c)}
                  className="px-2.5 py-1 rounded text-xs handwritten border"
                  style={{ background: '#fffdf7', borderColor: '#d9c2a6', color: '#5c4132' }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={archiveMutation.isPending}
                  onClick={() => archiveMutation.mutate(c.id)}
                  className="px-2.5 py-1 rounded text-xs handwritten border border-red-800/20 text-red-900 bg-red-50/70"
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between glass-card px-4 py-3 rounded-xl">
          <span className="text-xs" style={{ color: '#7a5a44' }}>
            Page {page} of {totalPages} ({totalCount} records)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border text-xs handwritten disabled:opacity-40"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6', color: '#5c4132' }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border text-xs handwritten disabled:opacity-40"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6', color: '#5c4132' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}