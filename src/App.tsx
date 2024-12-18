import "./styles/globals.scss";
import { WhiteboardApp } from "./components/Whiteboard";
import "tldraw/tldraw.css";
import { TestBoard } from "./components/TestBoard";

const App = () => {
  return <WhiteboardApp />;
  // return <TestBoard />;
};

export default App;
