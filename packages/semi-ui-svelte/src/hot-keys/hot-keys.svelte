<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/hot-keys/constants';
    import HotKeysFoundation, { type HotKeysAdapter, type HotKeysBaseProps } from '@fibrae/semi-foundation/hot-keys/foundation';
    import '@fibrae/semi-foundation/hot-keys/hot-keys.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import type { HotKeysProps } from './interface.js';

    type Foundation = HotKeysFoundation<HotKeysBaseProps>;
    type Adapter = HotKeysAdapter<HotKeysBaseProps>;

    const defaults = useDefaultProps('HotKeys');
    let { hotKeys, content = defaults('content'), preventDefault = defaults('preventDefault', false), getListenerTarget = defaults('getListenerTarget'), onHotKey, children, ...rest }: HotKeysProps = $props();

    const foundationProps: HotKeysBaseProps = {
        get hotKeys() {
            return hotKeys;
        },
        get preventDefault() {
            return preventDefault;
        },
        get getListenerTarget() {
            return getListenerTarget;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, HotKeysBaseProps, object>(
        HotKeysFoundation,
        foundationProps,
        () => ({}),
        () => ({ notifyHotKey: (event) => onHotKey?.(event) })
    );

    watch(() => getListenerTarget, foundation.handleTargetChange);

    // read item by item so an in-place edit of a reactive array also re-validates
    watch(() => [...hotKeys], foundation.handleHotKeysChange);
</script>

<div {...rest} class={[cssClasses.PREFIX, rest.class]}>
    {#if children}
        {@render children()}
    {:else}
        {#each content ?? hotKeys as key, index (index)}
            <span
                >{#if index > 0}<span class="{cssClasses.PREFIX}-split">+</span>{/if}<span class="{cssClasses.PREFIX}-content">{key}</span></span
            >
        {/each}
    {/if}
</div>
