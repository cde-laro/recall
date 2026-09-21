const fs = require('fs');

async function scrape() {
  try {
    const res = await fetch('https://marvelrivals.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Heroes&cmlimit=50&format=json');
    const data = await res.json();
    const heroes = data.query.categorymembers;
    
    const characters = [];
    for (const h of heroes) {
      if (h.title.includes('Category:')) continue;
      
      const name = h.title;
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Get image
      const imgRes = await fetch(`https://marvelrivals.fandom.com/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&pithumbsize=200&format=json`);
      const imgData = await imgRes.json();
      const pages = imgData.query.pages;
      const pageId = Object.keys(pages)[0];
      const imageUrl = pages[pageId].thumbnail ? pages[pageId].thumbnail.source : `https://via.placeholder.com/200?text=${encodeURIComponent(name)}`;
      
      characters.push({ name, id, imageUrl });
    }
    
    const out = {
      version: new Date().toISOString(),
      characters
    };
    
    fs.writeFileSync('./src/data/marvel-rivals.en.json', JSON.stringify(out, null, 2));
    fs.writeFileSync('./src/data/marvel-rivals.fr.json', JSON.stringify(out, null, 2));
    console.log(`Saved ${characters.length} characters.`);
  } catch(e) {
    console.error(e);
  }
}
scrape();
