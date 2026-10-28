import type React from 'react';
import { useFormStateContext } from '../context';

export default function withFormState<P extends { formState?: unknown }>(Component: React.ComponentType<P>) {
    function WithStateCom(props: Omit<P, 'formState'> & Partial<Pick<P, 'formState'>>) {
        const formState = useFormStateContext();
        const Inner = Component as React.ComponentType<Record<string, unknown>>;
        return <Inner formState={formState} {...props} />;
    }
    return WithStateCom as React.ComponentType<Omit<P, 'formState'> & Partial<Pick<P, 'formState'>> & React.RefAttributes<unknown>>;
}
