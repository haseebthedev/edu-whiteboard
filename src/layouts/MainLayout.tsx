import { useEffect, useRef, useState } from "react";
import { FileUpload } from "../components/upload-file";
import { WhiteboardEditor } from "../components/whiteboard/WhiteboardEditor";
import { Sidebar } from "../components/sidebar";
import { AssetRecordType, createShapeId, Editor, TLAssetId, TLImageShape, TLShapeId } from "tldraw";

const MainLayout = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const userType = searchParams.get("user");

  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [myJid, setMyJid] = useState<string | null>(null);
  const [iamModerator, setIamModerator] = useState<boolean | null>(null);
  const [whiteboardPreview, setWhiteboardPreview] = useState<string | null>(null);

  const [classId, setClassId] = useState("12345678");

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
      const image = images[0];

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
            w: 1600,
            h: 900,
            mimeType: "image/png",
            src: image,
            name: `image-${image + 1}`,
            isAnimated: false,
          },
        },
      ]);

      // Create a new page for this image
      // editor.createPage({
      //   name: `Activity ${index + 1}`,
      // });

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

      // Optionally return to the first page
      const firstPageId = editor.getPages()[0];
      if (firstPageId) {
        editor.setCurrentPage(firstPageId);
      }

      editor.zoomToFit();
    });
  };

  // Function to clear all pages in all whiteboards
  const clearAllWhiteboards = async () => {
    editorsRef.current.forEach((editor) => {
      // Delete all shapes (removes all the drawings, images, and objects on the canvas)
      editor.deleteShapes(shapeIds);

      // Delete all assets (removes any image assets, files, etc.)
      editor.deleteAssets(assetIds);

      // Clear the editor history (optional)
      editor.clearHistory();

      // Reset the camera to its initial state (optional)
      editor.selectAll();
      editor.deleteShapes(editor.getSelectedShapeIds());

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

  if (isLoading) {
    // Show loading state
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!myJid) {
    // Show an error state if `myJid` is not available
    return <div className="flex items-center justify-center h-screen">Unable to determine user role. Please try again.</div>;
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-start bg-gray-100">
      {/* Main Content Area */}
      <div className={`w-full md:w-[80%] h-auto md:h-[calc(100%-56px)] border border-gray-300 bg-white shadow-md`}>
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
        <div
          className={`w-full h-[calc(100%-80px)] p-4 ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}
          style={whiteboardPreview ? { opacity: 0 } : {}}
        >
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
        <div className="w-full h-screen absolute top-0 bottom-0 left-0 right-0 bg-[rgba(0,0,0,.8)] px-10 py-6 shadow-lg">
          <button onClick={() => setWhiteboardPreview(null)} className="px-4 py-2 md:px-6 md:py-2 bg-primary text-white rounded-md mb-4">
            Go Back
          </button>

          <div className="w-full h-[calc(100%-120px)]">
            <WhiteboardEditor
              classId={classId}
              occupantId={whiteboardPreview.split(".net/")[1]}
              // persistenceKey={whiteboardPreview}
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

export { MainLayout };
