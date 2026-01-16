
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'

import { weeklyReportSchema, type WeeklyReportInput } from '@/lib/validations/weeklyReport.schema'

interface WeeklyReport {
  id: string
  weekStart: string
  weekEnd?: string
  teacherData: any
  createdAt: string
}

interface WeeklyReportFormProps {
  reportId?: string
  onSuccess?: () => void
}

export default function WeeklyReportForm({ reportId, onSuccess }: WeeklyReportFormProps) {
  const t = useTranslations('WeeklyAchievement')
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [teacherName, setTeacherName] = useState('')
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // NEW: State to handle fetch errors visually instead of redirecting
  const [fetchError, setFetchError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<WeeklyReportInput>({
    resolver: zodResolver(weeklyReportSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      week: 'W1',
      classId: '',
      weekFrom: '',
      weekTo: '',
      preparedLessonPlans: false,
      usedVariedMethods: false,
      studentsEngaged: false,
      maintainedPositiveEnvironment: false,
      providedClearFeedback: false,
      usedDigitalPlatform: false,
      monitoredAssignments: false,
      teachingMethods: [],
      gradesTaught: [],
      environmentCommentsType: [],
      feedbackQuality: [],
      atRiskStudentsReasons: [],
      highPerformingStudentsReasons: [],
      issues: [],
      teacherSignature: '',
      signatureDate: new Date().toISOString().split('T')[0],
      // Add other optional fields if necessary
      teachingMethodDescription: '',
      teacherComment: '',
      studentsNeedingHelp: '',
      aiTutorComment: '',
      readingProgressComment: '',
      exactPathComment: '',
      atRiskStudentsNames: '',
      highPerformingStudentsNames: '',
      mainChallenge: '',
      supportNeeded: '',
    },
  })

  useEffect(() => {
    if (session?.user?.name) setTeacherName(session.user.name)
  }, [session])

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) return

    fetchClasses()
    if (reportId) {
      fetchReport()
    }
  }, [session, status, reportId])

  const fetchClasses = async () => {
    try {
      const res = await fetch(`/api/users/${session?.user?.id}/classes`)
      const data = await res.json()
      setClasses(data)
    } catch (error) {
      toast.error(t('fetchClassesError') || 'Failed to load classes')
    }
  }

  const fetchReport = async () => {
    setReportLoading(true)
    setFetchError(null) // Reset error state
    
    try {
      const res = await fetch(`/api/weekly-reports/${reportId}`)
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Server Error (${res.status}): ${errorText}`)
      }

      const json = await res.json()
      // Handle APIs that return { data: ... } or just the object directly
      const data = json.data || json

      if (!data) {
        throw new Error("No report data received from server.")
      }

      setReport(data)
      setIsEditMode(true)

      // SAFETY CHECK: Ensure teacherData exists before looping
      const td = data.teacherData || {}
      
      if (typeof td === 'object' && td !== null) {
        Object.entries(td).forEach(([key, value]) => {
          setValue(key as keyof WeeklyReportInput, value)
        })
      } else {
        console.warn("Report loaded, but teacherData was invalid.")
      }

      setValue('weekFrom', format(new Date(data.weekStart), 'yyyy-MM-dd'))
      setValue('weekTo', format(new Date(data.weekEnd || data.weekStart), 'yyyy-MM-dd'))
      
    } catch (error: any) {
      console.error("Failed to fetch report:", error)
      setFetchError(error.message || "Failed to load report. The report might have been moved or deleted.")
      toast.error(error.message || "Failed to load report")
    } finally {
      setReportLoading(false)
    }
  }

  // UPDATED: Curried function to match the creation code style for easier integration
  const handleCheckboxArray = (
    field:
      | "teachingMethods"
      | "gradesTaught"
      | "environmentCommentsType"
      | "feedbackQuality"
      | "atRiskStudentsReasons"
      | "highPerformingStudentsReasons"
      | "issues",
    value: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const current = watch(field);
    setValue(
      field,
      e.target.checked
        ? [...current, value]
        : current.filter((item) => item !== value)
    );
  };

    const onSubmit = async (data: WeeklyReportInput) => {
    setLoading(true)
    const formData = new FormData()
    
    // 1. Append all form data
    Object.entries(data).forEach(([key, value]) => {
      // Handle Arrays (checkboxes)
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v as string))
      } 
      // Handle Files and Strings
      else if (value !== undefined && value !== null) {
        // React Hook Form handles File objects natively, so this works
        formData.append(key, value as any)
      }
    })

    // 2. Determine URL dynamically based on mode
    // The backend PUT handler is at /api/weekly-reports/[id]
    const url = reportId 
      ? `/api/weekly-reports/${reportId}` 
      : '/api/weekly-reports';

    try {
      const method = reportId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.message || 'Submission failed')
        return
      }

      toast.success(isEditMode ? 'Report updated successfully' : t('successToast'))
      onSuccess?.() || router.push('/dashboard/teacher')
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const tt = (key: string): string[] => {
    const result = t.raw(key as any)
    if (!Array.isArray(result)) {
      console.warn(`Expected array for translation key ${key}, got`, result)
      return []
    }
    return result
  }

  const isArabic = t('title').includes('أ')

  if (reportLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading report...</div>
      </div>
    )
  }

  // NEW: Error Display UI
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Report</h2>
          <p className="text-slate-500 mb-6">{fetchError}</p>
          <button
            onClick={() => router.push('/dashboard/teacher/reports')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-slate-800 hover:bg-slate-900 transition shadow-lg"
          >
            Back to Reports List
          </button>
        </div>
      </div>
    )
  }

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full mx-auto font-semibold">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            {isEditMode ? 'Edit Weekly Report' : t('title')}
          </h1>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-sky-400" />
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-12">
            {/* Basic Info Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                    1
                  </span>
                  {t('basicInfo')}
                </h2>
                <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-teal-50 text-teal-700">
                  {t('requiredSection') ?? ''}
                </span>
              </div>

              {/* Teacher Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('teacherName')}</label>
                <div className="px-4 py-3 bg-slate-50 rounded-xl text-base text-slate-900 border border-slate-200 flex items-center justify-between">
                  <span>{teacherName}</span>
                  <span className="text-xs text-slate-400">{t('autoFilled') ?? ''}</span>
                </div>
              </div>

              {/* Date, Class, Week */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('dateLabel')}</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                  {errors.date && (
                    <p className="text-red-600 text-xs mt-1">{errors.date.message as string || t('dateRequired')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('selectClass')}</label>
                  <select
                    {...register('classId')}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  >
                    <option value="">{t('selectClassPlaceholder')}</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  {errors.classId && (
                    <p className="text-red-600 text-xs mt-1">{t('classRequired')}</p>
                  )}
                </div>
              </div>

              {/* Week From-To */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('weekFrom')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('weekFrom')}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                  {errors.weekFrom && (
                    <p className="text-red-600 text-xs mt-1">{errors.weekFrom.message as string}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('weekTo')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('weekTo')}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                  {errors.weekTo && (
                    <p className="text-red-600 text-xs mt-1">{errors.weekTo.message as string}</p>
                  )}
                </div>
              </div>
            </section>

            <div className="border-t border-dashed border-slate-200" />

            {/* Classroom Performance Section */}
            <section className="space-y-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                  2
                </span>
                {t('classroomPerformance')}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('preparedLessonPlans')}
                      className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{t('preparedLessonPlans')}</span>
                  </label>
                  {errors.preparedLessonPlans && (
                    <p className="text-red-600 text-xs mt-1">{errors.preparedLessonPlans.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('lessonPlanEvidence')}
                  </label>
                  <input
                    type="file"
                    {...register('lessonPlanDocument')}
                    className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 cursor-pointer"
                  />
                  {errors.lessonPlanDocument?.message && (
                    <p className="text-red-600 text-xs mt-1">
                      {String(errors.lessonPlanDocument.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('usedVariedMethods')}
                      className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{t('usedVariedMethods')}</span>
                  </label>
                  {errors.usedVariedMethods && (
                    <p className="text-red-600 text-xs mt-1">{errors.usedVariedMethods.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {t('teachingMethodsLabel')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tt('teachingMethods').map((method) => (
                      <label
                        key={method}
                        className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={watch('teachingMethods').includes(method)}
                          onChange={handleCheckboxArray('teachingMethods', method)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span className="truncate">{method}</span>
                      </label>
                    ))}
                  </div>
                  {errors.teachingMethods && (
                    <p className="text-red-600 text-xs mt-1">{errors.teachingMethods.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('teachingDescription')}
                  </label>
                  <textarea
                    {...register('teachingMethodDescription')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.teachingMethodDescription && (
                    <p className="text-red-600 text-xs mt-1">{errors.teachingMethodDescription.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('studentsEngaged')}
                      className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{t('studentsEngaged')}</span>
                  </label>
                  {errors.studentsEngaged && (
                    <p className="text-red-600 text-xs mt-1">{errors.studentsEngaged.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('studentWorkEvidence')}
                  </label>
                  <input
                    type="file"
                    {...register('studentWorkSample')}
                    className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('maintainedPositiveEnvironment')}
                      className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{t('positiveEnvironment')}</span>
                  </label>
                  {errors.maintainedPositiveEnvironment && (
                    <p className="text-red-600 text-xs mt-1">{errors.maintainedPositiveEnvironment.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {t('environmentTypesLabel')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tt('environmentTypes').map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={watch('environmentCommentsType').includes(type)}
                          onChange={handleCheckboxArray('environmentCommentsType', type)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span className="truncate">{type}</span>
                      </label>
                    ))}
                  </div>
                  {errors.environmentCommentsType && (
                    <p className="text-red-600 text-xs mt-1">{errors.environmentCommentsType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('teacherComment')}
                  </label>
                  <textarea
                    {...register('teacherComment')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.teacherComment && (
                    <p className="text-red-600 text-xs mt-1">{errors.teacherComment.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('providedClearFeedback')}
                      className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{t('clearFeedback')}</span>
                  </label>
                  {errors.providedClearFeedback && (
                    <p className="text-red-600 text-xs mt-1">{errors.providedClearFeedback.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {t('feedbackQualityLabel')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tt('feedbackQuality').map((quality) => (
                      <label
                        key={quality}
                        className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={watch('feedbackQuality').includes(quality)}
                          onChange={handleCheckboxArray('feedbackQuality', quality)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span className="truncate">{quality}</span>
                      </label>
                    ))}
                  </div>
                  {errors.feedbackQuality && (
                    <p className="text-red-600 text-xs mt-1">{errors.feedbackQuality.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('studentsNeedingHelp')}
                  </label>
                  <textarea
                    {...register('studentsNeedingHelp')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.studentsNeedingHelp && (
                    <p className="text-red-600 text-xs mt-1">{errors.studentsNeedingHelp.message}</p>
                  )}
                </div>
              </div>
            </section>

            <div className="border-t border-dashed border-slate-200" />

            {/* Digital Platform Section */}
            <section className="space-y-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                  3
                </span>
                {t('digitalPlatform')}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {t('platformLevelLabel')}
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition cursor-pointer">
                      <input
                        type="radio"
                        value="IXL"
                        {...register('platformLevel')}
                        className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                      />
                      <span>{t('ixl')}</span>
                    </label>
                    <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition cursor-pointer">
                      <input
                        type="radio"
                        value="Apex Learning"
                        {...register('platformLevel')}
                        className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                      />
                      <span>{t('apex')}</span>
                    </label>
                  </div>
                  {errors.platformLevel && (
                    <p className="text-red-600 text-xs mt-1">{errors.platformLevel.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('usedDigitalPlatform')}
                      className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{t('usedPlatform')}</span>
                  </label>
                  {errors.usedDigitalPlatform && (
                    <p className="text-red-600 text-xs mt-1">{errors.usedDigitalPlatform.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('gradesScreenshot')}
                  </label>
                  <input
                    type="file"
                    {...register('gradesBookScreenshot')}
                    className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('monitoredAssignments')}
                      className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>{t('monitoredAssignments')}</span>
                  </label>
                  {errors.monitoredAssignments && (
                    <p className="text-red-600 text-xs mt-1">{errors.monitoredAssignments.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('assignmentsScreenshot')}
                  </label>
                  <input
                    type="file"
                    {...register('assignmentsScreenshot')}
                    className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('aiTutor')}
                  </label>
                  <textarea
                    {...register('aiTutorComment')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.aiTutorComment && (
                    <p className="text-red-600 text-xs mt-1">{errors.aiTutorComment.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('readingProgress')}
                  </label>
                  <textarea
                    {...register('readingProgressComment')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.readingProgressComment && (
                    <p className="text-red-600 text-xs mt-1">{errors.readingProgressComment.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('exactPath')}
                  </label>
                  <textarea
                    {...register('exactPathComment')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.exactPathComment && (
                    <p className="text-red-600 text-xs mt-1">{errors.exactPathComment.message}</p>
                  )}
                </div>
              </div>
            </section>

            <div className="border-t border-dashed border-slate-200" />

            {/* Student Monitoring Section */}
            <section className="space-y-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                  4
                </span>
                {t('studentMonitoring')}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {t('atRiskReasonsLabel')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tt('atRiskReasons').map((reason) => (
                      <label
                        key={reason}
                        className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={watch('atRiskStudentsReasons').includes(reason)}
                          onChange={handleCheckboxArray('atRiskStudentsReasons', reason)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span className="truncate">{reason}</span>
                      </label>
                    ))}
                  </div>
                  {errors.atRiskStudentsReasons && (
                    <p className="text-red-600 text-xs mt-1">{errors.atRiskStudentsReasons.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('atRiskNames')}
                  </label>
                  <textarea
                    {...register('atRiskStudentsNames')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.atRiskStudentsNames && (
                    <p className="text-red-600 text-xs mt-1">{errors.atRiskStudentsNames.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {t('highPerformReasonsLabel')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tt('highPerformReasons').map((reason) => (
                      <label
                        key={reason}
                        className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={watch('highPerformingStudentsReasons').includes(reason)}
                          onChange={handleCheckboxArray('highPerformingStudentsReasons', reason)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span className="truncate">{reason}</span>
                      </label>
                    ))}
                  </div>
                  {errors.highPerformingStudentsReasons && (
                    <p className="text-red-600 text-xs mt-1">{errors.highPerformingStudentsReasons.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('highPerformNames')}
                  </label>
                  <textarea
                    {...register('highPerformingStudentsNames')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.highPerformingStudentsNames && (
                    <p className="text-red-600 text-xs mt-1">{errors.highPerformingStudentsNames.message}</p>
                  )}
                </div>
              </div>
            </section>

            <div className="border-t border-dashed border-slate-200" />

            {/* Issues Section */}
            <section className="space-y-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                  5
                </span>
                {t('issuesSection')}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {t('issuesLabel')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tt('issues').map((issue) => (
                      <label
                        key={issue}
                        className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={watch('issues').includes(issue)}
                          onChange={handleCheckboxArray('issues', issue)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span className="truncate">{issue}</span>
                      </label>
                    ))}
                  </div>
                  {errors.issues && (
                    <p className="text-red-600 text-xs mt-1">{errors.issues.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('mainChallenge')}
                  </label>
                  <textarea
                    {...register('mainChallenge')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.mainChallenge && (
                    <p className="text-red-600 text-xs mt-1">{errors.mainChallenge.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('supportNeeded')}
                  </label>
                  <textarea
                    {...register('supportNeeded')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                    rows={3}
                  />
                  {errors.supportNeeded && (
                    <p className="text-red-600 text-xs mt-1">{errors.supportNeeded.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Signature Section */}
            <section className="space-y-6">
              <div className="border-t border-dashed border-slate-200 pt-6" />
              <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                  6
                </span>
                {t('signature')}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('teacherSignature')}</label>
                  <input
                    {...register('teacherSignature')}
                    placeholder={t('signaturePlaceholder')}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                  {errors.teacherSignature && (
                    <p className="text-red-600 text-xs mt-1">{t('signatureRequired')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('signatureDate')}</label>
                  <input
                    type="date"
                    {...register('signatureDate')}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                  {errors.signatureDate && (
                    <p className="text-red-600 text-xs mt-1">{t('signatureDateRequired')}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <section className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 via-emerald-500 to-sky-500 hover:from-teal-700 hover:via-emerald-600 hover:to-sky-600 text-white font-semibold py-4 rounded-2xl text-lg shadow-lg shadow-teal-500/30 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting || loading ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    <span>{isEditMode ? 'Updating...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Update Report' : t('submit')}</span>
                )}
              </button>
            </section>
          </form>
        </div>
      </div>
    </div>
  )
}
