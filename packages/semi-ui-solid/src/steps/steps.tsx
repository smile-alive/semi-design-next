import { children, createEffect, createMemo, For, Match, mergeProps, splitProps, Switch } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/steps/constants';
import { getStepState } from '@fibrae/semi-foundation/steps/utils';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/steps/steps.scss';
import hasContent from '../_base/has-content';
import { namedRole } from '../_base/named-role';
import { isToken, type Token } from '../_base/token';
import useDefaultProps from '../_base/use-default-props';
import { Col, Row } from '../grid';
import BasicStep from './basic-step';
import FillStep from './fill-step';
import type { BasicStepsProps, StepProps, StepsProps } from './interface';
import NavStep from './nav-step';
import { STEP } from './step';
import type { Role } from './use-step-item';

// The union of the three types' props; the type-specific ones are read only by the type that declares them
interface AllStepsProps extends BasicStepsProps {
    type?: 'fill' | 'basic' | 'nav';
}

const defaultProps = {
    type: 'fill',
    size: 'default',
    current: 0,
    initial: 0,
    direction: 'horizontal',
    status: 'process',
    hasLine: true,
    prefixCls: css.PREFIX,
} satisfies Partial<AllStepsProps>;

const isStep = (node: unknown): node is Token<StepProps> => isToken<StepProps>(node, STEP);

export default function Steps(rawProps: StepsProps) {
    const props = useDefaultProps('Steps', rawProps as AllStepsProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'class', 'current', 'direction', 'hasLine', 'initial', 'onChange', 'prefixCls', 'size', 'status', 'type']);

    const resolved = children(() => local.children);

    // an empty slot (null, false, a Show without content) is not a stray child
    const nodes = createMemo(() => resolved.toArray().filter(hasContent));

    // only Steps.Step takes a position: a native element or text cannot carry the step props
    const steps = createMemo(() => nodes().flatMap((node) => (isStep(node) ? [node] : [])));

    const rootClass = () => {
        const { prefixCls, direction, size } = local;
        const sized = { [`${prefixCls}-${size}`]: size !== 'default' };
        switch (local.type) {
            case 'basic':
                return clsx(local.class, `${prefixCls}-basic`, `${prefixCls}-${direction}`, sized, { [`${prefixCls}-hasline`]: local.hasLine });
            case 'nav':
                return clsx(local.class, `${prefixCls}-nav`, sized);
            default:
                return clsx(local.class, prefixCls, `${prefixCls}-${direction}`);
        }
    };

    const createItem = (token: Token<StepProps>, index: () => number) => {
        const stepNumber = () => local.initial + index();
        const state = createMemo(() => getStepState(stepNumber(), local.current, local.status, Boolean(token.props.status)));
        const change = () => {
            if (stepNumber() !== local.current) {
                local.onChange?.(stepNumber());
            }
        };
        return {
            state,
            number: () => `${stepNumber() + 1}`,
            // a step is clickable only when Steps has a handler, so the item gets none otherwise
            onChange: () => (local.onChange ? change : undefined),
            nextErrorClass: () => (state().nextError ? clsx(token.props.class, `${local.prefixCls}-next-error`) : undefined),
        };
    };

    const basicProps = (token: Token<StepProps>, index: () => number) => {
        const item = createItem(token, index);
        return mergeProps(token.props, {
            get stepNumber() {
                return item.number();
            },
            get size() {
                return local.size;
            },
            get status() {
                return item.state().status;
            },
            get active() {
                return item.state().active;
            },
            get done() {
                return item.state().done;
            },
            get class() {
                return item.nextErrorClass();
            },
            get onChange() {
                return item.onChange();
            },
        });
    };

    const fillProps = (token: Token<StepProps>, index: () => number) => {
        const item = createItem(token, index);
        return mergeProps(token.props, {
            get stepNumber() {
                return item.number();
            },
            get status() {
                return item.state().status;
            },
            get active() {
                return item.state().active;
            },
            get class() {
                return item.nextErrorClass();
            },
            get onChange() {
                return item.onChange();
            },
        });
    };

    const navProps = (token: Token<StepProps>, index: () => number) => {
        const item = createItem(token, index);
        return mergeProps(token.props, {
            get index() {
                return index();
            },
            get total() {
                return steps().length;
            },
            get active() {
                return item.state().active;
            },
            get onChange() {
                return item.onChange();
            },
        });
    };

    const colStyle = () => (local.direction === 'vertical' ? undefined : { width: `${100 / steps().length}%` });

    createEffect(() => warning(steps().length !== nodes().length, '[Semi Steps] Only Steps.Step is rendered as a child of Steps; other children are ignored.'));

    return (
        <div {...rest} class={rootClass()} role={namedRole(props.role, props['aria-label'], props['aria-labelledby']) as Role}>
            <Switch
                fallback={
                    <Row type="flex" justify="start">
                        <For each={steps()}>
                            {(token, index) => (
                                <Col style={colStyle()}>
                                    <FillStep {...fillProps(token, index)} />
                                </Col>
                            )}
                        </For>
                    </Row>
                }
            >
                <Match when={local.type === 'basic'}>
                    <For each={steps()}>{(token, index) => <BasicStep {...basicProps(token, index)} />}</For>
                </Match>
                <Match when={local.type === 'nav'}>
                    <For each={steps()}>{(token, index) => <NavStep {...navProps(token, index)} />}</For>
                </Match>
            </Switch>
        </div>
    );
}
