import { createContext } from '../../_base/create-context';

export const [getReachable, setReachable] = createContext<string>('Reachable', { defaultValue: 'none' });
