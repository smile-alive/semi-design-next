<script setup lang="ts">
    import { type StyleValue, computed, h, mergeProps, nextTick, onMounted, shallowRef, useAttrs, useTemplateRef, watch, watchEffect } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
    import { canUseCSSEllipsis, getEllipsisOpt, getRenderText, isInsideWidgetItem, isOverflowing } from '@fibrae/semi-foundation/typography/ellipsis';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/typography/typography.scss';
    import { hasClickListener } from '../_base/control-attrs';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover/popover.vue';
    import Tooltip from '../tooltip/tooltip.vue';
    import TypographyContent from './content.vue';
    import { provideTypographyContext, useTypographyContext } from './context';
    import type { TypographyBaseSize, TypographyTextEmits, TypographyTextSlots } from './interface';
    import type { DecorationTag, EllipsisView, ResolvedCopyConfig, TypographyBaseProps } from './internal';
    import NumeralNodes from './numeral-nodes.vue';
    import slotText, { trimEdgeText } from './slot-text';
    import useEllipsis from './use-ellipsis';

    // attrs land on the text element, which a Tooltip or Popover would not pass them to.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TypographyBaseProps>(), {
        component: undefined,
        copyable: false,
        code: false,
        delete: false,
        disabled: false,
        ellipsis: false,
        link: false,
        mark: false,
        strong: false,
        type: 'primary',
        underline: false,
        size: 'normal',
        spacing: 'normal',
        weight: undefined,
        headingTag: undefined,
        format: undefined,
    });

    const emit = defineEmits<TypographyTextEmits>();
    const slots = defineSlots<Omit<TypographyTextSlots, 'default'>>();
    const attrs = useAttrs();

    const locale = useLocale('Typography');
    const inherited = useTypographyContext();

    const content = useTemplateRef('content');
    const insideWidgetItem = shallowRef(false);

    const prefix = cssClasses.PREFIX;
    const realSize = computed<TypographyBaseSize>(() => (props.size === 'inherit' ? (inherited?.value ?? 'normal') : props.size));
    const text = computed(() => slotText(props.nodes, props.format));
    const hasEllipsis = computed(() => Boolean(props.ellipsis));
    const nodes = computed(() => (hasEllipsis.value ? trimEdgeText(props.nodes) : props.nodes));
    const opt = computed(() => getEllipsisOpt(props.ellipsis, locale.value.locale.expand, locale.value.locale.collapse));
    const cssEllipsis = computed(() => hasEllipsis.value && canUseCSSEllipsis(opt.value, props.copyable));

    const tooltip = computed(() => {
        const { showTooltip, expandable, expandText } = opt.value;
        if (!showTooltip || expandable || expandText !== undefined) return false;
        const config = typeof showTooltip === 'object' ? showTooltip : {};
        return { popover: config.type === 'popover', opts: config.opts ?? {} };
    });

    // Switched by condition rather than unmounted, so the text element is not replaced when overflow changes
    const conditionOn = computed(() => tooltip.value !== false && tooltip.value.opts.condition !== false);
    const weightStyle = computed(() => (isNaN(Number(props.weight)) ? {} : { fontWeight: props.weight }));
    const linkClass = computed(() => (props.link ? [`${prefix}-link-text`, { [`${prefix}-link-underline`]: props.underline }] : undefined));

    const copyConfig = computed<false | ResolvedCopyConfig>(() => {
        if (!props.copyable) return false;
        const config = typeof props.copyable === 'object' ? props.copyable : {};
        return {
            content: config.content ?? text.value.text,
            duration: config.duration ?? 3,
            class: config.class,
            style: config.style,
        };
    });

    provideTypographyContext(realSize);

    // isTruncated starts out true so the expand button is rendered and the measurement takes its width into account.
    const resetView = (ellipsisContent: string): EllipsisView => ({
        isOverflowed: false,
        ellipsisContent,
        expanded: false,
        isTruncated: true,
    });

    const view = shallowRef<EllipsisView>({ ...resetView(text.value.text), isTruncated: hasEllipsis.value });

    const overflowed = computed(() => !view.value.expanded && (cssEllipsis.value ? view.value.isOverflowed : view.value.isTruncated));

    const tooltipBinding = computed(() => ({
        position: 'top' as const,
        ...(tooltip.value && tooltip.value.opts),
        condition: overflowed.value && conditionOn.value,
    }));

    const popoverBinding = computed(() => ({
        showArrow: true,
        ...tooltipBinding.value,
        class: [`${prefix}-ellipsis-popover`, tooltip.value && tooltip.value.opts.class],
    }));

    const actionText = computed(() => {
        if (!view.value.isTruncated) return undefined;
        return view.value.expanded ? opt.value.collapseText : opt.value.expandText;
    });

    // an expanded text that cannot collapse lost its button, so the text takes its focus
    const focusTarget = computed(() => view.value.expanded && actionText.value === undefined);

    const ellipsisClass = computed(() => {
        if (!hasEllipsis.value) return [];
        const { rows } = opt.value;
        const cssActive = !view.value.expanded && cssEllipsis.value;
        const inline = props.component === 'span';
        return {
            [`${prefix}-ellipsis`]: true,
            [`${prefix}-ellipsis-single-line`]: rows === 1,
            [`${prefix}-ellipsis-multiple-line`]: rows > 1,
            [`${prefix}-ellipsis-multiple-line-text`]: rows > 1 && inline,
            [`${prefix}-ellipsis-overflow-ellipsis`]: rows === 1 && cssActive,
            [`${prefix}-ellipsis-overflow-ellipsis-text`]: rows === 1 && cssActive && inline,
        };
    });

    const ellipsisStyle = computed(() => (!view.value.expanded && cssEllipsis.value && opt.value.rows > 1 ? { WebkitLineClamp: opt.value.rows } : {}));

    const wrapperClass = computed(() => {
        const { type, link, disabled, spacing, headingTag, weight } = props;
        return [
            ellipsisClass.value,
            {
                [`${prefix}-${type}`]: type && !link,
                [`${prefix}-${realSize.value}`]: realSize.value,
                [`${prefix}-link`]: link,
                [`${prefix}-disabled`]: disabled,
                [`${prefix}-${spacing}`]: spacing,
                [`${prefix}-${headingTag}`]: headingTag,
                [`${prefix}-${headingTag}-weight-${weight}`]: headingTag && weight && isNaN(Number(weight)),
            },
        ];
    });

    const update = (patch: Partial<EllipsisView>) => {
        const prev = view.value;
        if ((Object.keys(patch) as (keyof EllipsisView)[]).every((key) => Object.is(prev[key], patch[key]))) return;
        view.value = { ...prev, ...patch };
    };

    const measure = () => {
        const node = content.value?.root;
        if (!node) return;
        insideWidgetItem.value = isInsideWidgetItem(node, content.value.copyElement());
        const { rows, suffix, pos } = opt.value;
        if (cssEllipsis.value) {
            // A text that switched here from an expandable ellipsis must not stay expanded. The Tooltip depends on
            // isOverflowed: measuring only on hover would leave the first hover without it
            update({ isTruncated: false, expanded: false, ...(opt.value.showTooltip && { isOverflowed: isOverflowing(node, rows) }) });
            return;
        }
        if (props.nodes.length === 0) {
            update({ isTruncated: false, isOverflowed: false });
            return;
        }
        warning(!text.value.pure, '[Semi Typography] Only children with pure text could be used with ellipsis at this moment.');
        if (!rows || rows < 0 || view.value.expanded) return;
        const full = text.value.text;
        const ellipsisContent = getRenderText(node, rows, full, { expand: content.value.expandButton, copy: content.value.copyElement() }, suffix, pos, props.strong);
        update({ isOverflowed: false, ellipsisContent, isTruncated: full !== ellipsisContent });
    };

    const hover = () => {
        const node = content.value?.root;
        if (cssEllipsis.value && node) update({ isOverflowed: isOverflowing(node, opt.value.rows), isTruncated: false });
    };

    const toggle = (e: MouseEvent) => {
        const { expanded } = view.value;
        emit('expand', !expanded, e);
        const { expandable, collapsible, collapseText } = opt.value;
        if (!((expandable && !expanded) || (collapsible && expanded))) return;
        update({ expanded: !expanded });
        if (!expanded && collapseText === undefined && e.currentTarget === FocusTrapHandle.getActiveElement(e.currentTarget as Element)) {
            void nextTick(() => content.value?.root?.focus());
        }
    };

    const activateLink = (e: KeyboardEvent) => {
        if (!e.defaultPrevented && e.key === 'Enter') (e.currentTarget as HTMLElement).click();
    };

    const decorations = () => {
        const { link, disabled } = props;
        let linkAttrs: Record<string, unknown> = {};
        if (typeof link === 'object') {
            linkAttrs = disabled ? { class: link.class, style: link.style } : { ...link };
        }
        // An anchor without href is neither focusable nor a link; a clickable one needs both to be reached by keyboard
        if (link && !disabled && !linkAttrs.href && (hasClickListener(linkAttrs) || hasClickListener(attrs))) {
            linkAttrs = mergeProps({ role: 'link', tabindex: 0 }, linkAttrs, { onKeydown: activateLink });
        }
        const tags: (DecorationTag | false)[] = [
            Boolean(link) && { tag: disabled ? 'span' : 'a', attrs: linkAttrs },
            props.delete && { tag: 'del', attrs: {} },
            props.strong && { tag: 'strong', attrs: {} },
            props.underline && !link && { tag: 'u', attrs: {} },
            props.code && { tag: 'code', attrs: {} },
            props.mark && { tag: 'mark', attrs: {} },
        ];
        return tags.filter((tag) => tag !== false);
    };

    // Tooltip gives its trigger tabindex 0 unless the trigger sets its own; null keeps the text out of the tab order
    // until the tip can show, and inside items of composite widgets.
    const triggerTabindex = () => {
        const own = attrs.tabindex;
        return own !== undefined || (overflowed.value && conditionOn.value && !insideWidgetItem.value) ? (own ?? 0) : null;
    };

    // Runs before this component re-renders, so new text never shows with the previous truncation.
    watch(
        () => text.value.text,
        (value) => {
            if (hasEllipsis.value) view.value = resetView(value);
        },
        { flush: 'pre' }
    );

    watchEffect(() => warning(Boolean(props.copyable) && (typeof props.copyable !== 'object' || props.copyable.content === undefined) && !text.value.pure, 'Content to be copied in Typography is a object, it will case a [object Object] mistake when copy to clipboard.'));

    const { schedule } = useEllipsis(
        () => hasEllipsis.value,
        () => content.value?.root,
        measure
    );

    const contentBinding = (tabindex: unknown = attrs.tabindex ?? (focusTarget.value ? -1 : undefined), inTooltip = false) => {
        const tags = decorations();
        // The description goes to the focusable link inside (Decorate reads it from the Tooltip), unless the caller set their own.
        const linkAttrs = tags[0]?.tag === 'a' ? tags[0].attrs : undefined;
        const describedByLink = tooltip.value !== false && !tooltip.value.popover && Boolean(linkAttrs?.href || linkAttrs?.role === 'link') && !attrs['aria-describedby'];
        return {
            ...attrs,
            ...(inTooltip && describedByLink && { 'aria-describedby': null }),
            class: [wrapperClass.value, attrs.class],
            style: [weightStyle.value, attrs.style as StyleValue, ellipsisStyle.value],
            tabindex,
            tag: props.component ?? 'span',
            nodes: nodes.value,
            format: props.format,
            hasEllipsis: hasEllipsis.value,
            showFull: view.value.expanded || !view.value.isTruncated,
            ellipsisText: view.value.ellipsisContent,
            suffix: hasEllipsis.value ? opt.value.suffix : '',
            decorations: tags,
            linkClass: linkClass.value,
            iconSize: realSize.value === 'small' ? ('small' as const) : ('default' as const),
            actionText: actionText.value,
            actionToggles: view.value.expanded ? opt.value.collapsible : opt.value.expandable,
            expanded: view.value.expanded,
            copy: copyConfig.value,
            onToggle: toggle,
            onHover: hover,
            onCopiedChange: () => {
                if (hasEllipsis.value) schedule();
            },
            onCopy: (...args: TypographyTextEmits['copy']) => emit('copy', ...args),
        };
    };

    // A scoped slot argument can only carry a VNode, so the text element is built here; the template renders the same node.
    // Passing the slots object forwards only the slots given, which TypographyContent reads for presence.
    const contentNode = (tabindex?: unknown, inTooltip = false) => {
        return h(TypographyContent, { ...contentBinding(tabindex, inTooltip), ref: 'content' }, slots);
    };

    // Sources are compared one by one so an inline ellipsis object with the same values does not measure again
    // truncating renders the expand button, so the text is measured again with its width
    watch(
        [hasEllipsis, () => text.value.text, () => view.value.isTruncated, () => view.value.expanded, () => opt.value.rows, () => opt.value.pos, () => opt.value.suffix, () => opt.value.expandText, () => Boolean(opt.value.showTooltip), () => Boolean(props.copyable), () => props.strong],
        () => {
            if (hasEllipsis.value) schedule();
        },
        { flush: 'post' }
    );

    onMounted(() => {
        if (hasEllipsis.value) schedule();
    });
</script>

<template>
    <component :is="tooltip.popover ? Popover : Tooltip" v-if="tooltip && !$slots.ellipsisTooltip" v-bind="tooltip.popover ? popoverBinding : tooltipBinding">
        <component :is="contentNode(triggerTabindex(), true)" />
        <template #content>
            <slot name="ellipsisContent">
                <NumeralNodes :format="props.format" :nodes="nodes" />
            </slot>
        </template>
    </component>
    <slot v-else-if="tooltip && overflowed" :content="text.text" name="ellipsisTooltip" :trigger="contentNode()" />
    <component :is="contentNode()" v-else />
</template>
