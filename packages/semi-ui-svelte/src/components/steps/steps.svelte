<script lang="ts">
    import { stepsClasses } from '@fibrae/semi-foundation/components/steps/constants';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/steps/steps.scss';
    import { useDefaultProps } from '../../base/index.js';
    import { setStepsContext } from './context.js';
    import type { StepsProps } from './interface.js';
    import Step from './step.svelte';

    const defaults = useDefaultProps('Steps');

    let {
        type = defaults('type', 'basic'),
        current = defaults('current', 0),
        initial = defaults('initial', 0),
        direction = defaults('direction', 'horizontal'),
        status = defaults('status', 'process'),
        size = defaults('size', 'default'),
        hasLine = defaults('hasLine', true),
        dataSource = defaults('dataSource', []),
        classNames = defaults('classNames'),
        styles = defaults('styles'),
        onChange = defaults('onChange'),
        title,
        description,
        ...rest
    }: StepsProps = $props();

    const prefixCls = stepsClasses.PREFIX;

    const rootClass = $derived.by(() => {
        const sized = { [`${prefixCls}-${size}`]: size !== 'default' };
        switch (type) {
            case 'nav':
                return [`${prefixCls}-nav`, sized];
            default:
                return [`${prefixCls}-basic`, `${prefixCls}-${direction}`, sized, { [`${prefixCls}-hasline`]: hasLine }];
        }
    });

    setStepsContext({
        get type() {
            return type;
        },
        get size() {
            return size;
        },
        get current() {
            return current;
        },
        get initial() {
            return initial;
        },
        get status() {
            return status;
        },
        get classNames() {
            return classNames;
        },
        get styles() {
            return styles;
        },
        get clickable() {
            return Boolean(onChange);
        },
        get title() {
            return title;
        },
        get description() {
            return description;
        },
        change(stepNumber) {
            if (stepNumber !== current) {
                onChange?.(stepNumber);
            }
        },
    });
</script>

<div {...rest} class={[rootClass, rest.class]} role={namedRole(rest)}>
    {#each dataSource as item, index (index)}
        <Step {index} {item} total={dataSource.length} />
    {/each}
</div>
