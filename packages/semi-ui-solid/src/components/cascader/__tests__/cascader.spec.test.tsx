import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { cascaderSpec, type CascaderSpecProps } from '@test/specs/cascader';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Cascader from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<CascaderSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <ConfigProvider direction={props().direction}>
            <Cascader {...(splitProps(props(), ['direction'])[1] as object)} motion={false} />
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

cascaderSpec(mount);
