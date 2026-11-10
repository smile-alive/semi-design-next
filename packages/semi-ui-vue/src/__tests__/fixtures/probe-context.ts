import { createContext } from '../../base/index';

export const [provideProbeContext, useProbeContext] = createContext<{ label: string } | undefined>('Probe', { optional: true });
