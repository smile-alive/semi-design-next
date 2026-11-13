import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { switchSpec, type SwitchSpecProps } from '@test/specs/switch';
import Switch from '..';

const mount: SpecMount<SwitchSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => <Switch {...props()} />);
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

switchSpec(mount);
