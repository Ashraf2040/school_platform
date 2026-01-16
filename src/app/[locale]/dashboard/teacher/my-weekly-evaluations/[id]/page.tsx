'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import WeeklyReportForm from '@/components/WeeklyReportForm'


export default function EditReport() {
  const params = useParams()

  const reportId = params.id as string



  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <WeeklyReportForm reportId={reportId}  />
    </div>
  )
}
