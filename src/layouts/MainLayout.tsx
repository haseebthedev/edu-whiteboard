import { useState } from "react";
import { FileUpload } from "../components/upload-file";
import { WhiteboardEditor } from "../components/whiteboard/WhiteboardEditor";
import { Sidebar } from "../components/sidebar";

const MainLayout = () => {
  const [whiteboardPreview, setWhiteboardPreview] = useState<string | number | null>(null);
  const [role, setRole] = useState("tutor");

  const toggleUser = () => {
    const newUser = role === "tutor" ? "student" : "tutor";
    setRole(newUser);
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-start bg-gray-100">
      {/* Main Content Area */}
      <div className="w-full md:w-[80%] h-auto md:h-[calc(100%-56px)] border border-gray-300 bg-white shadow-md">
        <FileUpload role={role} toggle={toggleUser} />

        {/* Main whiteboard or content */}
        <div className="w-full h-[calc(100%-80px)] p-4" style={whiteboardPreview ? { opacity: 0 } : {}}>
          {role === "tutor" && <WhiteboardEditor editorId="tutor" persistenceKey="tutor-board" autoFocus />}
          {role === "student" && <WhiteboardEditor editorId="student" persistenceKey="student-board" autoFocus />}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar role={role} onPreviewClick={(userId: any) => setWhiteboardPreview(userId)} />

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
