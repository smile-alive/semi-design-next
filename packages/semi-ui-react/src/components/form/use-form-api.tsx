import type { BaseFormApi } from '@fibrae/semi-foundation/components/form/interface';
import { useFormApiContext } from './context';

export default function useFormApi<T extends Record<string, any> = any, O = T>() {
    return useFormApiContext() as BaseFormApi<T, O>;
}
