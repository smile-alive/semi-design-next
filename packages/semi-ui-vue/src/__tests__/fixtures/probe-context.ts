import { createContext } from '../../base/create-context';

export const [provideProbeContext, useProbeContext] = createContext<{ label: string } | undefined>('Probe', { optional: true });
