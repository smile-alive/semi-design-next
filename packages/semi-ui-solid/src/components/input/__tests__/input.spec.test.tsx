import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { inputSpec, type InputSpecProps } from '@test/specs/input';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Input from '..';

const mount: SpecMount<InputSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => <Input {...splitProps(props(), ['className'])[1]} class={props().className} />);
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

inputSpec(mount);
