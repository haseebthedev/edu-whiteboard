import React from "react";
import { Editor } from "tldraw";
import { WhiteboardEditor } from "./whiteboard/WhiteboardEditor";

interface SidebarI {
  iamModerator: boolean | null;
  occupants: Array<any>;
  onPreviewClick: Function;
  classId: string;
  editorsRef: React.MutableRefObject<Map<string, Editor>>;
}

const Sidebar = ({ iamModerator, occupants, onPreviewClick, editorsRef, classId }: SidebarI) => {
  const items = iamModerator ? occupants.filter((el) => el.role === "participant") : occupants.filter((el) => el.role === "moderator");

  const handleEditorMount = (editor: Editor) => {
    const handleContentChange = (changes: any) => {
      editor.zoomToFit();
      // editor.zoomToBounds({center: })
      // editor.centerOnPoint({ x: 0, y: 0 });
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
      {items?.length > 0 ? (
        <div className="sidebar__content">
          {items.map((occupant, index) => (
            <div key={index} className="sidebar__item">
              <div className="sidebar__item__header">
                <h4>{iamModerator ? occupant.name : "Tutor's Board"}</h4>
                <button className="primary-button" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => onPreviewClick(occupant.id)}>
                  Preview {occupant.id}
                </button>
              </div>

              <div className="sidebar__item__content">
                <div className="overlay" />
                <WhiteboardEditor
                  classId={classId}
                  occupantId={occupant?.id}
                  className="whiteboard-editor"
                  autoFocus={false}
                  hideUi={true}
                  onMount={(editor) => {
                    // @ts-ignore
                    editorsRef?.current.set(String(occupant?.id), editor);
                    handleEditorMount(editor);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="centered-content" style={{ fontSize: 18, color: "#329732" }}>
          No active participants.
        </div>
      )}
    </div>
  );
};

export { Sidebar };
