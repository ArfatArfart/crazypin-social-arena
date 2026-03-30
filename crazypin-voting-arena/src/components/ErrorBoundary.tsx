import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'Unknown error';
      let isFirestoreError = false;
      let firestoreInfo = null;

      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.operationType && parsed.authInfo) {
          isFirestoreError = true;
          firestoreInfo = parsed;
          errorMessage = parsed.error;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-4 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
              <span className="text-3xl">💀</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-4 italic">CRAZY ERROR!</h1>
            <p className="text-zinc-400 mb-6 text-sm">
              The pin went too crazy. Something broke in the matrix.
            </p>
            
            <div className="bg-black/50 rounded-xl p-4 mb-6 text-left overflow-auto max-h-60 border border-white/5">
              <p className="text-[10px] font-bold uppercase text-white/30 mb-2">Error Details</p>
              <code className="text-xs text-red-400 break-words">
                {errorMessage}
              </code>
              {isFirestoreError && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-white/30">Firestore Context</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="text-white/40">Operation:</div>
                    <div className="text-violet-400 font-bold">{firestoreInfo.operationType}</div>
                    <div className="text-white/40">Path:</div>
                    <div className="text-violet-400 font-bold">{firestoreInfo.path || 'N/A'}</div>
                    <div className="text-white/40">User ID:</div>
                    <div className="text-violet-400 font-bold truncate">{firestoreInfo.authInfo.userId || 'Guest'}</div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-violet-600/20 uppercase tracking-widest text-xs"
            >
              Reload Matrix
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
