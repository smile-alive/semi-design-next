<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import { getLocaleContext } from '../context';

    let { onSeen }: { onSeen: (locale: Locale | null) => void } = $props();

    const context = getLocaleContext();

    $effect(() => {
        onSeen(context?.locale ?? null);
    });
</script>
