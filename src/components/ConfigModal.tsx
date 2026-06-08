import {useCallback} from "react";

interface IConfigModalProps {
    config: string;
    onClose: () => void;
}

export const ConfigModal = ({config, onClose}: IConfigModalProps) => {
    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(config);
    }, [config]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-gray-100">Generated Configuration</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-2xl">
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>
    );
};
