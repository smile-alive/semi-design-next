import { render } from '@testing-library/react';
import { paginationSpec, type PaginationSpecProps } from '@test/specs/pagination';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Pagination from '..';

function Fixture({ attrs, ...props }: PaginationSpecProps) {
    return <Pagination {...attrs} {...props} />;
}

const mount: SpecMount<PaginationSpecProps> = (initial) => {
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

paginationSpec(mount);
