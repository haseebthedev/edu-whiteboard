import { useState } from "react";
import { FileUpload } from "../components/upload-file";
import { noComponents, WhiteboardEditor } from "../components/whiteboard/WhiteboardEditor";

const MainLayout = () => {
  const [fullscreenWhiteboard, setFullscreenWhiteboard] = useState<string | number | null>(null);
  const role = "tutor";

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-start bg-gray-100">
      {/* Main Content Area */}
      <div className="w-full md:w-[75%] h-auto md:h-[calc(100%-56px)] border border-gray-300 bg-white shadow-md">
        <FileUpload />

        {/* Main whiteboard or content */}
        <div className="w-full h-[calc(100%-80px)] p-4" style={fullscreenWhiteboard ? { opacity: 0 } : {}}>
          {role === "tutor" && <WhiteboardEditor editorId="tutor" persistenceKey="tutor-board" autoFocus />}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-[25%] h-auto md:h-[calc(100%-56px)] overflow-y-auto bg-gray-50 border-t md:border-l md:border-t-0 border-gray-300 shadow-md">
        <div className="w-full h-full p-4 flex flex-col gap-4">
          <p className="text-gray-700 font-medium">{role === "tutor" ? "Student Whiteboards" : "Tutor Whiteboard"}</p>

          {(role === "tutor" ? [1, 2, 3, 4, 5, 6] : ["tutor"]).map((id, index) => (
            <div key={index} className="w-full">
              <div className="flex items-center justify-between">
                <h4>{role === "tutor" ? `Student ${id}` : "Tutor's Board"}</h4>
                <button
                  className="text-primary font-medium border border-primary px-2 py-1 rounded-lg hover:bg-primary hover:text-white"
                  onClick={() => setFullscreenWhiteboard(id)}
                >
                  Preview
                </button>
              </div>

              <div className="w-full h-60">
                <WhiteboardEditor
                  editorId={`student-${id}`}
                  persistenceKey={`student-board-${id}`}
                  components={{
                    Toolbar: null,
                    PageMenu: null,
                    MenuPanel: null,
                  }}
                  className="w-full h-60 bg-red-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen */}
      {fullscreenWhiteboard !== null && (
        <div className="w-full h-screen absolute top-14 bottom-0 left-0 right-0 bg-[rgba(0,0,0,.8)] z-50 px-10 py-6 shadow-lg">
          <button onClick={() => setFullscreenWhiteboard(null)} className="px-4 py-2 md:px-6 md:py-2 bg-primary text-white rounded-md mb-4">
            Go Back
          </button>

          <div className="w-full h-[calc(100%-120px)]">
            <WhiteboardEditor
              // editorId={fullscreenWhiteboard === "tutor" ? "tutor" : `student-${fullscreenWhiteboard}`}
              editorId={`${fullscreenWhiteboard}`}
              // persistenceKey={fullscreenWhiteboard === "tutor" ? "tutor-board" : `student-${fullscreenWhiteboard}-board`}
              persistenceKey={`${fullscreenWhiteboard}`}
              className="fullscreen-editor"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { MainLayout };
