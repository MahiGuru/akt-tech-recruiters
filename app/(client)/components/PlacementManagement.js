// app/(client)/components/PlacementManagement.js - Manage placement details
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  X, 
  DollarSign, 
  Building2, 
  User, 
  CreditCard, 
  Calendar, 
  FileText, 
  Save, 
  Edit, 
  Eye, 
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  TrendingUp,
  Target,
  Award,
  Users,
  Clock,
  PlusCircle
} from 'lucide-react'

const PlacementManagement = ({ 
  isOpen, 
  onClose, 
  candidate, 
  onPlacementUpdate 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('compensation')
  const [existingPlacement, setExistingPlacement] = useState(null)
  const [placementData, setPlacementData] = useState({
    // Compensation Details
    salary: '',
    currency: 'USD',
    salaryType: 'ANNUAL', // ANNUAL, MONTHLY, HOURLY
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
    feeType: 'PERCENTAGE', // PERCENTAGE, FIXED
    feePercentage: '',
    paymentTerms: '',
    
    // Placement Details
    jobTitle: '',
    startDate: '',
    endDate: '', // For contract positions
    placementType: 'PERMANENT', // PERMANENT, CONTRACT, TEMP_TO_PERM
    workLocation: '',
    workType: 'FULL_TIME', // FULL_TIME, PART_TIME, CONTRACT
    reportingManager: '',
    
    // Additional Info
    notes: '',
    documents: [],
    milestones: []
  })

  const benefitOptions = [
    'Health Insurance', 'Dental Insurance', 'Vision Insurance', '401k',
    'Paid Time Off', 'Sick Leave', 'Life Insurance', 'Disability Insurance',
    'Stock Options', 'Flexible Schedule', 'Remote Work', 'Gym Membership',
    'Education Assistance', 'Commuter Benefits', 'Phone Allowance'
  ]

  useEffect(() => {
    if (isOpen && candidate) {
      fetchPlacementDetails()
    }
  }, [isOpen, candidate])

  const fetchPlacementDetails = async () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!placementData.salary || !placementData.clientCompany || !placementData.jobTitle) {
      toast.error('Salary, client company, and job title are required')
      return
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
        onPlacementUpdate(data.placement)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save placement details')
      }
    } catch (error) {
      console.error('Error saving placement details:', error)
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addBenefit = (benefit) => {
    if (!placementData.benefits.includes(benefit)) {
      setPlacementData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefit]
      }))
    }
  }

  const removeBenefit = (benefit) => {
    setPlacementData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }))
  }

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

  const updateMilestone = (id, field, value) => {
    setPlacementData(prev => ({
      ...prev,
      milestones: prev.milestones.map(milestone =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    }))
  }

  const removeMilestone = (id) => {
    setPlacementData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
    }))
  }

  if (!isOpen || !candidate) return null

  const tabs = [
    { id: 'compensation', label: 'Compensation', icon: DollarSign },
    { id: 'client', label: 'Client Details', icon: Building2 },
    { id: 'vendor', label: 'Vendor Details', icon: Users },
    { id: 'account', label: 'Account Details', icon: CreditCard },
    { id: 'placement', label: 'Placement Info', icon: Briefcase },
    { id: 'tracking', label: 'Tracking', icon: Target }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-1">Placement Management</h3>
              <p className="text-blue-100">Managing placement details for {candidate.name}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-blue-100">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {existingPlacement ? 'Update' : 'New'} Placement
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Status: {candidate.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit}>
            {/* Compensation Tab */}
            {activeTab === 'compensation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary *</label>
                    <input
                      type="number"
                      value={placementData.salary}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, salary: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={placementData.currency}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
                    <select
                      value={placementData.salaryType}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, salaryType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ANNUAL">Annual</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="HOURLY">Hourly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
                    <input
                      type="number"
                      value={placementData.bonus}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, bonus: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
                    <input
                      type="number"
                      value={placementData.commission}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, commission: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                  <div className="mb-3">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addBenefit(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Add a benefit...</option>
                      {benefitOptions.filter(b => !placementData.benefits.includes(b)).map(benefit => (
                        <option key={benefit} value={benefit}>{benefit}</option>
                      ))}
                    </select>
                  </div>
                  {placementData.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {placementData.benefits.map((benefit, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {benefit}
                          <button
                            type="button"
                            onClick={() => removeBenefit(benefit)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Client Details Tab */}
            {activeTab === 'client' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Company *</label>
                    <input
                      type="text"
                      value={placementData.clientCompany}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, clientCompany: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={placementData.clientIndustry}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, clientIndustry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={placementData.clientContactName}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, clientContactName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={placementData.clientContactEmail}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, clientContactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={placementData.clientContactPhone}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, clientContactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
                  <textarea
                    value={placementData.clientAddress}
                    onChange={(e) => setPlacementData(prev => ({ ...prev, clientAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Vendor Details Tab */}
            {activeTab === 'vendor' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Fill this section if the placement was made through a vendor/agency partner.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Company</label>
                    <input
                      type="text"
                      value={placementData.vendorCompany}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, vendorCompany: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Rate</label>
                    <input
                      type="number"
                      value={placementData.vendorRate}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, vendorRate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Contact</label>
                    <input
                      type="text"
                      value={placementData.vendorContactName}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, vendorContactName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Email</label>
                    <input
                      type="email"
                      value={placementData.vendorContactEmail}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, vendorContactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Phone</label>
                    <input
                      type="tel"
                      value={placementData.vendorContactPhone}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, vendorContactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Commission</label>
                  <input
                    type="number"
                    value={placementData.vendorCommission}
                    onChange={(e) => setPlacementData(prev => ({ ...prev, vendorCommission: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Commission amount or percentage"
                  />
                </div>
              </div>
            )}

            {/* Account Details Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Manager</label>
                    <input
                      type="text"
                      value={placementData.accountManager}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, accountManager: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placement Fee</label>
                    <input
                      type="number"
                      value={placementData.placementFee}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, placementFee: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                    <select
                      value={placementData.feeType}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, feeType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Percentage</label>
                    <input
                      type="number"
                      value={placementData.feePercentage}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, feePercentage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={placementData.feeType === 'FIXED'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <textarea
                    value={placementData.paymentTerms}
                    onChange={(e) => setPlacementData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Net 30, 50% upfront + 50% after 90 days, etc."
                  />
                </div>
              </div>
            )}

            {/* Placement Info Tab */}
            {activeTab === 'placement' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                    <input
                      type="text"
                      value={placementData.jobTitle}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                    <input
                      type="text"
                      value={placementData.reportingManager}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, reportingManager: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={placementData.startDate}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date (if contract)</label>
                    <input
                      type="date"
                      value={placementData.endDate}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placement Type</label>
                    <select
                      value={placementData.placementType}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, placementType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PERMANENT">Permanent</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="TEMP_TO_PERM">Temp to Perm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                    <input
                      type="text"
                      value={placementData.workLocation}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, workLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                    <select
                      value={placementData.workType}
                      onChange={(e) => setPlacementData(prev => ({ ...prev, workType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={placementData.notes}
                    onChange={(e) => setPlacementData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Additional notes about the placement..."
                  />
                </div>
              </div>
            )}

            {/* Tracking Tab */}
            {activeTab === 'tracking' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Placement Milestones</h4>
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Milestone
                  </button>
                </div>

                {placementData.milestones.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No milestones added</h5>
                    <p className="text-gray-600">Track important placement milestones and follow-ups</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {placementData.milestones.map((milestone) => (
                      <div key={milestone.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={milestone.title}
                              onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., 30-day check-in"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                              type="date"
                              value={milestone.dueDate}
                              onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={milestone.description}
                            onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Milestone details..."
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={milestone.completed}
                              onChange={(e) => updateMilestone(milestone.id, 'completed', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Completed</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {existingPlacement ? 'Updating...' : 'Saving...'}
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 inline mr-2" />
                    {existingPlacement ? 'Update Placement' : 'Save Placement'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PlacementManagement