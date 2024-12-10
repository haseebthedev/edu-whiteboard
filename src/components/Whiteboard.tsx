import { useEffect, useRef, useState } from "react";
import { FileUpload } from "./WhiteboardFileUpload";
import { WhiteboardEditor } from "./whiteboard/WhiteboardEditor";
import { Sidebar } from "./WhiteboardSidebar";
import { AssetRecordType, createShapeId, Editor, TLAssetId, TLImageShape, TLShapeId } from "tldraw";

const Whiteboard = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const userType = searchParams.get("user");

  const [isLoading, setIsLoading] = useState(true);
  const [classId, setClassId] = useState("12345678");
  const [myJid, setMyJid] = useState<string | null>(null);
  const [iamModerator, setIamModerator] = useState<boolean | null>(null);
  const [whiteboardPreview, setWhiteboardPreview] = useState<string | null>(null);

  const [occupants, setOccupants] = useState<any>([
    {
      occupantId: "isolatedacademicsawardyearly@conference.alpha.jitsi.net/4d62aa54",
      nick: "Tutor",
      role: "moderator",
      affiliation: "owner",
      jid: "4d62aa54-3ab9-4d56-9dd0-22d22533f563@alpha.jitsi.net/9MhoNk72E131",
      isFocus: true,
    },
    {
      occupantId: "isolatedacademicsawardyearly@conference.alpha.jitsi.net/5d62aa54",
      nick: "Alexa",
      role: "participant",
      affiliation: "none",
      jid: "5d62aa54-3ab9-4d56-9dd0-22d22533f563@alpha.jitsi.net/9MhoNk72E131",
      isFocus: false,
    },
    {
      occupantId: "isolatedacademicsawardyearly@conference.alpha.jitsi.net/6d62aa54",
      nick: "John",
      role: "participant",
      affiliation: "none",
      jid: "6d62aa54-3ab9-4d56-9dd0-22d22533f563@alpha.jitsi.net/9MhoNk72E131",
      isFocus: false,
    },
    {
      occupantId: "isolatedacademicsawardyearly@conference.alpha.jitsi.net/7d62aa54",
      nick: "Mark",
      role: "participant",
      affiliation: "none",
      jid: "7d62aa54-3ab9-4d56-9dd0-22d22533f563@alpha.jitsi.net/9MhoNk72E131",
      isFocus: false,
    },
  ]);

  const [isModalOpen, setModalOpen] = useState(false);
  const editorsRef = useRef<Editor[]>([]);

  const [assetIds] = useState<TLAssetId[]>([]);
  const [shapeIds] = useState<TLShapeId[]>([]);

  // Function to handle file upload
  const handleFileUpload = (images: string[]) => {
    if (!images || images.length === 0) return;

    editorsRef.current.forEach((editor) => {
      images.forEach((image, index) => {
        const assetId = AssetRecordType.createId();
        const shapeId = createShapeId();

        // Add the asset
        editor.createAssets([
          {
            id: assetId,
            typeName: "asset",
            type: "image",
            meta: {},
            props: {
              w: 1366,
              h: 768,
              mimeType: "image/png",
              src: image,
              name: `image-${index + 1}`,
              isAnimated: false,
            },
          },
        ]);

        // Create a new page for each image
        const pageId = `page:${index + 1}` as any; // Ensure proper typing for TLPageId
        editor.createPage({
          id: pageId,
          name: `Page ${index + 1}`,
          meta: {},
        });

        // Switch to the newly created page
        editor.setCurrentPage(pageId);

        // Add the image shape to the new page
        editor.createShape<TLImageShape>({
          id: shapeId,
          type: "image",
          x: 0,
          y: 0,
          isLocked: false,
          props: {
            w: 1600,
            h: 900,
            assetId,
          },
        });
      });

      // Optionally return to the first page after processing all images
      const firstPage = editor.getPages()[0];
      if (firstPage) {
        editor.setCurrentPage(firstPage.id);
      }

      editor.zoomToFit();
    });

    setModalOpen(false);
  };

  // Function to clear all pages in all whiteboards
  const clearAllWhiteboards = async () => {
    editorsRef.current.forEach((editor) => {
      // Get all page IDs
      const pageIds = editor.getPages().map((page) => page.id);

      // Delete all pages except the current one
      pageIds.forEach((pageId) => {
        if (pageId !== editor.getCurrentPageId()) {
          editor.deletePage(pageId);
        }
      });

      // Clear all shapes on the current page
      const currentPageId = editor.getCurrentPageId();
      const shapeIds = Array.from(editor.getPageShapeIds(currentPageId));
      if (shapeIds.length > 0) {
        editor.deleteShapes(shapeIds);
      }

      // Rename the current page to "Page"
      editor.renamePage(currentPageId, "Page");

      // Clear all assets (optional, in case assets persist)
      const assetIds = editor.getAssets().map((asset) => asset.id);
      if (assetIds.length > 0) {
        editor.deleteAssets(assetIds);
      }

      // Clear editor history (optional)
      editor.clearHistory();

      // Reset the camera to its initial state (optional)
      editor.zoomToFit();
    });
  };

  useEffect(() => {
    // Simulate fetching user data and determining userType
    setTimeout(() => {
      if (userType === "tutor") {
        const tutor = occupants.find((el: any) => el.role === "moderator");
        setMyJid(tutor?.jid || null);
        setIamModerator(true);
      } else {
        const participant = occupants.find((el: any) => el.role === "participant");
        setMyJid(participant?.jid || null);
        setIamModerator(false);
      }
      setIsLoading(false); // Mark loading as complete
    }, 1000); // Simulating an API call
  }, [userType, occupants]);

  const userInfo = occupants.find((el: any) => el.jid === myJid);

  const handleClosePreview = () => {
    setWhiteboardPreview(null);
  };

  if (isLoading) {
    return <div className="centered-content">Loading...</div>;
  }

  if (!myJid) {
    return <div className="centered-content">Unable to determine user role. Please try again.</div>;
  }

  return (
    <div className="app-container">
      {/* Main Content Area */}
      <div className="app-container__main-content">
        {iamModerator && (
          <FileUpload
            iamModerator
            isModalOpen={isModalOpen}
            setModalOpen={setModalOpen}
            onFileUpload={handleFileUpload}
            onClear={clearAllWhiteboards}
          />
        )}

        {/* Main whiteboard or content */}
        <div className={`content-area ${isModalOpen ? "modal-open" : ""}`} style={whiteboardPreview ? { opacity: 0 } : {}}>
          <WhiteboardEditor
            classId={classId}
            occupantId={userInfo?.occupantId.split(".net/")[1]}
            autoFocus={true}
            onMount={(editor) => editorsRef.current.push(editor)}
          />
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        classId={classId}
        iamModerator={iamModerator}
        occupants={occupants}
        onPreviewClick={(occupantId: any) => setWhiteboardPreview(occupantId)}
        editorsRef={editorsRef}
      />

      {/* Fullscreen */}
      {whiteboardPreview !== null && (
        <div className="app-container__fullscreen-preview">
          <button onClick={handleClosePreview} className="primary-button" style={{ paddingTop: "18px", paddingBottom: "18px", borderRadius: 0 }}>
            Go Back
          </button>

          <div className="fullscreen-editor">
            <WhiteboardEditor
              classId={classId}
              occupantId={whiteboardPreview.split(".net/")[1]}
              className="fullscreen-editor"
              autoFocus={true}
              onMount={(editor) => {
                editor.resetZoom();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { Whiteboard };