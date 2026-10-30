<script lang="ts">
    import { untrack } from 'svelte';
    import type { LeftMenuChangeProps } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
    import { setConfigureContext } from './context.js';
    import type { ConfigureHandle, ConfigureProps } from './interface.js';

    let { defaultValue, onChange, children }: ConfigureProps = $props();

    // Items register in one mount pass, each merging onto the value the previous one wrote
    let value = $state.raw<LeftMenuChangeProps>(untrack(() => ({ ...defaultValue })));

    setConfigureContext({
        get view() {
            return value;
        },
        onChange: (changed, init = false) => {
            value = { ...value, ...changed };
            if (!init) {
                onChange?.(value, changed);
            }
        },
        onRemove: (field) => {
            const { [field]: _removed, ...rest } = value;
            value = rest;
            onChange?.(value);
        },
    });

    /** The current value of every item */
    export function getConfigureValue(): ReturnType<ConfigureHandle['getConfigureValue']> {
        return value;
    }
</script>

{@render children?.()}
