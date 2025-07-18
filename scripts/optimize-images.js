const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Install sharp first: npm install sharp

const optimizeImages = async () => {
  const inputDir = './raw-photos';
  const outputDir = './public/images/gallery';
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Optimization settings
  const sizes = [
    { name: 'original', width: 1200, height: null },
    { name: 'thumbnail', width: 400, height: 400 },
    { name: 'mobile', width: 600, height: null }
  ];

  try {
    const files = fs.readdirSync(inputDir);
    
    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png)$/i)) {
        console.log(`Processing ${file}...`);
        
        const inputPath = path.join(inputDir, file);
        const fileName = path.parse(file).name;
        
        for (const size of sizes) {
          const outputPath = path.join(outputDir, `${fileName}-${size.name}.webp`);
          
          await sharp(inputPath)
            .resize(size.width, size.height, {
              fit: size.height ? 'cover' : 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toFile(outputPath);
            
          console.log(`✅ Created ${fileName}-${size.name}.webp`);
        }
        
        // Also create JPEG fallback
        const jpegPath = path.join(outputDir, `${fileName}.jpg`);
        await sharp(inputPath)
          .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(jpegPath);
          
        console.log(`✅ Created ${fileName}.jpg`);
      }
    }
    
    console.log('🎉 All images optimized successfully!');
  } catch (error) {
    console.error('❌ Error processing images:', error);
  }
};

optimizeImages(); 