// app/(client)/components/candidate-management/hooks/useCandidateData.js

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export const useCandidateData = () => {
  const { data: session } = useSession()
  const isAdmin = session?.user?.recruiterProfile?.recruiterType === 'ADMIN'

  // State
  const [candidates, setCandidates] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch main data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [candidatesRes, teamRes] = await Promise.all([
        fetch('/api/recruiter/candidates'),
        isAdmin ? fetch('/api/recruiter/team') : Promise.resolve({ ok: true, json: () => ({ teamMembers: [] }) })
      ])

      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json()
        setCandidates(candidatesData.candidates || [])
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamMembers(teamData.teamMembers || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  // Fetch resumes for a specific candidate
  const fetchResumes = useCallback(async (candidateId) => {
    try {
      const response = await fetch(`/api/recruiter/resumes?candidateId=${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
    }
  }, [])

  // Add candidate
  const addCandidate = useCallback(async (formData, resumeInfo) => {
    try {
      // Create candidate
      const candidateResponse = await fetch('/api/recruiter/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!candidateResponse.ok) {
        const error = await candidateResponse.json()
        throw new Error(error.message || 'Failed to add candidate')
      }

      const candidateResult = await candidateResponse.json()
      const newCandidate = candidateResult.candidate

      // Upload resume if provided
      if (resumeInfo) {
        const resumeFormData = new FormData()
        resumeFormData.append('resume', resumeInfo.file)
        resumeFormData.append('candidateId', newCandidate.id)
        resumeFormData.append('title', resumeInfo.data.title || resumeInfo.file.name)
        resumeFormData.append('description', resumeInfo.data.description || '')
        resumeFormData.append('experienceLevel', resumeInfo.data.experienceLevel)
        resumeFormData.append('originalName', resumeInfo.file.name)

        const resumeResponse = await fetch('/api/recruiter/resumes', {
          method: 'POST',
          body: resumeFormData
        })

        if (!resumeResponse.ok) {
          console.warn('Candidate created but resume upload failed')
          toast.warning('Candidate added but resume upload failed')
        } else {
          toast.success('Candidate and resume added successfully!')
        }
      } else {
        toast.success('Candidate added successfully!')
      }

      // Refresh data
      await fetchData()
      return { success: true, candidate: newCandidate }
    } catch (error) {
      console.error('Error adding candidate:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  }, [fetchData])

  // Update candidate
  const updateCandidate = useCallback(async (candidateId, formData, resumeInfo) => {
    try {
      // Update candidate
      const candidateResponse = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, ...formData })
      })

      if (!candidateResponse.ok) {
        const error = await candidateResponse.json()
        throw new Error(error.message || 'Failed to update candidate')
      }

      // Upload resume if provided
      if (resumeInfo) {
        const resumeFormData = new FormData()
        resumeFormData.append('resume', resumeInfo.file)
        resumeFormData.append('candidateId', candidateId)
        resumeFormData.append('title', resumeInfo.data.title || resumeInfo.file.name)
        resumeFormData.append('description', resumeInfo.data.description || '')
        resumeFormData.append('experienceLevel', resumeInfo.data.experienceLevel)
        resumeFormData.append('originalName', resumeInfo.file.name)

        const resumeResponse = await fetch('/api/recruiter/resumes', {
          method: 'POST',
          body: resumeFormData
        })

        if (!resumeResponse.ok) {
          console.warn('Candidate updated but resume upload failed')
          toast.warning('Candidate updated but resume upload failed')
        } else {
          toast.success('Candidate and resume updated successfully!')
        }
      } else {
        toast.success('Candidate updated successfully!')
      }

      // Refresh data
      await fetchData()
      return { success: true }
    } catch (error) {
      console.error('Error updating candidate:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  }, [fetchData])

  // Delete candidate
  const deleteCandidate = useCallback(async (candidateId, candidateName) => {
    if (!confirm(`Are you sure you want to delete ${candidateName}?`)) return { success: false }

    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Candidate deleted successfully')
        await fetchData()
        return { success: true }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete candidate')
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error deleting candidate:', error)
      toast.error('Failed to delete candidate')
      return { success: false, error: error.message }
    }
  }, [fetchData])

  // Update candidate status
  const updateCandidateStatus = useCallback(async (candidateId, newStatus, candidateName) => {
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status: newStatus })
      })

      if (response.ok) {
        toast.success(`${candidateName}'s status updated successfully`)
        await fetchData()
        return { success: true }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update status')
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
      return { success: false, error: error.message }
    }
  }, [fetchData])

  // Get detailed candidate info
  const getCandidateDetails = useCallback(async (candidateId) => {
    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`)
      if (response.ok) {
        const detailedCandidate = await response.json()
        return { success: true, candidate: detailedCandidate }
      } else {
        toast.error('Failed to load candidate details')
        return { success: false }
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      toast.error('Failed to load candidate details')
      return { success: false, error: error.message }
    }
  }, [])

  // Update candidate interview data in local state
  const updateCandidateInterview = useCallback((interviewData, editingInterview = null) => {
    setCandidates(prevCandidates => 
      prevCandidates.map(candidate => {
        if (candidate.id === interviewData.candidateId) {
          if (editingInterview) {
            // Update existing interview
            return {
              ...candidate,
              interviews: candidate.interviews.map(interview =>
                interview.id === editingInterview.id ? interviewData : interview
              )
            }
          } else {
            // Add new interview
            return { 
              ...candidate, 
              interviews: [...(candidate.interviews || []), interviewData]
            }
          }
        }
        return candidate
      })
    )
  }, [])

  // Update candidate placement data in local state
  const updateCandidatePlacement = useCallback((placementData) => {
    setCandidates(prevCandidates => 
      prevCandidates.map(candidate => 
        candidate.id === placementData.candidateId 
          ? { 
              ...candidate, 
              status: 'PLACED',
              placement: placementData
            }
          : candidate
      )
    )
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    // Data
    candidates,
    teamMembers,
    resumes,
    loading,
    isAdmin,
    
    // Actions
    fetchData,
    fetchResumes,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    updateCandidateStatus,
    getCandidateDetails,
    updateCandidateInterview,
    updateCandidatePlacement,
    
    // Setters for local state updates
    setCandidates,
    setResumes
  }
}