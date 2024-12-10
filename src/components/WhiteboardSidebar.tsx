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
    <div className="sidebar">
      <div className="sidebar__content">
        {items.map((occupant, index) => (
          <div key={index} className="sidebar__item">
            <div className="sidebar__item__header">
              <h4>{iamModerator ? occupant.nick : "Tutor's Board"}</h4>
              <button className="primary-button" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => onPreviewClick(occupant.occupantId)}>
                Preview
              </button>
            </div>

            <div className="sidebar__item__content">
              <div className="overlay" />
              <WhiteboardEditor
                classId={classId}
                occupantId={occupant?.occupantId.split(".net/")[1]}
                className="whiteboard-editor"
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
