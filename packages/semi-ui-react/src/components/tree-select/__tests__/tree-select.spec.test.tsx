import { render } from '@testing-library/react';
import { ConfigProvider, TreeSelect } from '@fibrae/semi-ui-react';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { treeSelectSpec, type TreeSelectSpecProps } from '@test/specs/tree-select';

function Fixture({ direction, ...props }: TreeSelectSpecProps) {
    return (
        <ConfigProvider direction={direction}>
            <TreeSelect motion={false} motionExpand={false} {...props} />
        </ConfigProvider>
    );
}

const mount: SpecMount<TreeSelectSpecProps> = (initial) => {
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

treeSelectSpec(mount);
