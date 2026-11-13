import { render } from '@testing-library/react';
import { Switch } from '@fibrae/semi-ui-react';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { switchSpec, type SwitchSpecProps } from '@test/specs/switch';

const mount: SpecMount<SwitchSpecProps> = (initial) => {
    let props = initial;
    const view = render(<Switch {...props} />);
    return {
        container: view.container,
        update: async (next) => {
            props = { ...props, ...next };
            view.rerender(<Switch {...props} />);
        },
        unmount: view.unmount,
    };
};

switchSpec(mount);
