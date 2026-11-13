import { render } from '@testing-library/react';
import { Cascader, ConfigProvider } from '@fibrae/semi-ui-react';
import { cascaderSpec, type CascaderSpecProps } from '@test/specs/cascader';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ direction, ...props }: CascaderSpecProps) {
    return (
        <ConfigProvider direction={direction}>
            <Cascader {...(props as object)} motion={false} />
        </ConfigProvider>
    );
}

const mount: SpecMount<CascaderSpecProps> = (initial) => {
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

cascaderSpec(mount);
