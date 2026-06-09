import { Component } from 'react';
import { AlertOctagon, RefreshCcw } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertOctagon size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8">
              We've encountered an unexpected error. Please try refreshing the page.
            </p>
            
            <Button 
              className="w-full flex justify-center items-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw size={18} /> Reload Page
            </Button>
            
            {/* For development/debugging, show error message */}
            {import.meta.env.DEV && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left overflow-auto text-xs text-red-500">
                <code>{this.state.error?.toString()}</code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
