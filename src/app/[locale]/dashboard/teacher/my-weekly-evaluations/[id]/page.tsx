'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const WeeklyReportForm = dynamic(() => import('@/components/WeeklyReportForm'), { ssr: false })

export default function EditReport() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string



  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <WeeklyReportForm reportId={reportId} onSuccess={() => router.push('/dashboard/teacher/reports')} />
    </div>
  )
}
