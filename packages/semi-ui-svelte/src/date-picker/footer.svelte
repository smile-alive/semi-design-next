<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
    import { Button } from '../button/index.js';
    import type { FooterProps } from './internal.js';

    let { locale, disabledConfirm = false, onCancel, onConfirm }: FooterProps = $props();

    const prefix = cssClasses.PREFIX;
</script>

<div class={`${prefix}-footer`}>
    <Button theme="borderless" onclick={() => onCancel()}>{locale.footer.cancel}</Button>
    <Button disabled={disabledConfirm} theme="solid" onclick={() => onConfirm()}>{locale.footer.confirm}</Button>
</div>
