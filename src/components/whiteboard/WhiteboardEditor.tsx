import "tldraw/tldraw.css";
import React, { useEffect, useState } from "react";
import { useSyncDemo } from "@tldraw/sync";
import {
  Tldraw,
  Editor,
  TLComponents,
  TldrawProps,
  useDialogs,
  TLRecord,
  TldrawUiDialogHeader,
  TldrawUiDialogTitle,
  TldrawUiDialogCloseButton,
  TldrawUiDialogBody,
  TldrawUiDialogFooter,
  TldrawUiButton,
  TldrawUiButtonLabel,
  TldrawUiInput,
  loadSnapshot,
} from "tldraw";
import { multiplayerAssets, unfurlBookmarkUrl } from "./useSyncStore";
import { processSlideUrl } from "./api";
import { extractPresentationIdFromSlideUrl } from "../utils";
import { WORKER_URL } from "../constants";

// @ts-ignore
const isInstanceRecord = (record: TLRecord): record is { currentPageId: string } => "currentPageId" in record;

interface WhiteboardEditorProps extends Omit<TldrawProps, "onMount"> {
  iamModerator?: boolean;
  classId: string;
  occupantId: string;
  persistenceKey?: string;
  isInSidebar?: boolean;
  previewMode?: boolean;
  onMount?: (editor: Editor) => void;
  onActivityUpload?: (images: string[], onClose: () => void) => void;
  onActivityRemove?: () => void;
  onClearPage?: () => void;
  initialSnapshot: any;
}

export const WhiteboardEditor: React.FC<WhiteboardEditorProps> = ({
  iamModerator = false,
  classId,
  occupantId,
  isInSidebar = false,
  previewMode = false,
  onActivityUpload,
  onActivityRemove,
  onClearPage,
  onMount,
  initialSnapshot = null,
  ...rest
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const roomId = `${classId}-${occupantId}`;

  const store = useSyncDemo({ roomId });
  // const store = useSync({ uri: `${WORKER_URL}/connect/${roomId}`, assets: multiplayerAssets });

  const UploadSlideDialog = ({ onClose }: { onClose(): void }) => {
    const [link, setLink] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false); // New state for loader
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async () => {
      if (!link) return;

      try {
        setLoading(true);

        const presentationId = extractPresentationIdFromSlideUrl(link);
        if (!presentationId) {
          setError("Invalid Google Slides link. Please enter a valid URL.");
          return;
        }
        const images = await processSlideUrl(presentationId);
        onActivityUpload?.(images, onClose);
      } catch (err) {
        setError("Failed to process the presentation. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <TldrawUiDialogHeader>
          <TldrawUiDialogTitle className="font-bold">Create Interactive Activity</TldrawUiDialogTitle>
          <TldrawUiDialogCloseButton />
        </TldrawUiDialogHeader>
        <TldrawUiDialogBody>
          {/* @ts-ignore */}
          <TldrawUiInput placeholder="Enter Google Slides URL" onValueChange={setLink} />
          {error && <p className="error-message">{error}</p>}
        </TldrawUiDialogBody>
        <TldrawUiDialogFooter className="tlui-dialog__footer__actions">
          {/* @ts-ignore */}
          <TldrawUiButton type="normal" onClick={onClose}>
            <TldrawUiButtonLabel>Cancel</TldrawUiButtonLabel>
          </TldrawUiButton>
          {/* @ts-ignore */}
          <TldrawUiButton type="primary" disabled={loading ?? false} onClick={handleUpload}>
            <TldrawUiButtonLabel>{loading ? "Please Wait..." : "Upload"}</TldrawUiButtonLabel>
          </TldrawUiButton>
        </TldrawUiDialogFooter>
      </>
    );
  };

  const CustomSharePanelForModerator = () => {
    const { addDialog } = useDialogs();
    return (
      <div style={{ padding: 16, gap: 16, display: "flex", pointerEvents: "all" }}>
        <button className="primary-button" onClick={() => addDialog({ component: UploadSlideDialog })}>
          Create Activity
        </button>
        <button
          className="primary-button"
          onClick={() =>
            addDialog({
              component: ({ onClose }) => {
                onActivityRemove?.();
                onClose();
                return <></>;
              },
            })
          }
        >
          Remove Link
        </button>
        <button
          className="primary-button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => editor?.undo()}
        >
          {/* @ts-ignore */}
          Undo
          {/* <Icon src={IconUndo} alt="undo-icon" size={18} /> */}
        </button>
        <button
          className="primary-button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => editor?.redo()}
        >
          {/* @ts-ignore */}
          Redo
          {/* <Icon src={IconRedo} alt="redo-icon" size={18} /> */}
        </button>
        <button
          className="primary-button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={onClearPage}
        >
          {/* @ts-ignore */}
          Delete
          {/* <Icon src={IconTrash} alt="eraser-icon" size={16} /> */}
        </button>
      </div>
    );
  };

  const CustomSharePanelForParticipant = () => {
    return (
      <div style={{ padding: 16, gap: 16, display: "flex", pointerEvents: "all" }}>
        <button
          className="primary-button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => editor?.undo()}
        >
          {/* @ts-ignore */}
          Undo
          {/* <Icon src={IconUndo} alt="undo-icon" size={18} /> */}
        </button>
        <button
          className="primary-button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => editor?.redo()}
        >
          {/* @ts-ignore */}
          Redo
          {/* <Icon src={IconRedo} alt="redo-icon" size={18} /> */}
        </button>
        <button
          className="primary-button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={onClearPage}
        >
          {/* @ts-ignore */}
          Delete
          {/* <Icon src={IconTrash} alt="trash-icon" size={16} /> */}
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!editor || previewMode === true) return;

    const handleChangeEvent = (change: any) => {
      // @ts-ignore
      Object.values(change.changes.updated).forEach(([from, to]: any) => {
        // Sync page changes only if not in preview mode
        if (isInstanceRecord(from) && isInstanceRecord(to) && from.currentPageId !== to.currentPageId) {
          // @ts-ignore
          editor.setCurrentPage(to.currentPageId);
        }

        const currentPageId = editor.getCurrentPageId();
        if (currentPageId.includes("page:IA") || isInSidebar) {
          editor.zoomToFit({ force: true, immediate: true }).setCameraOptions({ isLocked: true });
        }
      });
    };

    // Register the event listener
    const cleanupFunction = editor.store.listen(handleChangeEvent, {
      scope: "all",
      source: "remote",
    });

    // Cleanup listener on component unmount or when dependencies change
    return () => {
      cleanupFunction();
    };
  }, [editor, isInSidebar]);

  useEffect(() => {
    if (!editor || !previewMode || !initialSnapshot) return;

    const loadSnapshotIfAvailable = async (editor: any) => {
      console.log("loading latest snapshot...");

      const snapshot = await initialSnapshot();

      // Load initial snapshot for preview mode
      loadSnapshot(editor.store, snapshot);
      editor.zoomToFit({ force: true, immediate: true });
    };

    loadSnapshotIfAvailable(editor);
  }, [editor, previewMode, initialSnapshot]);

  const components: TLComponents = {
    ...{
      SharePanel: previewMode ? null : iamModerator ? CustomSharePanelForModerator : CustomSharePanelForParticipant,
      Minimap: null,
      ZoomMenu: null,
    },
    ...(previewMode && !iamModerator ? { Toolbar: null, MainMenu: null } : {}),
  };

  return (
    <Tldraw
      persistenceKey={roomId}
      store={store}
      forceMobile={true}
      components={components}
      onMount={(editor) => {
        setEditor(editor);
        editor.registerExternalAssetHandler("url", unfurlBookmarkUrl);
        if (onMount) onMount(editor);

        // Making editor readonly for preview mode
        // if (previewMode && !iamModerator) {
        //     editor.updateInstanceState({ isReadonly: true });
        //     // editor.updateInstanceState({ isReadonly: true, isToolLocked: true });
        // }
      }}
      {...rest}
    />
  );
};
