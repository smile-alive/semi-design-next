/**
 * Splits by `separators` (string | string[] | null; other types from users are tolerated).
 */
export default function getSplitedArray(originString: string, separators: string | string[] | null) {
    let splitedValue: string | string[] = [];
    if (typeof separators === 'string' || typeof separators === 'number') {
        splitedValue = originString.split(separators);
    } else if (Array.isArray(separators)) {
        const tempChar = separators[0];
        splitedValue = originString;
        for (let i = 1; i < separators.length; i++) {
            splitedValue = splitedValue.split(separators[i]).join(tempChar);
        }
        splitedValue = splitedValue.split(tempChar);
    } else {
        splitedValue.push(originString);
    }
    return splitedValue;
}
