import { children, createEffect, createMemo, For, Match, mergeProps, splitProps, Switch } from 'solid-js';
import clsx from 'clsx';
import { stepsClasses as css } from '@fibrae/semi-foundation/components/steps/constants';
import { getStepState } from '@fibrae/semi-foundation/components/steps/utils';
import { namedRole, warning } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/steps/steps.scss';
import { isToken, type Token, useDefaultProps } from '../../base/index';
import { hasContent } from '../../utils/index';
import BasicStep from './basic-step';
import type { BasicStepsProps, StepProps, StepsOwnPartProps, StepsProps } from './interface';
import NavStep from './nav-step';
import { STEP } from './step';

interface AllStepsProps extends BasicStepsProps, StepsOwnPartProps {
    type?: 'basic' | 'nav';
}

const defaultProps = {
    type: 'basic',
    size: 'default',
    current: 0,
    initial: 0,
    direction: 'horizontal',
    status: 'process',
    hasLine: true,
} satisfies Partial<AllStepsProps>;

const prefixCls = css.PREFIX;

const isStep = (node: unknown): node is Token<StepProps> => isToken<StepProps>(node, STEP);

export default function Steps(rawProps: StepsProps) {
    const props = useDefaultProps('Steps', rawProps as AllStepsProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'class', 'classNames', 'current', 'direction', 'hasLine', 'initial', 'onChange', 'size', 'status', 'styles', 'type']);

    const resolved = children(() => local.children);

    // an empty slot (null, false, a Show without content) is not a stray child
    const nodes = createMemo(() => resolved.toArray().filter(hasContent));

    // only Steps.Step takes a position: a native element or text cannot carry the step props
    const steps = createMemo(() => nodes().flatMap((node) => (isStep(node) ? [node] : [])));

    const rootClass = () => {
        const { direction, size } = local;
        const sized = { [`${prefixCls}-${size}`]: size !== 'default' };
        switch (local.type) {
            case 'nav':
                return clsx(local.class, `${prefixCls}-nav`, sized);
            default:
                return clsx(local.class, `${prefixCls}-basic`, `${prefixCls}-${direction}`, sized, { [`${prefixCls}-hasline`]: local.hasLine });
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
            onChange: () => (local.onChange ? change : undefined),
            nextErrorClass: () => (state().nextError ? clsx(token.props.class, `${prefixCls}-next-error`) : undefined),
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
            get stepsClassNames() {
                return local.classNames;
            },
            get stepsStyles() {
                return local.styles;
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
            get stepsClassNames() {
                return local.classNames;
            },
            get stepsStyles() {
                return local.styles;
            },
        });
    };

    createEffect(() => warning(steps().length !== nodes().length, '[Semi Steps] Only Steps.Step is rendered as a child of Steps; other children are ignored.'));

    return (
        <div {...rest} class={rootClass()} role={namedRole(props)}>
            <Switch fallback={<For each={steps()}>{(token, index) => <BasicStep {...basicProps(token, index)} />}</For>}>
                <Match when={local.type === 'nav'}>
                    <For each={steps()}>{(token, index) => <NavStep {...navProps(token, index)} />}</For>
                </Match>
            </Switch>
        </div>
    );
}
