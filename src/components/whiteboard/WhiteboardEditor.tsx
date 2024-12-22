import _ from "lodash";
import { useSync, useSyncDemo } from "@tldraw/sync";
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
import React, { useCallback, useEffect, useRef, useState } from "react";

interface WhiteboardEditorProps extends Omit<TldrawProps, "onMount"> {
  classId: string;
  occupantId: string;
  persistenceKey?: string;
  onMount?: (editor: Editor) => void;
}

// @ts-ignore
const isInstanceRecord = (record: TLRecord): record is { currentPageId: string } => "currentPageId" in record;

const WORKER_URL = import.meta.env.VITE_MULTI_SYNC_URL;

export const WhiteboardEditor: React.FC<WhiteboardEditorProps> = ({ classId, occupantId, onMount, ...rest }) => {
  const [editor, setEditor] = useState<Editor | null>(null); // State for the editor instance
  const [pendingPushRequests, setPendingPushRequests] = useState(new Set());

  const setAppToState = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const roomId = `${classId}-${occupantId}`;

  const store = useSync({ uri: `${WORKER_URL}/connect/${roomId}`, assets: multiplayerAssets });

  const UploadSlideDialog = ({ onClose }: { onClose(): void }) => (
    <>
      <TldrawUiDialogHeader>
        <TldrawUiDialogTitle className="font-bold">Create Interactive Activity</TldrawUiDialogTitle>
        <TldrawUiDialogCloseButton />
      </TldrawUiDialogHeader>
      <TldrawUiDialogBody style={{ maxWidth: 350 }}>
        <TldrawUiInput placeholder="Enter Google Slides URL" />
      </TldrawUiDialogBody>
      <TldrawUiDialogFooter className="tlui-dialog__footer__actions">
        <TldrawUiButton type="normal" onClick={onClose}>
          <TldrawUiButtonLabel>Cancel</TldrawUiButtonLabel>
        </TldrawUiButton>
        <TldrawUiButton type="primary" onClick={onClose}>
          <TldrawUiButtonLabel>Upload</TldrawUiButtonLabel>
        </TldrawUiButton>
      </TldrawUiDialogFooter>
    </>
  );

  const CustomSharePanel = () => {
    const { addDialog } = useDialogs();
    return (
      <div style={{ padding: 16, gap: 16, display: "flex", pointerEvents: "all" }}>
        <button className="primary-button" onClick={() => addDialog({ component: UploadSlideDialog })}>
          Activity
        </button>
      </div>
    );
  };

  const components: TLComponents = {
    // Uncomment to use custom share panel
    // SharePanel: CustomSharePanel,
    StylePanel: null, // Brush Colors
    SharePanel: null, // Shows user avatars
  };

  // const handleStateChange = (editor: Editor, store: any) => {
  //   const handleRemoteChanges = (changes: any) => {
  //     if (changes?.updated) {
  //       Object.entries(changes.updated).forEach(([key, value]: [string, any]) => {
  //         if (key.startsWith("instance_presence:") && value?.[0]?.currentPageId) {
  //           const newPageId = value[0].currentPageId;

  //           // Update the local editor to sync with the remote page change
  //           if (store) {
  //             const currentPageId = editor?.getCurrentPageId();
  //             if (currentPageId !== newPageId) {
  //               editor.setCurrentPage(newPageId);
  //               // store.setCurrentPageId(newPageId); // Assumes your store has a `setCurrentPageId` method
  //               console.log(`Page updated to: ${newPageId}`);
  //             }
  //           }
  //         }
  //       });
  //     }
  //   };

  //   if (editor) {
  //     editor.on("change", (event) => {
  //       if (event.source === "remote") {
  //         handleRemoteChanges(event.changes);
  //       }
  //     });
  //   }
  // };

  // const handleStateChange = (editor: Editor, store: any) => {
  //   let lastRemotePageId: string | null = null; // Track the last known remote page ID

  //   const handleRemoteChanges = (changes: any) => {
  //     if (changes?.updated) {
  //       Object.entries(changes.updated).forEach(([key, value]: [string, any]) => {
  //         if (key.startsWith("instance_presence:") && value?.[0]?.currentPageId) {
  //           const newPageId = value[0].currentPageId;

  //           // Check if the page ID is different and it's from a remote user
  //           if (newPageId !== lastRemotePageId) {
  //             const currentPageId = editor.getCurrentPageId();

  //             // Only change the page if it's not already the current one
  //             if (currentPageId !== newPageId) {
  //               editor.setCurrentPage(newPageId);
  //               lastRemotePageId = newPageId; // Update the last known remote page ID
  //               console.log(`Page updated to: ${newPageId}`);
  //             }
  //           }
  //         }
  //       });
  //     }
  //   };

  //   if (editor) {
  //     editor.on("update", () => {
  //       console.log("event ---- ");

  //       editor.getHighestIndexForParent(editor.getCurrentPageId());

  //       return;

  //       // if (event.source === "remote") {
  //       //   handleRemoteChanges(event.changes);
  //       // }
  //     });
  //   }
  // };

  const handlePageChangeEvent = useCallback(() => {
    if (!editor) return;

    // Handle the `change` event to detect page changes (including remote)
    const handleChangeEvent: TLEventMapHandler<"change"> = (change) => {
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (isInstanceRecord(from) && isInstanceRecord(to) && from.currentPageId !== to.currentPageId) {
          const requestId = `changePage-${from.currentPageId}`;
          setPendingPushRequests((prev) => new Set(prev.add(requestId)));

          console.log(`Page changed from ${from.currentPageId} to ${to.currentPageId}`);
          editor.setCurrentPage(to.currentPageId); // Switch the page in the editor

          // After handling, remove the request from pending
          setPendingPushRequests((prev) => {
            const newSet = new Set(prev);
            newSet.delete(requestId);
            return newSet;
          });
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
  }, [editor, handlePageChangeEvent]);

  return (
    <Tldraw
      // store={storeRef.current}
      store={store}
      autoFocus={false}
      components={components}
      onMount={(editor) => {
        // handleStateChange(editor);

        setEditor(editor);

        editor.registerExternalAssetHandler("url", unfurlBookmarkUrl);
        if (onMount) onMount(editor);
      }}
      {...rest}
    />
  );
};
