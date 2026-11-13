import { render } from '@testing-library/react';
import { AutoComplete } from '@fibrae/semi-ui-react';
import { autoCompleteSpec, type AutoCompleteSpecProps } from '@test/specs/auto-complete';
import type { SpecMount } from '@test/specs/shared/define-spec';

const Fixture = (props: AutoCompleteSpecProps) => (
    <>
        <AutoComplete aria-label="City" motion={false} {...props} />
        <button type="button">after</button>
    </>
);

const mount: SpecMount<AutoCompleteSpecProps> = (initial) => {
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

autoCompleteSpec(mount);
