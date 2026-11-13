import { render } from '@testing-library/react';
import { Checkbox } from '@fibrae/semi-ui-react';
import { checkboxSpec, type CheckboxGroupSpecProps, type CheckboxSpecProps } from '@test/specs/checkbox';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ label, ...props }: CheckboxSpecProps) {
    return <Checkbox {...props}>{label}</Checkbox>;
}

function GroupFixture({ options, asChildren, ...props }: CheckboxGroupSpecProps) {
    return (
        <Checkbox.Group {...props} options={asChildren ? undefined : options}>
            {asChildren
                ? options.map((option) => {
                      const { value, label, disabled } = typeof option === 'string' ? { value: option, label: option, disabled: undefined } : option;
                      return (
                          <Checkbox key={String(value)} disabled={disabled} value={value}>
                              {label}
                          </Checkbox>
                      );
                  })
                : undefined}
        </Checkbox.Group>
    );
}

function createMount<P extends object>(Component: (props: P) => React.ReactNode): SpecMount<P> {
    return (initial) => {
        let props = initial;
        const view = render(<Component {...props} />);
        return {
            container: view.container,
            update: async (next) => {
                props = { ...props, ...next };
                view.rerender(<Component {...props} />);
            },
            unmount: view.unmount,
        };
    };
}

checkboxSpec(createMount(Fixture), createMount(GroupFixture));
