import { createContext } from '@fibrae/semi-ui-svelte/base/create-context';

export const [getReachable, setReachable] = createContext<string>('Reachable', { defaultValue: 'none' });
