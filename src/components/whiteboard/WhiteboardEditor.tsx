import { useSync } from "@tldraw/sync";
// import { useContext, useRef, useEffect } from "react";
import { Tldraw, Editor, TldrawProps } from "tldraw";
// import { focusedEditorContext } from "./FocusedEditorProvider";
import { multiplayerAssets, unfurlBookmarkUrl } from "./useSyncStore";
import "tldraw/tldraw.css";

interface WhiteboardEditorProps extends Omit<TldrawProps, "onMount"> {
  classId: string;
  occupantId: string;
  persistenceKey?: string;
  onMount?: (editor: Editor) => void;
}

const WORKER_URL = `http://localhost:5858`;

export const WhiteboardEditor: React.FC<WhiteboardEditorProps> = ({ classId, occupantId, onMount, ...rest }) => {
  const roomId = `${classId}-${occupantId}`;

  const store = useSync({ uri: `${WORKER_URL}/connect/${roomId}`, assets: multiplayerAssets });

  return (
    <Tldraw
      store={store}
      autoFocus={false}
      onMount={(editor) => {
        // (window as any)[`EDITOR_${editorId}`] = editor;
        editor.registerExternalAssetHandler("url", unfurlBookmarkUrl);
        if (onMount) onMount(editor);
      }}
      {...rest}
    />
  );
};
