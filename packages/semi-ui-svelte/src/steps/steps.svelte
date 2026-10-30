<script lang="ts">
    import { stepsClasses } from '@fibrae/semi-foundation/steps/constants';
    import '@fibrae/semi-foundation/steps/steps.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import { Col, Row } from '../grid/index.js';
    import { setStepsContext } from './context.js';
    import type { StepsProps } from './interface.js';
    import Step from './step.svelte';

    const defaults = useDefaultProps('Steps');

    let {
        type = defaults('type', 'fill'),
        current = defaults('current', 0),
        initial = defaults('initial', 0),
        direction = defaults('direction', 'horizontal'),
        status = defaults('status', 'process'),
        size = defaults('size', 'default'),
        hasLine = defaults('hasLine', true),
        prefixCls = defaults('prefixCls', stepsClasses.PREFIX),
        dataSource = defaults('dataSource', []),
        onChange = defaults('onChange'),
        title,
        description,
        ...rest
    }: StepsProps = $props();

    const rootClass = $derived.by(() => {
        const sized = { [`${prefixCls}-${size}`]: size !== 'default' };
        switch (type) {
            case 'basic':
                return [`${prefixCls}-basic`, `${prefixCls}-${direction}`, sized, { [`${prefixCls}-hasline`]: hasLine }];
            case 'nav':
                return [`${prefixCls}-nav`, sized];
            default:
                return [prefixCls, `${prefixCls}-${direction}`];
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
        get prefixCls() {
            return prefixCls;
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

<div {...rest} class={[rootClass, rest.class]} role={groupRole(rest)}>
    {#if type === 'fill'}
        <Row justify="start" type="flex">
            {#each dataSource as item, index (index)}
                <Col style={direction === 'vertical' ? undefined : `width: ${100 / dataSource.length}%`}>
                    <Step {index} {item} total={dataSource.length} />
                </Col>
            {/each}
        </Row>
    {:else}
        {#each dataSource as item, index (index)}
            <Step {index} {item} total={dataSource.length} />
        {/each}
    {/if}
</div>
