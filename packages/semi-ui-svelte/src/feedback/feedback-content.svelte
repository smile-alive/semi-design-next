<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-foundation/feedback/constants';
    import type { EmojiResult } from '@fibrae/semi-foundation/feedback/foundation';
    import CheckboxGroup from '../checkbox/checkbox-group.svelte';
    import TextArea from '../input/textarea.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { RadioValue } from '../radio/interface.js';
    import RadioGroup from '../radio/radio-group.svelte';
    import type { FeedbackContentProps } from './interface.js';

    let { type, value, textAreaProps, radioGroupProps, checkboxGroupProps, onTextChange, onReasonChange, onEmojiChange, onRadioChange, onCheckboxChange, children, radioLabel, radioExtra, checkboxLabel, checkboxExtra }: FeedbackContentProps = $props();

    const locale = useLocale('Feedback');

    // one name per instance keeps the arrow keys inside this group, even with several Feedbacks on a page
    const emojiGroupName = $props.id();

    const prefix = cssClasses.PREFIX;
    const { Emoji } = strings;
    const emojis = Object.entries(Emoji) as [keyof typeof Emoji, string][];
    const emoji = $derived(type === 'emoji' ? (value as EmojiResult | null)?.emoji : undefined);

    // null (submitted or cancelled) clears the group selection; objects and arrays are no radio value.
    const radioValue = $derived<RadioValue | undefined>(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : undefined);
</script>

{#if type === 'text'}
    <!-- the handler comes last: the foundation calls the caller's own onChange -->
    <TextArea placeholder={locale().locale.placeholder} value={typeof value === 'string' ? value : ''} {...textAreaProps} onChange={onTextChange} />
{:else if type === 'emoji'}
    <!-- APG radio group: native radios provide the arrow keys, single Tab stop and checked state -->
    <div aria-label={locale().locale.rating} class={`${prefix}-emoji-container`} role="radiogroup">
        {#each emojis as [name, item] (item)}
            <label class={[`${prefix}-emoji-item`, { [`${prefix}-emoji-item-selected`]: item === emoji }]} data-value={item}>
                <input aria-label={locale().locale[name]} checked={item === emoji} class={`${prefix}-emoji-input`} name={emojiGroupName} type="radio" value={item} onchange={() => onEmojiChange(item)} />
                <span aria-hidden="true" class={`${prefix}-emoji-glyph`}>{item}</span>
            </label>
        {/each}
    </div>
    {#if emoji === Emoji.bad}
        <TextArea placeholder={locale().locale.placeholderOptional} {...textAreaProps} onChange={onReasonChange} />
    {/if}
{:else if type === 'radio'}
    <div class={`${prefix}-radio-container`}>
        <RadioGroup direction="vertical" extra={radioExtra} label={radioLabel} value={radioValue} {...radioGroupProps} onChange={onRadioChange} />
    </div>
{:else if type === 'checkbox'}
    <div class={`${prefix}-checkbox-container`}>
        <CheckboxGroup direction="vertical" extra={checkboxExtra} label={checkboxLabel} value={Array.isArray(value) ? value : []} {...checkboxGroupProps} onChange={onCheckboxChange} />
    </div>
{:else}
    {@render children?.()}
{/if}
