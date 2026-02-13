import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '1rem', backgroundColor: '#ffe6e6' }}>
          <strong>Something went wrong in the editor.</strong>
          <div>Please reload the page or try again.</div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
