<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/date-picker/constants';
    import { Button } from '../button/index.js';
    import type { FooterProps } from './internal.js';

    let { class: className, style, locale, disabledConfirm = false, onCancel, onConfirm }: FooterProps = $props();

    const prefix = cssClasses.PREFIX;
</script>

<div class={[`${prefix}-footer`, className]} {style}>
    <Button theme="borderless" onclick={() => onCancel()}>{locale.footer.cancel}</Button>
    <Button disabled={disabledConfirm} theme="solid" onclick={() => onConfirm()}>{locale.footer.confirm}</Button>
</div>
