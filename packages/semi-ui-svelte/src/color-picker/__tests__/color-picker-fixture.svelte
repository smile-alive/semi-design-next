<script lang="ts">
    import en_US from '@fibrae/semi-foundation/locale/source/en_US';
    import { ConfigProvider } from '../../config-provider';
    import ColorPicker from '../color-picker.svelte';
    import type { ColorPickerProps } from '../interface';

    // an English locale for every render, so a hard-coded Chinese name cannot pass; the snippets are passed only when
    // their flag is on, so absence stays observable
    let { store }: { store: { props: ColorPickerProps; trigger?: boolean; slots?: boolean } } = $props();

    let picker = $state<ColorPicker>();

    export function api() {
        return picker;
    }
</script>

{#snippet trigger()}<button type="button">pick</button>{/snippet}
{#snippet top()}<div class="top-slot">top</div>{/snippet}
{#snippet bottom()}<div class="bottom-slot">bottom</div>{/snippet}

<ConfigProvider locale={en_US}>
    <ColorPicker bind:this={picker} {...store.props} bottomSlot={store.slots ? bottom : undefined} children={store.trigger ? trigger : undefined} topSlot={store.slots ? top : undefined} />
</ConfigProvider>
