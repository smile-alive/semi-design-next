<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/collapse/constants';
    import CollapseFoundation, { type CollapseAdapter, type CollapseProps as FoundationProps, type CollapseState } from '@fibrae/semi-foundation/collapse/foundation';
    import '@fibrae/semi-foundation/collapse/collapse.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { setCollapseContext } from './context.js';
    import type { CollapseProps } from './interface.js';

    type Foundation = CollapseFoundation<MouseEvent>;
    type Adapter = CollapseAdapter<MouseEvent>;

    const defaults = useDefaultProps('Collapse');
    const collapsibleDefaults = useDefaultProps('Collapsible');

    // No fallback on `activeKey`: a bound `undefined` (form reset) would throw with one
    let {
        activeKey = $bindable(),
        accordion = defaults('accordion', false),
        clickHeaderToExpand = defaults('clickHeaderToExpand', true),
        expandIconPosition = defaults('expandIconPosition', 'right'),
        keepDOM = defaults('keepDOM'),
        motion = defaults('motion'),
        lazyRender = defaults('lazyRender', false),
        onChange,
        expandIcon,
        collapseIcon,
        children,
        ...rest
    }: CollapseProps = $props();

    const foundationProps: FoundationProps = {
        get activeKey() {
            return activeKey;
        },
        get accordion() {
            return accordion;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, CollapseState>(
        CollapseFoundation,
        foundationProps,
        (view) => CollapseFoundation.getInitialState(view),
        () => ({
            notifyChange: (next, event) => {
                activeKey = next;
                onChange?.(next, event);
            },
        })
    );

    const activeSet = $derived(CollapseFoundation.deriveActiveSet(foundationProps, states()));

    setCollapseContext({
        get activeSet() {
            return activeSet;
        },
        get clickHeaderToExpand() {
            return clickHeaderToExpand;
        },
        get keepDOM() {
            return keepDOM ?? collapsibleDefaults('keepDOM', false);
        },
        get motion() {
            return motion ?? collapsibleDefaults('motion', true);
        },
        get lazyRender() {
            return lazyRender;
        },
        get expandIconPosition() {
            return expandIconPosition;
        },
        get expandIcon() {
            return expandIcon;
        },
        get collapseIcon() {
            return collapseIcon;
        },
        onClick: foundation.handleChange,
    });
</script>

<div {...rest} class={[cssClasses.PREFIX, rest.class]}>
    {@render children?.()}
</div>
