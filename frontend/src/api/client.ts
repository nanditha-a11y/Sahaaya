import { supabase } from '../lib/supabase'

export interface Child {
  id: string
  name: string
  age: number
  education: string
  health: string
  photo: string
}

export interface Message {
  id: string
  from: string
  role: string
  text: string
  date: string
}

export interface DashboardStats {
  children: number
  donations: { count: number; total: number }
  resources: { count: number; totalStock: number }
  messages: number
}

export type NewChild = Omit<Child, 'id'>

const configuredApiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
const apiBaseUrl = configuredApiBaseUrl ?? '/api'

class ApiResponseError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'ApiResponseError'
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiResponseError(
      response.status,
      body.error || `API request failed (${response.status} ${response.statusText})`
    )
  }

  return response.json() as Promise<T>
}

export async function getDashboardStats(fallback: DashboardStats): Promise<DashboardStats> {
  try {
    return await apiRequest<DashboardStats>('/dashboard/stats')
  } catch (error) {
    console.warn('Using fallback dashboard statistics:', error)
    return fallback
  }
}

export async function getChildren(fallback: Child[]): Promise<Child[]> {
  try {
    return await apiRequest<Child[]>('/children')
  } catch (error) {
    console.warn('Using fallback children:', error)
    return fallback
  }
}

export async function createChild(child: NewChild): Promise<Child> {
  return apiRequest<Child>('/children', {
    method: 'POST',
    body: JSON.stringify(child),
  })
}

export async function getMessages(fallback: Message[]): Promise<Message[]> {
  try {
    const messages = await apiRequest<Message[]>('/messages')
    return messages.map((message) => ({
      ...message,
      date: message.date.slice(0, 10),
    }))
  } catch (error) {
    console.warn('Using fallback messages:', error)
    return fallback
  }
}