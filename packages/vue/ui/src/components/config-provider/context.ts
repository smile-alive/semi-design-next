import type { ComputedRef } from 'vue';
import { createContext } from '../../base/create-context';
import type { ContextValue } from './interface';

export const [provideConfigContext, useConfigContext] = createContext<ComputedRef<ContextValue>>('ConfigProvider', { optional: true });
export type { ContextValue } from './interface';
