import React from "react";

type GlobalErrorDialogProps = {
  message: string | null;
  onClose: () => void;
};

const GlobalErrorDialog: React.FC<GlobalErrorDialogProps> = ({
  message,
  onClose,
}) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl max-w-md w-full mx-4">
        <h2 className="font-semibold text-lg mb-2">
          Wystąpił problem z serwerem
        </h2>
        <p className="mb-4">{message}</p>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={onClose}
        >
          Zamknij
        </button>
      </div>
    </div>
  );
};

export default GlobalErrorDialog;
