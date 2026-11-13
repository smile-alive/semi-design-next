import { render } from '@testing-library/react';
import Popover from '@fibrae/semi-ui-react/popover';
import { popoverSpec, type PopoverSpecProps } from '@test/specs/popover';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ content, contentButton, popupLabel, ...props }: PopoverSpecProps) {
    return (
        <Popover
            {...props}
            aria-label={popupLabel}
            content={
                <>
                    {content}
                    {contentButton && <button type="button">{contentButton}</button>}
                </>
            }
            motion={false}
        >
            <button type="button">trigger</button>
        </Popover>
    );
}

const mount: SpecMount<PopoverSpecProps> = (initial) => {
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

popoverSpec(mount);
