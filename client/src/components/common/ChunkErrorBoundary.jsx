import React from 'react';

export class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    const errorMsg = String(error?.message || '');
    const isChunkError =
      errorMsg.includes('dynamically imported module') ||
      errorMsg.includes('text/html') ||
      errorMsg.includes('Failed to fetch') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      const storageKey = 'chunk_boundary_reload_ts';
      const lastReload = sessionStorage.getItem(storageKey);
      const now = Date.now();

      // Guard against infinite reload loops (allow 1 reload per 10s window)
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  }

  handleManualReload = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container text-center py-5 my-5 text-white">
          <div className="p-4 p-md-5 rounded-4 bg-dark border border-secondary d-inline-block max-w-500">
            <h4 className="text-warning mb-3">Store Updated</h4>
            <p className="text-muted small mb-4">
              A newer version of ORDERLY Mens Wear was just deployed. Please refresh to load the latest checkout experience.
            </p>
            <button
              type="button"
              onClick={this.handleManualReload}
              className="btn btn-danger px-4 py-2 fw-bold"
            >
              Refresh Store
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;

