<script lang="ts">
    import useDefaultProps from '@fibrae/semi-ui-svelte/_base/use-default-props';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Container from '../container/container.svelte';
    import type { MCPConfigureProps } from './interface.js';
    import MCPConfigureContent from './mcp-configure-content.svelte';

    const defaults = useDefaultProps('MCPConfigure');

    // No fallback on the bindables: a bound `undefined` would throw with one
    let {
        visible = $bindable(),
        options = $bindable(),
        customOptions = $bindable(),
        title = defaults('title'),
        motion = defaults('motion'),
        resizable = defaults('resizable'),
        minWidth = defaults('minWidth'),
        maxWidth = defaults('maxWidth'),
        defaultSize = defaults('defaultSize'),
        showClose = defaults('showClose'),
        closeOnEsc = defaults('closeOnEsc'),
        filter = defaults('filter'),
        placeholder = defaults('placeholder'),
        onStatusChange,
        onSearch,
        onAddClick,
        onConfigureClick,
        onEditClick,
        icon,
        desc,
        item,
        ...rest
    }: MCPConfigureProps = $props();

    const locale = useLocale('Sidebar');

    let container: ReturnType<typeof Container> | undefined = $state();

    /** The `.semi-sidebar-container` element; null while hidden */
    export function getRoot() {
        return container?.getRoot() ?? null;
    }
</script>

<Container {...rest} bind:this={container} bind:visible {closeOnEsc} {defaultSize} {maxWidth} {minWidth} {motion} {resizable} {showClose} title={title ?? locale().locale.mcpConfigure}>
    <MCPConfigureContent bind:customOptions bind:options {desc} {filter} {icon} {item} {onAddClick} {onConfigureClick} {onEditClick} {onSearch} {onStatusChange} {placeholder} />
</Container>
