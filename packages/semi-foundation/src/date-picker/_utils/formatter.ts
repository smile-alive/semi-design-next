import { format } from 'date-fns';
import { strings } from '../constants';
import type { BaseValueType } from '../foundation';

export function formatDateValues(values: BaseValueType[], formatToken: string, { groupInnerSeparator = strings.DEFAULT_SEPARATOR_RANGE, groupSize = 1, groupSeparator = strings.DEFAULT_SEPARATOR_MULTIPLE }: { groupInnerSeparator?: string; groupSize?: number; groupSeparator?: string } = {}, locale: any) {
    let text = '';
    if (groupSize <= 0 || typeof groupSize !== 'number') {
        groupSize = 1;
    }

    if (Array.isArray(values) && values.length) {
        const groups = [];
        const { length } = values;
        for (let i = 0; i < length; i++) {
            if (i % groupSize === 0) {
                groups.push([]);
            }
            const curArrIdx = Math.floor(i / groupSize);
            groups[curArrIdx].push(values[i]);
        }

        text = groups
            .map((arr) =>
                arr
                    .map((v) => {
                        if (v) {
                            return format(v, formatToken, { locale });
                        } else {
                            return '';
                        }
                    })
                    .join(groupInnerSeparator)
            )
            .join(groupSeparator);
    }
    return text;
}
