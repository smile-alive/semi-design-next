import { requireFormContext } from '../context';
import type { FormApi } from '../interface';

export default function useFormApi<Values extends Record<string, any> = any>(): FormApi<Values> {
    return requireFormContext('useFormApi').formApi;
}
