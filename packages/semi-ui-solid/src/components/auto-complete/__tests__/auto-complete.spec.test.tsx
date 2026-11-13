import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { autoCompleteSpec, type AutoCompleteSpecProps } from '@test/specs/auto-complete';
import type { SpecMount } from '@test/specs/shared/define-spec';
import AutoComplete from '..';

const mount: SpecMount<AutoCompleteSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <>
            <AutoComplete aria-label="City" motion={false} {...props()} />
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

autoCompleteSpec(mount);
