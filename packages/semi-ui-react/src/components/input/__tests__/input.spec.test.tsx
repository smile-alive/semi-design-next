import { render } from '@testing-library/react';
import { Input } from '@fibrae/semi-ui-react';
import { inputSpec, type InputSpecProps } from '@test/specs/input';
import type { SpecMount } from '@test/specs/shared/define-spec';

const mount: SpecMount<InputSpecProps> = (initial) => {
    let props = initial;
    const view = render(<Input {...props} />);
    return {
        container: view.container,
        update: async (next) => {
            props = { ...props, ...next };
            view.rerender(<Input {...props} />);
        },
        unmount: view.unmount,
    };
};

inputSpec(mount);
