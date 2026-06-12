import {useCallback, useEffect, useRef, useState} from "react";

interface IConfigModalProps {
    config: string;
    onClose: () => void;
}

const COPIED_RESET_MS = 1500;

export const ConfigModal = ({config, onClose}: IConfigModalProps) => {
    const [copied, setCopied] = useState(false);
    const resetTimer = useRef<number>(undefined);

    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(config).then(() => {
            setCopied(true);
            window.clearTimeout(resetTimer.current);
            resetTimer.current = window.setTimeout(() => { setCopied(false); }, COPIED_RESET_MS);
        });
    }, [config]);

    useEffect(() => () => { window.clearTimeout(resetTimer.current); }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-gray-100">Generated Configuration</h2>
                    <button
                        onClick={onClose}
                        className="px-2 py-0.5 text-2xl leading-none text-gray-400 border border-gray-600 rounded hover:text-gray-200 hover:border-gray-400"
                    >
                        ×
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {config}
                    </pre>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-gray-100">
                        Close
                    </button>
                    <button
                        onClick={handleCopy}
                        className={`min-w-48 px-4 py-2 text-white rounded-lg transition-colors duration-300 ${
                            copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        <span key={String(copied)} className="inline-block animate-pop">
                            {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
