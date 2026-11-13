import { render } from '@testing-library/react';
import { Radio } from '@fibrae/semi-ui-react';
import { radioSpec, type RadioGroupSpecProps, type RadioSpecProps } from '@test/specs/radio';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ label, ...props }: RadioSpecProps) {
    return <Radio {...props}>{label}</Radio>;
}

function GroupFixture({ options, asChildren, ...props }: RadioGroupSpecProps) {
    return (
        <Radio.Group {...props} options={asChildren ? undefined : options}>
            {asChildren
                ? options.map((option) => {
                      const { value, label, disabled } = typeof option === 'string' ? { value: option, label: option, disabled: undefined } : option;
                      return (
                          <Radio key={String(value)} disabled={disabled} value={value}>
                              {label}
                          </Radio>
                      );
                  })
                : undefined}
        </Radio.Group>
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

radioSpec(createMount(Fixture), createMount(GroupFixture));
