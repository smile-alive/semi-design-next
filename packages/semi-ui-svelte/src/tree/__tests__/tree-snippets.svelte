<script lang="ts">
    import type { TreeProps } from '../interface';
    import Tree from '../tree.svelte';
    import { treeData } from './data';

    let { kind, props = {}, log = [] }: { kind: 'label' | 'icon' | 'expandIcon' | 'fullLabel' | 'search' | 'emptyContent' | 'draggingNode' | 'button'; props?: TreeProps; log?: string[] } = $props();
</script>

{#if kind === 'label'}
    <Tree {treeData} {...props}>
        {#snippet label({ item, label, searchWord })}
            <b class="custom-label">{label}|{item.key}|{searchWord}</b>
        {/snippet}
    </Tree>
{:else if kind === 'icon'}
    <Tree {treeData} {...props}>
        {#snippet icon({ item, expanded, isLeaf })}
            <i class="custom-icon">{item.key}:{expanded}:{isLeaf}</i>
        {/snippet}
    </Tree>
{:else if kind === 'expandIcon'}
    <Tree {treeData} {...props}>
        {#snippet expandIcon({ onClick, class: className, expanded })}
            <button class={className} type="button" onclick={onClick}>{expanded ? '-' : '+'}</button>
        {/snippet}
    </Tree>
{:else if kind === 'fullLabel'}
    <Tree {treeData} {...props}>
        {#snippet fullLabel({ data, class: className, expandIcon, onClick, onExpand, expandStatus })}
            <div class={className} data-testid="full-{data.key}" role="none" onclick={onClick}>
                {@render expandIcon()}
                <span>{data.label}</span>
                <button type="button" onclick={onExpand}>{expandStatus.expanded ? 'close' : 'open'} {data.label}</button>
            </div>
        {/snippet}
    </Tree>
{:else if kind === 'search'}
    <Tree filterTreeNode {treeData} {...props}>
        {#snippet search({ class: className, value, placeholder, onChange })}
            <input aria-label="custom search" class={className} {placeholder} {value} oninput={(event) => onChange(event.currentTarget.value)} />
        {/snippet}
    </Tree>
{:else if kind === 'emptyContent'}
    <Tree treeData={[]} {...props}>
        {#snippet emptyContent()}
            diy empty
        {/snippet}
    </Tree>
{:else if kind === 'draggingNode'}
    <Tree draggable {treeData} {...props}>
        {#snippet renderDraggingNode({ node })}
            <span class="drag-image">{node.label}</span>
        {/snippet}
    </Tree>
{:else}
    <Tree {treeData} {...props}>
        {#snippet label({ label })}
            <button
                type="button"
                onclick={(event) => {
                    event.stopPropagation();
                    log.push(`click ${label}`);
                }}>open {label}</button
            >
        {/snippet}
    </Tree>
{/if}
