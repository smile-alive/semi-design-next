import { createSignal, For, splitProps, type JSX } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { radioSpec, type RadioGroupSpecProps, type RadioSpecProps } from '@test/specs/radio';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Radio from '..';

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

function Fixture(props: RadioSpecProps) {
    const [local, rest] = splitProps(props, ['label']);
    return <Radio {...rest}>{local.label}</Radio>;
}

function GroupFixture(props: RadioGroupSpecProps) {
    const [local, rest] = splitProps(props, ['options', 'asChildren']);
    return (
        <Radio.Group {...rest} options={local.asChildren ? undefined : local.options}>
            {local.asChildren && (
                <For each={local.options}>
                    {(option) => {
                        const { value, label, disabled } = typeof option === 'string' ? { value: option, label: option, disabled: undefined } : option;
                        return (
                            <Radio value={value} disabled={disabled}>
                                {label}
                            </Radio>
                        );
                    }}
                </For>
            )}
        </Radio.Group>
    );
}

radioSpec(createMount(Fixture), createMount(GroupFixture));
