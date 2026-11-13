import { render } from '@testing-library/react';
import { SideSheet } from '@fibrae/semi-ui-react';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { sideSheetSpec, type SideSheetSpecProps } from '@test/specs/side-sheet';

function Fixture({ content, stacked, ...props }: SideSheetSpecProps) {
    return (
        <>
            <SideSheet motion={false} {...props}>
                <p>{content}</p>
                <button type="button">Inner</button>
            </SideSheet>
            {stacked && <SideSheet motion={false} {...stacked} />}
        </>
    );
}

const mount: SpecMount<SideSheetSpecProps> = (initial) => {
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

sideSheetSpec(mount);
