import { useRef, useState } from "react";
import { FileUpload } from "../components/upload-file";
import { WhiteboardEditor } from "../components/whiteboard/WhiteboardEditor";
import { Sidebar } from "../components/sidebar";
import { AssetRecordType, createShapeId, Editor, TLAssetId, TLImageShape, TLShapeId } from "tldraw";

const MainLayout = () => {
  const [whiteboardPreview, setWhiteboardPreview] = useState<string | null>(null);

  const [myJid, setMyJid] = useState("focus@auth.alpha.jitsi.net/focus");
  const [iamModerator, setIamModerator] = useState(true);
  const [occupants, setOccupants] = useState<any>([
    {
      occupantId: "isolatedacademicsawardyearly@conference.alpha.jitsi.net/focus",
      nick: "Tutor",
      role: "moderator",
      affiliation: "owner",
      jid: "focus@auth.alpha.jitsi.net/focus",
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

  // Toggle between tutor and student roles
  const toggleRole = () => {
    setIamModerator(!iamModerator);
    setMyJid((prevJid) =>
      prevJid === "focus@auth.alpha.jitsi.net/focus"
        ? "5d62aa54-3ab9-4d56-9dd0-22d22533f563@alpha.jitsi.net/9MhoNk72E131"
        : "focus@auth.alpha.jitsi.net/focus"
    );
  };

  const [isModalOpen, setModalOpen] = useState(false); // Track modal state
  const editorsRef = useRef<Editor[]>([]); // Ref to store all editor instances

  const [assetIds, setAssetIds] = useState<TLAssetId[]>([]);
  const [shapeIds, setShapeIds] = useState<TLShapeId[]>([]);

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

  const userInfo = occupants.find((el: any) => el.jid === myJid);

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
            editorId={userInfo.occupantId}
            persistenceKey={userInfo.occupantId}
            autoFocus={true}
            onMount={(editor) => editorsRef.current.push(editor)}
          />
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
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
              editorId={whiteboardPreview}
              persistenceKey={whiteboardPreview}
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
