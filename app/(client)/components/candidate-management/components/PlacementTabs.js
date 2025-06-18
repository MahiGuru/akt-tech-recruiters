// app/(client)/components/placement-management/components/PlacementTabs.js
'use client'

import { DollarSign, Building2, Users, CreditCard, Briefcase, Target } from 'lucide-react'

const iconMap = {
  DollarSign,
  Building2,
  Users,
  CreditCard,
  Briefcase,
  Target
}

const PlacementTabs = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div className="border-b border-gray-200">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const IconComponent = iconMap[tab.icon]
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PlacementTabs