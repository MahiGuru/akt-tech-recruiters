// app/(client)/lib/validationUtils.js
// Centralized validation patterns and utilities for forms

// Email validation - comprehensive pattern
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Phone validation patterns - India and US specific
export const PHONE_PATTERNS = {
  INDIA: {
    WITH_CODE: /^(\+91[-.\s]?)?[6-9]\d{9}$/,
    WITHOUT_CODE: /^[6-9]\d{9}$/,
    FORMATTED: /^(\+91[-.\s]?)?[6-9]\d{4}[-.\s]?\d{5}$/
  },
  US: {
    WITH_CODE: /^(\+1[-.\s]?)?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
    WITHOUT_CODE: /^(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
    FORMATTED: /^(\+1[-.\s]?)?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/
  },
  INTERNATIONAL: /^[\+]?[1-9][\d]{7,15}$/
}

// Name validation pattern
export const NAME_REGEX = /^[a-zA-Z\s'-]+$/

// Password validation
export const PASSWORD_MIN_LENGTH = 6
export const PASSWORD_MAX_LENGTH = 128

/**
 * Validates email address format
 * @param {string} email - Email to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validateEmail = (email) => {
  if (!email) return { isValid: null, message: '' }
  
  const isValid = EMAIL_REGEX.test(email)
  return {
    isValid,
    message: isValid ? 'Valid email address' : 'Please enter a valid email address'
  }
}

/**
 * Validates phone number format for India and US
 * @param {string} phone - Phone number to validate
 * @returns {object} - Validation result with isValid, message, format type, and country
 */
export const validatePhone = (phone) => {
  if (!phone) return { isValid: null, message: '', format: '', country: '' }
  
  // Clean phone number for validation
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length < 7) {
    return { isValid: false, message: 'Phone number too short', format: '', country: '' }
  }
  
  if (cleanPhone.length > 15) {
    return { isValid: false, message: 'Phone number too long', format: '', country: '' }
  }

  // Check India formats first
  if (PHONE_PATTERNS.INDIA.WITH_CODE.test(phone) || PHONE_PATTERNS.INDIA.FORMATTED.test(phone)) {
    return { isValid: true, message: 'Valid Indian phone number', format: 'India', country: 'IN' }
  }
  
  if (PHONE_PATTERNS.INDIA.WITHOUT_CODE.test(phone)) {
    return { isValid: true, message: 'Valid Indian phone number', format: 'India', country: 'IN' }
  }
  
  // Check US formats
  if (PHONE_PATTERNS.US.WITH_CODE.test(phone) || PHONE_PATTERNS.US.FORMATTED.test(phone)) {
    return { isValid: true, message: 'Valid US phone number', format: 'US', country: 'US' }
  }
  
  if (PHONE_PATTERNS.US.WITHOUT_CODE.test(phone)) {
    return { isValid: true, message: 'Valid US phone number', format: 'US', country: 'US' }
  }
  
  // Check international format as fallback
  if (PHONE_PATTERNS.INTERNATIONAL.test(phone)) {
    return { isValid: true, message: 'Valid international phone number', format: 'International', country: 'OTHER' }
  }
  
  return { isValid: false, message: 'Invalid phone number format. Please use India (+91) or US (+1) format', format: '', country: '' }
}

/**
 * Validates name format
 * @param {string} name - Name to validate
 * @returns {object} - Validation result
 */
export const validateName = (name) => {
  if (!name) return { isValid: null, message: '' }
  
  if (name.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' }
  }
  
  if (name.length > 50) {
    return { isValid: false, message: 'Name must be less than 50 characters' }
  }
  
  if (!NAME_REGEX.test(name)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  }
  
  return { isValid: true, message: 'Valid name' }
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with strength score
 */
export const validatePassword = (password) => {
  if (!password) return { isValid: null, message: '', strength: 0 }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      strength: 0 
    }
  }
  
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { 
      isValid: false, 
      message: `Password must be less than ${PASSWORD_MAX_LENGTH} characters`,
      strength: 0 
    }
  }
  
  // Calculate strength
  let strength = 0
  if (password.length >= 6) strength++
  if (password.match(/[a-z]/)) strength++
  if (password.match(/[A-Z]/)) strength++
  if (password.match(/[0-9]/)) strength++
  if (password.match(/[^a-zA-Z0-9]/)) strength++
  
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['', 'red', 'orange', 'yellow', 'blue', 'green']
  
  return {
    isValid: strength >= 2, // Require at least "Weak" strength
    message: strengthLabels[strength],
    strength,
    color: strengthColors[strength]
  }
}

/**
 * Formats phone number as user types (India and US formats)
 * @param {string} value - Raw phone input
 * @param {string} detectedCountry - Detected country from validation
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (value, detectedCountry = '') => {
  if (!value) return value
  
  // Remove all non-digit characters
  const phoneNumber = value.replace(/[^\d]/g, '')
  const phoneNumberLength = phoneNumber.length
  
  // Check if it starts with country codes
  const startsWithIndia = phoneNumber.startsWith('91')
  const startsWithUS = phoneNumber.startsWith('1')
  
  // India formatting
  if (startsWithIndia || detectedCountry === 'IN' || (phoneNumberLength === 10 && phoneNumber[0] >= '6')) {
    if (startsWithIndia) {
      // +91 XXXXX XXXXX format
      if (phoneNumberLength <= 2) return `+${phoneNumber}`
      if (phoneNumberLength <= 7) return `+91 ${phoneNumber.slice(2)}`
      return `+91 ${phoneNumber.slice(2, 7)} ${phoneNumber.slice(7, 12)}`
    } else {
      // XXXXX XXXXX format (Indian mobile without country code)
      if (phoneNumberLength <= 5) return phoneNumber
      return `${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5, 10)}`
    }
  }
  
  // US formatting
  if (startsWithUS || detectedCountry === 'US') {
    if (startsWithUS) {
      // +1 (XXX) XXX-XXXX format
      const usNumber = phoneNumber.slice(1) // Remove the '1'
      if (usNumber.length <= 3) return `+1 (${usNumber}`
      if (usNumber.length <= 6) return `+1 (${usNumber.slice(0, 3)}) ${usNumber.slice(3)}`
      return `+1 (${usNumber.slice(0, 3)}) ${usNumber.slice(3, 6)}-${usNumber.slice(6, 10)}`
    } else {
      // (XXX) XXX-XXXX format
      if (phoneNumberLength <= 3) return `(${phoneNumber}`
      if (phoneNumberLength <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
    }
  }
  
  // Default: return as is for international or unknown formats
  return phoneNumber.length > 10 ? `+${phoneNumber}` : phoneNumber
}

/**
 * Common validation rules for react-hook-form
 */
export const validationRules = {
  email: {
    required: 'Email address is required',
    pattern: {
      value: EMAIL_REGEX,
      message: 'Please enter a valid email address'
    }
  },
  
  name: {
    required: 'Full name is required',
    minLength: { 
      value: 2, 
      message: 'Name must be at least 2 characters' 
    },
    maxLength: {
      value: 50,
      message: 'Name must be less than 50 characters'
    },
    pattern: {
      value: NAME_REGEX,
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  
  phone: {
    required: 'Phone number is required',
    validate: (value) => {
      const validation = validatePhone(value)
      return validation.isValid || validation.message
    }
  },
  
  password: {
    required: 'Password is required',
    minLength: {
      value: PASSWORD_MIN_LENGTH,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    },
    maxLength: {
      value: PASSWORD_MAX_LENGTH,
      message: `Password must be less than ${PASSWORD_MAX_LENGTH} characters`
    }
  },
  
  companyName: {
    required: 'Company name is required',
    minLength: { 
      value: 2, 
      message: 'Company name must be at least 2 characters' 
    }
  },
  
  companySize: {
    required: 'Company size is required'
  },
  
  industry: {
    required: 'Industry is required'
  }
}

/**
 * Get validation state class names for input styling
 * @param {boolean} hasError - Whether field has error
 * @param {boolean} isValid - Whether field is valid
 * @param {boolean} isInvalid - Whether field is invalid
 * @returns {string} - CSS class names
 */
export const getValidationClasses = (hasError, isValid, isInvalid) => {
  if (hasError) {
    return 'border-red-400 bg-red-50 focus:border-red-500'
  }
  if (isValid === true) {
    return 'border-green-400 bg-green-50 focus:border-green-500'
  }
  if (isInvalid === true) {
    return 'border-yellow-400 bg-yellow-50 focus:border-yellow-500'
  }
  return 'focus:border-primary-400 focus:bg-white'
}

/**
 * Get validation icon color class
 * @param {boolean} hasError - Whether field has error
 * @param {boolean} isValid - Whether field is valid
 * @param {boolean} isInvalid - Whether field is invalid
 * @returns {string} - CSS class for icon color
 */
export const getValidationIconColor = (hasError, isValid, isInvalid) => {
  if (hasError) return 'text-red-400'
  if (isValid === true) return 'text-green-400'
  if (isInvalid === true) return 'text-yellow-400'
  return 'text-secondary-400'
}