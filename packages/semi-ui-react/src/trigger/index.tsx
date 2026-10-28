import type React from 'react';

export interface TriggerProps<P> {
    triggerRender: (props: P) => React.ReactNode;
}

/**
 * Renders `triggerRender` as its own component so its hooks do not run inside the popup component
 */
export default function Trigger<P extends object>({ triggerRender, ...rest }: P & TriggerProps<P>) {
    return triggerRender(rest as P);
}
