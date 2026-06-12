import type {ReactNode} from "react";

interface ICodeSpansProps {
    text: string;
}

/** Renders `backtick` segments of plain text as inline code chips. */
export const CodeSpans = ({text}: ICodeSpansProps) => {
    const nodes: ReactNode[] = [];
    let offset = 0;
    text.split(/`([^`]+)`/g).forEach((part, index) => {
        const isCode = index % 2 === 1;
        if (isCode) {
            nodes.push(
                <code
                    key={offset}
                    className="rounded bg-gray-700/60 px-1 py-0.5 font-mono text-gray-200"
                >
                    {part}
                </code>,
            );
        } else {
            nodes.push(part);
        }
        offset += part.length + (isCode ? 2 : 0);
    });
    return nodes;
};
