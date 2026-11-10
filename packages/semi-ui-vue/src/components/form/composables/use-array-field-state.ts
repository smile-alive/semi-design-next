import { type ComputedRef, computed } from 'vue';
import { type ArrayFieldContextValue, useArrayFieldContext } from '../context';

/** Internal: whether the caller renders inside an ArrayField, and the values its rows start from */
export default function useArrayFieldState(): ComputedRef<Omit<ArrayFieldContextValue, 'keepState'> & { keepState?: boolean; inArrayField: boolean }> {
    const context = useArrayFieldContext();

    return computed(() => (context ? { ...context.value, inArrayField: true } : { shouldUseInitValue: true, inArrayField: false }));
}
