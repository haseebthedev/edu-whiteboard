import fs from "fs";
import path from "path";
import express, { Request, Response, Express, RequestHandler } from "express";
import cors from "cors";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import { pdf } from "pdf-to-img";
import { promises as fsPromises } from 'fs';

// Constants
const PORT = process.env.PORT || 5100;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const dirs = {
  uploads: path.join(serverRoot, "uploads"),
  processed: path.join(serverRoot, "processed")
};

// Initialize Express
const app: Express = express();
app.use(cors());
app.use(express.json());
app.use("/processed", express.static(dirs.processed));

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(serverRoot, "turtled-service-account.json"),
  scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/presentations.readonly"]
});
const drive = google.drive({ version: "v3", auth });

// Helper Functions
const ensureDir = async (dir: string) => {
  try {
    await fsPromises.access(dir);
  } catch {
    await fsPromises.mkdir(dir, { recursive: true });
  }
};

const cleanupFile = async (filePath: string) => {
  try {
    if (await fsPromises.access(filePath).then(() => true).catch(() => false)) {
      await fsPromises.unlink(filePath);
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
};

const handleGoogleDriveError = (err: any) => {
  const errorDetails = err?.response?.data?.error || {};

  if (errorDetails.code === 404) return "This Google Slides presentation doesn't exist.";
  if (errorDetails.code === 403 || err?.response?.status === 403) return "This presentation is private. Please make it accessible.";
  if (err?.response?.status === 404) return "Invalid presentation link.";
  return "Unable to access the presentation.";
};

// Main Functions
async function exportSlidesToPDF(presentationId: string, outputPath: string): Promise<void> {
  let writeStream: fs.WriteStream | null = null;

  try {
    // Verify access
    await drive.files.get({ fileId: presentationId, fields: 'id', supportsAllDrives: true });

    // Ensure directory exists and create file
    await ensureDir(path.dirname(outputPath));

    // Export and write PDF
    const response = await drive.files.export(
      { fileId: presentationId, mimeType: "application/pdf" },
      { responseType: "stream" }
    );

    await new Promise((resolve, reject) => {
      writeStream = fs.createWriteStream(outputPath);

      writeStream
        .on('error', reject)
        .on('finish', async () => {
          const stats = await fsPromises.stat(outputPath);
          if (stats.size > MAX_FILE_SIZE) {
            await cleanupFile(outputPath);
            reject(new Error("The uploaded Slide is too large (over 25 MB). Please reduce the size."));
          } else {
            resolve(undefined);
          }
        });

      response.data.pipe(writeStream).on('error', reject);
    });

  } catch (err: any) {
    if (writeStream) writeStream.end();
    await cleanupFile(outputPath);
    throw new Error(err.message?.includes('25 MB') ? err.message : handleGoogleDriveError(err));
  }
}

async function convertPdfToImages(pdfPath: string, outputDir: string): Promise<string[]> {
  const imageFiles = await pdf(pdfPath, { scale: 2 });
  const images: string[] = [];

  for (let i = 1; i <= imageFiles.length; i++) {
    try {
      const pageImage = await imageFiles.getPage(i);
      const fileName = `page-${i}.png`;
      await fsPromises.writeFile(path.join(outputDir, fileName), pageImage);
      images.push(`/processed/${path.basename(outputDir)}/${fileName}`);
    } catch (err) {
      console.error(`Error processing page ${i}:`, err);
    }
  }

  return images;
}

// Initialize directories
Promise.all([ensureDir(dirs.uploads), ensureDir(dirs.processed)])
  .catch(err => {
    console.error("Error initializing directories:", err);
    process.exit(1);
  });

// Route Handlers with proper types
const healthCheckHandler: RequestHandler = (_req: Request, res: Response) => {
  res.json({ status: "OK" });
};

interface ProcessRequestParams {
  presentationId: string;
}

const processHandler: RequestHandler<ProcessRequestParams> = async (req: Request<ProcessRequestParams>, res: Response) => {
  const pdfPath = path.join(dirs.uploads, `${new Date().toISOString().replace(/:/g, '-')}.pdf`);
  const presentationFolder = path.join(dirs.processed, req.params.presentationId);

  try {
    await exportSlidesToPDF(req.params.presentationId, pdfPath);
    await ensureDir(presentationFolder);
    const imageUrls = await convertPdfToImages(pdfPath, presentationFolder);

    res.json({
      imageUrls,
      message: "Presentation processed successfully."
    });
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({
      error: err.message || "Failed to process the presentation. Please try again."
    });
  } finally {
    await cleanupFile(pdfPath);
  }
};

// Routes with proper type handlers
app.get("/healthCheck", healthCheckHandler);
app.get("/process/:presentationId", processHandler);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
