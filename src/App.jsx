import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import api from './api/axiosConfig'
import { SESSION_EXPIRED_FLAG_KEY } from './constants/auth'
import { useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'

async function requestJobs(filters = {}) {
  const response = await api.get('/jobs', {
    params: {
      q: filters.q || undefined,
      location: filters.location || undefined,
      type: filters.type || undefined,
    },
  })
  return Array.isArray(response.data?.jobs) ? response.data.jobs : []
}

async function submitJobApplication(jobId) {
  const response = await api.post(`/jobs/${jobId}/apply`)
  return response.data
}

async function submitJobData(payload) {
  const response = await api.post('/jobs', payload)
  return response.data
}

async function requestRecruiterApplications() {
  const response = await api.get('/jobs/recruiter/applications')
  return Array.isArray(response.data?.applications) ? response.data.applications : []
}

async function requestMyDashboardMetrics() {
  const response = await api.get('/jobs/my/metrics')
  return response.data?.metrics || { appliedJobs: 0, savedJobs: null, profileCompletion: 0 }
}

async function requestAdminApplications(filters = {}) {
  const response = await api.get('/admin/applications', {
    params: {
      status: filters.status || undefined,
      q: filters.q || undefined,
    },
  })
  return Array.isArray(response.data?.applications) ? response.data.applications : []
}

async function requestAdminDashboardSummary() {
  const response = await api.get('/admin/dashboard')
  return response.data
}

async function updateAdminApplicationStatus(applicationId, status) {
  const response = await api.patch(`/admin/applications/${applicationId}/status`, { status })
  return response.data
}

function formatDateTime(value) {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return date.toLocaleString()
}

function getPostLoginRoute(role) {
  if (role === 'admin') {
    return '/admin'
  }

  if (role === 'employer') {
    return '/post-job'
  }

  return '/'
}

async function requestProfile(userId) {
  try {
    const response = await api.get(`/profiles/${userId}`)
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    throw new Error(error.response?.data?.message || 'Failed to load profile data.')
  }
}

async function saveProfile(userId, payload) {
  const response = await api.post(`/profiles/${userId}`, payload)
  return response.data
}

function ProtectedRoute({ children }) {
  const { token, authLoading } = useAuth()

  if (authLoading) {
    return <div className="p-8 text-center text-slate-600">Loading authentication state...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AdminRoute({ children }) {
  const { token, user, authLoading } = useAuth()

  if (authLoading) {
    return <div className="p-8 text-center text-slate-600">Loading authentication state...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

function RecruiterRoute({ children }) {
  const { token, user, authLoading } = useAuth()

  if (authLoading) {
    return <div className="p-8 text-center text-slate-600">Loading authentication state...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'employer') {
    return <Navigate to="/" replace />
  }

  return children
}

function AppShell({ title, subtitle, children }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, setIsDark, bgClass, cardClass, headerClass, textClass, subTextClass } = useTheme()

  return (
    <main className={`min-h-screen ${bgClass} p-4 md:p-8 transition-colors duration-300`}>
      <div className={`mx-auto max-w-7xl rounded-3xl border ${cardClass} p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)] md:p-6 transition-colors duration-300`}>
        <header className={`rounded-3xl border ${headerClass} p-4 md:p-5 transition-colors duration-300`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={`text-2xl font-bold ${textClass}`}>💼 Online Job Portal</p>
              <p className={`text-sm ${subTextClass}`}>Smart opportunities for candidates and recruiters</p>
            </div>

            <nav className="flex flex-wrap gap-2">
              <NavLink to="/" end className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-emerald-500 text-white shadow-lg' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                📊 Dashboard
              </NavLink>
              <NavLink to="/jobs" className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-emerald-500 text-white shadow-lg' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                💼 Jobs
              </NavLink>
              {user?.role === 'employer' && (
                <NavLink to="/post-job" className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-blue-500 text-white shadow-lg' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                  ➕ Post Job
                </NavLink>
              )}
              {user?.role === 'employer' && (
                <NavLink to="/recruiter/applications" className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-indigo-500 text-white shadow-lg' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                  👥 Applicants
                </NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-purple-500 text-white shadow-lg' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                  ⚙️ Admin
                </NavLink>
              )}
              <NavLink to="/profile" className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-emerald-500 text-white shadow-lg' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                👤 Profile
              </NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <span className={`text-sm ${subTextClass}`}>Hi, {user?.name || 'User'}</span>
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${isDark ? 'bg-slate-700 text-yellow-300' : 'bg-slate-100 text-slate-800'}`}
                title="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6">
          <h1 className={`text-4xl font-bold ${textClass}`}>{title}</h1>
          <p className={`mt-2 ${subTextClass}`}>{subtitle}</p>
        </section>

        {children}
      </div>
    </main>
  )
}

function DashboardPage() {
  const [metrics, setMetrics] = useState({ appliedJobs: 0, savedJobs: null, profileCompletion: 0 })
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadMetrics() {
      try {
        const nextMetrics = await requestMyDashboardMetrics()
        if (!ignore) {
          setMetrics(nextMetrics)
        }
      } catch {
        if (!ignore) {
          toast.error('Failed to load dashboard metrics.')
        }
      } finally {
        if (!ignore) {
          setLoadingMetrics(false)
        }
      }
    }

    loadMetrics()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <AppShell title="Dashboard" subtitle="Track your applications, saved jobs, and profile progress.">
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Applied Jobs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loadingMetrics ? '...' : metrics.appliedJobs}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Saved Jobs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loadingMetrics ? '...' : metrics.savedJobs ?? 'N/A'}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Profile Completion</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loadingMetrics ? '...' : `${metrics.profileCompletion}%`}</p>
        </article>
      </section>
    </AppShell>
  )
}

function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [applyingId, setApplyingId] = useState(null)
  const [filters, setFilters] = useState({ q: '', location: '', type: '' })

  const loadJobs = async (nextFilters = filters) => {
    try {
      setIsLoading(true)
      const data = await requestJobs(nextFilters)
      setJobs(data)
    } catch {
      toast.error('Failed to load jobs.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const handleApply = async (jobId) => {
    if (user?.role !== 'job_seeker') {
      toast.error('Only candidates can apply for jobs.')
      return
    }

    try {
      setApplyingId(jobId)
      await submitJobApplication(jobId)
      toast.success('Application submitted successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application.')
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <AppShell title="Find Jobs" subtitle="Filter and apply to jobs that match your skills.">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          loadJobs(filters)
        }}
        className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.4fr_1fr_0.8fr_auto_auto]"
      >
        <input
          className="rounded-xl border border-slate-300 px-3 py-2.5"
          placeholder="Keyword"
          value={filters.q}
          onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2.5"
          placeholder="Location"
          value={filters.location}
          onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
        />
        <select
          className="rounded-xl border border-slate-300 px-3 py-2.5"
          value={filters.type}
          onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
        >
          <option value="">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Remote">Remote</option>
        </select>
        <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white">Filter</button>
        <button
          type="button"
          onClick={() => {
            const cleared = { q: '', location: '', type: '' }
            setFilters(cleared)
            loadJobs(cleared)
          }}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          Reset
        </button>
      </form>

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600">Loading jobs...</div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{job.type}</span>
                <span className="text-xs text-slate-500">#{job.id}</span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{job.title}</h3>
              <p className="text-sm text-slate-600">{job.company}</p>
              <p className="mt-3 text-sm text-slate-600">{job.description}</p>
              <p className="mt-3 text-sm"><span className="font-semibold">Location:</span> {job.location}</p>
              <p className="text-sm"><span className="font-semibold">Salary:</span> {job.salary}</p>
              <button
                type="button"
                onClick={() => handleApply(job.id)}
                disabled={applyingId === job.id || user?.role !== 'job_seeker'}
                className="mt-4 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {applyingId === job.id ? 'Submitting...' : user?.role === 'job_seeker' ? 'Apply' : 'Candidates Only'}
              </button>
            </article>
          ))}
        </div>
      )}

      {!isLoading && jobs.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          No jobs found.
        </div>
      )}
    </AppShell>
  )
}

function PostJobPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    type: 'Full-time',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.title || !form.company || !form.location || !form.salary || !form.type || !form.description) {
      toast.error('All fields are required.')
      return
    }

    try {
      setSubmitting(true)
      await submitJobData(form)
      toast.success('Job posted successfully!')
      navigate('/jobs')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post job.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="Post a New Job" subtitle="Create a job listing and receive applications.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Job title" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} />
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Company" value={form.company} onChange={(e) => setForm((c) => ({ ...c, company: e.target.value }))} />
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Location" value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} />
        <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Salary" value={form.salary} onChange={(e) => setForm((c) => ({ ...c, salary: e.target.value }))} />
        <select className="w-full rounded-xl border border-slate-300 px-3 py-2.5" value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Remote">Remote</option>
        </select>
        <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2.5" rows={5} placeholder="Job description" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70">
            {submitting ? 'Posting...' : 'Post Job'}
          </button>
          <button type="button" onClick={() => navigate('/jobs')} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </AppShell>
  )
}

function RecruiterApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadApplications() {
      try {
        const data = await requestRecruiterApplications()
        if (!ignore) {
          setApplications(data)
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error.response?.data?.message || 'Failed to load applicants.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadApplications()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <AppShell title="Applicants" subtitle="Candidates who applied to your posted jobs.">
      {loading ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600">Loading applicants...</div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Details</th>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Applied</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.applicant_name}</td>
                  <td className="px-3 py-3">{item.applicant_email}</td>
                  <td className="px-3 py-3">
                    <div className="space-y-1 text-xs text-slate-600">
                      {item.applicant_profile_name && item.applicant_profile_name !== item.applicant_account_name ? (
                        <p><span className="font-semibold">Profile Name:</span> {item.applicant_profile_name}</p>
                      ) : null}
                      {item.applicant_profile_email && item.applicant_profile_email !== item.applicant_account_email ? (
                        <p><span className="font-semibold">Profile Email:</span> {item.applicant_profile_email}</p>
                      ) : null}
                      <p><span className="font-semibold">Phone:</span> {item.applicant_phone || 'N/A'}</p>
                      <p><span className="font-semibold">Location:</span> {item.applicant_location || 'N/A'}</p>
                      <p><span className="font-semibold">Profile:</span> {Number(item.applicant_profile_completion || 0)}%</p>
                      <p><span className="font-semibold">Education:</span> {item.applicant_education || 'N/A'}</p>
                      <p><span className="font-semibold">Skills:</span> {item.applicant_skills || 'N/A'}</p>
                      <p><span className="font-semibold">Experience:</span> {item.applicant_experience || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">{item.job_title}</td>
                  <td className="px-3 py-3">{item.job_company}</td>
                  <td className="px-3 py-3">{formatDateTime(item.applied_at)}</td>
                  <td className="px-3 py-3">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {applications.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">No applicants yet for your posted jobs.</p>
          )}
        </div>
      )}
    </AppShell>
  )
}

function AdminPanelPage() {
  const statusOptions = ['All', 'Pending', 'Reviewed', 'Shortlisted', 'Rejected']
  const [applications, setApplications] = useState([])
  const [summary, setSummary] = useState({
    summary: { users: 0, jobs: 0, applications: 0, recentApplications: 0 },
    statusBreakdown: { Pending: 0, Reviewed: 0, Shortlisted: 0, Rejected: 0 },
    topJobs: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [filterForm, setFilterForm] = useState({ q: '', status: 'All' })
  const [filters, setFilters] = useState({ q: '', status: 'All' })

  const loadData = async ({ silent = false, appliedFilters = filters } = {}) => {
    try {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const [applicationsData, summaryData] = await Promise.all([
        requestAdminApplications({
          status: appliedFilters.status === 'All' ? '' : appliedFilters.status,
          q: appliedFilters.q,
        }),
        requestAdminDashboardSummary(),
      ])

      setApplications(applicationsData)
      setSummary(summaryData)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load admin data.')
    } finally {
      if (silent) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    let ignore = false

    if (!ignore) {
      loadData({ appliedFilters: filters })
    }

    return () => {
      ignore = true
    }
  }, [filters])

  const updateStatus = async (id, status) => {
    try {
      setStatusUpdatingId(id)
      await updateAdminApplicationStatus(id, status)
      setApplications((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
      const nextSummary = await requestAdminDashboardSummary()
      setSummary(nextSummary)
      toast.success('Status updated.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status.')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const getStatusPillClass = (status) => {
    if (status === 'Reviewed') {
      return 'bg-sky-100 text-sky-700'
    }

    if (status === 'Shortlisted') {
      return 'bg-emerald-100 text-emerald-700'
    }

    if (status === 'Rejected') {
      return 'bg-rose-100 text-rose-700'
    }

    return 'bg-amber-100 text-amber-700'
  }

  return (
    <AppShell title="Admin Panel" subtitle="Review applications and manage statuses.">
      <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
            placeholder="Applicant, email, job title, company"
            value={filterForm.q}
            onChange={(event) => setFilterForm((current) => ({ ...current, q: event.target.value }))}
          />
        </div>

        <div className="w-full lg:w-56">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
            value={filterForm.status}
            onChange={(event) => setFilterForm((current) => ({ ...current, status: event.target.value }))}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilters({ ...filterForm, q: filterForm.q.trim() })}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              const cleared = { q: '', status: 'All' }
              setFilterForm(cleared)
              setFilters(cleared)
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => loadData({ silent: true, appliedFilters: filters })}
            disabled={refreshing}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-70"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Users</p><p className="text-2xl font-bold">{summary.summary.users}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Jobs</p><p className="text-2xl font-bold">{summary.summary.jobs}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Applications</p><p className="text-2xl font-bold">{summary.summary.applications}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Last 7 Days</p><p className="text-2xl font-bold">{summary.summary.recentApplications}</p></article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">Application Status Breakdown</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(summary.statusBreakdown).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm text-slate-500">{status}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">Top Jobs by Applications</p>
          <div className="mt-3 space-y-2">
            {summary.topJobs.length === 0 ? (
              <p className="text-sm text-slate-500">No application activity yet.</p>
            ) : (
              summary.topJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">{job.title}</p>
                  <p className="text-sm text-slate-500">{job.company}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">{job.applicationsCount} applications</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600">Loading applications...</div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Applied</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.applicant_name}</td>
                  <td className="px-3 py-3">{item.applicant_email}</td>
                  <td className="px-3 py-3">{item.job_title}</td>
                  <td className="px-3 py-3">{item.job_company}</td>
                  <td className="px-3 py-3">{formatDateTime(item.applied_at)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusPillClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, 'Reviewed')}
                        disabled={statusUpdatingId === item.id || item.status === 'Reviewed'}
                        className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 disabled:opacity-50"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, 'Shortlisted')}
                        disabled={statusUpdatingId === item.id || item.status === 'Shortlisted'}
                        className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                      >
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, 'Rejected')}
                        disabled={statusUpdatingId === item.id || item.status === 'Rejected'}
                        className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {applications.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">No applications found for the selected filters.</p>
          )}
        </div>
      )}
    </AppShell>
  )
}

function ProfilePage() {
  const { user } = useAuth()
  const userId = Number(user?.id || 0)
  const [profile, setProfile] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    educationText: '',
    skillsText: '',
    experienceText: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadData() {
      if (!userId) {
        if (!ignore) {
          setLoading(false)
        }
        return
      }

      try {
        const data = await requestProfile(userId)
        if (data && !ignore) {
          setProfile({
            fullName: data.fullName || user?.name || '',
            email: data.email || user?.email || '',
            phone: data.phone || '',
            location: data.location || '',
            educationText: Array.isArray(data.education)
              ? data.education
                .map((item) => `${item.degree || ''} | ${item.institute || ''} | ${item.year || ''}`.trim())
                .filter(Boolean)
                .join('\n')
              : '',
            skillsText: Array.isArray(data.skills) ? data.skills.join(', ') : '',
            experienceText: Array.isArray(data.experience)
              ? data.experience
                .map((item) => `${item.role || ''} | ${item.company || ''} | ${item.period || ''}`.trim())
                .filter(Boolean)
                .join('\n')
              : '',
          })
        } else if (!ignore) {
          setProfile((current) => ({
            ...current,
            fullName: user?.name || current.fullName,
            email: user?.email || current.email,
          }))
        }
      } catch {
        if (!ignore) {
          toast.error('Failed to load profile data.')
          setProfile((current) => ({
            ...current,
            fullName: user?.name || current.fullName,
            email: user?.email || current.email,
          }))
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [userId, user?.name, user?.email])

  const handleSave = async () => {
    if (!profile.fullName || !profile.email || !profile.phone || !profile.location) {
      toast.error('Please complete all required profile fields.')
      return
    }

    const education = profile.educationText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [degree = '', institute = '', year = ''] = line.split('|').map((part) => part.trim())
        return { degree, institute, year }
      })
      .filter((item) => item.degree && item.institute && item.year)

    const skills = profile.skillsText
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    const experience = profile.experienceText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [role = '', company = '', period = ''] = line.split('|').map((part) => part.trim())
        return { role, company, period }
      })
      .filter((item) => item.role && item.company && item.period)

    if (education.length === 0 || skills.length === 0 || experience.length === 0) {
      toast.error('Please provide education, skills, and experience details.')
      return
    }

    try {
      setSaving(true)
      const completedFields = [profile.fullName, profile.email, profile.phone, profile.location, education.length, skills.length, experience.length].filter(Boolean).length
      await saveProfile(userId, {
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        resumeFile: null,
        profileCompletion: Math.round((completedFields / 7) * 100),
        education,
        skills,
        experience,
      })
      toast.success('Profile saved successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="My Profile" subtitle="Update your personal and professional profile details.">
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        {loading ? (
          <p className="text-slate-600">Loading profile data...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Full Name" value={profile.fullName} onChange={(e) => setProfile((c) => ({ ...c, fullName: e.target.value }))} />
            <input className="rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Email" value={profile.email} onChange={(e) => setProfile((c) => ({ ...c, email: e.target.value }))} />
            <input className="rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Phone" value={profile.phone} onChange={(e) => setProfile((c) => ({ ...c, phone: e.target.value }))} />
            <input className="rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Location" value={profile.location} onChange={(e) => setProfile((c) => ({ ...c, location: e.target.value }))} />
            <textarea
              className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2.5"
              rows={4}
              placeholder="Education (one per line): Degree | Institute | Year"
              value={profile.educationText}
              onChange={(e) => setProfile((c) => ({ ...c, educationText: e.target.value }))}
            />
            <textarea
              className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2.5"
              rows={3}
              placeholder="Skills (comma separated): React, Node.js, MySQL"
              value={profile.skillsText}
              onChange={(e) => setProfile((c) => ({ ...c, skillsText: e.target.value }))}
            />
            <textarea
              className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2.5"
              rows={4}
              placeholder="Experience (one per line): Role | Company | Duration"
              value={profile.experienceText}
              onChange={(e) => setProfile((c) => ({ ...c, experienceText: e.target.value }))}
            />
          </div>
        )}

        <button type="button" disabled={saving || loading} onClick={handleSave} className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </section>
    </AppShell>
  )
}

function AuthPage({ mode }) {
  const navigate = useNavigate()
  const { token, login, register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', loginRole: 'job_seeker', registerRole: 'job_seeker' })
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (mode !== 'login') {
      return
    }

    const expired = window.sessionStorage.getItem(SESSION_EXPIRED_FLAG_KEY) === 'true'
    if (expired) {
      toast.error('Your session expired. Please log in again.')
      window.sessionStorage.removeItem(SESSION_EXPIRED_FLAG_KEY)
    }
  }, [mode])

  if (token) {
    return <Navigate to="/" replace />
  }

  const title = mode === 'register' ? 'Create Account' : 'Login'

  function getRequestErrorMessage(error, fallbackMessage) {
    if (!error?.response) {
      return 'Server connection failed. Start backend server and MySQL, then try again.'
    }

    return error?.response?.data?.message || error?.message || fallbackMessage
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim().toLowerCase()

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setFeedback('Password and confirm password do not match.')
      return
    }

    if (mode === 'register' && !trimmedName) 
      {
      setFeedback('Full name is required.')
      return
    }

    if (!trimmedEmail) {
      setFeedback('Email is required.')
      return
    }

    if (!form.password) {
      setFeedback('Password is required.')
      return
    }

    try {
      setSubmitting(true)
      if (mode === 'register') {
        await register({
          name: trimmedName,
          email: trimmedEmail,
          password: form.password,
          role: form.registerRole,
        })
        navigate('/login')
      } else {
        const data = await login({
          email: trimmedEmail,
          password: form.password,
          role: form.loginRole,
        })
        navigate(getPostLoginRoute(data?.user?.role), { replace: true })
      }
    } catch (error) {
      setFeedback(getRequestErrorMessage(error, 'Request failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff6f3_0,#eff7fb_32%,#f7fbff_62%,#ffffff_100%)] px-4 py-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Access Portal</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{title}</h1>

        <div className="mt-5 flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1.5">
          <Link to="/login" className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Login</Link>
          <Link to="/register" className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Register</Link>
        </div>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Full Name" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
          )}
          {mode === 'register' && (
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              value={form.registerRole}
              onChange={(e) => setForm((c) => ({ ...c, registerRole: e.target.value }))}
            >
              <option value="job_seeker">Register as Candidate</option>
              <option value="employer">Register as Recruiter</option>
            </select>
          )}
          {mode === 'login' && (
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              value={form.loginRole}
              onChange={(e) => setForm((c) => ({ ...c, loginRole: e.target.value }))}
            >
              <option value="job_seeker">Candidate</option>
              <option value="employer">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} />
          {mode === 'register' && (
            <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={(e) => setForm((c) => ({ ...c, confirmPassword: e.target.value }))} />
          )}
          {feedback && <p className="text-sm text-rose-600">{feedback}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70">
            {submitting ? 'Submitting...' : mode === 'register' ? 'Register' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function App() {
  const routes = useMemo(
    () => (
      <Routes>
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
        <Route path="/post-job" element={<RecruiterRoute><PostJobPage /></RecruiterRoute>} />
        <Route path="/recruiter/applications" element={<RecruiterRoute><RecruiterApplicationsPage /></RecruiterRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanelPage /></AdminRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    ),
    [],
  )

  return <ThemeProvider>{routes}</ThemeProvider>
}
