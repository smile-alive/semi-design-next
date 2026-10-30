<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/empty/constants';
    import '@fibrae/semi-foundation/empty/empty.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import { TypographyTitle } from '../typography/index.js';
    import type { EmptyProps } from './interface.js';

    const defaults = useDefaultProps('Empty');
    const { layout = defaults('layout', 'vertical'), imageStyle = defaults('imageStyle'), title = defaults('title'), image = defaults('image'), darkModeImage = defaults('darkModeImage'), description, children, ...rest }: EmptyProps = $props();

    // Read after mount only: server render and hydration see null, so the markup matches
    let themeMode = $state<string | null>(null);

    const prefixCls = cssClasses.PREFIX;
    const shown = $derived(themeMode === 'dark' && darkModeImage ? darkModeImage : image);
    const shownSnippet = $derived(typeof shown === 'function' ? shown : undefined);

    // an empty URL is no image; a URL image is decorative (`alt=""`) since title and description describe it
    const src = $derived(typeof shown === 'string' && shown ? shown : undefined);
    const sprite = $derived(typeof shown === 'object' && shown ? shown.id : undefined);
    const hasImage = $derived(Boolean(shownSnippet || src || sprite));

    // Only an Empty with a darkModeImage has anything to switch, so only it observes
    $effect(() => {
        if (!darkModeImage) return;
        const sync = () => {
            themeMode = document.body.getAttribute('theme-mode');
        };
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(document.body, { attributes: true, attributeFilter: ['theme-mode'] });
        return () => observer.disconnect();
    });
</script>

<div {...rest} class={[prefixCls, rest.class, { [`${prefixCls}-${layout}`]: layout }]}>
    <div class={`${prefixCls}-image`} style={imageStyle} x-semi-prop="image,darkModeImage">
        {#if shownSnippet}
            {@render shownSnippet()}
        {:else if src}
            <img alt="" {src} />
        {:else if sprite}
            <svg aria-hidden="true"><use href={`#${sprite}`} /></svg>
        {/if}
    </div>
    <div class={`${prefixCls}-content`}>
        {#if title}
            <!-- styled as a heading but not one: a fixed level would break the page outline -->
            <TypographyTitle class={`${prefixCls}-title`} component="div" heading={hasImage ? 4 : 6} style={hasImage ? undefined : 'font-weight: 400'} x-semi-prop="title">
                {#if typeof title === 'function'}{@render title()}{:else}{title}{/if}
            </TypographyTitle>
        {/if}
        {#if description}
            <div class={`${prefixCls}-description`} x-semi-prop="description">{@render description()}</div>
        {/if}
        {#if children}
            <div class={`${prefixCls}-footer`} x-semi-prop="children">{@render children()}</div>
        {/if}
    </div>
</div>
