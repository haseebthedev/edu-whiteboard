import { WhiteboardEditor } from "./whiteboard/WhiteboardEditor";

const Sidebar = ({ role = "tutor", onPreviewClick }: any) => {
  return (
    <div className="w-full md:w-[20%] h-auto md:h-[calc(100%-56px)] overflow-y-auto bg-gray-50 border-t md:border-l md:border-t-0 border-gray-300 shadow-md">
      <div className="w-full h-full p-4 flex flex-col gap-3">
        <p className="text-gray-700 font-medium text-lg">{role === "tutor" ? "Student Whiteboards" : "Tutor Whiteboard"}</p>

        {(role === "tutor" ? [1, 2, 3] : ["tutor"]).map((id, index) => (
          <div key={index} className="w-full bg-white shadow-md rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <h4 className="text-gray-800 text-sm font-medium">{role === "tutor" ? `Student ${id}` : "Tutor's Board"}</h4>
              <button
                className="text-primary text-sm font-medium border border-primary px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors"
                onClick={() => onPreviewClick(id)}
              >
                Preview
              </button>
            </div>

            <div className="w-full h-44 p-4">
              <WhiteboardEditor
                editorId={`student-${id}`}
                persistenceKey={`student-board-${id}`}
                className="w-full h-full rounded-lg border border-gray-200"
                autoFocus={false}
                hideUi={true}
                onMount={(editor) => {
                  editor.zoomToFit();
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { Sidebar };
