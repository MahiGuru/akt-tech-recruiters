// app/(client)/components/placement-management/components/CompensationTab.js
'use client'

import { X } from 'lucide-react'
import { CURRENCY_OPTIONS, SALARY_TYPES, BENEFIT_OPTIONS } from '../utils/constants'

const CompensationTab = ({
  placementData,
  updatePlacementField,
  addBenefit,
  removeBenefit,
  isSubmitting
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salary *</label>
          <input
            type="number"
            value={placementData.salary}
            onChange={(e) => updatePlacementField('salary', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={placementData.currency}
            onChange={(e) => updatePlacementField('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {CURRENCY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
          <select
            value={placementData.salaryType}
            onChange={(e) => updatePlacementField('salaryType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {SALARY_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
          <input
            type="number"
            value={placementData.bonus}
            onChange={(e) => updatePlacementField('bonus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
          <input
            type="number"
            value={placementData.commission}
            onChange={(e) => updatePlacementField('commission', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            <option value="">Add a benefit...</option>
            {BENEFIT_OPTIONS.filter(b => !placementData.benefits.includes(b)).map(benefit => (
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
                  disabled={isSubmitting}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CompensationTab