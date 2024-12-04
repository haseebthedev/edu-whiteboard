import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import { pdf } from "pdf-to-img";

const PORT = 3000;

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service account credentials
const keyPath = path.join(__dirname, "turtled-service-account.json");
const auth = new google.auth.GoogleAuth({
  keyFile: keyPath,
  scopes: [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/presentations.readonly",
  ],
});

// Google APIs
const drive = google.drive({ version: "v3", auth });

async function exportSlidesToPDF(presentationId, outputPath) {
  return new Promise((resolve, reject) => {
    drive.files
      .export(
        {
          fileId: presentationId,
          mimeType: "application/pdf",
        },
        { responseType: "stream" }
      )
      .then((response) => {
        const dest = fs.createWriteStream(outputPath);
        response.data
          .on("end", () => {
            console.log("PDF export completed!");
            resolve();
          })
          .on("error", (err) => {
            console.error("Error exporting the file.", err);
            reject(err);
          })
          .pipe(dest);
      })
      .catch((error) => {
        console.error("Error exporting slides to PDF:", error.message);
        reject(error);
      });
  });
}

async function convertPdfToImages(pdfPath, outputDir) {

  const imageFiles = await pdf(pdfPath, { scale: 2 });
  const images = [];

  for (let i = 1; i <= imageFiles.length; i++) {
    try {
      const pageImage = await imageFiles.getPage(i);
      const outputPath = path.join(outputDir, `page-${i}.png`);

      fs.writeFileSync(outputPath, pageImage);
      images.push(`/${path.relative(__dirname, outputPath)}`);
    } catch (err) {
      console.error(`Error processing page ${i}:`, err);
    }
  }

  return images;
}

// Serve the processed directory as static files
app.use("/processed", express.static(path.join(__dirname, "processed")));

app.get("/process/:presentationId", async (req, res) => {
  const { presentationId } = req.params;

  const outputDir = path.join(__dirname, `processed/${presentationId}`);
  const pdfPath = path.join(__dirname, `/uploads/${new Date().toISOString()}.pdf`);

  try {
    // Step 1: Export presentation to PDF
    console.log("Exporting presentation to PDF...");
    await exportSlidesToPDF(presentationId, pdfPath);

    // Step 2: Convert PDF to images
    console.log("Converting PDF to images...");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const imageUrls = await convertPdfToImages(pdfPath, outputDir);

    // Step 3: Return image URLs
    console.log("Returning image URLs...");
    res.json({
      imageUrls,
      message: "Presentation processed successfully.",
    });
  } catch (err) {
    console.error("Error processing presentation:", err);
    res.status(500).json({ error: "Failed to process the presentation." });
  }
  finally {
    // Cleanup: Delete the PDF file
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log("Deleted temporary PDF file.");
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
