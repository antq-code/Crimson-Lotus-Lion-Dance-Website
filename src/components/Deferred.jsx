import { Component, Suspense, useRef } from 'react';
import { useNear, useShownWithoutScrolling } from '../lazyLoad.js';

// If a section fails (e.g. its file didn't download because the connection dropped, or the
// site was redeployed while the page was open), leave it out instead of losing the whole page.
class SectionBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Holds the place of a below-the-fold section (a React.lazy component) until it comes within
// a screen of view or its turn to render comes up anyway (see lazyLoad.js), then downloads
// and renders it.
export default function Deferred({ children, minHeight = '100vh' }) {
  const ref = useRef(null);
  const near = useNear(ref);
  const shown = useShownWithoutScrolling();
  const placeholder = <div ref={ref} data-deferred="" style={{ minHeight }} />;
  if (!near && !shown) return placeholder;
  return (
    <SectionBoundary>
      <Suspense fallback={<div data-deferred="" style={{ minHeight }} />}>{children}</Suspense>
    </SectionBoundary>
  );
}
