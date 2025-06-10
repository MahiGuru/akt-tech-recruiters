'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MultipleResumeUpload from '../components/MultipleResumeUpload';
import ResumeUploadDebug from '../components/ResumeUpload';

export default function TestUploadPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Upload Test</h1>
          <p className="text-gray-600">Testing multiple resume upload functionality</p>
        </div>

        <div className="space-y-8">
          {/* Debug Component */}
          <ResumeUploadDebug 
            userId={user.id}
            userName={user.name}
          />

          {/* Main Upload Component */}
          <MultipleResumeUpload
            userId={user.id}
            userName={user.name}
            onUploadSuccess={(resume) => {
              console.log('Upload success:', resume)
            }}
            onUploadError={(error) => {
              console.error('Upload error:', error)
            }}
          />
        </div>
      </div>
    </div>
  )
}
