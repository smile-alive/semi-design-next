export { default as ConfigProvider } from './config-provider.svelte';
export { default as ConfigConsumer } from './config-consumer.svelte';
export { getConfigContext as useConfig } from './context.js';
export { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';
export type { ConfigConsumerProps, ConfigProviderProps, ContextValue } from './interface.js';
export type { ResponsiveMap, BreakpointScreens, Breakpoint, OnBreakpointScreensCallback, OnBreakpointChangeCallback } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
