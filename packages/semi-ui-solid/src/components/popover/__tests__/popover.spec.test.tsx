import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { popoverSpec, type PopoverSpecProps } from '@test/specs/popover';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Popover from '..';

const mount: SpecMount<PopoverSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <Popover
            {...splitProps(props(), ['content', 'contentButton', 'popupLabel'])[1]}
            aria-label={props().popupLabel}
            content={
                <>
                    {props().content}
                    {props().contentButton && <button type="button">{props().contentButton}</button>}
                </>
            }
            motion={false}
        >
            {(t) => <button {...t({ type: 'button' })}>trigger</button>}
        </Popover>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

popoverSpec(mount);
