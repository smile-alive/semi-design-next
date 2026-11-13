import { render } from '@testing-library/react';
import { ConfigProvider, Slider } from '@fibrae/semi-ui-react';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { sliderSpec, type SliderSpecProps } from '@test/specs/slider';

function Fixture({ direction, ariaLabel, ...props }: SliderSpecProps) {
    return (
        <ConfigProvider direction={direction}>
            <Slider {...props} aria-label={ariaLabel} />
        </ConfigProvider>
    );
}

const mount: SpecMount<SliderSpecProps> = (initial) => {
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

sliderSpec(mount);
