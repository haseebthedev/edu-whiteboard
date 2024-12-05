import fs from 'fs';
import path from 'path'
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Specify your dist directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

// Function to add .js extension in import statements
function updateImports(filePath) {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf-8');

    // Regular expression to match imports and add .js extension
    content = content.replace(/import\s.*\sfrom\s'(\.\/[\w-]+)'/g, (match, p1) => {
        return match.replace(p1, `${p1}.js`);
    });

    // Write the updated content back to the file
    fs.writeFileSync(filePath, content);
}

// Function to recursively process files in the dist directory
function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processDirectory(filePath); // Recursively process subdirectories
        } else if (filePath.endsWith('.js')) {
            updateImports(filePath); // Update import statements in .js files
        }
    });
}

// Run the script on the dist directory
processDirectory(distDir);
