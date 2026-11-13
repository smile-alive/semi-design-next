import { createSignal, For, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { collapseSpec, type CollapseSpecProps } from '@test/specs/collapse';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Collapse from '..';

const mount: SpecMount<CollapseSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <Collapse {...splitProps(props(), ['panels'])[1]}>
            <For each={props().panels}>
                {({ content, ...panel }) => (
                    // Panel decides "has a body" from whether children was passed at all
                    <Collapse.Panel {...panel} {...(content === undefined ? {} : { children: content })} />
                )}
            </For>
        </Collapse>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

collapseSpec(mount);
