<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    // aliased: the generated declaration names this component `Select` after its file
    import { Select as SemiSelect } from '@fibrae/semi-ui-svelte/select/index';
    import ConfigureItem from './configure-item.svelte';
    import type { ConfigureSelectProps } from './interface.js';

    let props: ConfigureSelectProps = $props();
</script>

<ConfigureItem {...props} baseClass={`${cssClasses.PREFIX}-footer-configure-select`} component={SemiSelect} />
