import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { treeSelectSpec, type TreeSelectSpecProps } from '@test/specs/tree-select';
import TreeSelect from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<TreeSelectSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <ConfigProvider direction={props().direction}>
            <TreeSelect motion={false} motionExpand={false} {...splitProps(props(), ['direction'])[1]} />
        </ConfigProvider>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

treeSelectSpec(mount);
