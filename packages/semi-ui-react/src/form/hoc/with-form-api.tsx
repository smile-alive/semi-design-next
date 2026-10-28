import type React from 'react';
import { useFormApiContext } from '../context';

export default function withFormApi<P extends { formApi?: unknown }>(Component: React.ComponentType<P>) {
    function WithApiCom(props: Omit<P, 'formApi'> & Partial<Pick<P, 'formApi'>>) {
        const formApi = useFormApiContext();
        const Inner = Component as React.ComponentType<Record<string, unknown>>;
        return <Inner formApi={formApi} {...props} />;
    }
    return WithApiCom as React.ComponentType<Omit<P, 'formApi'> & Partial<Pick<P, 'formApi'>> & React.RefAttributes<unknown>>;
}
