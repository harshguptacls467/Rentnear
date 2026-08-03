import { Component } from 'react';
import { AlertOctagon, RefreshCcw, Home, RotateCcw, AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * Route-Level Error Boundary
 * Prevents single-page crashes from crashing navigation or other routes.
 */
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[RouteErrorBoundary] Error in route "${this.props.routeName || 'unknown'}":`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 animate-zoom-in">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-500">
              <AlertTriangle size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">This page encountered an issue</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              An unexpected error occurred while loading this section. The rest of the platform remains functional.
            </p>
            
            <div className="space-y-2.5">
              <Button 
                className="w-full flex justify-center items-center gap-2 rounded-xl text-sm"
                onClick={this.handleReset}
              >
                <RotateCcw size={16} /> Try Loading Again
              </Button>
              <button 
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex justify-center items-center gap-2"
                onClick={() => window.location.href = '/'}
              >
                <Home size={14} /> Return to Homepage
              </button>
            </div>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-xl text-left overflow-auto text-[11px] text-red-600 max-h-32">
                <p className="font-bold mb-1">Debug info:</p>
                <code>{this.state.error.message || String(this.state.error)}</code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Component-Level Error Boundary
 * Wraps individual widgets (Chat, Maps, AI Bot, etc.) so a sub-component crash only hides/resets that widget.
 */
export class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ComponentErrorBoundary] Error in component "${this.props.name || 'widget'}":`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center my-2">
          <div className="flex items-center justify-center gap-2 text-amber-600 text-xs font-bold mb-2">
            <AlertTriangle size={16} />
            <span>{this.props.name || 'Component'} is temporarily unavailable</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-3">Something went wrong rendering this element.</p>
          <button 
            onClick={this.handleReset}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-bold text-[11px] rounded-lg hover:bg-gray-100 transition-all inline-flex items-center gap-1"
          >
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Global Error Boundary (Fallback Safety Net)
 */
export class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[GlobalErrorBoundary] Fatal application crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertOctagon size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              We've encountered an unexpected application error. You can reload the page or return home.
            </p>
            
            <div className="space-y-3">
              <Button 
                className="w-full flex justify-center items-center gap-2 rounded-xl"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw size={18} /> Reload Page
              </Button>
              <button 
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex justify-center items-center gap-2"
                onClick={() => window.location.href = '/'}
              >
                <Home size={16} /> Return to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
