// Solid applies signal writes synchronously, so the framework-free mocks need no wrapper that waits for a re-render
export * from './function';
export * from './dom/common';
export * from './table/data';
export { mockMatchMediaCore as mockMatchMedia } from './dom/match-media-core';
export { mockResizeObserverCore as mockResizeObserver } from './dom/resize-observer-core';
