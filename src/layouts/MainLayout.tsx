import { FileUpload } from "../components/upload-file";

const MainLayout = () => {
  return (
    <div className="w-full h-full flex flex-col md:flex-row items-start bg-gray-100">
      {/* Main Content Area */}
      <div className="w-full md:w-[75%] h-auto md:h-[calc(100%-56px)] border border-gray-300 bg-white shadow-md">
        <FileUpload />

        <div className="p-4">
          {/* Main whiteboard or content */}
          <p className="text-gray-700">MAIN WHITEBOARD</p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-[25%] h-auto md:h-[calc(100%-56px)] bg-gray-50 border-t md:border-l md:border-t-0 border-gray-300 shadow-md">
        <div className="p-4">
          <p className="text-gray-700 font-medium">SIDEBAR</p>
        </div>
      </div>
    </div>
  );
};

export { MainLayout };
