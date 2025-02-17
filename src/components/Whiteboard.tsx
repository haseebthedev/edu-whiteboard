import { useEffect, useRef, useState } from "react";
import { AssetRecordType, createShapeId, Editor, getSnapshot, TLImageShape, transact } from "tldraw";
import { WhiteboardEditor } from "./whiteboard/WhiteboardEditor";
import { Sidebar } from "./WhiteboardSidebar";
import { WhiteboarMobileTopBar } from "./WhiteboardMobileTopBar";

const WhiteboardApp = () => {
  const editorsRef = useRef(new Map<string, Editor>());

  const searchParams = new URLSearchParams(window.location.search);

  const userId = searchParams.get("id");
  const userRole = searchParams.get("role");

  // Static users data
  const users = [
    {
      dominantSpeaker: false,
      email: "",
      id: 1,
      loadableAvatarUrl: "",
      local: true,
      name: "Ahmed",
      pinned: false,
      role: "moderator",
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      loadableAvatarUrlUseCORS: false,
      audioOutputDeviceId: "default",
    },
    {
      dominantSpeaker: false,
      email: "",
      id: 2,
      loadableAvatarUrl: "",
      local: true,
      name: "Haseeb",
      pinned: false,
      role: "participant",
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      loadableAvatarUrlUseCORS: false,
      audioOutputDeviceId: "default",
    },
  ];

  // Set the local user (based on the ID and role from the URL params)
  const localUser = users.find((user) => user.id.toString() === userId);
  const remoteUsers = users.filter((user) => user.id.toString() !== userId);

  const { room } = { room: "abcdcx" };

  const iamModerator = userRole === "moderator";

  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [whiteboardPreview, setWhiteboardPreview] = useState<string | null>(null);

  // Initialize participants with the local and remote users
  useEffect(() => {
    if (localUser) {
      const newParticipants = [
        ...remoteUsers, // These are the "other" users
        localUser, // The current user
      ];

      // Only update participants if they differ
      if (JSON.stringify(participants) !== JSON.stringify(newParticipants)) {
        setParticipants(newParticipants);
      }
    }
  }, [localUser, remoteUsers]); // Watch for changes in participants

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const onActivityUpload = (images: string[], onClose: Function) => {
    if (!images || images.length === 0) return;

    // Works like transaction to ensure atomicity
    transact(() => {
      editorsRef.current.forEach((editor) => {
        // Fetch existing pages to avoid overwriting
        const existingPages = editor.getPages();
        const existingPageIds = new Set(existingPages?.map((page) => page.id));

        // Create pages and shapes for each image
        images.forEach((image, index) => {
          const assetId = AssetRecordType.createId();
          const shapeId = createShapeId();
          const pageId = `page:IA-${String(index + 1).padStart(2, "0")}` as any;

          // Skip creating a page if it already exists
          if (!existingPageIds.has(pageId)) {
            editor.createPage({
              id: pageId,
              name: `IA-${String(index + 1).padStart(2, "0")}`,
              meta: {},
            });
          }

          // Set the current page to the newly created or existing page
          editor.setCurrentPage(pageId);

          // Create the image asset and shape
          editor.createAssets([
            {
              id: assetId,
              typeName: "asset",
              type: "image",
              meta: {},
              props: {
                w: 1920,
                h: 1080,
                mimeType: "image/png",
                src: image,
                name: `image-${index + 1}`,
                isAnimated: false,
              },
            },
          ]);

          editor.createShape<TLImageShape>({
            id: shapeId,
            type: "image",
            x: 0,
            y: 0,
            props: {
              w: 1920,
              h: 1080,
              assetId,
            },
            isLocked: true,
          });
        });

        // Navigate to the first page (IA-01)
        const firstPageId = `page:IA-01` as any;
        if (existingPageIds.has(firstPageId) || images.length > 0) {
          editor.setCurrentPage(firstPageId);
        }

        // // Adjust zoom level and lock the camera
        editor.zoomToFit({ force: true, immediate: true });
        editor.setCameraOptions({ isLocked: true });
      });
    });

    onClose?.();
  };

  const onActivityRemove = () => {
    transact(() => {
      editorsRef.current.forEach((editor) => {
        // Get all pages
        const pages = editor.getPages();

        // Identify IA pages based on their IDs or names
        const iaPages = pages.filter((page) => page.name.startsWith("IA-"));
        const iaPageIds = new Set(iaPages.map((page) => page.id));

        // Delete IA pages
        iaPages.forEach((page) => {
          editor.deletePage(page.id);
        });

        // Get all shapes from all IA pages and delete them
        iaPages.forEach((page) => {
          const shapeIds = Array.from(editor.getPageShapeIds(page.id));
          shapeIds.forEach((shapeId) => {
            const shape = editor.getShape(shapeId);
            if (shape?.type === "image" && shape.isLocked) {
              editor.updateShape({ ...shape, isLocked: false });
            }
          });
          editor.deleteShapes(shapeIds);
        });

        // Delete all assets used in IA pages
        const assetIdsToDelete = editor
          .getAssets()
          // @ts-ignore
          .filter((asset) => iaPages.some((page) => asset.props?.name?.startsWith("image")))
          .map((asset) => asset.id);

        editor.deleteAssets(assetIdsToDelete);

        // If the current page is deleted, switch to another existing page
        const currentPageId = editor.getCurrentPageId();
        if (iaPageIds.has(currentPageId)) {
          const remainingPages = pages.filter((page) => !iaPageIds.has(page.id));
          if (remainingPages.length > 0) {
            editor.setCurrentPage(remainingPages[0].id);
          }
        }

        // Clear history and reset view
        editor.clearHistory();
        editor.zoomToFit();
      });
    });
  };

  const handleClosePreview = (occupantId: string) => {
    const editor = editorsRef.current.get(occupantId);
    if (editor) {
      // Fetch the current page from the occupant's whiteboard
      const currentPageId = editor.getCurrentPageId();

      // Update the sidebar editor to match
      editor.setCurrentPage(currentPageId);
      setWhiteboardPreview(null);
    }
  };

  const handleClearUserContent = () => {
    transact(() => {
      const editor = editorsRef.current.get(String(localUser?.name).toLowerCase());
      if (!editor) return;

      const currentPageId = editor.getCurrentPageId();

      // Get all shapes on the current page
      const allShapeIds = Array.from(editor.getPageShapeIds(currentPageId));

      // Filter out frame shapes and their children from the deletion list
      const shapesToDelete = allShapeIds.filter((shapeId) => {
        const shape = editor.getShape(shapeId);
        // @ts-ignore
        return shape?.type !== "frame" && shape?.type !== "image";
        // return shape?.props?.name !== "Frame" && !shape.props?.name?.startsWith("Image");
      });
      editor.deleteShapes(shapesToDelete);
    });
  };

  if (isLoading) return <div className="centered-content text-white">Loading...</div>;

  if (!localUser) return <div className="centered-content">Unable to determine user. Please try again.</div>;

  if (!room) return <div className="centered-content">Invalid room. Please try again.</div>;

  return (
    <div className="app-container">
      <div className="app-container__main-content">
        {/* For Mobile View - Participants */}
        <WhiteboarMobileTopBar
          iamModerator={iamModerator}
          occupants={participants}
          onPreviewClick={(occupantId: any) => setWhiteboardPreview(occupantId)}
        />

        <div className="content-area" style={whiteboardPreview ? { opacity: 0 } : {}}>
          <WhiteboardEditor
            autoFocus={true}
            iamModerator={iamModerator}
            classId={room}
            occupantId={localUser?.name?.toLowerCase() as any}
            onActivityUpload={onActivityUpload}
            onActivityRemove={onActivityRemove}
            onClearPage={handleClearUserContent}
            onMount={(editor) => {
              editorsRef.current.set(String(localUser?.name?.toLowerCase()), editor);
            }}
          />
        </div>
      </div>

      <Sidebar
        classId={room}
        iamModerator={iamModerator}
        occupants={participants}
        editorsRef={editorsRef}
        onPreviewClick={(occupantId: any) => setWhiteboardPreview(occupantId)}
      />

      {whiteboardPreview && (
        <div className="app-container__fullscreen-preview">
          <button
            className="primary-button"
            onClick={() => {
              handleClosePreview(whiteboardPreview);
            }}
          >
            Go Back
          </button>
          <div className="fullscreen-editor">
            <WhiteboardEditor
              classId={room}
              iamModerator={iamModerator}
              occupantId={whiteboardPreview}
              autoFocus={false}
              previewMode={true}
              initialSnapshot={() => {
                const editor = editorsRef?.current.get(String(whiteboardPreview).toLowerCase());
                return getSnapshot(editor?.store as any);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { WhiteboardApp };
