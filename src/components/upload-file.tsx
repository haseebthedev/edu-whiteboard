import { useState } from "react";
import { X } from "lucide-react";

const FileUpload = ({ isModalOpen, setModalOpen, onFileUpload, onClear }: any) => {
  const [pdfPreviews, setPdfPreviews] = useState<string[]>([]); // To store preview URLs

  // Maximum number of previews to display
  const MAX_PREVIEWS = 3;

  const remainingImagesCount = pdfPreviews.length - MAX_PREVIEWS;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate server-side processing
      console.log("Uploading file:", file.name);

      const formData = new FormData();
      formData.append("pdf", file);

      try {
        const response = await fetch("http://localhost:3000/file/upload-and-convert", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (response.ok) {
          const images = result.images.map((el: string) => "http://localhost:3000" + el);
          setPdfPreviews(images);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClearWhiteboard = () => {
    onClear();
    console.log("Clear Whiteboard triggered!");
    // Implement logic to clear the whiteboard
  };

  const createActivity = () => {
    onFileUpload(pdfPreviews);
  };

  return (
    <>
      {/* Buttons */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200">
        <button onClick={() => setModalOpen(true)} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition">
          Upload
        </button>
        <button onClick={handleClearWhiteboard} className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">
          Clear
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] md:w-[600px] p-6">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-bold mb-4">Upload PDF</h2>

              <button onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* File Input */}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* Previews */}
            {pdfPreviews.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-semibold mb-2">Preview:</h3>
                <div className="flex items-center gap-4">
                  {/* Display up to MAX_PREVIEWS images */}
                  {pdfPreviews.slice(0, MAX_PREVIEWS).map((url, index) => (
                    <img key={index} src={url} alt={`Preview ${index + 1}`} className="w-20 h-20 bg-primary border border-gray-300 rounded-md" />
                  ))}
                  {/* Placeholder for remaining images */}
                  {remainingImagesCount > 0 && (
                    <div className="text-sm tecenterxt-center text-gray-500">
                      <p>{`+${remainingImagesCount} more images`}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-4">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">
                Cancel
              </button>
              <button onClick={createActivity} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition">
                Create Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { FileUpload };
