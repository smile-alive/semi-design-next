import { render } from '@testing-library/react';
import Popconfirm from '@fibrae/semi-ui-react/popconfirm';
import { popconfirmSpec, type PopconfirmSpecProps } from '@test/specs/popconfirm';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture(props: PopconfirmSpecProps) {
    return (
        <Popconfirm {...props} motion={false}>
            <button type="button">trigger</button>
        </Popconfirm>
    );
}

const mount: SpecMount<PopconfirmSpecProps> = (initial) => {
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

popconfirmSpec(mount);
