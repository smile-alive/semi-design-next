<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
    import type { DropdownDividerProps } from './interface.js';

    let { children: _children, ...rest }: DropdownDividerProps = $props();
</script>

<!-- A child of the menu ul, which accepts only li; APG exposes a group boundary of a menu as a separator. -->
<li {...rest} class={[`${cssClasses.PREFIX}-divider`, rest.class]} role="separator"></li>
