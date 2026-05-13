export const metadata = {
  title: 'Tesseract Training Guide | Tamil OCR Hub',
  description: 'Step-by-step guide to install, use, and train Tesseract OCR for Tamil text recognition.',
};

const steps = [
  {
    title: 'Install Tesseract OCR',
    desc: 'Install Tesseract on your system. It supports Linux, macOS, and Windows.',
    code: `# Ubuntu / Debian
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-tam

# macOS (Homebrew)
brew install tesseract
brew install tesseract-lang   # Includes Tamil

# Windows — Download installer from:
# https://github.com/UB-Mannheim/tesseract/wiki

# Verify installation
tesseract --version`,
  },
  {
    title: 'Basic Usage — Recognize Tamil Text',
    desc: 'Run Tesseract on an image with Tamil text. Use the -l flag to specify the Tamil language.',
    code: `# Basic recognition
tesseract input_image.png output_text -l tam

# Output to stdout
tesseract input_image.png stdout -l tam

# Generate searchable PDF
tesseract input_image.png output -l tam pdf

# Generate TSV with word positions
tesseract input_image.png output -l tam tsv

# Multiple languages (Tamil + English)
tesseract input_image.png output -l tam+eng`,
  },
  {
    title: 'Image Pre-processing (Critical for Accuracy)',
    desc: 'Pre-processing dramatically improves OCR accuracy. Use ImageMagick or Python with OpenCV.',
    code: `# Using ImageMagick — Convert to grayscale + increase contrast
convert input.jpg -colorspace Gray -contrast-stretch 2% processed.png

# Using Python + OpenCV
import cv2
import numpy as np

img = cv2.imread('input.jpg', cv2.IMREAD_GRAYSCALE)

# Apply Gaussian blur to reduce noise
img = cv2.GaussianBlur(img, (5, 5), 0)

# Apply Otsu's binarization
_, img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Deskew if needed
coords = np.column_stack(np.where(img > 0))
angle = cv2.minAreaRect(coords)[-1]
if angle < -45: angle = -(90 + angle)
else: angle = -angle
M = cv2.getRotationMatrix2D(tuple(np.array(img.shape[1::-1]) / 2), angle, 1.0)
img = cv2.warpAffine(img, M, img.shape[1::-1])

cv2.imwrite('processed.png', img)`,
  },
  {
    title: 'Prepare Training Data',
    desc: 'To fine-tune Tesseract for your specific Tamil fonts or documents, you need ground truth data.',
    code: `# 1. Create a training directory
mkdir -p ~/tamil-training/ground-truth
cd ~/tamil-training

# 2. Prepare ground truth pairs:
#    - image.tif (the text image)
#    - image.gt.txt (the correct text transcription)

# 3. Generate .lstmf training files from your images
for f in ground-truth/*.tif; do
  tesseract "$f" "\${f%.tif}" --psm 7 lstm.train
done

# 4. Create a file listing all .lstmf files
ls ground-truth/*.lstmf > all-lstmf

# PSM Modes (Page Segmentation Modes):
#   0  = OSD only
#   6  = Assume uniform block of text
#   7  = Treat image as a single text line
#   13 = Raw line, no OSD/recognition`,
  },
  {
    title: 'Fine-tune the LSTM Model',
    desc: 'Use Tesseract\'s training tools to fine-tune the existing Tamil model with your data.',
    code: `# 1. Extract the existing Tamil LSTM model
combine_tessdata -e /usr/share/tesseract-ocr/4.00/tessdata/tam.traineddata \\
  tam.lstm

# 2. Run the fine-tuning
lstmtraining \\
  --model_output ~/tamil-training/output/tam_finetuned \\
  --continue_from tam.lstm \\
  --traineddata /usr/share/tesseract-ocr/4.00/tessdata/tam.traineddata \\
  --train_listfile all-lstmf \\
  --max_iterations 3000 \\
  --learning_rate 0.0001

# 3. Monitor training - check error rate
# Target: CER (Character Error Rate) < 2%

# 4. Package the trained model
lstmtraining --stop_training \\
  --continue_from ~/tamil-training/output/tam_finetuned_checkpoint \\
  --traineddata /usr/share/tesseract-ocr/4.00/tessdata/tam.traineddata \\
  --model_output ~/tamil-training/tam_custom.traineddata`,
  },
  {
    title: 'Deploy Your Custom Model',
    desc: 'Copy your trained model to Tesseract\'s tessdata directory and use it.',
    code: `# Copy to tessdata
sudo cp tam_custom.traineddata /usr/share/tesseract-ocr/4.00/tessdata/

# Use your custom model
tesseract input.png output -l tam_custom

# Compare accuracy: original vs fine-tuned
echo "=== Original ==="
tesseract test_image.png stdout -l tam
echo "=== Fine-tuned ==="
tesseract test_image.png stdout -l tam_custom

# Evaluate with accuracy tool
accuracy test_reference.txt <(tesseract test.png stdout -l tam_custom)`,
  },
];

const tips = [
  { title: 'Use High-Resolution Images', desc: 'Minimum 300 DPI for printed text. 600 DPI for small fonts.' },
  { title: 'Clean Your Images', desc: 'Remove borders, watermarks, and noise before OCR. Binarization is your best friend.' },
  { title: 'Start with Pre-trained Models', desc: 'Always fine-tune from the existing Tamil model — never train from scratch unless you have 100K+ samples.' },
  { title: 'Augment Your Data', desc: 'Use rotation, blur, noise, and font variation to make your model more robust.' },
  { title: 'Monitor CER, Not Accuracy', desc: 'Character Error Rate is a better metric than word accuracy for Tamil due to long compound words.' },
  { title: 'Use tesseract.js for Web', desc: 'For browser-based OCR, use tesseract.js — it runs the full Tesseract engine in WebAssembly.' },
];

export default function TrainingPage() {
  return (
    <div className="container">
      <div className="page-header" id="training-header">
        <h1>Tesseract <span className="gradient-text">Training Guide</span></h1>
        <p>Everything you need to install, use, and train Tesseract OCR for Tamil — from basics to fine-tuning.</p>
      </div>

      <div style={{ marginBottom: '64px' }}>
        {steps.map((step, i) => (
          <div className="training-step" key={i} id={`step-${i + 1}`}>
            <div className="step-number">{i + 1}</div>
            <div className="step-content">
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <div className="code-block">{step.code}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Tips & Best Practices</h2>
      <p className="section-subtitle">Pro tips to get the best results from your Tamil OCR pipeline.</p>
      <div className="grid-3" style={{ marginBottom: '80px' }}>
        {tips.map((tip, i) => (
          <div className="glass-card" key={i}>
            <div className="feature-title">{tip.title}</div>
            <div className="feature-desc">{tip.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
