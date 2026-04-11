import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const pageName = this.props.pageName || 'Page';
      return (
        <div className="error-boundary-card">
          <div className="error-boundary-icon">!</div>
          <h2 className="error-boundary-title">{pageName}</h2>
          <p className="error-boundary-message">Something went wrong.</p>
          <button className="error-boundary-reload" onClick={this.handleReload}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
