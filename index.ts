import yaml from 'js-yaml';

// Get document, or throw exception on error
(async () => {
  try {
    const doc = yaml.load(await Bun.file('./src/links.yml').text());
    Bun.write('./dist/links.json', JSON.stringify(doc));
  } catch (e) {
    console.error(e);
  }
})();
