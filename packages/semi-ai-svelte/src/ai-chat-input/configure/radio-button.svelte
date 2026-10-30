<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { RadioGroup } from '@fibrae/semi-ui-svelte/radio/index';
    import ConfigureItem from './configure-item.svelte';
    import type { ConfigureRadioButtonProps } from './interface.js';

    let props: ConfigureRadioButtonProps = $props();
</script>

<ConfigureItem {...props} baseClass={`${cssClasses.PREFIX}-footer-configure-radio-button`} component={RadioGroup} defaultProps={{ type: 'button' }} valuePath="target.value" />
