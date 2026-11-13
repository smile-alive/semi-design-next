import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { inputNumberSpec, type InputNumberSpecProps } from '@test/specs/input-number';
import type { SpecMount } from '@test/specs/shared/define-spec';
import InputNumber from '..';

const mount: SpecMount<InputNumberSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => <InputNumber {...splitProps(props(), ['className'])[1]} class={props().className} />);
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

inputNumberSpec(mount);
