import jsPDF from 'jspdf';

class PDFExportService {
  constructor() {
    this.pdf = null;
    this.currentY = 0;
    this.margins = {
      top: 20,
      right: 25,
      bottom: 20,
      left: 25
    };
  }

  // Load image and convert to base64
  async loadImageAsBase64(imagePath) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        try {
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        } catch (error) {
          console.warn('Could not convert image to base64, using fallback');
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.warn('Could not load logo image, using fallback');
        resolve(null);
      };
      
      // Try to load the image from the public folder
      img.src = `${process.env.PUBLIC_URL || ''}/images/ullishtja_logo.jpeg`;
    });
  }

  // Initialize PDF document
  initializePDF() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.currentY = this.margins.top;
  }

  // Check if we need a new page
  checkPageBreak(requiredHeight = 15) {
    const pageHeight = 297; // A4 height in mm
    const availableHeight = pageHeight - this.margins.bottom - this.currentY;
    
    if (requiredHeight > availableHeight) {
      this.pdf.addPage();
      
      // Add background and border to new page
      this.addCleanBackground();
      this.addElegantBorder();
      
      this.currentY = this.margins.top + 20; // Add some space from the border
      return true;
    }
    return false;
  }

  // Add elegant decorative border like the actual menu
  addElegantBorder() {
    this.pdf.setLineWidth(1.5);
    this.pdf.setDrawColor(85, 107, 47); // Olive green matching the text
    
    // Main border frame with rounded corners
    const margin = 12;
    const width = 210 - (margin * 2);
    const height = 297 - (margin * 2);
    
    // Create the main decorative frame
    this.pdf.roundedRect(margin, margin, width, height, 8, 8);
    
    // Inner decorative border
    this.pdf.setLineWidth(0.8);
    const innerMargin = margin + 6;
    const innerWidth = width - 12;
    const innerHeight = height - 12;
    this.pdf.roundedRect(innerMargin, innerMargin, innerWidth, innerHeight, 6, 6);
    
    // Clean border without corner decorations
  }

  // Corner flourishes removed for cleaner design

  // Add textured background with green rust patina
  addCleanBackground() {
    // Base cream background
    this.pdf.setFillColor(252, 250, 246);
    this.pdf.rect(0, 0, 210, 297, 'F');
    
    // Add subtle green rust texture overlay
    this.addGreenRustTexture();
  }

  // Add balanced green rust/patina texture
  addGreenRustTexture() {
    // Create random seed for consistent pattern
    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Add medium-subtle green tinted patches - visible but not overwhelming
    for (let i = 0; i < 50; i++) {
      const x = random() * 210;
      const y = random() * 297;
      const size = random() * 18 + 6;
      
      // Balanced green rust colors - visible but subtle
      const greenVariant = Math.floor(random() * 4);
      switch (greenVariant) {
        case 0:
          this.pdf.setFillColor(235, 240, 230); // Light sage green
          break;
        case 1:
          this.pdf.setFillColor(230, 238, 225); // Soft green
          break;
        case 2:
          this.pdf.setFillColor(240, 245, 238); // Very light green
          break;
        default:
          this.pdf.setFillColor(238, 242, 235); // Green-gray
      }
      
      // Create soft shapes with slight blur effect
      const layers = 2;
      for (let layer = 0; layer < layers; layer++) {
        const layerSize = size * (1 - layer * 0.15);
        const offsetX = (random() - 0.5) * 1.5;
        const offsetY = (random() - 0.5) * 1.5;
        
        if (random() > 0.6) {
          this.pdf.circle(x + offsetX, y + offsetY, layerSize / 2, 'F');
        } else {
          this.pdf.ellipse(x + offsetX, y + offsetY, layerSize / 2, layerSize / 3, 'F');
        }
      }
    }

    // Add smaller texture details
    for (let i = 0; i < 80; i++) {
      const x = random() * 210;
      const y = random() * 297;
      const size = random() * 8 + 2;
      
      // Subtle but visible tints
      this.pdf.setFillColor(
        242 + Math.floor(random() * 6), // More noticeable variation
        246 + Math.floor(random() * 6), 
        238 + Math.floor(random() * 8)
      );
      
      this.pdf.circle(x, y, size / 2, 'F');
    }

    // Add soft weathered streaks
    for (let i = 0; i < 12; i++) {
      const x = random() * 210;
      const y = random() * 297;
      const length = random() * 20 + 5;
      const angle = random() * Math.PI * 2;
      
      this.pdf.setFillColor(236, 241, 232); // Visible but soft
      this.pdf.setLineWidth(random() * 1.5 + 0.8);
      this.pdf.setDrawColor(236, 241, 232);
      
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      
      // Single line for cleaner appearance
      this.pdf.line(x, y, endX, endY);
    }
  }

  // QR code functionality removed as requested

  // Add header with restaurant logo and elegant styling
  async addHeader(language = 'al') {
    // Add clean background first
    this.addCleanBackground();
    
    // Add elegant decorative border
    this.addElegantBorder();
    
    // Skip QR code - start with logo directly
    this.currentY += 10;
    
    // Reset text color to olive green
    this.pdf.setTextColor(85, 107, 47);
    
    // Try to load and add the actual logo
    const logoBase64 = await this.loadImageAsBase64('/images/ullishtja_logo.jpeg');
    
    if (logoBase64) {
      // Add the actual logo image - larger and more prominent
      const logoSize = 35;
      const logoX = (210 - logoSize) / 2;
      const logoY = this.currentY;
      
      try {
        this.pdf.addImage(logoBase64, 'JPEG', logoX, logoY, logoSize, logoSize);
        this.currentY += logoSize + 8;
      } catch (error) {
        console.warn('Could not add logo image, using fallback');
        this.addFallbackLogo();
      }
    } else {
      // Fallback to text-based logo if image fails to load
      this.addFallbackLogo();
    }

    // Restaurant name with elegant typography matching the menu
    this.pdf.setFontSize(24);
    this.pdf.setFont(undefined, 'bold');
    const mainTitle = 'Ullishtja';
    const titleWidth = this.pdf.getTextWidth(mainTitle);
    this.pdf.text(mainTitle, (210 - titleWidth) / 2, this.currentY);
    this.currentY += 8;

    // Subtitle - clean style like the actual menu
    this.pdf.setFontSize(14);
    this.pdf.setFont(undefined, 'normal');
    const subtitle = 'AGRI TURIZËM';
    const subtitleWidth = this.pdf.getTextWidth(subtitle);
    this.pdf.text(subtitle, (210 - subtitleWidth) / 2, this.currentY);
    this.currentY += 6;

    // "est 2021" like in the actual menu
    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'italic');
    const estText = 'est 2021';
    const estWidth = this.pdf.getTextWidth(estText);
    this.pdf.text(estText, (210 - estWidth) / 2, this.currentY);
    this.currentY += 20;
  }

  // Fallback method for text-based logo when image fails
  addFallbackLogo() {
    const logoSize = 25;
    const logoX = (210 - logoSize) / 2;
    const logoY = this.currentY;
    
    // Logo border/frame
    this.pdf.setLineWidth(1.5);
    this.pdf.setDrawColor(85, 107, 47);
    this.pdf.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2);
    
    // Logo text
    this.pdf.setFontSize(12);
    this.pdf.setFont(undefined, 'bold');
    const logoText = 'ULLISHTJA';
    const logoTextWidth = this.pdf.getTextWidth(logoText);
    this.pdf.text(logoText, logoX + (logoSize - logoTextWidth)/2, logoY + logoSize/2 - 2);
    
    const logoSubText = 'AGROTURIZEM';
    this.pdf.setFontSize(8);
    const logoSubTextWidth = this.pdf.getTextWidth(logoSubText);
    this.pdf.text(logoSubText, logoX + (logoSize - logoSubTextWidth)/2, logoY + logoSize/2 + 3);
    
    this.currentY += logoSize + 10;
  }

  // Add category section with elegant styling matching the actual menu
  addCategory(category, language = 'al') {
    this.checkPageBreak(30);

    // Category title with elegant styling
    this.pdf.setTextColor(85, 107, 47); // Olive green
    this.pdf.setFontSize(18);
    this.pdf.setFont(undefined, 'bold');
    
    let categoryName = 'Category';
    if (language === 'al' && category.nameAL) {
      categoryName = category.nameAL;
    } else if (language === 'en' && category.nameEN) {
      categoryName = category.nameEN;
    } else if (language === 'it' && category.nameIT) {
      categoryName = category.nameIT;
    } else if (category.name) {
      categoryName = category.name;
    }
    
    // Center the category name
    const categoryNameWidth = this.pdf.getTextWidth(categoryName);
    const categoryX = (210 - categoryNameWidth) / 2;
    
    // Category name centered like in the actual menu
    this.pdf.text(categoryName, categoryX, this.currentY);
    this.currentY += 12;

    // Category description (if available)
    let categoryDescription = null;
    if (language === 'al' && category.descriptionAL) {
      categoryDescription = category.descriptionAL;
    } else if (language === 'en' && category.descriptionEN) {
      categoryDescription = category.descriptionEN;
    } else if (language === 'it' && category.descriptionIT) {
      categoryDescription = category.descriptionIT;
    } else if (category.description) {
      categoryDescription = category.description;
    }

    if (categoryDescription) {
      this.pdf.setFontSize(10);
      this.pdf.setFont(undefined, 'italic');
      const descLines = this.pdf.splitTextToSize(categoryDescription, 170);
      this.pdf.text(descLines, this.margins.left, this.currentY);
      this.currentY += descLines.length * 4 + 5;
    }

    // Add items - handle both 'menuItems' (from API) and 'items' (fallback)
    const items = category.menuItems || category.items || [];
    if (items.length > 0) {
      items.forEach(item => {
        this.addMenuItem(item, language);
      });
    }

    this.currentY += 5; // Space after category
  }

  // Add individual menu item with clean styling like the actual menu
  addMenuItem(item, language = 'al') {
    this.checkPageBreak(20);

    // Item name and price - use language-specific name
    this.pdf.setTextColor(85, 107, 47); // Olive green
    this.pdf.setFontSize(12);
    this.pdf.setFont(undefined, 'bold');
    
    let itemName = 'Item';
    if (language === 'al' && item.nameAL) {
      itemName = item.nameAL;
    } else if (language === 'en' && item.nameEN) {
      itemName = item.nameEN;
    } else if (language === 'it' && item.nameIT) {
      itemName = item.nameIT;
    } else if (item.name) {
      itemName = item.name;
    }
    
    // Format price to match the actual menu (e.g., "250 Lekë")
    const price = item.price ? `${item.price} ${item.currency === 'ALL' ? 'Lekë' : item.currency || 'ALL'}` : '';
    
    // Add item name
    this.pdf.text(itemName, this.margins.left + 5, this.currentY);
    
    // Add price (right aligned) - clean style like actual menu
    if (price) {
      this.pdf.setTextColor(85, 107, 47);
      const priceWidth = this.pdf.getTextWidth(price);
      const priceX = 210 - this.margins.right - priceWidth - 5;
      this.pdf.text(price, priceX, this.currentY);
    }
    
    this.currentY += 6;

    // Item description - use language-specific description (clean style)
    let itemDescription = null;
    if (language === 'al' && item.descriptionAL) {
      itemDescription = item.descriptionAL;
    } else if (language === 'en' && item.descriptionEN) {
      itemDescription = item.descriptionEN;
    } else if (language === 'it' && item.descriptionIT) {
      itemDescription = item.descriptionIT;
    } else if (item.description) {
      itemDescription = item.description;
    }

    if (itemDescription) {
      this.pdf.setFontSize(9);
      this.pdf.setFont(undefined, 'italic');
      this.pdf.setTextColor(140, 140, 140); // Subtle gray for description
      const descLines = this.pdf.splitTextToSize(itemDescription, 170);
      this.pdf.text(descLines, this.margins.left + 5, this.currentY);
      this.currentY += descLines.length * 3.5 + 2;
    }

    this.currentY += 4; // Clean spacing between items like the actual menu
  }

  // Add elegant footer like the actual menu
  addFooter(language = 'al') {
    
    // Go to bottom of page
    this.currentY = this.pageHeight - this.margins.bottom - 30;
    
    // Add main Ullishtja logo section
    this.pdf.setFontSize(24);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(85, 107, 47);
    const logoText = 'Ullishtja';
    const logoWidth = this.pdf.getTextWidth(logoText);
    this.pdf.text(logoText, (210 - logoWidth) / 2, this.currentY);
    this.currentY += 8;
    
    // Add subtitle
    this.pdf.setFontSize(14);
    this.pdf.setFont(undefined, 'normal');
    const subtitle = 'AGRI TURIZËM';
    const subtitleWidth = this.pdf.getTextWidth(subtitle);
    this.pdf.text(subtitle, (210 - subtitleWidth) / 2, this.currentY);
    this.currentY += 6;
    
    // Add "est 2021"
    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'italic');
    const estText = 'est 2021';
    const estWidth = this.pdf.getTextWidth(estText);
    this.pdf.text(estText, (210 - estWidth) / 2, this.currentY);
    this.currentY += 15;
    
    // Footer complete - no QR code needed
  }

  // Main method to generate PDF from menu data
  async generateMenuPDF(menuData, language = 'al', options = {}) {
    try {
      
      this.initializePDF();
      
      // Add header with logo
      await this.addHeader(language);

      // Add categories and items
      if (menuData && menuData.length > 0) {
        menuData.forEach((category, index) => {
          this.addCategory(category, language);
        });
      } else {
        // Fallback message if no menu data
        this.pdf.setFontSize(14);
        this.pdf.setTextColor(85, 107, 47);
        this.pdf.text(
          language === 'al' ? 'Menu në përgatitje...' : 
          language === 'en' ? 'Menu in preparation...' : 
          'Menu in preparazione...',
          this.margins.left, 
          this.currentY
        );
        this.currentY += 20;
        
        // Add some example items to show PDF is working
        this.pdf.setFontSize(12);
        this.pdf.text(
          language === 'al' ? 'Për menu të plotë, ju lutemi kontaktoni restorantin.' : 
          language === 'en' ? 'For complete menu, please contact the restaurant.' : 
          'Per il menu completo, contattare il ristorante.',
          this.margins.left,
          this.currentY
        );
      }

      // Add footer on last page
      this.addFooter(language);

      // Return the PDF for download or preview
      return this.pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
  }

  // Download PDF file
  async downloadPDF(menuData, language = 'al', filename = null) {
    try {
      const pdf = await this.generateMenuPDF(menuData, language);
      const defaultFilename = `Ullishtja_Menu_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename || defaultFilename);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  // Detect if user is on mobile device
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

  // Open PDF with mobile-friendly approach
  async openPDFInNewWindow(menuData, language = 'al') {
    try {
      const pdf = await this.generateMenuPDF(menuData, language);
      const isMobile = this.isMobileDevice();
      
      if (isMobile) {
        // On mobile: directly download the PDF instead of opening in new window
        const filename = `Ullishtja_Menu_${language.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);
        
        // Show user feedback
        const message = language === 'al' 
          ? 'PDF-ja u shkarkua në pajisjen tuaj'
          : language === 'en'
          ? 'PDF downloaded to your device'
          : 'PDF scaricato sul tuo dispositivo';
        
        // Create temporary notification
        this.showMobileNotification(message);
      } else {
        // On desktop: try to open in new window, fallback to download
        try {
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          // Try to open in new window
          const newWindow = window.open(pdfUrl, '_blank');
          
          // Check if pop-up was blocked
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Pop-up blocked, fallback to download
            const filename = `Ullishtja_Menu_${language.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(filename);
          } else {
            // Success - clean up URL after delay
            setTimeout(() => {
              URL.revokeObjectURL(pdfUrl);
            }, 5000); // Longer delay for slower loading
          }
        } catch (windowError) {
          // Fallback to download
          const filename = `Ullishtja_Menu_${language.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
          pdf.save(filename);
        }
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      throw error;
    }
  }

  // Show mobile notification
  showMobileNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Get PDF as base64 string
  async getPDFAsBase64(menuData, language = 'al') {
    try {
      const pdf = await this.generateMenuPDF(menuData, language);
      return pdf.output('datauristring');
    } catch (error) {
      console.error('Error generating PDF base64:', error);
      throw error;
    }
  }

  // Test PDF generation with minimal data
  async testPDFGeneration(language = 'al') {  
    try {
      // Create minimal test data
      const testMenuData = [
        {
          id: 1,
          nameAL: 'Pjata Kryesore',
          nameEN: 'Main Dishes',
          nameIT: 'Piatti Principali',
          items: [
            {
              id: 1,
              nameAL: 'Tavë Kosi',
              nameEN: 'Baked Lamb with Yogurt',
              nameIT: 'Agnello al Forno con Yogurt',
              price: 1200,
              currency: 'ALL'
            },
            {
              id: 2,
              nameAL: 'Byrek me Spinaq',
              nameEN: 'Spinach Pie',
              nameIT: 'Torta di Spinaci',
              price: 400,
              currency: 'ALL'
            }
          ]
        }
      ];

      const pdf = await this.generateMenuPDF(testMenuData, language);
      
      if (this.isMobileDevice()) {
        pdf.save(`Test_Menu_${language.toUpperCase()}.pdf`);
        this.showMobileNotification('Test PDF downloaded successfully!');
      } else {
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(pdfUrl, '_blank');
        
        if (!newWindow) {
          pdf.save(`Test_Menu_${language.toUpperCase()}.pdf`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Test PDF generation failed:', error);
      throw error;
    }
  }
}

const pdfExportService = new PDFExportService();
export default pdfExportService; 