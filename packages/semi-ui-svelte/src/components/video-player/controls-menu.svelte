<script lang="ts" generics="T extends string | number">
    import { cssClasses } from '@fibrae/semi-foundation/components/video-player/constants';
    import { Dropdown, DropdownItem, DropdownMenu, type DropdownTriggerProps } from '../dropdown/index.js';
    import type { ControlsMenuProps } from './interface.js';

    let { classNames, current, label, list, styles, onSelect }: ControlsMenuProps<T> = $props();

    const controlsCls = cssClasses.PREFIX_CONTROLS;
    const currentLabel = $derived(list.find((option) => option.value === current)?.label ?? String(current));
    const buttonName = $derived([label, currentLabel].filter(Boolean).join(' '));
</script>

{#snippet trigger({ props }: { props: DropdownTriggerProps })}
    <button {...props} aria-label={buttonName} class={[props.class, `${controlsCls}-menu-item`, `${controlsCls}-popup`]} type="button">
        {currentLabel}
    </button>
{/snippet}

<Dropdown child={trigger} class={`${controlsCls}-popup-menu`} classNames={{ content: classNames?.dropdown }} position="top" selectionMode="single" styles={{ content: styles?.dropdown }}>
    {#snippet content()}
        <DropdownMenu>
            {#each list as option (option.value)}
                <DropdownItem active={option.value === current} class={`${controlsCls}-popup-menu-item`} onclick={() => onSelect?.(option)}>
                    {option.label}
                </DropdownItem>
            {/each}
        </DropdownMenu>
    {/snippet}
</Dropdown>
