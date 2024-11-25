import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Editor, Tldraw, TLUiComponents } from "tldraw";
import "tldraw/tldraw.css";
// import io from "socket.io-client";

// The WebSocket URL
// const socket = io("http://localhost:4000"); // Replace with your backend URL

// Custom Components Configuration for Sidebar Whiteboards
const sidebarComponents: Required<TLUiComponents> = {
  ContextMenu: null,
  ActionsMenu: null,
  HelpMenu: null,
  ZoomMenu: null,
  MainMenu: null,
  Minimap: null,
  StylePanel: null,
  PageMenu: null,
  NavigationPanel: null,
  Toolbar: null,
  KeyboardShortcutsDialog: null,
  QuickActions: null,
  HelperButtons: null,
  DebugPanel: null,
  DebugMenu: null,
  SharePanel: null,
  MenuPanel: null,
  TopPanel: null,
  CursorChatBubble: null,
};

// Context for managing focused editor
const FocusedEditorContext = createContext({
  focusedEditor: null as Editor | null,
  setFocusedEditor: (editor: Editor | null) => {},
});

export default function MultiSyncWhiteboardApp() {
  const [focusedEditor, _setFocusedEditor] = useState<Editor | null>(null);
  const [fullscreenWhiteboard, setFullscreenWhiteboard] = useState<number | null>(null); // Track fullscreen whiteboard ID

  const setFocusedEditor = useCallback(
    (editor: Editor | null) => {
      if (focusedEditor !== editor) {
        if (focusedEditor) {
          focusedEditor.blur();
        }
        if (editor) {
          editor.focus();
        }
        _setFocusedEditor(editor);
      }
    },
    [focusedEditor]
  );

  return (
    <div className="whiteboard-app">
      <FocusedEditorContext.Provider value={{ focusedEditor, setFocusedEditor }}>
        {/* Main Whiteboard Area */}
        <div className="main-whiteboard">
          <h2>Tutor's Whiteboard</h2>
          <WhiteboardEditor
            editorId="tutor"
            persistenceKey="tutor-board"
            className="tutor-board"
            showComponents // Pass `showComponents` as true for main whiteboard
          />
        </div>

        {/* Sidebar for Student Whiteboards */}
        <div className="student-sidebar">
          <h3>Student Whiteboards</h3>
          {[1, 2, 3].map((studentId) => (
            <div
              key={studentId}
              className="student-board-card"
              onClick={() => setFullscreenWhiteboard(studentId)} // Open in fullscreen on click
            >
              <h4>Student {studentId}</h4>
              <WhiteboardEditor
                editorId={`student-${studentId}`}
                persistenceKey={`student-${studentId}-board`}
                className="student-board"
                showComponents={false} // Sidebar whiteboards have minimal UI
              />
            </div>
          ))}
        </div>

        {/* Fullscreen Whiteboard */}
        {fullscreenWhiteboard !== null && (
          <div className="fullscreen-whiteboard">
            <button className="exit-button" onClick={() => setFullscreenWhiteboard(null)}>
              Go Back
            </button>
            <WhiteboardEditor
              editorId={`student-${fullscreenWhiteboard}`}
              persistenceKey={`student-${fullscreenWhiteboard}-board`}
              className="fullscreen-editor"
              showComponents // Show all components in fullscreen mode
            />
          </div>
        )}
      </FocusedEditorContext.Provider>
    </div>
  );
}

// Whiteboard Editor Component
function WhiteboardEditor({
  editorId,
  persistenceKey,
  className,
  showComponents,
}: {
  editorId: string;
  persistenceKey: string;
  className: string;
  showComponents: boolean; // Boolean flag to toggle components
}) {
  const { setFocusedEditor } = useContext(FocusedEditorContext);
  const editorRef = useRef<Editor | null>(null);

  // useEffect(() => {
  //   // Initialize WebSocket event listeners
  //   socket.on("whiteboard-update", (data) => {
  //     if (editorRef.current) {
  //       // Apply the changes to the current editor
  //       // @ts-ignore
  //       editorRef.current.applyChange(data);
  //     }
  //   });

  //   return () => {
  //     socket.off("whiteboard-update"); // Cleanup listener on unmount
  //   };
  // }, []);

  // const handleEditorChange = (change: any) => {
  //   if (editorRef.current) {
  //     // Send changes to the server in real-time
  //     socket.emit("whiteboard-update", {
  //       editorId,
  //       change,
  //     });
  //   }
  // };

  return (
    <div tabIndex={-1} onFocus={() => setFocusedEditor((window as any)[`EDITOR_${editorId}`])} className={`whiteboard-editor ${className}`}>
      <Tldraw
        persistenceKey={persistenceKey}
        autoFocus={false}
        components={showComponents ? undefined : sidebarComponents} // Pass components conditionally
        onMount={(editor) => {
          editor.setCamera({ x: 0, y: 0, z: 1.5 }, { animation: { duration: 1000, easing: (t) => t * t } });
          editor.zoomToFit();
          editorRef.current = editor;

          editor.createPage({
            name: "Test Page",
          });
          // editor.createPage({ name: 'Page 2' })

          // Save the editor to global scope
          (window as any)[`EDITOR_${editorId}`] = editor;
        }}
        // onUiEvent={handleEditorChange}
      />
    </div>
  );
}
