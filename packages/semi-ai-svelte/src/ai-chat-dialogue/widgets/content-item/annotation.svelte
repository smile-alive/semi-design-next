<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconChevronRight } from '@fibrae/semi-icons-svelte';
    import AvatarGroup from '@fibrae/semi-ui-svelte/avatar/avatar-group.svelte';
    import Avatar from '@fibrae/semi-ui-svelte/avatar/avatar.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import type { AnnotationItemProps, AnnotationWidgetProps } from '../../interface.js';

    let { maxCount, annotation, description, onClick, ...rest }: AnnotationWidgetProps = $props();

    const locale = useLocale('AIChatDialogue');

    const prefixCls = cssClasses.PREFIX_ANNOTATION;
    const items = $derived(annotation as AnnotationItemProps[]);
    const avatars = $derived(items.filter((item) => item.logo).map((item) => ({ alt: item.title, class: `${prefixCls}-content-logo`, src: item.logo })));

    const onKeydown = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick?.(event, items);
        }
        rest.onkeydown?.(event);
    };
</script>

<div
    {...rest}
    class={[`${prefixCls}-wrapper`, rest.class]}
    role="button"
    tabindex="0"
    onclick={(event) => {
        onClick?.(event, items);
        rest.onclick?.(event);
    }}
    onkeydown={onKeydown}
>
    <div class="{prefixCls}-content">
        <AvatarGroup items={avatars} {maxCount} overlapFrom="end" size="extra-extra-small">
            {#snippet more({ restNumber })}
                <Avatar alt={locale().locale.more} class="{prefixCls}-content-logo-renderMore" size="extra-extra-small">{`+${restNumber}`}</Avatar>
            {/snippet}
        </AvatarGroup>
        <div class="{prefixCls}-content-description">
            {description || `${annotation.length} ${locale().locale.annotationText}`}
        </div>
        <div class="{prefixCls}-content-icon"><IconChevronRight /></div>
    </div>
</div>
