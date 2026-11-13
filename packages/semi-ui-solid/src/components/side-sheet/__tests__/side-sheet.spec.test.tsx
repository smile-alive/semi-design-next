import { createSignal, Show, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { sideSheetSpec, type SideSheetSpecProps } from '@test/specs/side-sheet';
import SideSheet from '..';

const mount: SpecMount<SideSheetSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <>
            <SideSheet motion={false} {...splitProps(props(), ['content', 'stacked'])[1]}>
                <p>{props().content}</p>
                <button type="button">Inner</button>
            </SideSheet>
            <Show when={props().stacked}>{(stacked) => <SideSheet motion={false} {...stacked()} />}</Show>
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

sideSheetSpec(mount);
