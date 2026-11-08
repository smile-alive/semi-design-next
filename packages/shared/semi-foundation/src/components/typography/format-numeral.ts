import type { strings } from './constants';

// Known limitation: there is no 'currency' rule; add one to strings.RULE and #ruleMethods if it is needed
type Rule = (typeof strings.RULE)[number];
type Truncate = (typeof strings.TRUNCATE)[number];
type Parser = (value: string) => string;

type RuleMethods = Record<Exclude<Rule, 'text' | 'numbers'>, (value: number) => string>;
type TruncateMethods = {
    [key in Truncate]: (value: number) => number;
};

export default class FormatNumeral {
    readonly #content: string;
    readonly #rule: Rule;
    readonly #precision: number;
    readonly #truncate: Truncate;
    readonly #parser: Parser | undefined;

    readonly #ruleMethods: RuleMethods = {
        'bytes-decimal': (value: number) => {
            const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            let i = 0;
            while (value >= 1000 && i < units.length - 1) {
                value /= 1000;
                i++;
            }
            return `${this.#truncatePrecision(value)} ${units[i]}`;
        },
        'bytes-binary': (value: number) => {
            const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
            let i = 0;
            while (value >= 1024 && i < units.length - 1) {
                value /= 1024;
                i++;
            }
            return `${this.#truncatePrecision(value)} ${units[i]}`;
        },
        percentages: (value: number) => {
            return `${this.#truncatePrecision(shiftDecimal(value, 2))}%`;
        },
        exponential: (value: number) => {
            // The shortest exact mantissa, so the truncation is the only rounding step
            const [mantissa, exponent] = value.toExponential().split('e');
            let truncated = this.#truncatePrecision(mantissa);
            let power = Number(exponent);
            // ceil can carry the mantissa up to 10, which is renormalized to 1
            if (Math.abs(Number(truncated)) >= 10) {
                truncated = (Number(truncated) / 10).toFixed(this.#precision);
                power += 1;
            }
            return `${truncated}e${power < 0 ? '-' : '+'}${Math.abs(power)}`;
        },
    };
    readonly #truncateMethods: TruncateMethods = {
        ceil: Math.ceil,
        floor: Math.floor,
        round: Math.round,
    };

    constructor(content: string, rule: Rule, precision: number, truncate: Truncate, parser?: Parser) {
        this.#content = content;
        this.#rule = rule;
        this.#precision = precision;
        this.#truncate = truncate;
        this.#parser = parser;
    }

    #truncatePrecision(content: string | number) {
        const cTruncated = shiftDecimal(this.#truncateMethods[this.#truncate](shiftDecimal(Number(content), this.#precision)), -this.#precision);
        const cArr = cTruncated.toString().split('.');
        if (cArr.length === 1) {
            return cTruncated.toFixed(this.#precision);
        }
        const cTLength = cArr[1].length;
        if (cTLength < this.#precision) {
            return `${cArr[0]}.${cArr[1]}${'0'.repeat(this.#precision - cTLength)}`;
        }
        return cTruncated.toString();
    }

    format = () => {
        if (this.#parser !== undefined) {
            return this.#parser(this.#content);
        }
        if (this.#rule === 'text') {
            return extractNumbers(this.#content)
                .map((item) => (checkIsNumeral(item) ? this.#truncatePrecision(item) : item))
                .join('');
        }
        if (this.#rule === 'numbers') {
            return extractNumbers(this.#content)
                .filter((item) => checkIsNumeral(item))
                .map((item) => this.#truncatePrecision(item))
                .join(',');
        }
        return extractNumbers(this.#content)
            .map((item) => (checkIsNumeral(item) ? this.#ruleMethods[this.#rule](Number(item)) : item))
            .join('');
    };
}

// Multiplies by 10^places on the decimal exponent, so 0.58 * 100 is 58 rather than 57.99999999999999
function shiftDecimal(value: number, places: number) {
    if (!Number.isFinite(value)) {
        return value;
    }
    const [mantissa, exponent = '0'] = String(value).split('e');
    return Number(`${mantissa}e${Number(exponent) + places}`);
}

// Splits numbers from the rest of the string; `-` counts only as a numeric prefix, and a lone `-` or `.` stays text
function extractNumbers(content: string) {
    return content.split(/(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/).filter(Boolean);
}

function checkIsNumeral(str: string) {
    return !(isNaN(Number(str)) || str.replace(/\s+/g, '') === '');
}
