<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import '@fibrae/semi-foundation/form/form.scss';
    import { IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-svelte';
    import type { ErrorMessageProps } from './interface.js';
    import { errorText, hasErrorContent } from './utils.js';

    let { error, showValidateIcon, validateStatus, isInInputGroup, errorMessageId, helpTextId, helpText, errorContent, ...rest }: ErrorMessageProps = $props();

    const prefix = cssClasses.PREFIX;
    const iconClass = `${prefix}-field-validate-status-icon`;

    const rendered = $derived.by(() => {
        if (!error && !helpText) {
            return false;
        }
        // async-validator's `message: ''` means "failed, but hide the text"; showing helpText would look like success
        if (error === '' && validateStatus === 'error') {
            return false;
        }
        return !(Array.isArray(error) && !hasErrorContent(error) && !helpText);
    });

    const textRendered = $derived(error ? hasErrorContent(error) : Boolean(helpText));
</script>

{#if rendered}
    <div {...rest} class={[rest.class, { [`${prefix}-field-error-message`]: Boolean(error), [`${prefix}-field-help-text`]: Boolean(helpText) }]}>
        {#if textRendered}
            {#if showValidateIcon}
                {#if isInInputGroup || validateStatus === 'error'}
                    <IconAlertCircle class={iconClass} />
                {:else if validateStatus === 'warning'}
                    <IconAlertTriangle class={iconClass} />
                {/if}
            {/if}
            <!-- the span id is the target of aria-errormessage and aria-describedby -->
            {#if error}
                <span id={errorMessageId}>
                    {#if errorContent}{@render errorContent({ error })}{:else}{errorText(error)}{/if}
                </span>
            {:else}
                <span id={helpTextId}>{@render helpText?.()}</span>
            {/if}
        {/if}
    </div>
{/if}
