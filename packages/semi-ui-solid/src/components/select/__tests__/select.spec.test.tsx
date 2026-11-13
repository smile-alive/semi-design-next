import { createSignal, For, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { selectSpec, type SelectSpecProps } from '@test/specs/select';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Select from '..';

const mount: SpecMount<SelectSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const groups = () => [...new Set(props().options.map((option) => option.group))];
    const view = render(() => (
        <>
            <Select aria-label="Fruit" innerBottomSlot={props().bottomButton ? <button type="button">slot button</button> : undefined} motion={false} {...splitProps(props(), ['options', 'bottomButton'])[1]}>
                <For each={groups()}>
                    {(group) => {
                        const items = () => <For each={props().options.filter((option) => option.group === group)}>{(option) => <Select.Option disabled={option.disabled} label={option.label} value={option.value} />}</For>;
                        return group ? <Select.OptGroup label={group}>{items()}</Select.OptGroup> : items();
                    }}
                </For>
            </Select>
            <button type="button">after</button>
        </>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

selectSpec(mount);
