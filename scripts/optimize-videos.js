const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Install fluent-ffmpeg first: npm install fluent-ffmpeg
// Also need ffmpeg installed on system: https://ffmpeg.org/download.html

const optimizeVideos = async () => {
  const inputDir = './raw-videos';
  const outputDir = './public/videos';
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Modern optimization settings for different devices and networks
  const compressionSettings = {
    mobile: {
      webm: {
        resolution: '640x360',
        videoBitrate: '400k',
        audioBitrate: '64k',
        crf: 30,
        preset: 'medium'
      },
      mp4: {
        resolution: '640x360',
        videoBitrate: '500k',
        audioBitrate: '64k',
        crf: 28,
        preset: 'medium'
      },
      av1: {
        resolution: '640x360',
        videoBitrate: '300k',
        audioBitrate: '64k',
        crf: 35,
        preset: 'slow'
      }
    },
    tablet: {
      webm: {
        resolution: '1024x576',
        videoBitrate: '800k',
        audioBitrate: '96k',
        crf: 28,
        preset: 'medium'
      },
      mp4: {
        resolution: '1024x576',
        videoBitrate: '1000k',
        audioBitrate: '96k',
        crf: 26,
        preset: 'medium'
      },
      av1: {
        resolution: '1024x576',
        videoBitrate: '600k',
        audioBitrate: '96k',
        crf: 32,
        preset: 'slow'
      }
    },
    desktop: {
      webm: {
        resolution: '1920x1080',
        videoBitrate: '2000k',
        audioBitrate: '128k',
        crf: 24,
        preset: 'medium'
      },
      mp4: {
        resolution: '1920x1080',
        videoBitrate: '2500k',
        audioBitrate: '128k',
        crf: 22,
        preset: 'medium'
      },
      av1: {
        resolution: '1920x1080',
        videoBitrate: '1500k',
        audioBitrate: '128k',
        crf: 28,
        preset: 'slow'
      }
    }
  };

  try {
    const files = fs.readdirSync(inputDir);
    
    for (const file of files) {
      if (file.match(/\.(mov|mp4|avi|mkv)$/i)) {

        const inputPath = path.join(inputDir, file);
        const fileName = path.parse(file).name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        // Generate poster image first
        await generatePoster(inputPath, fileName, outputDir);
        
        // Generate videos for each device type and format
        for (const [deviceType, formats] of Object.entries(compressionSettings)) {
          
          for (const [format, settings] of Object.entries(formats)) {
            const outputPath = path.join(outputDir, `${fileName}-${deviceType}.${format === 'av1' ? 'av1.mp4' : format}`);
            
            try {
              await generateVideoVariant(inputPath, outputPath, format, settings);
            } catch (error) {
              console.error(`Failed to create ${fileName}-${deviceType}.${format}:`, error.message);
            }
          }
        }
      }
    }
    
    // Generate video mappings file for easy reference
    generateVideoMappings(outputDir);
    
    
    // Calculate size savings
    const originalSize = calculateDirectorySize(inputDir);
    const optimizedSize = calculateDirectorySize(outputDir);
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
  } catch (error) {
    console.error('Error processing videos:', error);
  }
};

// Generate poster image from video
const generatePoster = (inputPath, fileName, outputDir) => {
  return new Promise((resolve, reject) => {
    const posterPath = path.join(outputDir, `${fileName}-poster.jpg`);
    
    ffmpeg(inputPath)
      .seekInput('00:00:02') // Take frame at 2 seconds
      .frames(1)
      .size('1920x1080')
      .format('image2')
      .outputOptions([
        '-q:v 2', // High quality JPEG
        '-vf scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080' // Maintain aspect ratio
      ])
      .output(posterPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

// Generate specific video variant
const generateVideoVariant = (inputPath, outputPath, format, settings) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);
    
    // Common video settings
    command
      .size(settings.resolution)
      .videoBitrate(settings.videoBitrate)
      .audioBitrate(settings.audioBitrate)
      .autopad(false, 'black')
      .aspect('16:9');
    
    // Format-specific optimizations
    switch (format) {
      case 'webm':
        command
          .format('webm')
          .videoCodec('libvpx-vp9')
          .audioCodec('libopus')
          .outputOptions([
            '-crf ' + settings.crf,
            '-preset ' + settings.preset,
            '-row-mt 1', // Enable row-based multithreading
            '-tile-columns 2', // Optimize for parallel processing
            '-frame-parallel 1', // Enable frame-level parallelism
            '-aq-mode 0', // Disable adaptive quantization for consistency
            '-lag-in-frames 25', // Optimize for compression
            '-auto-alt-ref 1', // Enable alternative reference frames
            '-deadline realtime' // Balance speed vs quality
          ]);
        break;
        
      case 'mp4':
        command
          .format('mp4')
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-crf ' + settings.crf,
            '-preset ' + settings.preset,
            '-profile:v baseline', // Maximum compatibility
            '-level 3.0',
            '-pix_fmt yuv420p', // Ensure compatibility
            '-movflags +faststart', // Enable progressive download
            '-tune film', // Optimize for film content
            '-x264opts keyint=48:min-keyint=48:scenecut=-1' // Optimize keyframes
          ]);
        break;
        
      case 'av1':
        command
          .format('mp4')
          .videoCodec('libaom-av1')
          .audioCodec('aac')
          .outputOptions([
            '-crf ' + settings.crf,
            '-preset ' + settings.preset,
            '-cpu-used 4', // Balance speed vs quality
            '-row-mt 1', // Enable row multithreading
            '-tiles 2x2', // Optimize tile structure
            '-tile-columns 1',
            '-tile-rows 1',
            '-usage realtime', // Optimize for streaming
            '-aq-mode 1', // Enable adaptive quantization
            '-movflags +faststart' // Progressive download
          ]);
        break;
    }
    
    command
      .output(outputPath)
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r     ${format.toUpperCase()}: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        process.stdout.write('\n');
        resolve();
      })
      .on('error', reject)
      .run();
  });
};

// Generate video mappings JSON file
const generateVideoMappings = (outputDir) => {
  const files = fs.readdirSync(outputDir);
  const videoFiles = files.filter(file => file.match(/\.(mp4|webm|av1\.mp4)$/));
  
  const mappings = {
    videos: [],
    generated: new Date().toISOString(),
    note: "Optimized videos with modern compression for mobile-first loading"
  };
  
  // Group files by base name
  const groupedFiles = {};
  videoFiles.forEach(file => {
    const match = file.match(/^(.+?)-(mobile|tablet|desktop)\.(webm|mp4|av1\.mp4)$/);
    if (match) {
      const [, baseName, quality, format] = match;
      if (!groupedFiles[baseName]) {
        groupedFiles[baseName] = {
          baseName,
          poster: `${baseName}-poster.jpg`,
          formats: {}
        };
      }
      
      if (!groupedFiles[baseName].formats[quality]) {
        groupedFiles[baseName].formats[quality] = {};
      }
      
      groupedFiles[baseName].formats[quality][format === 'av1.mp4' ? 'av1' : format] = file;
    }
  });
  
  mappings.videos = Object.values(groupedFiles);
  
  fs.writeFileSync(
    path.join(outputDir, 'video-mappings.json'),
    JSON.stringify(mappings, null, 2)
  );
  
};

// Utility functions
const calculateDirectorySize = (dirPath) => {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
  });
  
  return totalSize;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Run the optimization
optimizeVideos(); 