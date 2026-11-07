<script lang="ts">
    import { Popover } from '@fibrae/semi-ui-svelte/popover/index';
    import { Rating } from '@fibrae/semi-ui-svelte/rating/index';
    import { AIChatInput } from '../index';
    import type { AIChatInputActionAreaSnippetProps, AIChatInputHandle, AIChatInputProps, AIChatInputSkillItemSnippetProps, AIChatInputSuggestionItemSnippetProps, AIChatInputTemplateSnippetProps, AIChatInputTopSlotSnippetProps, AIChatInputUploadButtonSnippetProps } from '../interface';

    export interface InputHostStore {
        props: AIChatInputProps;
        /** Which snippets the host passes; each one records its arguments under its own name in `calls` */
        slots: {
            topSlot?: boolean;
            reference?: boolean;
            uploadTip?: boolean;
            uploadButton?: boolean;
            actionArea?: 'default' | 'twice';
            suggestionItem?: boolean;
            skillItem?: boolean;
            skillIcon?: boolean;
            /** 'nested' puts an already open Popover inside the template */
            template?: boolean | 'nested';
            configure?: { model?: boolean; search?: boolean | 'init'; mcp?: boolean | number; radio?: boolean; custom?: boolean };
        };
        handle?: AIChatInputHandle;
    }

    // `calls` is a plain object: recording from a snippet is a write inside a template expression, which a $state forbids
    let { store, calls }: { store: InputHostStore; calls: Record<string, unknown[]> } = $props();

    const record = (name: string, value: unknown) => (calls[name] ??= []).push(value);

    const modelOptions = [{ label: 'A', value: 'a' }];
    const radioOptions = [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
    ];
</script>

{#snippet topSlot(args: AIChatInputTopSlotSnippetProps)}
    {record('topSlot', args)}
    <div class="slot"></div>
{/snippet}

{#snippet reference({ item }: { item: { id: string } })}
    <i>{item.id}</i>
{/snippet}

{#snippet uploadTip()}
    tip
{/snippet}

{#snippet uploadButton(args: AIChatInputUploadButtonSnippetProps)}
    {record('uploadButton', args)}
    <span class="mine">{@render args.defaultNode()}</span>
{/snippet}

{#snippet actionArea({ upload, send, class: className }: AIChatInputActionAreaSnippetProps)}
    {record('actionArea', { class: className })}
    <div class="{className} mine">
        {@render upload()}
        {@render send()}
        {#if store.slots.actionArea === 'twice'}
            <span>{@render upload()}</span>
        {/if}
    </div>
{/snippet}

{#snippet suggestionItem(args: AIChatInputSuggestionItemSnippetProps)}
    {record('suggestionItem', args)}
    <button aria-selected={args['aria-selected']} class={args.class} id={args.id} role={args.role} type="button" onclick={args.onclick}>{`${String(args.suggestion)}!`}</button>
{/snippet}

{#snippet skillItem(args: AIChatInputSkillItemSnippetProps)}
    <div aria-selected={args['aria-selected']} class={args.class} id={args.id} role={args.role} onclick={args.onclick} onmouseenter={args.onmouseenter}>
        {args.skill.label}!
    </div>
{/snippet}

{#snippet skillIcon({ item }: { item: { value?: string } })}
    <b class="icon">{item.value}</b>
{/snippet}

{#snippet template({ skill, onTemplateClick }: AIChatInputTemplateSnippetProps)}
    {record('template', { skill })}
    <button class="tpl" type="button" onclick={() => onTemplateClick('<p>from template</p>')}>{skill?.label ?? 'none'}</button>
    {#if store.slots.template === 'nested'}
        <Popover motion={false} trigger="custom" visible>
            <button type="button">nested trigger</button>
            {#snippet content()}
                <button type="button">inside nested</button>
            {/snippet}
        </Popover>
    {/if}
{/snippet}

{#snippet configureArea()}
    {#if store.slots.configure?.model}
        <AIChatInput.Configure.Select field="model" initValue="a" optionList={modelOptions} />
    {/if}
    {#if store.slots.configure?.search}
        <AIChatInput.Configure.Button field="search" initValue={store.slots.configure.search === 'init' ? true : undefined}>Search</AIChatInput.Configure.Button>
    {/if}
    {#if store.slots.configure?.radio}
        <AIChatInput.Configure.RadioButton field="mode" initValue={1} options={radioOptions} />
    {/if}
    {#if store.slots.configure?.custom}
        <AIChatInput.Configure.Item component={Rating} field="stars" initValue={2} />
    {/if}
    {#if store.slots.configure?.mcp}
        <AIChatInput.Configure.Mcp
            num={typeof store.slots.configure.mcp === 'number' ? store.slots.configure.mcp : undefined}
            options={[
                { label: 'one', value: '1' },
                { label: 'two', value: '2' },
            ]}
        />
    {/if}
{/snippet}

<AIChatInput
    bind:this={store.handle}
    {...store.props}
    actionArea={store.slots.actionArea ? actionArea : undefined}
    configureArea={store.slots.configure ? configureArea : undefined}
    reference={store.slots.reference ? reference : undefined}
    skillIcon={store.slots.skillIcon ? skillIcon : undefined}
    skillItem={store.slots.skillItem ? skillItem : undefined}
    suggestionItem={store.slots.suggestionItem ? suggestionItem : undefined}
    template={store.slots.template ? template : undefined}
    topSlot={store.slots.topSlot ? topSlot : undefined}
    uploadButton={store.slots.uploadButton ? uploadButton : undefined}
    uploadTip={store.slots.uploadTip ? uploadTip : undefined}
/>
