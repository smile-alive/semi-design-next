import { render } from '@testing-library/react';
import { ConfigProvider, Tree } from '@fibrae/semi-ui-react';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { treeSpec, type TreeSpecProps } from '@test/specs/tree';

function Fixture({ direction, labelButtons, onLabelButtonPress, ...props }: TreeSpecProps) {
    return (
        <ConfigProvider direction={direction}>
            <Tree
                motion={false}
                {...props}
                renderLabel={
                    labelButtons
                        ? (label, node) => (
                              <button
                                  type="button"
                                  onClick={(event) => {
                                      event.stopPropagation();
                                      onLabelButtonPress?.(node.key);
                                  }}
                              >
                                  {label}
                              </button>
                          )
                        : undefined
                }
            />
        </ConfigProvider>
    );
}

const mount: SpecMount<TreeSpecProps> = (initial) => {
    let props = initial;
    const view = render(<Fixture {...props} />);
    return {
        container: view.container,
        update: async (next) => {
            props = { ...props, ...next };
            view.rerender(<Fixture {...props} />);
        },
        unmount: view.unmount,
    };
};

treeSpec(mount);
