// app/(client)/components/placement-management/hooks/usePlacementData.js

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const initialPlacementData = {
  // Compensation Details
  salary: '',
  currency: 'USD',
  salaryType: 'ANNUAL',
  bonus: '',
  commission: '',
  benefits: [],
  
  // Client Details
  clientCompany: '',
  clientContactName: '',
  clientContactEmail: '',
  clientContactPhone: '',
  clientAddress: '',
  clientIndustry: '',
  
  // Vendor Details (if through agency)
  vendorCompany: '',
  vendorContactName: '',
  vendorContactEmail: '',
  vendorContactPhone: '',
  vendorRate: '',
  vendorCommission: '',
  
  // Account Details
  accountManager: '',
  placementFee: '',
  feeType: 'PERCENTAGE',
  feePercentage: '',
  paymentTerms: '',
  
  // Placement Details
  jobTitle: '',
  startDate: '',
  endDate: '',
  placementType: 'PERMANENT',
  workLocation: '',
  workType: 'FULL_TIME',
  reportingManager: '',
  
  // Additional Info
  notes: '',
  documents: [],
  milestones: []
}

export const usePlacementData = (candidate) => {
  const [placementData, setPlacementData] = useState(initialPlacementData)
  const [existingPlacement, setExistingPlacement] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch existing placement data
  const fetchPlacementDetails = async () => {
    if (!candidate?.id) return

    try {
      const response = await fetch(`/api/recruiter/placements/${candidate.id}`)
      if (response.ok) {
        const data = await response.json()
        setExistingPlacement(data.placement)
        if (data.placement) {
          setPlacementData(data.placement)
        }
      }
    } catch (error) {
      console.error('Error fetching placement details:', error)
    }
  }

  // Save placement data
  const savePlacementData = async () => {
    if (!placementData.salary || !placementData.clientCompany) {
      toast.error('Salary and client company are required')
      return { success: false }
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/recruiter/placements/${candidate.id}`, {
        method: existingPlacement ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placementData)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(existingPlacement ? 'Placement updated successfully!' : 'Placement details saved successfully!')
        setExistingPlacement(data.placement)
        return { success: true, placement: data.placement }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save placement details')
        return { success: false, error: error.message }
      }
    } catch (error) {
      console.error('Error saving placement details:', error)
      toast.error('Something went wrong')
      return { success: false, error: error.message }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add benefit
  const addBenefit = (benefit) => {
    if (!placementData.benefits.includes(benefit)) {
      setPlacementData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefit]
      }))
    }
  }

  // Remove benefit
  const removeBenefit = (benefit) => {
    setPlacementData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }))
  }

  // Add milestone
  const addMilestone = () => {
    setPlacementData(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        id: Date.now(),
        title: '',
        description: '',
        dueDate: '',
        completed: false
      }]
    }))
  }

  // Update milestone
  const updateMilestone = (id, field, value) => {
    setPlacementData(prev => ({
      ...prev,
      milestones: prev.milestones.map(milestone =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    }))
  }

  // Remove milestone
  const removeMilestone = (id) => {
    setPlacementData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
    }))
  }

  // Update placement data field
  const updatePlacementField = (field, value) => {
    setPlacementData(prev => ({ ...prev, [field]: value }))
  }

  // Initialize data when component mounts
  useEffect(() => {
    if (candidate?.id) {
      fetchPlacementDetails()
    }
  }, [candidate?.id])

  return {
    // Data
    placementData,
    existingPlacement,
    isSubmitting,

    // Actions
    savePlacementData,
    addBenefit,
    removeBenefit,
    addMilestone,
    updateMilestone,
    removeMilestone,
    updatePlacementField,
    setPlacementData,

    // Utilities
    fetchPlacementDetails
  }
}