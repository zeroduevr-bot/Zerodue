import React from 'react';
import { Header } from './components/Header';
import { Section } from './components/Section';
import { CodeBlock } from './components/CodeBlock';
import { InteractivePipeline } from './components/InteractivePipeline';
import { PythonIcon, GpuIcon, FilePdfIcon, FileCsvIcon, GearIcon, ServerIcon, BrainCircuitIcon, HardDriveIcon, DesktopIcon, PlayCircleIcon } from './components/IconComponents';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg font-sans text-dark-text">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <div className="space-y-16">
          <Section title="Live Demo: PDF to Image Extraction" icon={<PlayCircleIcon />}>
            <p className="text-dark-subtext mb-4">
              Upload a PDF to see the first step of the pipeline in action. Your file is processed entirely in your browser and is never uploaded to any server. This demonstrates the client-side PDF-to-image conversion.
            </p>
            <InteractivePipeline />
          </Section>

          <Section title="Overview: The 100% Offline Pipeline" icon={<BrainCircuitIcon />}>
            <p className="text-dark-subtext">
              This guide outlines how to build a high-accuracy, server-independent PDF-to-CSV OCR pipeline. The entire process, from model loading to final output, runs locally, ensuring data privacy and eliminating reliance on external APIs. We will focus on using robust Python libraries to create a pipeline optimized for both scanned and digital documents.
            </p>
          </Section>

          <Section title="Core Components & Technology" icon={<GearIcon />}>
            <ul className="space-y-4">
              <li className="flex items-start"><PythonIcon className="mr-3 mt-1 flex-shrink-0" /><div><strong>PaddleOCR:</strong> A powerful, multilingual OCR toolkit. Chosen for its excellent balance of speed, accuracy, and ease of offline setup.</div></li>
              <li className="flex items-start"><GearIcon className="mr-3 mt-1 flex-shrink-0" /><div><strong>OpenCV:</strong> The cornerstone for all image preprocessing tasks, crucial for maximizing OCR accuracy by cleaning and enhancing page images.</div></li>
              <li className="flex items-start"><FilePdfIcon className="mr-3 mt-1 flex-shrink-0" /><div><strong>PyMuPDF (or pdf2image):</strong> Efficiently converts PDF pages into high-resolution images, serving as the input for our preprocessing and OCR stages.</div></li>
              <li className="flex items-start"><FileCsvIcon className="mr-3 mt-1 flex-shrink-0" /><div><strong>Pandas:</strong> Used for structuring the extracted text data into a clean, tabular format and exporting it to a CSV file.</div></li>
            </ul>
          </Section>

          <Section title="Step 1: Setup & Installation" icon={<ServerIcon />}>
            <p className="text-dark-subtext mb-4">
              First, ensure you have Python 3.8+ installed. Then, install the necessary libraries. For a fully offline setup, run these commands on a machine with internet access and transfer the downloaded packages if needed.
            </p>
            <CodeBlock language="bash" code={`# For CPU-only version
pip install paddlepaddle paddleocr opencv-python-headless PyMuPDF pandas

# For GPU version (ensure CUDA and cuDNN are installed first)
pip install paddlepaddle-gpu paddleocr opencv-python-headless PyMuPDF pandas`} />
            <p className="text-dark-subtext mt-4">
              The first time you run PaddleOCR, it will download models to <code className="bg-dark-card px-1 rounded-md text-sm">~/.paddleocr/</code>. Do this on an internet-connected machine, then copy this directory to your offline machine to ensure it works without network access.
            </p>
          </Section>

          <Section title="Step 2: PDF to Image Conversion" icon={<FilePdfIcon />}>
             <p className="text-dark-subtext mb-4">
              The OCR engine works on images, so our first step is to convert each PDF page into a high-resolution image. PyMuPDF is fast and reliable for this task.
            </p>
            <CodeBlock language="python" code={`import fitz # PyMuPDF
import os

def convert_pdf_to_images(pdf_path, output_folder, dpi=300):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    doc = fitz.open(pdf_path)
    image_paths = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=dpi)
        output_path = os.path.join(output_folder, f"page_{page_num + 1}.png")
        pix.save(output_path)
        image_paths.append(output_path)
        
    doc.close()
    return image_paths

# Usage
# image_files = convert_pdf_to_images("my_document.pdf", "temp_images")
# print(f"Converted PDF to {len(image_files)} images.")`} />
          </Section>
          
          <Section title="Step 3: Advanced Image Preprocessing" icon={<GearIcon />}>
            <p className="text-dark-subtext mb-4">
              This is the most critical step for achieving high accuracy. The function below is now configurable, allowing you to enable or disable different filters to create a pipeline tailored to your specific documents. Experiment with these options to find the best combination for your data.
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Denoising:</strong> Choose between `fastNlMeansDenoising` (good for general noise) or `medianBlur` (effective for salt-and-pepper noise).</li>
              <li><strong>Contrast Adjustment:</strong> Use `CLAHE` (Contrast Limited Adaptive Histogram Equalization) to enhance text clarity, especially in images with uneven lighting.</li>
              <li><strong>Sharpening:</strong> A kernel filter is used to sharpen edges, which can help with slightly blurry text but may amplify noise.</li>
            </ul>
            <CodeBlock language="python" code={`import cv2
import numpy as np

def preprocess_image(image_path, options=None):
    """
    Applies a configurable series of preprocessing steps to an image.
    
    :param image_path: Path to the input image.
    :param options: A dictionary to control preprocessing steps.
    :return: The preprocessed image.
    """
    if options is None:
        # Default options provide a good baseline
        options = {
            'deskew': True,
            'denoise': 'fast',  # 'fast', 'median', or None
            'contrast': 'clahe', # 'clahe', or None
            'sharpen': True,
            'threshold': 'adaptive' # 'adaptive' or None
        }

    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    # 1. Deskewing (correcting tilted pages)
    if options.get('deskew'):
        coords = np.column_stack(np.where(img < 128))
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    # 2. Denoising
    denoise_type = options.get('denoise')
    if denoise_type == 'fast':
        img = cv2.fastNlMeansDenoising(img, None, 10, 7, 21)
    elif denoise_type == 'median':
        img = cv2.medianBlur(img, 3)

    # 3. Contrast Adjustment
    if options.get('contrast') == 'clahe':
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        img = clahe.apply(img)

    # 4. Sharpening
    if options.get('sharpen'):
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        img = cv2.filter2D(img, -1, kernel)

    # 5. Thresholding (Binarization)
    if options.get('threshold') == 'adaptive':
        img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    return img

# Usage: Customize the pipeline for a specific document type
custom_options = {
    'deskew': True,
    'denoise': 'median',  # Use median for salt-and-pepper noise
    'contrast': 'clahe',
    'sharpen': False,     # Disable sharpening if it adds noise
    'threshold': 'adaptive'
}
# preprocessed_img = preprocess_image("temp_images/page_1.png", options=custom_options)
# cv2.imwrite("temp_images/page_1_processed.png", preprocessed_img)`} />
          </Section>

          <Section title="Step 4: OCR Text Extraction" icon={<PythonIcon />}>
            <p className="text-dark-subtext mb-4">
              With our cleaned images, we can now run PaddleOCR. We initialize it once and reuse the object for efficiency. Ensure the model paths are set correctly for offline use.
            </p>
            <CodeBlock language="python" code={`from paddleocr import PaddleOCR
import pandas as pd

# Initialize OCR engine for English. 
# Make sure models are downloaded and accessible offline.
# use_gpu=True enables GPU acceleration.
ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)

def extract_text_from_image(image_path):
    result = ocr_engine.ocr(image_path, cls=True)
    
    lines = []
    if result and result[0]:
        for line_info in result[0]:
            # line_info is a list: [bounding_box, (text, confidence_score)]
            text = line_info[1][0]
            lines.append(text)
    return "\\n".join(lines)

def structure_results(ocr_result):
    # This is a simple example. For tables, you'd need more complex logic
    # analyzing bounding box coordinates to reconstruct rows and columns.
    rows = []
    if ocr_result and ocr_result[0]:
      for line in ocr_result[0]:
          text = line[1][0]
          # Simple CSV: assume comma-separated values in text
          rows.append(text.split(',')) 
    
    df = pd.DataFrame(rows)
    return df


# Usage
# ocr_output = ocr_engine.ocr("temp_images/page_1_processed.png", cls=True)
# df = structure_results(ocr_output)
# df.to_csv("output.csv", index=False, header=False)
# print("CSV file generated.")`} />
          </Section>

          <Section title="Scaling Up: Batch Processing & GPU" icon={<GpuIcon />}>
            <p className="text-dark-subtext mb-4">
              To process hundreds of PDFs, automate the pipeline and leverage a GPU. A GPU can increase OCR speed by over 10x.
            </p>
            <CodeBlock language="python" code={`import os
import glob
import pandas as pd

# Assume previous functions are defined:
# convert_pdf_to_images, preprocess_image, structure_results

def batch_process_pdfs(pdf_folder, output_folder):
    ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=True) # Enable GPU
    
    pdf_files = glob.glob(os.path.join(pdf_folder, "*.pdf"))
    
    for pdf_path in pdf_files:
        print(f"Processing {pdf_path}...")
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        
        # 1. Convert
        temp_image_folder = f"temp_{base_name}"
        image_paths = convert_pdf_to_images(pdf_path, temp_image_folder)
        
        all_pages_df = pd.DataFrame()
        
        for img_path in image_paths:
            # 2. Preprocess (can pass custom options here)
            # Example: preprocessed_img = preprocess_image(img_path, options=custom_options)
            processed_img = preprocess_image(img_path) 
            
            # 3. OCR
            result = ocr_engine.ocr(processed_img, cls=True)
            page_df = structure_results(result)
            all_pages_df = pd.concat([all_pages_df, page_df], ignore_index=True)
        
        # 4. Save CSV
        output_csv_path = os.path.join(output_folder, f"{base_name}.csv")
        all_pages_df.to_csv(output_csv_path, index=False)
        print(f"Saved results to {output_csv_path}")

# batch_process_pdfs("my_pdfs/", "my_csv_outputs/")`} />
          </Section>

          <Section title="Advanced: Offline Custom Model Training" icon={<BrainCircuitIcon />}>
            <p className="text-dark-subtext">
              To achieve maximum accuracy on specific document types (e.g., invoices with unique fonts), you can fine-tune PaddleOCR on your own dataset. This is an advanced process that happens entirely offline once the base models and training scripts are downloaded.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-dark-subtext pl-4">
              <li><strong>Data Preparation:</strong> Create a dataset of image crops (individual words or lines) and a corresponding label file. The label file is typically a <code className="bg-dark-card px-1 rounded-md text-sm">.txt</code> file mapping image paths to their ground truth text.</li>
              <li><strong>Configuration:</strong> Download the PaddleOCR repository. Modify a training configuration file (e.g., <code className="bg-dark-card px-1 rounded-md text-sm">rec_en_lite_train.yml</code>) to point to your local dataset paths, adjust learning rates, and set the number of training epochs.</li>
              <li><strong>Download Pre-trained Model:</strong> You need a base model to fine-tune from. Download it once and point your configuration to its local path.</li>
              <li><strong>Run Training Script:</strong> Execute the training command provided in the PaddleOCR documentation, ensuring all paths in your config are local.
                <CodeBlock language="bash" code={`# Example command (run from within the PaddleOCR repo)
python3 tools/train.py -c configs/rec/my_custom_config.yml`} />
              </li>
              <li><strong>Use Trained Model:</strong> The training process will output new model weights (e.g., in an <code className="bg-dark-card px-1 rounded-md text-sm">/output</code> directory). To use them for inference, simply point the <code className="bg-dark-card px-1 rounded-md text-sm">PaddleOCR()</code> initializer to the path of your new model file.</li>
            </ol>
          </Section>

          <Section title="Hardware & Model Management" icon={<HardDriveIcon />}>
            <ul className="space-y-4 text-dark-subtext">
              <li><strong>Hardware:</strong>
                <ul className="list-disc list-inside pl-6 mt-2">
                  <li><strong>CPU/RAM:</strong> A modern multi-core CPU and 16GB+ of RAM are recommended for smooth batch processing.</li>
                  <li><strong>GPU:</strong> For significant speed-ups, an NVIDIA GPU with 8GB+ of VRAM is ideal. Ensure you have the correct CUDA and cuDNN versions installed.</li>
                </ul>
              </li>
              <li className="mt-4"><strong>Local Model Storage:</strong>
                <ul className="list-disc list-inside pl-6 mt-2">
                  <li>By default, PaddleOCR stores models in <code className="bg-dark-card px-1 rounded-md text-sm">~/.paddleocr/whl/</code>.</li>
                  <li>You can place these model files in any directory on your offline machine and specify the paths during initialization to ensure lifetime offline use:
                    <CodeBlock language="python" code={`ocr = PaddleOCR(det_model_dir='/path/to/your/det_model/', 
               rec_model_dir='/path/to/your/rec_model/',
               cls_model_dir='/path/to/your/cls_model/')`} />
                  </li>
                </ul>
              </li>
            </ul>
          </Section>

          <Section title="Bonus: Packaging a Web App as a Desktop .exe" icon={<DesktopIcon />}>
            <p className="text-dark-subtext mb-4">
              While this guide is a web page, the principles of creating offline-first tools can be extended by packaging a web application into a standalone desktop executable (.exe). This is useful for distributing tools that need to run without a browser or internet connection. We can achieve this using a framework like <a href="https://www.electronjs.org/" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Electron</a>.
            </p>
            <h3 className="text-xl font-bold text-dark-text mt-6 mb-2">How It Works</h3>
            <p className="text-dark-subtext mb-4">
              Electron bundles your web app (HTML, CSS, JS) with a minimal version of the Chromium browser and the Node.js runtime. The result is a native desktop application that runs your web code in its own window.
            </p>
            
            <h3 className="text-xl font-bold text-dark-text mt-6 mb-2">Step 1: Project Setup</h3>
            <p className="text-dark-subtext mb-4">
              First, you need Node.js and npm installed. Then, create a new project and install Electron and a packager like `electron-builder`.
            </p>
            <CodeBlock language="bash" code={`# 1. Create a new directory for your app
mkdir my-desktop-app && cd my-desktop-app

# 2. Initialize a Node.js project
npm init -y

# 3. Install Electron and Electron Builder
npm install --save-dev electron electron-builder`} />

            <h3 className="text-xl font-bold text-dark-text mt-6 mb-2">Step 2: Create the Main Process File</h3>
            <p className="text-dark-subtext mb-4">
              Create a file named `main.js`. This is the entry point that controls your application's lifecycle and creates the browser window. Your web app's `index.html` and other assets should be in the same directory.
            </p>
            <CodeBlock language="javascript" code={`// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // It's recommended to use a preload script for security
      // preload: path.join(__dirname, 'preload.js') 
    }
  });

  // Load the index.html of your app.
  mainWindow.loadFile('index.html');

  // Open the DevTools (optional for debugging)
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished initialization.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});`} />

            <h3 className="text-xl font-bold text-dark-text mt-6 mb-2">Step 3: Configure package.json for Building</h3>
            <p className="text-dark-subtext mb-4">
              Update your `package.json` to tell Electron where your main script is and to add scripts for starting and building the application.
            </p>
            <CodeBlock language="json" code={`{
  "name": "my-desktop-app",
  "version": "1.0.0",
  "description": "My Awesome Desktop App",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  },
  "build": {
    "appId": "com.example.myapp",
    "productName": "My App",
    "files": [
      "main.js",
      "index.html",
      "**/*.css",
      "**/*.js"
    ],
    "win": {
      "target": "nsis"
    },
    "mac": {
      "target": "dmg"
    }
  }
}`} />

            <h3 className="text-xl font-bold text-dark-text mt-6 mb-2">Step 4: Build the Executable</h3>
            <p className="text-dark-subtext mb-4">
              Place your web application files (\`index.html\`, etc.) in the project root. Then, run the build command:
            </p>
            <CodeBlock language="bash" code={`# This command packages your app into an installer (.exe on Windows)
npm run build`} />
            <p className="text-dark-subtext mt-4">
              After the process completes, you will find your distributable application inside a new \`dist/\` directory. You can now share this \`.exe\` file with others to run your application on their Windows machines without needing a browser or any setup.
            </p>
          </Section>
        </div>
      </main>
      <footer className="text-center py-8 text-dark-subtext text-sm">
        <p>Built as a conceptual guide. All code is for illustrative purposes.</p>
      </footer>
    </div>
  );
};

export default App;
