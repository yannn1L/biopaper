/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { BioPaperEngine } from './game/BioPaperEngine.js';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountEl = containerRef.current;
    if (!mountEl) return;

    const engine = new BioPaperEngine(mountEl);
    let disposed = false;

    engine.start().then(() => {
      if (disposed) {
        engine.destroy();
      }
    });

    return () => {
      disposed = true;
      engine.destroy();
    };
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#161824] flex items-center justify-center select-none">
      <div
        ref={containerRef}
        className="flex items-center justify-center"
        aria-label="BioPaper Arena 9:16 Portrait Canvas"
      />
    </main>
  );
}
