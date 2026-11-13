import { render } from '@testing-library/react';
import { Collapse } from '@fibrae/semi-ui-react';
import { collapseSpec, type CollapseSpecProps } from '@test/specs/collapse';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ panels, ...props }: CollapseSpecProps) {
    return (
        <Collapse {...props}>
            {panels.map(({ content, ...panel }) => (
                <Collapse.Panel key={panel.itemKey} {...panel}>
                    {content}
                </Collapse.Panel>
            ))}
        </Collapse>
    );
}

const mount: SpecMount<CollapseSpecProps> = (initial) => {
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

collapseSpec(mount);
