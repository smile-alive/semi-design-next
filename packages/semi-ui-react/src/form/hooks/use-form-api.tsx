import type { BaseFormApi } from '@fibrae/semi-foundation/form/interface';
import { useFormApiContext } from '../context';

export default function useFormApi<T extends Record<string, any> = any>() {
    return useFormApiContext() as BaseFormApi<T>;
}
