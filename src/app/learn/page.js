export const metadata = {
  title: 'Learn Tamil OCR — Knowledge Base | Tamil OCR Hub',
  description: 'Complete guide to understanding Tamil Optical Character Recognition, script history, challenges, and technology.',
};

export default function LearnPage() {
  return (
    <div className="container">
      <div className="page-header" id="learn-header">
        <h1>Learn <span className="gradient-text">Tamil OCR</span></h1>
        <p>A comprehensive knowledge base covering everything you need to know about Tamil script recognition technology.</p>
      </div>

      <div className="prose">
        <h2>What is OCR?</h2>
        <p>
          <strong>Optical Character Recognition (OCR)</strong> is a technology that converts different types of documents — such as scanned paper documents, PDF files, or images captured by a digital camera — into editable and searchable text data. OCR is a bridge between the physical and digital worlds.
        </p>

        <h2>What is Tamil OCR?</h2>
        <p>
          Tamil OCR specifically deals with recognizing and digitizing <strong>Tamil script</strong> — one of the oldest classical languages in the world, with a history spanning over 2,000 years. Tamil is spoken by over 80 million people worldwide and is the official language of Tamil Nadu (India), Sri Lanka, and Singapore.
        </p>
        <p>
          The Tamil script has <strong>247 characters</strong> including 12 vowels (உயிர் எழுத்துக்கள்), 18 consonants (மெய் எழுத்துக்கள்), 216 combined characters (உயிர்மெய் எழுத்துக்கள்), and 1 special character (ஃ — ஆய்த எழுத்து). This complexity makes Tamil OCR significantly more challenging than Latin-script OCR.
        </p>

        <h2>Why is Tamil OCR Important?</h2>
        <ul>
          <li><strong>Preserving Heritage:</strong> Millions of ancient Tamil manuscripts, inscriptions, and palm-leaf documents need to be digitized before they deteriorate.</li>
          <li><strong>Accessibility:</strong> Converting printed Tamil books and documents into searchable digital text makes knowledge accessible to everyone.</li>
          <li><strong>Government & Admin:</strong> Tamil Nadu&apos;s government processes thousands of Tamil-language documents daily that benefit from automated digitization.</li>
          <li><strong>Education:</strong> Digital Tamil text enables better e-learning tools, dictionaries, and language preservation efforts.</li>
          <li><strong>AI Training:</strong> Digitized Tamil text is essential for training Natural Language Processing (NLP) models for the Tamil language.</li>
        </ul>

        <h2>How Does OCR Work?</h2>
        <h3>1. Image Pre-processing</h3>
        <p>
          The input image is cleaned up — noise is removed, the image is converted to grayscale, skew is corrected, and contrast is enhanced. This step is critical for accuracy. Techniques include binarization (Otsu&apos;s method), deskewing, and denoising.
        </p>

        <h3>2. Text Detection & Segmentation</h3>
        <p>
          The system identifies regions of the image that contain text. It then segments these regions into individual lines, words, and finally characters. For Tamil, this is particularly challenging because of connected characters and complex ligatures.
        </p>

        <h3>3. Feature Extraction</h3>
        <p>
          Each character image is analyzed to extract distinctive features — curves, strokes, intersections, and spatial relationships. Modern OCR uses Convolutional Neural Networks (CNNs) to learn these features automatically.
        </p>

        <h3>4. Character Recognition</h3>
        <p>
          The extracted features are compared against trained models to identify each character. Tesseract uses an LSTM (Long Short-Term Memory) neural network for this step, which excels at recognizing sequences of characters in context.
        </p>

        <h3>5. Post-processing</h3>
        <p>
          The recognized text is refined using language models, dictionaries, and spell-checking to correct errors. This step significantly improves accuracy for Tamil, where similar-looking characters can cause confusion.
        </p>

        <h2>Challenges in Tamil OCR</h2>
        <ul>
          <li><strong>Character Complexity:</strong> With 247 unique characters, Tamil has far more classes to distinguish than English (26 uppercase + 26 lowercase).</li>
          <li><strong>Similar-Looking Characters:</strong> Many Tamil characters differ by only a small curve or dot. For example, &quot;ன&quot; and &quot;ணி&quot; can look very similar in degraded documents.</li>
          <li><strong>Font Diversity:</strong> Tamil has hundreds of fonts with vastly different styles, making generalization difficult.</li>
          <li><strong>Historical Documents:</strong> Old palm-leaf manuscripts and stone inscriptions use ancient Tamil script forms that differ from modern Tamil.</li>
          <li><strong>Low-Quality Scans:</strong> Many documents are poorly scanned with noise, blur, and skew.</li>
          <li><strong>Lack of Training Data:</strong> Compared to English, there is significantly less labeled Tamil OCR training data available.</li>
        </ul>

        <h2>Key Technologies</h2>
        <ul>
          <li><strong>Tesseract OCR:</strong> The most popular open-source OCR engine, maintained by Google. Supports Tamil out of the box with the &quot;tam&quot; language pack.</li>
          <li><strong>Google Cloud Vision API:</strong> Cloud-based OCR with strong Tamil support.</li>
          <li><strong>EasyOCR:</strong> A Python library using deep learning, supports Tamil.</li>
          <li><strong>PaddleOCR:</strong> Baidu&apos;s OCR toolkit with multilingual support including Tamil.</li>
          <li><strong>Custom LSTM/CNN Models:</strong> Research teams build specialized neural networks trained specifically on Tamil script datasets.</li>
        </ul>

        <h2>Current State of Tamil OCR (2024-2026)</h2>
        <p>
          Modern Tamil OCR systems achieve <strong>96%+ accuracy</strong> on clean, printed text. However, accuracy drops to 70-85% on handwritten text and historical documents. Active research areas include:
        </p>
        <ul>
          <li>Transformer-based architectures for better context understanding</li>
          <li>Synthetic data generation to overcome training data scarcity</li>
          <li>Multi-scale feature extraction for varying font sizes</li>
          <li>Attention mechanisms for complex ligature recognition</li>
          <li>End-to-end recognition without explicit segmentation</li>
        </ul>
      </div>

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
