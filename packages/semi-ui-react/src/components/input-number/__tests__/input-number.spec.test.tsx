import { render } from '@testing-library/react';
import { InputNumber } from '@fibrae/semi-ui-react';
import { inputNumberSpec, type InputNumberSpecProps } from '@test/specs/input-number';
import type { SpecMount } from '@test/specs/shared/define-spec';

const mount: SpecMount<InputNumberSpecProps> = (initial) => {
    let props = initial;
    const view = render(<InputNumber {...props} />);
    return {
        container: view.container,
        update: async (next) => {
            props = { ...props, ...next };
            view.rerender(<InputNumber {...props} />);
        },
        unmount: view.unmount,
    };
};

inputNumberSpec(mount);
