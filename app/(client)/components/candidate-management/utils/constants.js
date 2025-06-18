import { ThumbsUp, ThumbsDown, Meh } from 'lucide-react'

export const CANDIDATE_STATUSES = [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'PLACED', label: 'Placed', color: 'bg-blue-100 text-blue-800' },
    { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', color: 'bg-red-100 text-red-800' }
  ]
  
  export const EXPERIENCE_LEVELS = [
    { value: 'ENTRY_LEVEL', label: 'Entry Level' },
    { value: 'MID_LEVEL', label: 'Mid Level' },
    { value: 'SENIOR_LEVEL', label: 'Senior Level' },
    { value: 'EXECUTIVE', label: 'Executive' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'INTERNSHIP', label: 'Internship' }
  ]
  
  export const INTERVIEW_STATUSES = {
    'SCHEDULED': 'bg-blue-100 text-blue-800 border-blue-200',
    'CONFIRMED': 'bg-green-100 text-green-800 border-green-200',
    'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'COMPLETED': 'bg-purple-100 text-purple-800 border-purple-200',
    'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
    'RESCHEDULED': 'bg-orange-100 text-orange-800 border-orange-200'
  }
  
  export const FEEDBACK_OUTCOMES = {
    EXCELLENT: {
      color: "bg-green-100 text-green-800 border-green-200",
      description: "Outstanding performance",
    },
    GOOD: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      description: "Good performance",
    },
    AVERAGE: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      description: "Average performance",
    },
    POOR: {
      color: "bg-red-100 text-red-800 border-red-200",
      description: "Below expectations",
    },
  }
  
  export const SORT_OPTIONS = [
    { value: 'priority', label: 'Smart Priority' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'status', label: 'Status' }
  ]
  
  export const FILE_UPLOAD = {
    ACCEPTED_TYPES: [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ],
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPTED_EXTENSIONS: '.pdf,.doc,.docx,.txt'
  }


export const FEEDBACK_CONFIGS = {
  EXCELLENT: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: ThumbsUp,
    bgGradient: "from-green-50 to-emerald-50",
    description: "Outstanding performance",
  },
  GOOD: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: ThumbsUp,
    bgGradient: "from-blue-50 to-indigo-50",
    description: "Good performance",
  },
  AVERAGE: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Meh,
    bgGradient: "from-yellow-50 to-orange-50",
    description: "Average performance",
  },
  POOR: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: ThumbsDown,
    bgGradient: "from-red-50 to-pink-50",
    description: "Below expectations",
  },
}

export const STATUS_COLORS = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  PLACED: "bg-blue-100 text-blue-800 border-blue-200",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
  DO_NOT_CONTACT: "bg-red-100 text-red-800 border-red-200",
}

export const INTERVIEW_STATUS_COLORS = {
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
  COMPLETED: "bg-purple-100 text-purple-800 border-purple-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  RESCHEDULED: "bg-orange-100 text-orange-800 border-orange-200",
}

export const CARD_PRIORITY_STYLES = {
  upcoming: {
    border: "border-green-300",
    background: "bg-gradient-to-r from-green-50 to-green-25",
    shadow: "shadow-green-100",
  },
  feedback_needed: {
    border: "border-orange-300",
    background: "bg-gradient-to-r from-orange-50 to-orange-25",
    shadow: "shadow-orange-100",
  },
  placed: {
    border: "border-blue-300",
    background: "bg-gradient-to-r from-blue-50 to-blue-25",
    shadow: "shadow-blue-100",
  },
  inactive: {
    border: "border-gray-300",
    background: "bg-gradient-to-r from-gray-50 to-gray-25",
    shadow: "shadow-gray-100",
  },
  default: {
    border: "border-gray-200",
    background: "bg-white",
    shadow: "shadow-gray-50",
  },
} 

export const BENEFIT_OPTIONS = [
    'Health Insurance', 'Dental Insurance', 'Vision Insurance', '401k',
    'Paid Time Off', 'Sick Leave', 'Life Insurance', 'Disability Insurance',
    'Stock Options', 'Flexible Schedule', 'Remote Work', 'Gym Membership',
    'Education Assistance', 'Commuter Benefits', 'Phone Allowance'
  ]
  
  export const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'INR', label: 'INR (₹)' }
  ]
  
  export const SALARY_TYPES = [
    { value: 'ANNUAL', label: 'Annual' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'HOURLY', label: 'Hourly' }
  ]
  
  export const FEE_TYPES = [
    { value: 'PERCENTAGE', label: 'Percentage' },
    { value: 'FIXED', label: 'Fixed Amount' }
  ]
  
  export const PLACEMENT_TYPES = [
    { value: 'PERMANENT', label: 'Permanent' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'TEMP_TO_PERM', label: 'Temp to Perm' }
  ]
  
  export const WORK_TYPES = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' }
  ]
  
  export const DURATION_OPTIONS = [
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ]
  
  export const PLACEMENT_TABS = [
    { id: 'compensation', label: 'Compensation', icon: 'DollarSign' },
    { id: 'client', label: 'Client Details', icon: 'Building2' },
    { id: 'vendor', label: 'Vendor Details', icon: 'Users' },
    { id: 'account', label: 'Account Details', icon: 'CreditCard' },
    { id: 'placement', label: 'Placement Info', icon: 'Briefcase' },
    { id: 'tracking', label: 'Tracking', icon: 'Target' }
  ]