<script lang="ts" generics="K extends LocaleComponentName">
    import type { LocaleComponentName, LocaleConsumerProps } from './interface.js';
    import useLocale from './use-locale.svelte.js';

    let { componentName, children }: LocaleConsumerProps<K> = $props();

    const locale = useLocale(() => componentName);
</script>

{@render children(locale())}
