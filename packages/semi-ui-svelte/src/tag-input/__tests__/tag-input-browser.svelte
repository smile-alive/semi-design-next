<script lang="ts">
    import { Popover } from '../../popover';
    import { Tooltip } from '../../tooltip';
    import type { TagInputProps } from '../interface';
    import TagInput from '../tag-input.svelte';

    interface Store {
        // 'reject' binds the value through a setter the parent may refuse; 'popover' puts a draggable TagInput in a
        // click Popover; 'tooltip' wraps a TagInput in a Tooltip that hands it its trigger props; 'focus' sits between
        // two buttons so Tab can enter and leave it
        kind: 'reject' | 'popover' | 'tooltip' | 'focus';
        value: string[];
        accept: boolean;
        changes: string[][];
        props: TagInputProps;
    }

    let { store }: { store: Store } = $props();
</script>

{#snippet field()}
    <div style="padding: 20px; width: 300px">
        <TagInput draggable value={['抖音', '火山', '西瓜视频']} />
    </div>
{/snippet}

{#if store.kind === 'reject'}
    <TagInput
        bind:value={
            () => store.value,
            (next) => {
                if (store.accept) store.value = next;
            }
        }
        draggable
        onChange={(next) => store.changes.push(next)}
    />
{:else if store.kind === 'popover'}
    <Popover content={field} position="bottomLeft" trigger="click">
        <button type="button">TagInput In Popover</button>
    </Popover>
{:else if store.kind === 'tooltip'}
    <Tooltip>
        {#snippet content()}tip{/snippet}
        {#snippet child({ props })}
            <TagInput {...props} value={['abc']} />
        {/snippet}
    </Tooltip>
{:else}
    <button type="button">before</button>
    <TagInput value={['抖音', '火山', '西瓜视频']} {...store.props} />
    <button type="button">after</button>
{/if}
