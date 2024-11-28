import { Editor } from "tldraw";
import { WhiteboardEditor } from "./whiteboard/WhiteboardEditor";

const Sidebar = ({
  iamModerator,
  occupants,
  onPreviewClick,
  editorsRef,
}: {
  iamModerator: boolean;
  occupants: Array<any>;
  onPreviewClick: Function;
  editorsRef: React.RefObject<Editor[]>;
}) => {
  const items = iamModerator
    ? occupants.filter((el) => el.role === "participant") // Show students for moderators
    : occupants.filter((el) => el.role === "moderator"); // Show tutor for students

  return (
    <div className="w-full md:w-[20%] h-auto md:h-[calc(100%-56px)] overflow-y-auto bg-gray-50 border-t md:border-l md:border-t-0 border-gray-300 shadow-md">
      <div className="w-full h-full p-4 flex flex-col gap-3">
        {items.map((occupant, index) => (
          <div key={index} className="w-full bg-white shadow-md rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <h4 className="text-gray-800 text-sm font-medium">{iamModerator ? occupant.nick : "Tutor's Board"}</h4>
              <button
                className="text-primary text-sm font-medium border border-primary px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors"
                onClick={() => onPreviewClick(occupant.occupantId)}
              >
                Preview
              </button>
            </div>

            <div className="w-full h-44 p-4">
              <WhiteboardEditor
                editorId={occupant.occupantId}
                persistenceKey={occupant.occupantId}
                className="w-full h-full rounded-lg border border-gray-200"
                autoFocus={false}
                hideUi={true}
                onMount={(editor) => {
                  editor.zoomToFit();
                  editorsRef?.current?.push(editor);
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
