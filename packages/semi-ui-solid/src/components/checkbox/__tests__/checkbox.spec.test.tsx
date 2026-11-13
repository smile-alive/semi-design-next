import { createSignal, For, splitProps, type JSX } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { checkboxSpec, type CheckboxGroupSpecProps, type CheckboxSpecProps } from '@test/specs/checkbox';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Checkbox from '..';

function createMount<P extends object>(Component: (props: P) => JSX.Element): SpecMount<P> {
    return (initial) => {
        const [props, setProps] = createSignal(initial);
        const view = render(() => <Component {...props()} />);
        return {
            container: view.container,
            update: async (next) => {
                setProps((current) => ({ ...current, ...next }));
            },
            unmount: view.unmount,
        };
    };
}

function Fixture(props: CheckboxSpecProps) {
    const [local, rest] = splitProps(props, ['label']);
    return <Checkbox {...rest}>{local.label}</Checkbox>;
}

function GroupFixture(props: CheckboxGroupSpecProps) {
    const [local, rest] = splitProps(props, ['options', 'asChildren']);
    return (
        <Checkbox.Group {...rest} options={local.asChildren ? undefined : local.options}>
            {local.asChildren && (
                <For each={local.options}>
                    {(option) => {
                        const { value, label, disabled } = typeof option === 'string' ? { value: option, label: option, disabled: undefined } : option;
                        return (
                            <Checkbox value={value} disabled={disabled}>
                                {label}
                            </Checkbox>
                        );
                    }}
                </For>
            )}
        </Checkbox.Group>
    );
}

checkboxSpec(createMount(Fixture), createMount(GroupFixture));
