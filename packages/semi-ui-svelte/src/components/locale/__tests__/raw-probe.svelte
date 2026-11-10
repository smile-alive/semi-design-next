<script lang="ts">
    import type { LocaleInput } from '@fibrae/semi-ui-svelte/locale';
    import { getLocaleContext } from '../context';

    let { onSeen }: { onSeen: (locale: LocaleInput | null) => void } = $props();

    const context = getLocaleContext();

    $effect(() => {
        onSeen(context?.locale ?? null);
    });
</script>
