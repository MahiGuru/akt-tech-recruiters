// app/(client)/components/shared/hooks/useApiCall.js

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

/**
 * Custom hook for handling API calls with loading states and error handling
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback  
 * @param {boolean} options.showSuccessToast - Show success toast message
 * @param {boolean} options.showErrorToast - Show error toast message
 * @param {string} options.successMessage - Custom success message
 * @param {string} options.errorMessage - Custom error message
 */
export const useApiCall = (options = {}) => {
  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation successful',
    errorMessage = 'Something went wrong'
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const execute = useCallback(async (apiCall, ...args) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await apiCall(...args)
      
      setData(result)
      
      if (showSuccessToast) {
        toast.success(successMessage)
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return { success: true, data: result }
    } catch (err) {
      const errorMsg = err.message || errorMessage
      setError(errorMsg)
      
      if (showErrorToast) {
        toast.error(errorMsg)
      }
      
      if (onError) {
        onError(err)
      }
      
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast, successMessage, errorMessage])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    execute,
    isLoading,
    error,
    data,
    reset
  }
}

/**
 * Hook for API calls that return data (GET requests)
 */
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (customUrl = url, fetchOptions = {}) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(customUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers
        },
        ...fetchOptions
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
      
      return { success: true, data: result }
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch data'
      setError(errorMsg)
      
      if (options.showErrorToast !== false) {
        toast.error(errorMsg)
      }
      
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [url, options.showErrorToast])

  return {
    data,
    isLoading,
    error,
    fetchData,
    refetch: () => fetchData()
  }
}

/**
 * Hook for API calls that modify data (POST, PUT, DELETE)
 */
export const useMutation = (options = {}) => {
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operation successful',
    errorMessage = 'Operation failed'
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(async (url, data, method = 'POST') => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (showSuccessToast) {
        toast.success(successMessage)
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return { success: true, data: result }
    } catch (err) {
      const errorMsg = err.message || errorMessage
      setError(errorMsg)
      
      if (showErrorToast) {
        toast.error(errorMsg)
      }
      
      if (onError) {
        onError(err)
      }
      
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast, successMessage, errorMessage])

  // Convenience methods
  const post = useCallback((url, data) => mutate(url, data, 'POST'), [mutate])
  const put = useCallback((url, data) => mutate(url, data, 'PUT'), [mutate])
  const patch = useCallback((url, data) => mutate(url, data, 'PATCH'), [mutate])
  const del = useCallback((url) => mutate(url, null, 'DELETE'), [mutate])

  return {
    mutate,
    post,
    put,
    patch,
    delete: del,
    isLoading,
    error,
    reset: () => {
      setError(null)
      setIsLoading(false)
    }
  }
}

/**
 * Hook for file upload operations
 */
export const useFileUpload = (options = {}) => {
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'File uploaded successfully',
    errorMessage = 'File upload failed'
  } = options

  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const upload = useCallback(async (url, file, additionalData = {}) => {
    try {
      setIsUploading(true)
      setError(null)
      setProgress(0)

      const formData = new FormData()
      formData.append('file', file)
      
      // Add additional form data
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key])
      })

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed! status: ${response.status}`)
      }

      const result = await response.json()
      setProgress(100)
      
      if (showSuccessToast) {
        toast.success(successMessage)
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return { success: true, data: result }
    } catch (err) {
      const errorMsg = err.message || errorMessage
      setError(errorMsg)
      
      if (showErrorToast) {
        toast.error(errorMsg)
      }
      
      if (onError) {
        onError(err)
      }
      
      return { success: false, error: errorMsg }
    } finally {
      setIsUploading(false)
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast, successMessage, errorMessage])

  return {
    upload,
    isUploading,
    progress,
    error,
    reset: () => {
      setError(null)
      setProgress(0)
      setIsUploading(false)
    }
  }
}

export default useApiCall