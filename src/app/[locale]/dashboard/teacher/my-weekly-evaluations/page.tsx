

'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WeeklyReport {
  id: string
  weekStart: string
  weekEnd: string
  teacherData: any
  createdAt: string
}

export default function TeacherReports() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ dateFrom: '', dateTo: '', classId: '' })
  const [classes, setClasses] = useState<{id: string, name: string}[]>([])

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      router.push('/dashboard/teacher')
      return
    }
    fetchReports()
    fetchClasses()
  }, [session, status, router])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom)
      if (filter.dateTo) params.append('dateTo', filter.dateTo)
      if (filter.classId) params.append('classId', filter.classId)
      
      // ✅ FIXED: Correct API endpoint
      const url = `/api/teacher-reports?${params.toString()}`
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`)
      }
      
      const result = await res.json()
      setReports(result.data || [])
    } catch (error) {
      console.error('Fetch reports error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const url = `/api/users/${session?.user?.id}/classes`
      const res = await fetch(url)
      
      if (!res.ok) return
      
      const data = await res.json()
      setClasses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fetch classes error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-slate-600">Loading reports...</div>
      </div>
    )
  }

  const formatDate = (dateStr: string, format: 'short' | 'full' = 'short') => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Invalid Date'
    
    if (format === 'short') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ✅ NEW: Helper function to find class name by ID
  const getClassName = (id: string | undefined) => {
    if (!id) return 'N/A';
    const foundClass = classes.find(c => c.id === id);
    return foundClass ? foundClass.name : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
      <div className='flex items-center justify-between'>
          <h1 className="text-3xl font-bold text-slate-900 mb-8">My Weekly Reports ({reports.length})</h1> 
        
        <Link href="/dashboard/teacher/weekly-achievement" className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-xl">
      Create New Report
        </Link>
      </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => {
                setFilter({ ...filter, dateFrom: e.target.value })
                setTimeout(fetchReports, 500)
              }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => {
                setFilter({ ...filter, dateTo: e.target.value })
                setTimeout(fetchReports, 500)
              }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={filter.classId}
              onChange={(e) => {
                setFilter({ ...filter, classId: e.target.value })
                setTimeout(fetchReports, 500)
              }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Classes ({classes.length})</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchReports}
            className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-xl hover:bg-teal-700 transition"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                <tr>
                  <th className="p-4 text-left font-semibold">Week</th>
                  <th className="p-4 text-left font-semibold">Class</th>
                  <th className="p-4 text-left font-semibold">Created</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div>
                        {formatDate(report.weekStart)} - {formatDate(report.weekEnd || report.weekStart)}
                      </div>
                      <div className="text-sm text-slate-500">
                        Week {(report.teacherData as any)?.week || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      {/* ✅ UPDATED: Use helper function to show Name instead of ID */}
                      {getClassName((report.teacherData as any)?.classId)}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {formatDate(report.createdAt, 'full')}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => router.push(`/dashboard/teacher/my-weekly-evaluations/${report.id}`)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition"
                      >
                         Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">
                      No reports found. <br />
                      <small>User ID: {session?.user?.id}</small>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
