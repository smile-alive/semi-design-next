import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { treeSpec, type TreeSpecProps } from '@test/specs/tree';
import Tree from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<TreeSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <ConfigProvider direction={props().direction}>
            <Tree
                motion={false}
                {...splitProps(props(), ['direction', 'labelButtons', 'onLabelButtonPress'])[1]}
                renderLabel={
                    props().labelButtons
                        ? (label, node) => (
                              <button
                                  type="button"
                                  onClick={(event) => {
                                      event.stopPropagation();
                                      props().onLabelButtonPress?.(node?.key);
                                  }}
                              >
                                  {label}
                              </button>
                          )
                        : undefined
                }
            />
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

treeSpec(mount);
