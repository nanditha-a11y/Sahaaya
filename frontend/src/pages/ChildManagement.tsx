import React, { FormEvent, useEffect, useState } from 'react'
import childrenData from '../data/children.json'
import Card from '../components/Card'
import { Child, createChild, getChildren } from '../api/client'
import Modal from '../components/Modal'

export default function ChildManagement(){
  const [children, setChildren] = useState<Child[]>(childrenData)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let active = true
    getChildren(childrenData).then(result => {
      if (active) setChildren(result)
    })

    return () => {
      active = false
    }
  }, [])

  const addChild = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const age = Number(formData.get('age'))
    if (!Number.isInteger(age) || age < 0) {
      setSubmitError('Enter a valid non-negative age.')
      return
    }
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const child = await createChild({
        name: String(formData.get('name')).trim(),
        age,
        education: String(formData.get('education')).trim(),
        health: String(formData.get('health')).trim(),
        photo: String(formData.get('photo')).trim()
      })
      setChildren(current => [...current, child])
      form.reset()
      setIsAddModalOpen(false)
    } catch (error) {
      console.error('Could not add child.', error)
      setSubmitError(error instanceof Error ? error.message : 'Could not add child.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Stories & Memories</h2>
        <div>
          <button className="btn-primary handwritten" onClick={() => setIsAddModalOpen(true)}>Add Memory</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map(child => (
          <Card key={child.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 overflow-hidden rounded-md paper-edge">
                <img src={child.photo} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-semibold handwritten" style={{color:'#4b3628'}}>{child.name} — {child.age}</div>
                <div className="text-sm" style={{color:'#6b4c3b'}}>{child.education} • {child.health}</div>
                <div className="text-xs mt-2" style={{color:'#7a5a44'}}>Tap to open scrapbook →</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={isAddModalOpen} title="Add Child Record" onClose={() => setIsAddModalOpen(false)}>
        <form className="space-y-4" onSubmit={addChild}>
          <label className="block text-sm" style={{ color: '#4b3628' }}>
            Child name
            <input name="name" type="text" required minLength={2} maxLength={100} className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]" />
          </label>
          <label className="block text-sm" style={{ color: '#4b3628' }}>
            Age
            <input name="age" type="number" required min={0} step={1} className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]" />
          </label>
          <label className="block text-sm" style={{ color: '#4b3628' }}>
            Education level
            <input name="education" type="text" required maxLength={100} className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]" />
          </label>
          <label className="block text-sm" style={{ color: '#4b3628' }}>
            Health status
            <input name="health" type="text" required maxLength={100} className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]" />
          </label>
          <label className="block text-sm" style={{ color: '#4b3628' }}>
            Photo URL
            <input name="photo" type="url" required className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]" />
          </label>
          {submitError && (
            <p role="alert" className="rounded-lg border border-red-800/20 bg-red-50 p-3 text-sm text-red-900">
              {submitError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="rounded-lg border border-[#6b4c3b]/30 px-4 py-2 handwritten" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary handwritten" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Child'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
