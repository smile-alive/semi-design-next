import { render } from '@testing-library/react';
import { Modal } from '@fibrae/semi-ui-react';
import { modalSpec, type ModalSpecProps } from '@test/specs/modal';
import type { SpecMount } from '@test/specs/shared/define-spec';

function Fixture({ content, stacked, ...props }: ModalSpecProps) {
    return (
        <>
            <Modal motion={false} {...props}>
                <p>{content}</p>
            </Modal>
            {stacked && <Modal motion={false} {...stacked} />}
        </>
    );
}

const mount: SpecMount<ModalSpecProps> = (initial) => {
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

modalSpec(mount);
