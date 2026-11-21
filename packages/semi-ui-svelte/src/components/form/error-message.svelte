<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { errorMessages, isErrorLeaf } from '@fibrae/semi-foundation/components/form/errors';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import { IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-svelte';
    import { getFormContext } from './context.js';
    import type { ErrorMessageProps } from './interface.js';

    let { error, showValidateIcon, validateStatus, isInInputGroup, errorMessageId, helpTextId, helpText, errorContent, ...rest }: ErrorMessageProps = $props();

    const form = getFormContext()?.formProps;
    const prefix = cssClasses.PREFIX;
    const iconClass = `${prefix}-field-validate-status-icon`;
    const failed = $derived(isErrorLeaf(error));
    const messages = $derived(errorMessages(error));

    // [''] fails without a text; showing the help text instead would look like success
    const rendered = $derived(failed ? messages.length > 0 : Boolean(helpText));
</script>

{#if rendered}
    <div {...rest} class={[form?.classNames?.help, rest.class, { [`${prefix}-field-error-message`]: failed, [`${prefix}-field-help-text`]: helpText }]} style={[form?.styles?.help, rest.style].filter(Boolean).join(';') || undefined}>
        {#if showValidateIcon}
            {#if isInInputGroup || validateStatus === 'error'}
                <IconAlertCircle class={iconClass} />
            {:else if validateStatus === 'warning'}
                <IconAlertTriangle class={iconClass} />
            {/if}
        {/if}
        {#if failed}
            <span id={errorMessageId}>
                {#if errorContent}{@render errorContent({ error: error! })}{:else}{messages.join(', ')}{/if}
            </span>
        {:else}
            <span id={helpTextId}>{@render helpText?.()}</span>
        {/if}
    </div>
{/if}
