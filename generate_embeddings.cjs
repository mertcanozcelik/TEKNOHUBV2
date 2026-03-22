const fs = require('fs');
const xlsx = require('xlsx');

function sanitizeText(text) {
  if (!text) return '';
  return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  // Dynamic import for ES module
  const { pipeline } = await import('@xenova/transformers');

  const workbook = xlsx.readFile('ssb_teknoloji_taksonomisi.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  const embeddingsData = [];

  console.log(`Processing ${data.length} rows...`);

  // Using a faster model for better performance in this environment
  console.log('Loading model (Xenova/all-MiniLM-L6-v2)...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('Model loaded.');

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row.Category || !row.Title) continue;
    
    const cleanCategory = sanitizeText(row.Category);
    const cleanTitle = sanitizeText(row.Title);
    const cleanArticle = sanitizeText(row.Article);
    const cleanTurkish = sanitizeText(row['__EMPTY']);

    // Multi-Vector Approach: Separate Title and Content embeddings
    const titleText = `${cleanCategory} ${cleanTitle}`;
    const contentText = `${cleanTurkish} ${cleanArticle}`;
    
    try {
      const titleOutput = await extractor(titleText, { pooling: 'mean', normalize: true });
      const contentOutput = await extractor(contentText, { pooling: 'mean', normalize: true });
      
      embeddingsData.push({
        category: cleanCategory,
        title: cleanTitle,
        article: cleanArticle,
        turkishArticle: cleanTurkish,
        titleEmbedding: Array.from(titleOutput.data),
        contentEmbedding: Array.from(contentOutput.data)
      });
      
      if (i % 10 === 0 || i === data.length - 1) {
        console.log(`Processed ${i + 1} / ${data.length} (${Math.round((i + 1) / data.length * 100)}%)`);
        // Save intermediate progress to a temp file then rename to avoid corruption
        const tempPath = 'src/data/taxonomy_embeddings.json.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(embeddingsData));
        fs.renameSync(tempPath, 'src/data/taxonomy_embeddings.json');
      }
    } catch (err) {
      console.error(`Error embedding row ${row.Category}:`, err.message);
    }
  }

  if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data', { recursive: true });
  }

  fs.writeFileSync('src/data/taxonomy_embeddings.json', JSON.stringify(embeddingsData));
  console.log('Successfully saved embeddings to src/data/taxonomy_embeddings.json');
}

main().catch(console.error);
