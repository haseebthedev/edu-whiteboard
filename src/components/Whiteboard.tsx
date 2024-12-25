import React, { useEffect, useRef, useState } from "react";
import { FileUpload } from "./WhiteboardFileUpload";
import { WhiteboardEditor } from "./whiteboard/WhiteboardEditor";
import { Sidebar } from "./WhiteboardSidebar";
import { AssetRecordType, createShapeId, Editor, TLImageShape, transact } from "tldraw";
import { WhiteboarMobileTopBar } from "./WhiteboardMobileTopBar";
import SlideShowExample from "./whiteboard/SlidesWhiteboard";
import { ImageAnnotationEditor } from "./ImageAnnotator";

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
      role: "participant",
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
      role: "moderator",
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      loadableAvatarUrlUseCORS: false,
      audioOutputDeviceId: "default",
    },
  ];

  // Set the local user (based on the ID and role from the URL params)
  const localUser = users.find((user) => user.id.toString() === userId);
  const remoteUsers = users.filter((user) => user.id.toString() !== userId);

  const { room } = { room: "abcde" };

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
  }, [localUser, remoteUsers, participants]); // Watch for changes in participants

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // const handleFileUpload = (images: string[], onClose: Function) => {
  //   if (!images || images.length === 0) return;

  //   editorsRef.current.forEach((editor) => {
  //     images.forEach((image, index) => {
  //       const assetId = AssetRecordType.createId();
  //       const shapeId = createShapeId();

  //       editor.createAssets([
  //         {
  //           id: assetId,
  //           typeName: "asset",
  //           type: "image",
  //           meta: {},
  //           props: {
  //             w: 1366,
  //             h: 768,
  //             mimeType: "image/png",
  //             src: image,
  //             name: `image-${index + 1}`,
  //             isAnimated: false,
  //           },
  //         },
  //       ]);

  //       const pageId = `page:${index + 1}` as any;
  //       editor.createPage({
  //         id: pageId,
  //         name: `Page ${index + 1}`,
  //         meta: {},
  //       });

  //       editor.setCurrentPage(pageId);

  //       editor.createShape<TLImageShape>({
  //         id: shapeId,
  //         type: "image",
  //         x: 0,
  //         y: 0,
  //         isLocked: false,
  //         props: {
  //           w: 1600,
  //           h: 900,
  //           assetId,
  //         },
  //       });
  //     });

  //     const firstPage = editor.getPages()[0];
  //     if (firstPage) {
  //       editor.setCurrentPage(firstPage.id);
  //     }

  //     editor.zoomToFit();
  //   });

  //   onClose?.();
  // };

  const handleFileUpload = (images: string[], onClose: Function) => {
    if (!images || images.length === 0) return;

    transact(() => {
      editorsRef.current.forEach((editor) => {
        // Create and set page 1 first
        // const firstPageId = `page:1` as any;
        // editor.createPage({
        //   id: firstPageId,
        //   name: "Page 1",
        //   meta: {},
        // });
        // editor.setCurrentPage(firstPageId);

        // Start creating pages and shapes for images from page 2 onwards
        images.forEach((image, index) => {
          const assetId = AssetRecordType.createId();
          const shapeId = createShapeId();

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

          const pageId = `page:activity-${index + 1}` as any;
          editor.createPage({
            id: pageId,
            name: `Page ${index + 1}`,
            meta: {},
          });

          editor.setCurrentPage(pageId);

          editor.createShape<TLImageShape>({
            id: shapeId,
            type: "image",
            x: 0,
            y: 0,
            isLocked: false,
            props: {
              w: 1920,
              h: 1080,
              assetId,
            },
          });
        });

        // Adjust zoom level to fit the first page
        editor.zoomToFit();
        editor.setCameraOptions({ isLocked: true });
      });
    });

    onClose?.();
  };

  const onActivityRemove = () => {
    editorsRef.current.forEach((editor) => {
      const pageIds = editor.getPages().map((page) => page.id);

      pageIds.forEach((pageId) => {
        if (pageId !== editor.getCurrentPageId()) {
          editor.deletePage(pageId);
        }
      });

      const currentPageId = editor.getCurrentPageId();
      const shapeIds = Array.from(editor.getPageShapeIds(currentPageId));
      editor.deleteShapes(shapeIds);

      editor.renamePage(currentPageId, "Page");

      const assetIds = editor.getAssets().map((asset) => asset.id);
      editor.deleteAssets(assetIds);

      editor.clearHistory();
      editor.zoomToFit();
    });
  };

  const handleClosePreview = () => setWhiteboardPreview(null);

  if (isLoading) return <div className="centered-content text-white">Loading...</div>;

  if (!localUser) return <div className="centered-content">Unable to determine user. Please try again.</div>;

  if (!room) return <div className="centered-content">Invalid room. Please try again.</div>;

  return (
    <div className="app-container">
      <div className="app-container__main-content">
        {/* {iamModerator && (
          <FileUpload
            iamModerator={iamModerator}
            isModalOpen={isModalOpen}
            setModalOpen={setModalOpen}
            onFileUpload={handleFileUpload}
            onClear={clearAllWhiteboards}
          />
        )} */}

        {/* For Mobile View - Participants */}
        <WhiteboarMobileTopBar
          iamModerator={iamModerator}
          occupants={participants}
          onPreviewClick={(occupantId: any) => setWhiteboardPreview(occupantId)}
        />

        <div className="content-area" style={whiteboardPreview ? { opacity: 0 } : {}}>
          {/* <SlideShowExample classId={room} occupantId={String(localUser?.id)} /> */}

          {/* <ImageAnnotationEditor
            image={{
              src: "https://picsum.photos/1920",
              width: 1920,
              height: 1080,
              type: "image/png",
            }}
            onDone={() => {}}
          /> */}

          <WhiteboardEditor
            iamModerator={iamModerator}
            classId={room}
            occupantId={String(localUser?.id)}
            autoFocus={true}
            onMount={(editor) => {
              editorsRef.current.set(String(localUser?.id), editor);
              // editor.setCameraOptions({ isLocked: true });
            }}
            onActivityUpload={handleFileUpload}
            onActivityRemove={onActivityRemove}
          />
        </div>
      </div>

      <Sidebar
        classId={room}
        iamModerator={iamModerator}
        occupants={participants}
        onPreviewClick={(occupantId: any) => setWhiteboardPreview(occupantId)}
        editorsRef={editorsRef}
      />

      {whiteboardPreview && (
        <div className="app-container__fullscreen-preview">
          <button className="primary-button" onClick={handleClosePreview}>
            Go Back
          </button>
          <div className="fullscreen-editor">
            <WhiteboardEditor classId={room} occupantId={whiteboardPreview} autoFocus onMount={(editor) => editor.resetZoom()} />
          </div>
        </div>
      )}
    </div>
  );
};

export { WhiteboardApp };
