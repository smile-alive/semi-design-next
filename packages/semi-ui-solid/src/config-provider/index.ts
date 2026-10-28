import { defaultResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
import ConfigProvider from './config-provider';

export default Object.assign(ConfigProvider, { defaultResponsiveMap });
export { default as ConfigConsumer } from './config-consumer';
export { default as useConfig } from './use-config';
export { defaultResponsiveMap };
export type { ConfigProviderProps } from './config-provider';
export type { ConfigConsumerProps } from './config-consumer';
export type { ContextValue } from './context';
export type { ResponsiveMap, BreakpointScreens, Breakpoint, OnBreakpointScreensCallback, OnBreakpointChangeCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
