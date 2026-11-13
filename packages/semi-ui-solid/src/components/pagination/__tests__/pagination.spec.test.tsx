import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { paginationSpec, type PaginationSpecProps } from '@test/specs/pagination';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Pagination from '..';

const mount: SpecMount<PaginationSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => <Pagination {...props().attrs} {...splitProps(props(), ['attrs'])[1]} />);
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

paginationSpec(mount);
