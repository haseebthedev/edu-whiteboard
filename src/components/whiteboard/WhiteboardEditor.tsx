import { useContext, useRef, useEffect } from "react";
import { Tldraw, Editor, TldrawProps, TLUiComponents } from "tldraw";
import "tldraw/tldraw.css";
import { focusedEditorContext } from "./FocusedEditorProvider";

export const noComponents: Required<TLUiComponents> = {
  ContextMenu: null,
  ActionsMenu: null,
  HelpMenu: null,
  ZoomMenu: null,
  MainMenu: null,
  Minimap: null,
  StylePanel: null,
  PageMenu: null,
  NavigationPanel: null,
  Toolbar: null,
  KeyboardShortcutsDialog: null,
  QuickActions: null,
  HelperButtons: null,
  DebugPanel: null,
  DebugMenu: null,
  SharePanel: null,
  MenuPanel: null,
  TopPanel: null,
  CursorChatBubble: null,
};

interface WhiteboardEditorProps extends Omit<TldrawProps, "onMount"> {
  editorId: string;
  persistenceKey: string;
  onMount?: (editor: Editor) => void;
}

export const WhiteboardEditor: React.FC<WhiteboardEditorProps> = ({ editorId, persistenceKey, onMount, ...rest }) => {
  const { setFocusedEditor } = useContext(focusedEditorContext);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div tabIndex={-1} className="w-full h-full" onFocus={() => setFocusedEditor((window as any)[`EDITOR_${editorId}`])}>
      <Tldraw
        persistenceKey={persistenceKey}
        autoFocus={false}
        onMount={(editor) => {
          editor.zoomToFit();
          editorRef.current = editor;

          (window as any)[`EDITOR_${editorId}`] = editor;
          if (onMount) onMount(editor);
        }}
        {...rest}
      />
    </div>
  );
};
