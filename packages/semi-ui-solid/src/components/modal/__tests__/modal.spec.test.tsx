import { createSignal, Show, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { modalSpec, type ModalSpecProps } from '@test/specs/modal';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Modal from '..';

const mount: SpecMount<ModalSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <>
            <Modal motion={false} {...splitProps(props(), ['content', 'stacked'])[1]}>
                <p>{props().content}</p>
            </Modal>
            <Show when={props().stacked}>{(stacked) => <Modal motion={false} {...stacked()} />}</Show>
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

modalSpec(mount);
