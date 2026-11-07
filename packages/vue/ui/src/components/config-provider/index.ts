import { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';
import ConfigProvider from './config-provider.vue';

// Annotated so declaration emit refers to the SFC type instead of inlining it with Vue's GlobalComponents.
const ConfigProviderWithMap: typeof ConfigProvider & { defaultResponsiveMap: typeof defaultResponsiveMap } = Object.assign(ConfigProvider, { defaultResponsiveMap });
export default ConfigProviderWithMap;
export { default as ConfigConsumer } from './config-consumer.vue';
export { default as useConfig } from './use-config';
export { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';
export type { ConfigProviderProps, ConfigProviderSlots, ConfigConsumerSlots, ContextValue } from './interface';
export type { ResponsiveMap, BreakpointScreens, Breakpoint, OnBreakpointScreensCallback, OnBreakpointChangeCallback } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
