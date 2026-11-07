import { createContext } from '../../../base/create-context';

export const [getReachable, setReachable] = createContext<string>('Reachable', { defaultValue: 'none' });
