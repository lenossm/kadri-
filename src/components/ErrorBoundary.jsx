import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="not-found">
          <span className="eyebrow">KADRI / ERROR</span>
          <h1>This cut<br /><em>didn’t load.</em></h1>
          <button className="primary-button" type="button" onClick={() => window.location.assign('/')}>Back to KADRI</button>
        </div>
      );
    }
    return this.props.children;
  }
}
