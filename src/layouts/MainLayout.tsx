import { useRef, useState } from "react";
import { FileUpload } from "../components/upload-file";
import { WhiteboardEditor } from "../components/whiteboard/WhiteboardEditor";
import { Sidebar } from "../components/sidebar";
import { AssetRecordType, createShapeId, Editor, TLAssetId, TLImageShape, TLShapeId } from "tldraw";

const MainLayout = () => {
  const [whiteboardPreview, setWhiteboardPreview] = useState<string | number | null>(null);
  const [role, setRole] = useState("tutor");
  const [isModalOpen, setModalOpen] = useState(false); // Track modal state
  const editorsRef = useRef<Editor[]>([]); // Ref to store all editor instances

  const [assetIds, setAssetIds] = useState<TLAssetId[]>([]);
  const [shapeIds, setShapeIds] = useState<TLShapeId[]>([]);

  // const toggleUser = () => {
  //   const newUser = role === "tutor" ? "student" : "tutor";
  //   setRole(newUser);
  // };

  // Function to handle file upload
  const handleFileUpload = (images: string[]) => {
    const image = images[0];

    const assetId = AssetRecordType.createId();
    const shapeId = createShapeId();

    setAssetIds((prev) => [...prev, assetId]);
    setShapeIds((prev) => [...prev, shapeId]);

    editorsRef.current.forEach((editor) => {
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
            name: "image",
            isAnimated: false,
          },
        },
      ]);

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
      editor.toggleLock(shapeIds);
      editor.selectAll();
      editor.deleteShapes(editor.getSelectedShapeIds());

      editor.zoomToFit();
    });
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-start bg-gray-100">
      {/* Main Content Area */}
      <div className={`w-full md:w-[80%] h-auto md:h-[calc(100%-56px)] border border-gray-300 bg-white shadow-md`}>
        <FileUpload role={role} isModalOpen={isModalOpen} setModalOpen={setModalOpen} onFileUpload={handleFileUpload} onClear={clearAllWhiteboards} />

        {/* Main whiteboard or content */}
        <div
          className={`w-full h-[calc(100%-80px)] p-4 ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}
          style={whiteboardPreview ? { opacity: 0 } : {}}
        >
          {role === "tutor" && (
            <WhiteboardEditor editorId="tutor" persistenceKey="tutor-board" autoFocus={true} onMount={(editor) => editorsRef.current.push(editor)} />
          )}
          {role === "student" && (
            <WhiteboardEditor
              editorId="student"
              persistenceKey="student-board"
              autoFocus={true}
              onMount={(editor) => editorsRef.current.push(editor)}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        role={role}
        onPreviewClick={(userId: any) => setWhiteboardPreview(userId)}
        editorsRef={editorsRef} // Pass editorsRef to Sidebar
      />

      {/* Fullscreen */}
      {whiteboardPreview !== null && (
        <div className="w-full h-screen absolute top-0 bottom-0 left-0 right-0 bg-[rgba(0,0,0,.8)] px-10 py-6 shadow-lg">
          <button onClick={() => setWhiteboardPreview(null)} className="px-4 py-2 md:px-6 md:py-2 bg-primary text-white rounded-md mb-4">
            Go Back
          </button>

          <div className="w-full h-[calc(100%-120px)]">
            <WhiteboardEditor
              editorId={whiteboardPreview === "tutor" ? "tutor" : `student-${whiteboardPreview}`}
              persistenceKey={whiteboardPreview === "tutor" ? "tutor-board" : `student-board-${whiteboardPreview}`}
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
