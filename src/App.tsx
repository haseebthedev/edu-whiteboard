import { Header } from "./components/header";
import { MainLayout } from "./layouts/MainLayout";
import "tldraw/tldraw.css";

const App = () => {
  return (
    <div className="w-full h-screen overflow-hidden">
      {/* <Header /> */}
      <MainLayout />
    </div>
  );
};

export default App;
