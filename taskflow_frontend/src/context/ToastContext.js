import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext({
  showToast: () => {},
  hideToast: () => {},
});

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', action = null) => {
    setToast({ message, type, action });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`
              min-w-[320px] max-w-md rounded-lg border p-4 shadow-lg
              ${
                toast.type === 'error'
                  ? 'border-red-500/30 bg-red-50 dark:bg-red-950/30'
                  : toast.type === 'warning'
                  ? 'border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/30'
                  : 'border-blue-500/30 bg-blue-50 dark:bg-blue-950/30'
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <p
                className={`
                  flex-1 text-sm font-medium
                  ${
                    toast.type === 'error'
                      ? 'text-red-800 dark:text-red-200'
                      : toast.type === 'warning'
                      ? 'text-yellow-800 dark:text-yellow-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }
                `}
              >
                {toast.message}
              </p>
              <button
                onClick={hideToast}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    toast.action.onClick();
                    hideToast();
                  }}
                  className={`
                    w-full rounded-lg px-4 py-2 text-sm font-semibold transition
                    ${
                      toast.type === 'error'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : toast.type === 'warning'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
