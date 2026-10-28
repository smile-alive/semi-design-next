import { createContext } from '../../create-context';

export const [provideProbeContext, useProbeContext] = createContext<{ label: string } | undefined>('Probe', { optional: true });
