// compat merge accepts an undefined source and deep-merges component maps while keeping memo/forwardRef objects as is
import { merge } from 'es-toolkit/compat';
import type { TableComponents, Virtualized } from './interface';

/**
 * Merges the components passed in by the user with the default components
 */
export function mergeComponents(components: TableComponents, virtualized: Virtualized) {
    return merge(
        {},
        {
            table: 'table',
            header: {
                outer: 'table',
                wrapper: 'thead',
                row: 'tr',
                cell: 'th',
            },
            body: virtualized
                ? {
                      outer: 'div',
                      wrapper: 'div',
                      row: 'div',
                      cell: 'div',
                      colgroup: {
                          wrapper: 'div',
                          col: 'div',
                      },
                  }
                : {
                      outer: 'table',
                      wrapper: 'tbody',
                      row: 'tr',
                      cell: 'td',
                      colgroup: {
                          wrapper: 'colgroup',
                          col: 'col',
                      },
                  },
        },
        components
    );
}

export { cloneDeep } from '../_utils';
