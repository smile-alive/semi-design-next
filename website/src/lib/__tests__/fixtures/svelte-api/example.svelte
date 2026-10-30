<script lang="ts" module>
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';

    const strings = { SIZE: 'small' } as const;

    export interface ExampleProps extends HTMLAttributes<HTMLDivElement> {
        value?: string;
        label?: string;
        size?: 'small' | 'large';
        onChange?: (value: string) => void;
        item?: Snippet<[{ index: number }]>;
    }

    // Stands in for _base/use-default-props: the generator only reads the fallback each call passes
    function useDefaultProps(_name: string) {
        return <T>(_key: string, fallback?: T) => fallback;
    }

    // A module export is not an instance method
    export function helper() {
        return strings.SIZE;
    }
</script>

<script lang="ts">
    const defaults = useDefaultProps('Example');

    let { value = $bindable(), label = defaults('label'), size = defaults('size', strings.SIZE), onChange, item, children, ...rest }: ExampleProps = $props();

    export function focus() {}

    export function reset(next: string): void {
        value = next;
        onChange?.(next);
    }
</script>

<div {...rest} data-size={size}>{label}{value}{@render item?.({ index: 0 })}{@render children?.()}</div>
