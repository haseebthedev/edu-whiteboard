import _ from "lodash";
import { useSync } from "@tldraw/sync";
import {
  Tldraw,
  Editor,
  TldrawProps,
  TLComponents,
  TldrawUiButton,
  TldrawUiButtonLabel,
  TldrawUiDialogBody,
  TldrawUiDialogCloseButton,
  TldrawUiDialogFooter,
  TldrawUiDialogHeader,
  TldrawUiDialogTitle,
  TldrawUiInput,
  useDialogs,
  TLEventMapHandler,
  TLRecord,
} from "tldraw";
import { multiplayerAssets, unfurlBookmarkUrl } from "./useSyncStore";
import "tldraw/tldraw.css";
import React, { useCallback, useEffect, useState } from "react";
import { extractPresentationIdFromSlideUrl } from "../../utils";

interface WhiteboardEditorProps extends Omit<TldrawProps, "onMount"> {
  iamModerator?: boolean;
  classId: string;
  occupantId: string;
  persistenceKey?: string;
  onMount?: (editor: Editor) => void;
  onActivityUpload?: (images: string[], onClose: () => void) => void;
  onActivityRemove?: () => void;
}

// @ts-ignore
const isInstanceRecord = (record: TLRecord): record is { currentPageId: string } => "currentPageId" in record;

const WORKER_URL = import.meta.env.VITE_MULTI_SYNC_URL;

export const WhiteboardEditor: React.FC<WhiteboardEditorProps> = ({
  iamModerator = false,
  classId,
  occupantId,
  onActivityUpload,
  onActivityRemove,
  onMount,
  ...rest
}) => {
  const [editor, setEditor] = useState<Editor | null>(null); // State for the editor instance

  const roomId = `${classId}-${occupantId}`;

  const store = useSync({ uri: `${WORKER_URL}/connect/${roomId}`, assets: multiplayerAssets });

  const UploadSlideDialog = ({ onClose }: { onClose(): void }) => {
    const [link, setLink] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false); // New state for loader
    const [error, setError] = useState<string | null>(null);

    const startActivity = async () => {
      setError("");
      if (!link) return;

      const presentationId = extractPresentationIdFromSlideUrl(link);
      if (!presentationId) {
        setError("Invalid Google Slides link. Please enter a valid URL.");
        return;
      }

      setLoading(true); // Start loader
      try {
        const response = await fetch(`https://jitsi.withturtled.com:5001/process/${presentationId}`, {
          method: "GET",
        });
        const result = await response.json();

        if (result && result.imageUrls) {
          const images = result.imageUrls.map((el: string) => `https://jitsi.withturtled.com:5001${el}`);
          if (!images) {
            setError("Please enter the Google Slide URL.");
            return;
          }
          onActivityUpload?.(images, onClose);
        } else {
          setError("Failed to process the presentation. Please check URL or permissions.");
        }
      } catch (err) {
        setError("Failed to process the presentation. Please try again.");
        console.error(err);
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
          <TldrawUiInput placeholder="Enter Google Slides URL" onValueChange={setLink} />
          {error && <p className="error-message">{error}</p>}
        </TldrawUiDialogBody>
        <TldrawUiDialogFooter className="tlui-dialog__footer__actions">
          <TldrawUiButton type="normal" onClick={onClose}>
            <TldrawUiButtonLabel>Cancel</TldrawUiButtonLabel>
          </TldrawUiButton>
          <TldrawUiButton type="primary" disabled={loading ?? false} onClick={startActivity}>
            <TldrawUiButtonLabel>{loading ? "Please Wait..." : "Upload"}</TldrawUiButtonLabel>
          </TldrawUiButton>
        </TldrawUiDialogFooter>
      </>
    );
  };

  const CustomSharePanel = () => {
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
      </div>
    );
  };

  const components: TLComponents = {
    // Uncomment to use custom share panel
    SharePanel: iamModerator ? CustomSharePanel : null,
    StylePanel: null, // Brush Colors
    // SharePanel: null, // Shows user avatars
  };

  const handlePageChangeEvent = useCallback(() => {
    if (!editor) return;

    // Handle the change event to detect page changes (including remote)
    const handleChangeEvent: TLEventMapHandler<"change"> = (change) => {
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (isInstanceRecord(from) && isInstanceRecord(to) && from.currentPageId !== to.currentPageId) {
          editor.setCurrentPage(to.currentPageId); // Switch the page in the editor
        }
      }
    };

    // Subscribe to store events for both user and remote changes
    const cleanupFunction = editor.store.listen(handleChangeEvent, { scope: "all", source: "remote" });

    return cleanupFunction; // Return the cleanup function for useEffect
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    // Start listening to page changes
    const cleanup = handlePageChangeEvent();

    // Cleanup listener on component unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, [editor]);

  return (
    <Tldraw
      store={store}
      autoFocus={false}
      components={components}
      onMount={(editor) => {
        setEditor(editor);

        editor.registerExternalAssetHandler("url", unfurlBookmarkUrl);
        if (onMount) onMount(editor);
      }}
      {...rest}
    />
  );
};
