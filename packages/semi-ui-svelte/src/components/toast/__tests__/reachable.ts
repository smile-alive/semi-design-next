import { createContext } from '@fibrae/semi-ui-svelte/base';

export const [getReachable, setReachable] = createContext<string>('Reachable', { defaultValue: 'none' });
