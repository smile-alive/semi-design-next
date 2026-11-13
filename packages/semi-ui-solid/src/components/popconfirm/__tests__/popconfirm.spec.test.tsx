import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { popconfirmSpec, type PopconfirmSpecProps } from '@test/specs/popconfirm';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Popconfirm from '..';

const mount: SpecMount<PopconfirmSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <Popconfirm {...props()} motion={false}>
            {(t) => <button {...t({ type: 'button' })}>trigger</button>}
        </Popconfirm>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

popconfirmSpec(mount);
