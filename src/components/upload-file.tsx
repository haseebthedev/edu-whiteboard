// import { useState, useRef } from "react";

const FileUpload = ({ role, toggle }: any) => {
  const isModerator = role === "tutor" ? true : false;

  // const [file, setFile] = useState<File | null>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const selectedFile = event.target.files?.[0];
  //   if (selectedFile) {
  //     setFile(selectedFile);
  //   }
  // };

  // const handleUpload = () => {
  //   if (file) {
  //     // Here you would typically send the file to your server
  //     console.log("Uploading file:", file.name);
  //     // For demonstration, we'll just log the file details
  //     console.log("File size:", file.size, "bytes");
  //     console.log("File type:", file.type);
  //   } else {
  //     console.log("No file selected");
  //   }
  // };

  // const handleClear = () => {
  //   setFile(null);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // };

  return (
    <div className="flex flex-wrap items-center justify-between px-4 py-4 md:px-8 md:py-4 border-b border-gray-200">
      {isModerator && (
        <input
          type="file"
          className="file-input border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto"
        />
      )}

      <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
        <button
          onClick={toggle}
          className="px-4 py-2 md:px-6 md:py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition w-full md:w-auto"
        >
          Upload
        </button>
        <button className="px-4 py-2 md:px-6 md:py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition w-full md:w-auto">Clear</button>
      </div>
    </div>
  );
};

export { FileUpload };
