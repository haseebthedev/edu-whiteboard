import { useEffect, useState } from "react";
import { X } from "lucide-react";

const FileUpload = ({ isModalOpen, setModalOpen, onFileUpload, onClear }: any) => {
  const [googleSlideLink, setGoogleSlideLink] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // New state for loader

  const MAX_PREVIEWS = 3;
  const remainingImagesCount = imagePreviews.length - MAX_PREVIEWS;

  const handleClearWhiteboard = () => {
    onClear();
    console.log("Clear Whiteboard triggered!");
  };

  const extractPresentationId = (url: string) => {
    const regex = /\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleProcessSlides = async () => {
    setError("");
    if (!googleSlideLink) return;

    const presentationId = extractPresentationId(googleSlideLink);
    if (!presentationId) {
      setError("Invalid Google Slides link. Please enter a valid URL.");
      return;
    }

    setLoading(true); // Start loader
    try {
      const response = await fetch(`https://jitsi.withturtled.com:5001/process/${presentationId}`, { method: "GET" });
      const result = await response.json();

      if (result && result.imageUrls) {
        const images = result.imageUrls.map((el: string) => `https://jitsi.withturtled.com:5001${el}`);
        setImagePreviews(images);
      } else {
        setError("Failed to process the presentation. Please check URL or permissions.");
      }
    } catch (err) {
      setError("Failed to process the presentation. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startActivityHandler = async () => {
    if (!imagePreviews) setError("Please enter the Google Slide URL.");
    onFileUpload(imagePreviews);
  };

  useEffect(() => {
    return () => {
      setGoogleSlideLink(null);
      setImagePreviews([]);
      setError(null);
      setLoading(false); // Reset loader
    };
  }, [isModalOpen]);

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
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter Google Slide URL"
                onChange={({ target: { value } }) => setGoogleSlideLink(value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleProcessSlides}
                disabled={!googleSlideLink || loading} // Disable button when URL is null or loading
                className={`px-4 py-2 rounded-md ${
                  googleSlideLink && !loading ? "bg-primary text-white cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? "Processing..." : "Process"}
              </button>
            </div>

            {/* Previews */}
            {error ? (
              <p className="text-red-600 my-4">{error}</p>
            ) : (
              imagePreviews.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-md font-semibold mb-2">Preview:</h3>
                  <div className="flex items-center gap-4">
                    {imagePreviews.slice(0, MAX_PREVIEWS).map((url, index) => (
                      <img key={index} src={url} alt={`Preview ${index + 1}`} className="w-20 h-20 bg-primary border border-gray-300 rounded-md" />
                    ))}
                    {remainingImagesCount > 0 && (
                      <div className="text-sm text-center text-gray-500">
                        <p>{`+${remainingImagesCount} more images`}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Actions */}
            {imagePreviews.length > 0 && ( // Show buttons only if there are image previews
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-32 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition text-center"
                >
                  Cancel
                </button>
                <button onClick={startActivityHandler} className="w-32 px-4 py-2 rounded-md bg-primary text-white cursor-pointer text-center">
                  Create
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export { FileUpload };
