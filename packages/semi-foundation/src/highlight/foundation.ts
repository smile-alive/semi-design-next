// Modified version based on 'highlight-words-core'. Stateless text splitting with no adapter, so plain functions
// rather than a BaseFoundation subclass.
import { escapeRegExp } from 'es-toolkit';

interface ChunkQuery {
    autoEscape?: boolean;
    caseSensitive?: boolean;
    searchWords: SearchWords;
    sourceString: string;
}
/** Plain-text chunks carry neither className nor style */
export interface Chunk {
    start: number;
    end: number;
    highlight: boolean;
    className?: string;
    style?: HighlightStyle;
}

/** Inline style values: numbers such as `fontWeight: 600` are valid CSS property values too */
export type HighlightStyle = Record<string, string | number>;

export interface ComplexSearchWord {
    text: string;
    className?: string;
    style?: HighlightStyle;
}

export type SearchWord = string | ComplexSearchWord | undefined;
export type SearchWords = SearchWord[];

function findChunks({ autoEscape, caseSensitive, searchWords, sourceString }: ChunkQuery): Chunk[] {
    return searchWords
        .map((searchWord) => (typeof searchWord === 'string' ? { text: searchWord } : searchWord))
        .filter((searchWord) => searchWord?.text)
        .reduce((chunks, searchWord) => {
            let searchText = searchWord.text;
            if (autoEscape) {
                searchText = escapeRegExp(searchText);
            }
            const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');

            for (const match of sourceString.matchAll(regex)) {
                const start = match.index;
                const end = start + match[0].length;
                if (end > start) {
                    chunks.push({
                        highlight: true,
                        start,
                        end,
                        className: searchWord.className,
                        style: searchWord.style,
                    });
                }
            }
            return chunks;
        }, []);
}

function combineChunks({ chunks }: { chunks: Chunk[] }): Chunk[] {
    return chunks
        .toSorted((first, second) => first.start - second.start)
        .reduce((processedChunks, nextChunk) => {
            if (processedChunks.length === 0) {
                return [nextChunk];
            } else {
                const prevChunk = processedChunks.pop();
                // Touching chunks stay separate: each keeps its own className and style
                if (nextChunk.start < prevChunk.end) {
                    // prevChunk may fully contain nextChunk, so take the larger end
                    const endIndex = Math.max(prevChunk.end, nextChunk.end);
                    processedChunks.push({
                        highlight: true,
                        start: prevChunk.start,
                        end: endIndex,
                        className: prevChunk.className || nextChunk.className,
                        style: { ...prevChunk.style, ...nextChunk.style },
                    });
                } else {
                    processedChunks.push(prevChunk, nextChunk);
                }
                return processedChunks;
            }
        }, []);
}

// Adds non-highlight chunks for the text between (and around) the highlighted chunks
function fillInChunks({ chunksToHighlight, totalLength }: { chunksToHighlight: Chunk[]; totalLength: number }) {
    const allChunks: Chunk[] = [];
    const append = (start: number, end: number, highlight: boolean, className?: string, style?: HighlightStyle) => {
        if (end - start > 0) {
            allChunks.push({
                start,
                end,
                highlight,
                className,
                style,
            });
        }
    };

    if (chunksToHighlight.length === 0) {
        append(0, totalLength, false);
    } else {
        let lastIndex = 0;
        chunksToHighlight.forEach((chunk) => {
            append(lastIndex, chunk.start, false);
            append(chunk.start, chunk.end, true, chunk.className, chunk.style);
            lastIndex = chunk.end;
        });
        append(lastIndex, totalLength, false);
    }
    return allChunks;
}

/**
 * Creates an array of chunk objects representing both highlightable and non-highlightable pieces of text that match each search word.
 *
    findAll ['z'], 'aaazaaazaaa'
        result #=> [
            { start: 0, end: 3, highlight: false }
            { start: 3, end: 4, highlight: true }
            { start: 4, end: 7, highlight: false }
            { start: 7, end: 8, highlight: true }
            { start: 8, end: 11, highlight: false }
        ]

    findAll ['do', 'dollar'], 'aaa do dollar aaa'
        #=> chunks: [
                { start: 4, end: 6 },
                { start: 7, end: 9 },
                { start: 7, end: 13 },
            ]
        #=> chunksToHight: [
                { start: 4, end: 6 },
                { start: 7, end: 13 },
            ]
        #=> result: [
                { start: 0, end: 4, highlight: false },
                { start: 4, end: 6, highlight: true },
                { start: 6, end: 7, highlight: false },
                { start: 7, end: 13, highlight: true },
                { start: 13, end: 17, highlight: false },
            ]

* @return Array of "chunks" (where a Chunk is { start:number, end:number, highlight:boolean })
*/
export function findAll({ autoEscape = true, caseSensitive = false, searchWords, sourceString }: Omit<ChunkQuery, 'searchWords'> & { searchWords: string | SearchWords }) {
    const chunks = findChunks({
        autoEscape,
        caseSensitive,
        searchWords: typeof searchWords === 'string' ? [searchWords] : searchWords,
        sourceString,
    });
    const chunksToHighlight = combineChunks({ chunks });
    return fillInChunks({
        chunksToHighlight,
        totalLength: sourceString ? sourceString.length : 0,
    });
}
