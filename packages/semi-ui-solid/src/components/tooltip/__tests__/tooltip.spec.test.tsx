import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tooltipSpec, type TooltipSpecProps } from '@test/specs/tooltip';
import Tooltip from '..';

const mount: SpecMount<TooltipSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <Tooltip
            {...splitProps(props(), ['content', 'contentButton', 'triggerDisabled', 'popupLabel'])[1]}
            aria-label={props().popupLabel}
            content={
                <>
                    {props().content}
                    {props().contentButton && <button type="button">{props().contentButton}</button>}
                </>
            }
            motion={false}
        >
            {(t) => (
                <button {...t({ type: 'button' })} disabled={props().triggerDisabled}>
                    trigger
                </button>
            )}
        </Tooltip>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

tooltipSpec(mount);
