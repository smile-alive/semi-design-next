import { type WatchOptions, watch } from 'vue';

export default function useDidUpdate<T>(source: () => T, onChange: (value: T, previous: T) => void, isEqual: (a: T, b: T) => boolean = Object.is, flush: WatchOptions['flush'] = 'post') {
    let previous = source();

    watch(
        source,
        (value) => {
            if (!isEqual(previous, value)) {
                const committed = previous;
                previous = value;
                onChange(value, committed);
            }
        },
        { flush }
    );
}
