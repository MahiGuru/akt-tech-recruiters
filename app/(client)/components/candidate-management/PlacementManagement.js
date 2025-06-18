// app/(client)/components/placement-management/index.js
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Award, CheckCircle } from 'lucide-react'

// Hooks
import { usePlacementData } from './hooks/usePlacementData'

// Components
import PlacementTabs from './components/PlacementTabs'
import CompensationTab from './components/CompensationTab'

// Utils
import { PLACEMENT_TABS } from './utils/constants'

const PlacementManagement = ({ 
  isOpen, 
  onClose, 
  candidate, 
  onPlacementUpdate 
}) => {
  const [activeTab, setActiveTab] = useState('compensation')

  const {
    placementData,
    existingPlacement,
    isSubmitting,
    savePlacementData,
    addBenefit,
    removeBenefit,
    addMilestone,
    updateMilestone,
    removeMilestone,
    updatePlacementField
  } = usePlacementData(candidate)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await savePlacementData()
    
    if (result.success) {
      onPlacementUpdate(result.placement)
      onClose()
    }
  }

  if (!isOpen || !candidate) return null

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
        <PlacementTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={PLACEMENT_TABS}
        />

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit}>
            {/* Compensation Tab */}
            {activeTab === 'compensation' && (
              <CompensationTab
                placementData={placementData}
                updatePlacementField={updatePlacementField}
                addBenefit={addBenefit}
                removeBenefit={removeBenefit}
                isSubmitting={isSubmitting}
              />
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
                      onChange={(e) => updatePlacementField('clientCompany', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={placementData.clientIndustry}
                      onChange={(e) => updatePlacementField('clientIndustry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={placementData.clientContactName}
                      onChange={(e) => updatePlacementField('clientContactName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={placementData.clientContactEmail}
                      onChange={(e) => updatePlacementField('clientContactEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={placementData.clientContactPhone}
                      onChange={(e) => updatePlacementField('clientContactPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
                  <textarea
                    value={placementData.clientAddress}
                    onChange={(e) => updatePlacementField('clientAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    disabled={isSubmitting}
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
                      onChange={(e) => updatePlacementField('vendorCompany', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Rate</label>
                    <input
                      type="number"
                      value={placementData.vendorRate}
                      onChange={(e) => updatePlacementField('vendorRate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Contact</label>
                    <input
                      type="text"
                      value={placementData.vendorContactName}
                      onChange={(e) => updatePlacementField('vendorContactName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Email</label>
                    <input
                      type="email"
                      value={placementData.vendorContactEmail}
                      onChange={(e) => updatePlacementField('vendorContactEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Phone</label>
                    <input
                      type="tel"
                      value={placementData.vendorContactPhone}
                      onChange={(e) => updatePlacementField('vendorContactPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Commission</label>
                  <input
                    type="number"
                    value={placementData.vendorCommission}
                    onChange={(e) => updatePlacementField('vendorCommission', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Commission amount or percentage"
                    disabled={isSubmitting}
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
                      onChange={(e) => updatePlacementField('accountManager', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placement Fee</label>
                    <input
                      type="number"
                      value={placementData.placementFee}
                      onChange={(e) => updatePlacementField('placementFee', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                    <select
                      value={placementData.feeType}
                      onChange={(e) => updatePlacementField('feeType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
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
                      onChange={(e) => updatePlacementField('feePercentage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={placementData.feeType === 'FIXED' || isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <textarea
                    value={placementData.paymentTerms}
                    onChange={(e) => updatePlacementField('paymentTerms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Net 30, 50% upfront + 50% after 90 days, etc."
                    disabled={isSubmitting}
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
                      onChange={(e) => updatePlacementField('jobTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                    <input
                      type="text"
                      value={placementData.reportingManager}
                      onChange={(e) => updatePlacementField('reportingManager', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={placementData.startDate}
                      onChange={(e) => updatePlacementField('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date (if contract)</label>
                    <input
                      type="date"
                      value={placementData.endDate}
                      onChange={(e) => updatePlacementField('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placement Type</label>
                    <select
                      value={placementData.placementType}
                      onChange={(e) => updatePlacementField('placementType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
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
                      onChange={(e) => updatePlacementField('workLocation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                    <select
                      value={placementData.workType}
                      onChange={(e) => updatePlacementField('workType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
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
                    onChange={(e) => updatePlacementField('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Additional notes about the placement..."
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    <span>+</span>
                    Add Milestone
                  </button>
                </div>

                {placementData.milestones.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
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
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                              type="date"
                              value={milestone.dueDate}
                              onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isSubmitting}
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
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={milestone.completed}
                              onChange={(e) => updateMilestone(milestone.id, 'completed', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              disabled={isSubmitting}
                            />
                            <span className="text-sm text-gray-700">Completed</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={isSubmitting}
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