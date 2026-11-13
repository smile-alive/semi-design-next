import { render } from '@testing-library/react';
import Tooltip from '@fibrae/semi-ui-react/tooltip';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tooltipSpec, type TooltipSpecProps } from '@test/specs/tooltip';

function Fixture({ content, contentButton, triggerDisabled, popupLabel, ...props }: TooltipSpecProps) {
    return (
        <Tooltip
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
            <button type="button" disabled={triggerDisabled}>
                trigger
            </button>
        </Tooltip>
    );
}

const mount: SpecMount<TooltipSpecProps> = (initial) => {
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

tooltipSpec(mount);
