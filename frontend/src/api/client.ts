import { supabase } from '../lib/supabase'

export interface Child {
  id: string
  code?: string
  name: string
  age: number
  gender?: string
  education: string
  health: string
  photo: string
  bio?: string | null
  admissionDate?: string
  isArchived?: boolean
}

export interface PaginatedChildren {
  items: Child[]
  total: number
  page: number
  pageSize: number
  totalPages: number
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

export type NewChild = Omit<Child, 'id' | 'code' | 'admissionDate' | 'isArchived'>

const configuredApiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
const apiBaseUrl = configuredApiBaseUrl ?? '/api'

export class ApiResponseError extends Error {
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

export async function getDashboardStats(_fallback?: DashboardStats): Promise<DashboardStats> {
  return apiRequest<DashboardStats>('/dashboard/stats')
}

export async function getChildren(_fallback?: Child[]): Promise<Child[]> {
  return apiRequest<Child[]>('/children')
}

export async function getChildrenPage(params: {
  search?: string
  grade?: string
  sortBy?: 'name' | 'age' | 'admissionDate' | 'code'
  sortOrder?: 'asc' | 'desc'
  page: number
  limit?: number
}): Promise<PaginatedChildren> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.grade) qs.set('grade', params.grade)
  if (params.sortBy) qs.set('sortBy', params.sortBy)
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder)
  qs.set('page', String(params.page))
  qs.set('limit', String(params.limit ?? 9))
  return apiRequest<PaginatedChildren>(`/children?${qs.toString()}`)
}

export async function createChild(child: NewChild): Promise<Child> {
  return apiRequest<Child>('/children', {
    method: 'POST',
    body: JSON.stringify(child),
  })
}

export async function updateChild(id: string, updates: Partial<NewChild>): Promise<Child> {
  return apiRequest<Child>(`/children/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function archiveChild(id: string): Promise<{ message: string; id: string }> {
  return apiRequest<{ message: string; id: string }>(`/children/${id}`, {
    method: 'DELETE',
  })
}

export async function getMessages(_fallback?: Message[]): Promise<Message[]> {
  const messages = await apiRequest<Message[]>('/messages')
  return messages.map((message) => ({
    ...message,
    date: message.date.slice(0, 10),
  }))
}

export async function postMessage(payload: {
  from: string
  role: string
  text: string
}): Promise<Message> {
  const created = await apiRequest<Message>('/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return {
    ...created,
    date: created.date.slice(0, 10),
  }
}

export interface EducationOverview {
  monthlyTrend: { month: string; score: number }[]
  attendanceSummary: {
    total: number
    present: number
    late: number
    excused: number
    absent: number
    ratePercent: number
  }
  records: {
    id: string
    childId: string
    grade: string
    subject: string
    score: number
    term: string
    remarks?: string | null
    recordedAt: string
    child?: { id: string; code: string; name: string }
    educator?: { id: string; name: string } | null
  }[]
}

export async function getEducationOverview(childId?: string): Promise<EducationOverview> {
  const query = childId ? `?childId=${encodeURIComponent(childId)}` : ''
  return apiRequest<EducationOverview>(`/education/overview${query}`)
}

export async function createEducationRecord(payload: {
  childId: string
  grade: string
  subject: string
  score: number
  term: string
  remarks?: string
}) {
  return apiRequest('/education/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logAttendance(payload: {
  childId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  date?: string
  remarks?: string
}) {
  return apiRequest('/education/attendance', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface HealthRecordItem {
  id: string
  childId: string
  checkupDate: string
  heightCm?: number | null
  weightKg?: number | null
  immunizationNotes?: string | null
  diagnosisOrNotes: string
  followUpDate?: string | null
  child?: { id: string; code: string; name: string; age: number; healthSummary: string }
  healthcareStaff?: { id: string; name: string } | null
}

export async function getHealthRecords(childId?: string): Promise<HealthRecordItem[]> {
  const query = childId ? `?childId=${encodeURIComponent(childId)}` : ''
  return apiRequest<HealthRecordItem[]>(`/health-records${query}`)
}

export async function createHealthRecord(payload: {
  childId: string
  checkupDate?: string
  heightCm?: number
  weightKg?: number
  immunizationNotes?: string
  diagnosisOrNotes: string
  healthStatusSummary?: 'Good' | 'Fair' | 'Needs Follow-up'
  followUpDate?: string
}): Promise<HealthRecordItem> {
  return apiRequest<HealthRecordItem>('/health-records', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface StockMovementItem {
  id: string
  resourceId: string
  type: 'INCOMING' | 'OUTGOING' | 'ADJUSTMENT'
  quantity: number
  reason: string
  createdAt: string
  performedBy?: { id: string; name: string } | null
}

export interface ResourceItem {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  lowThreshold: number
  isLowStock: boolean
  updatedAt: string
  movements?: StockMovementItem[]
}

export async function getResources(params?: {
  category?: string
  lowStock?: boolean
}): Promise<ResourceItem[]> {
  const search = new URLSearchParams()
  if (params?.category) search.set('category', params.category)
  if (params?.lowStock) search.set('lowStock', 'true')
  const qs = search.toString()
  return apiRequest<ResourceItem[]>(`/resources${qs ? `?${qs}` : ''}`)
}

export async function createResource(payload: {
  name: string
  category: string
  unit?: string
  stock: number
  lowThreshold?: number
}): Promise<ResourceItem> {
  return apiRequest<ResourceItem>('/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function recordStockMovement(
  resourceId: string,
  payload: {
    type: 'INCOMING' | 'OUTGOING' | 'ADJUSTMENT'
    quantity: number
    reason: string
  }
) {
  return apiRequest<{ resource: ResourceItem; movement: StockMovementItem }>(
    `/resources/${resourceId}/movements`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export interface DonorSummaryItem {
  id: string
  name: string
  city?: string | null
  isRecurring: boolean
  donationCount: number
  total: number
}

export interface CampaignItem {
  id: string
  title: string
  description: string
  targetAmount: number
  raisedAmount: number
  progressPercent: number
}

export interface DonorsOverview {
  donors: DonorSummaryItem[]
  campaigns: CampaignItem[]
  myDonations: {
    id: string
    amount: number
    currency: string
    donatedAt: string
    campaign?: { id: string; title: string } | null
  }[]
}

export interface ScholarshipItem {
  id: string
  name: string
  title: string
  provider: string
  amount: number
  eligibility: string
  deadline: string
  awarded: number
  totalApplications: number
  applications: {
    id: string
    status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
    statement?: string | null
    appliedAt: string
    child: { id: string; code: string; name: string }
  }[]
}

export interface MentorItem {
  id: string
  name: string
  specialty: string
  bio?: string | null
  city?: string | null
  _count: { sessions: number }
}

export interface MentorshipSessionItem {
  id: string
  topic: string
  sessionDate: string
  durationMin: number
  notes?: string | null
  mentor: { id: string; name: string; specialty: string }
  child: { id: string; code: string; name: string }
}

export async function getDonorsOverview(): Promise<DonorsOverview> {
  return apiRequest<DonorsOverview>('/donors')
}

export async function createDonation(payload: {
  amount: number
  campaignId?: string
  donorName?: string
  donorEmail?: string
  isAnonymous?: boolean
}) {
  return apiRequest('/donations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getScholarships(): Promise<ScholarshipItem[]> {
  return apiRequest<ScholarshipItem[]>('/scholarships')
}

export async function applyForScholarship(
  scholarshipId: string,
  payload: { childId?: string; statement: string }
) {
  return apiRequest(`/scholarships/${scholarshipId}/apply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function reviewScholarshipApplication(
  applicationId: string,
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
) {
  return apiRequest(`/scholarships/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function getMentorshipOverview(): Promise<{
  mentors: MentorItem[]
  sessions: MentorshipSessionItem[]
}> {
  return apiRequest('/mentors')
}

export async function createMentorshipSession(payload: {
  mentorId: string
  childId: string
  topic: string
  sessionDate: string
  durationMin?: number
  notes?: string
}) {
  return apiRequest('/mentorship/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}