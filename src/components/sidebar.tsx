import { Editor } from "tldraw";
import { WhiteboardEditor } from "./whiteboard/WhiteboardEditor";

const Sidebar = ({
  iamModerator,
  occupants,
  onPreviewClick,
  editorsRef,
  classId,
}: {
  iamModerator: boolean | null;
  occupants: Array<any>;
  onPreviewClick: Function;
  editorsRef: React.RefObject<Editor[]>;
  classId: string;
}) => {
  const items = iamModerator
    ? occupants.filter((el) => el.role === "participant") // Show students for moderators
    : occupants.filter((el) => el.role === "moderator"); // Show tutor for students

  const handleEditorMount = (editor: Editor) => {
    const handleContentChange = () => {
      editor.zoomToFit();
    };

    // Subscribe to the editor's content changes
    editor.on("change", handleContentChange);

    // Clean up subscription on unmount
    return () => {
      editor.off("change", handleContentChange);
    };
  };

  return (
    <div className="w-full md:w-[20%] h-screen overflow-y-auto bg-gray-50 border-t md:border-l md:border-t-0 border-gray-300 shadow-md select-none">
      <div className="w-full h-full p-4 flex flex-col">
        {items.map((occupant, index) => (
          <div
            key={index}
            className="w-full bg-white shadow-sm rounded-lg mb-4 border border-gray-200 hover:shadow-xl transition-shadow duration-200"
          >
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <h4 className="text-gray-800 text-sm font-medium">{iamModerator ? occupant.nick : "Tutor's Board"}</h4>
              <button
                className="text-primary text-sm font-medium border border-primary px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors"
                onClick={() => onPreviewClick(occupant.occupantId)}
              >
                Preview
              </button>
            </div>

            <div className="w-full h-52 p-4 border relative">
              <div className="absolute top-0 bottom-0 left-0 right-0 z-50" />
              <WhiteboardEditor
                classId={classId}
                occupantId={occupant?.occupantId.split(".net/")[1]}
                className="w-full h-full border border-gray-200 rounded-lg"
                autoFocus={false}
                hideUi={true}
                onMount={(editor) => {
                  editor.zoomToFit();
                  editorsRef?.current?.push(editor);

                  handleEditorMount(editor);
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
