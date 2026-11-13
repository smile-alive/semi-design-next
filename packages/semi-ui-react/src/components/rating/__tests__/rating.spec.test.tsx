import { render } from '@testing-library/react';
import { ConfigProvider, Rating } from '@fibrae/semi-ui-react';
import { ratingSpec, type RatingSpecProps } from '@test/specs/rating';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ direction, ariaLabel, ...props }: RatingSpecProps) {
    return (
        <ConfigProvider direction={direction}>
            <Rating {...props} aria-label={ariaLabel} />
        </ConfigProvider>
    );
}

const mount: SpecMount<RatingSpecProps> = (initial) => {
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

ratingSpec(mount);
