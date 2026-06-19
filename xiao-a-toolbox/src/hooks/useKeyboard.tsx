import { createContext, useContext, useCallback, useRef, useEffect, type ReactNode } from "react";

interface KeyActions {
  selectFile: (() => void) | null;
  startConvert: (() => void) | null;
  cancelConvert: (() => void) | null;
}

const KeyContext = createContext<{
  register: (actions: KeyActions) => void;
}>({ register: () => {} });

export function useKeyboard(actions: KeyActions) {
  const { register } = useContext(KeyContext);
  useEffect(() => {
    register(actions);
  }, [actions.selectFile, actions.startConvert, actions.cancelConvert]);
}

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const actionsRef = useRef<KeyActions>({ selectFile: null, startConvert: null, cancelConvert: null });

  const register = useCallback((actions: KeyActions) => {
    actionsRef.current = actions;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const a = actionsRef.current;
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        a.selectFile?.();
      } else if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        a.startConvert?.();
      } else if (e.key === "Escape") {
        e.preventDefault();
        a.cancelConvert?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <KeyContext.Provider value={{ register }}>
      {children}
    </KeyContext.Provider>
  );
}
