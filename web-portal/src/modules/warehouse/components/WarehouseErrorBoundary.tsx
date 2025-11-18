/**
 * WarehouseErrorBoundary Component
 * 
 * Error boundary to catch render errors in warehouse module pages.
 * Displays a friendly error message with retry option.
 * 
 * @author CARE Team
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error boundary component for warehouse module
 * 
 * @example
 * ```tsx
 * <WarehouseErrorBoundary>
 *   <WarehouseListPage />
 * </WarehouseErrorBoundary>
 * ```
 */
export default class WarehouseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('Warehouse module error:', error, errorInfo)
    
    // TODO: Send error to backend logging service
    // Example:
    // api.post('/logging/api/errors', {
    //   module: 'warehouse',
    //   error: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack,
    // })
    
    this.setState({
      error,
      errorInfo,
    })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="w-16 h-16 text-red-500 mb-4">
            <AlertCircle className="w-full h-full" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Something went wrong
          </h2>
          
          <p className="text-sm text-gray-600 text-center max-w-md mb-6">
            An error occurred while loading this page. Please try again.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-6 p-4 bg-gray-100 rounded text-left max-w-2xl w-full">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-gray-600 overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

