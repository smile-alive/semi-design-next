import { type ComputedRef, computed, shallowRef, watch } from 'vue';

export default function useControllable<T>(get: () => T | undefined, getDefault: () => T | undefined, onChange: (value: T) => void, { keepLastControlled = false }: { keepLastControlled?: boolean } = {}): [ComputedRef<T | undefined>, (value: T) => void] {
    const initial = get();

    const local = shallowRef<T | undefined>(initial !== undefined ? initial : getDefault());

    const value = computed(() => (get() !== undefined ? get() : local.value));

    const set = (next: T) => {
        if (get() === undefined) {
            local.value = next;
        }
        onChange(next);
    };

    watch(
        get,
        (value) => {
            if (value !== undefined && keepLastControlled) {
                local.value = value;
            } else if (value === undefined && !keepLastControlled) {
                local.value = undefined;
            }
        },
        { flush: 'sync' }
    );

    return [value, set];
}
