import { render } from '@testing-library/react';
import { Select } from '@fibrae/semi-ui-react';
import { selectSpec, type SelectSpecProps } from '@test/specs/select';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ options, bottomButton, ...props }: SelectSpecProps) {
    const groups = [...new Set(options.map((option) => option.group))];
    return (
        <>
            <Select aria-label="Fruit" innerBottomSlot={bottomButton ? <button type="button">slot button</button> : undefined} motion={false} {...props}>
                {groups.map((group) => {
                    const items = options.filter((option) => option.group === group).map((option) => <Select.Option key={option.value} disabled={option.disabled} value={option.value} label={option.label} />);
                    return group ? (
                        <Select.OptGroup key={group} label={group}>
                            {items}
                        </Select.OptGroup>
                    ) : (
                        items
                    );
                })}
            </Select>
            <button type="button">after</button>
        </>
    );
}

const mount: SpecMount<SelectSpecProps> = (initial) => {
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

selectSpec(mount);
