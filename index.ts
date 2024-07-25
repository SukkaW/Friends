import yaml from 'js-yaml';
import fs from 'fs';

// Get document, or throw exception on error
(() => {
  try {
    const doc = yaml.load(fs.readFileSync('./src/links.yml', 'utf-8'));
    fs.writeFileSync('./dist/links.json', JSON.stringify(doc));
  } catch (e) {
    console.error(e);
  }
})();
