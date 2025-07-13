import jsPDF from 'jspdf';
import { translations } from '../translations';

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
      this.currentY = this.margins.top;
      return true;
    }
    return false;
  }

  // Add vintage decorative border
  addVintageBorder() {
    // Outer border with vintage styling
    this.pdf.setLineWidth(2);
    this.pdf.setDrawColor(139, 115, 85); // Vintage brown
    this.pdf.rect(10, 10, 190, 277);
    
    // Inner decorative border
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(15, 15, 180, 267);
    
    // Corner decorative elements
    const cornerSize = 8;
    this.pdf.setLineWidth(1);
    
    // Top-left corner
    this.pdf.line(15, 15 + cornerSize, 15 + cornerSize, 15 + cornerSize);
    this.pdf.line(15 + cornerSize, 15, 15 + cornerSize, 15 + cornerSize);
    
    // Top-right corner
    this.pdf.line(195 - cornerSize, 15, 195 - cornerSize, 15 + cornerSize);
    this.pdf.line(195 - cornerSize, 15 + cornerSize, 195, 15 + cornerSize);
    
    // Bottom-left corner
    this.pdf.line(15, 282 - cornerSize, 15 + cornerSize, 282 - cornerSize);
    this.pdf.line(15 + cornerSize, 282 - cornerSize, 15 + cornerSize, 282);
    
    // Bottom-right corner
    this.pdf.line(195 - cornerSize, 282 - cornerSize, 195, 282 - cornerSize);
    this.pdf.line(195 - cornerSize, 282 - cornerSize, 195 - cornerSize, 282);
  }

  // Add vintage background texture
  addVintageBackground() {
    // Add subtle vintage texture using overlapping shapes
    this.pdf.setFillColor(250, 248, 240); // Vintage cream background
    this.pdf.rect(0, 0, 210, 297, 'F');
    
    // Add subtle texture with very light brown dots
    this.pdf.setFillColor(245, 240, 235);
    this.pdf.setDrawColor(245, 240, 235);
    
    // Create a subtle pattern
    for (let x = 20; x < 190; x += 15) {
      for (let y = 20; y < 280; y += 15) {
        if (Math.random() > 0.7) {
          this.pdf.circle(x, y, 0.5, 'F');
        }
      }
    }
  }

  // Add header with restaurant logo and vintage styling
  async addHeader(language = 'al') {
    const t = translations[language];
    
    // Add vintage background first
    this.addVintageBackground();
    
    // Add decorative border
    this.addVintageBorder();
    
    // Reset text color to dark brown for vintage look
    this.pdf.setTextColor(101, 67, 33);
    
    // Try to load and add the actual logo
    const logoBase64 = await this.loadImageAsBase64('/images/ullishtja_logo.jpeg');
    
    if (logoBase64) {
      // Add the actual logo image
      const logoSize = 25;
      const logoX = (210 - logoSize) / 2;
      const logoY = this.currentY;
      
      try {
        this.pdf.addImage(logoBase64, 'JPEG', logoX, logoY, logoSize, logoSize);
        this.currentY += logoSize + 10;
      } catch (error) {
        console.warn('Could not add logo image, using fallback');
        this.addFallbackLogo();
      }
    } else {
      // Fallback to text-based logo if image fails to load
      this.addFallbackLogo();
    }

    // Decorative separator
    this.pdf.setLineWidth(1);
    this.pdf.setDrawColor(139, 115, 85);
    const centerX = 210 / 2;
    this.pdf.line(centerX - 30, this.currentY, centerX + 30, this.currentY);
    
    // Add decorative elements on the line
    this.pdf.circle(centerX - 25, this.currentY, 2);
    this.pdf.circle(centerX, this.currentY, 3);
    this.pdf.circle(centerX + 25, this.currentY, 2);
    
    this.currentY += 10;

    // Restaurant name with vintage typography
    this.pdf.setFontSize(28);
    this.pdf.setFont(undefined, 'bold');
    const mainTitle = 'Ullishtja Agroturizem';
    const titleWidth = this.pdf.getTextWidth(mainTitle);
    this.pdf.text(mainTitle, (210 - titleWidth) / 2, this.currentY);
    this.currentY += 12;

    // Subtitle with decorative elements
    this.pdf.setFontSize(18);
    this.pdf.setFont(undefined, 'italic');
    const subtitle = t.nav.menu || 'Menu';
    const subtitleWidth = this.pdf.getTextWidth(subtitle);
    
    // Add decorative flourishes around subtitle
    const subtitleX = (210 - subtitleWidth) / 2;
    this.pdf.text('~ ', subtitleX - 8, this.currentY);
    this.pdf.text(subtitle, subtitleX, this.currentY);
    this.pdf.text(' ~', subtitleX + subtitleWidth + 3, this.currentY);
    this.currentY += 10;

    // Vintage tagline
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'italic');
    const tagline = language === 'al' 
      ? 'Tradita • Cilësi • Përvojë Autentike'
      : language === 'en' 
      ? 'Tradition • Quality • Authentic Experience'
      : 'Tradizione • Qualità • Esperienza Autentica';
    const taglineWidth = this.pdf.getTextWidth(tagline);
    this.pdf.text(tagline, (210 - taglineWidth) / 2, this.currentY);
    this.currentY += 8;

    // Contact info and date in vintage style
    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'normal');
    const contactInfo = 'Durres, Albania • Tel: +355 XX XXX XXX';
    const contactWidth = this.pdf.getTextWidth(contactInfo);
    this.pdf.text(contactInfo, (210 - contactWidth) / 2, this.currentY);
    this.currentY += 5;

    // Date
    const currentDate = new Date().toLocaleDateString(language === 'al' ? 'sq-AL' : language === 'en' ? 'en-US' : 'it-IT');
    const dateText = `${language === 'al' ? 'Data' : language === 'en' ? 'Date' : 'Data'}: ${currentDate}`;
    const dateWidth = this.pdf.getTextWidth(dateText);
    this.pdf.text(dateText, (210 - dateWidth) / 2, this.currentY);
    this.currentY += 15;

    // Final decorative separator
    this.pdf.setLineWidth(0.8);
    this.pdf.setDrawColor(139, 115, 85);
    this.pdf.line(this.margins.left, this.currentY, 210 - this.margins.right, this.currentY);
    
    this.currentY += 12;
  }

  // Fallback method for text-based logo when image fails
  addFallbackLogo() {
    const logoSize = 25;
    const logoX = (210 - logoSize) / 2;
    const logoY = this.currentY;
    
    // Logo border/frame
    this.pdf.setLineWidth(1.5);
    this.pdf.setDrawColor(139, 115, 85);
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

  // Add category section with vintage styling
  addCategory(category, language = 'al') {
    this.checkPageBreak(25);

    // Category title with vintage styling
    this.pdf.setTextColor(101, 67, 33); // Dark brown
    this.pdf.setFontSize(20);
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
    
    // Center the category name with decorative elements
    const categoryNameWidth = this.pdf.getTextWidth(categoryName);
    const categoryX = (210 - categoryNameWidth) / 2;
    
    // Add decorative elements before and after category name
    this.pdf.setFontSize(16);
    this.pdf.text('•', categoryX - 12, this.currentY);
    this.pdf.text('•', categoryX + categoryNameWidth + 8, this.currentY);
    
    // Category name
    this.pdf.setFontSize(20);
    this.pdf.text(categoryName, categoryX, this.currentY);
    this.currentY += 10;
    
    // Decorative underline
    this.pdf.setLineWidth(1);
    this.pdf.setDrawColor(139, 115, 85);
    this.pdf.line(categoryX - 5, this.currentY, categoryX + categoryNameWidth + 5, this.currentY);
    this.currentY += 8;

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

  // Add individual menu item with vintage styling
  addMenuItem(item, language = 'al') {
    this.checkPageBreak(18);

    // Item name and price - use language-specific name
    this.pdf.setTextColor(101, 67, 33); // Dark brown
    this.pdf.setFontSize(14);
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
    
    const price = item.price ? `${item.price} ${item.currency || 'ALL'}` : '';
    
    // Calculate positions for name and price
    const nameWidth = this.pdf.getTextWidth(itemName);
    const priceWidth = this.pdf.getTextWidth(price);
    const availableWidth = 165; // Page width minus larger margins for vintage look
    const dotsWidth = availableWidth - nameWidth - priceWidth - 6;
    
    // Add decorative bullet point
    this.pdf.setFontSize(12);
    this.pdf.text('•', this.margins.left + 2, this.currentY);
    
    // Add name
    this.pdf.setFontSize(14);
    this.pdf.text(itemName, this.margins.left + 8, this.currentY);
    
    // Add price (right aligned) with vintage styling
    if (price) {
      // Price background for vintage effect
      this.pdf.setFillColor(245, 240, 215); // Light vintage background
      this.pdf.setDrawColor(139, 115, 85);
      this.pdf.setLineWidth(0.5);
      const priceX = 210 - this.margins.right - priceWidth - 4;
      this.pdf.rect(priceX - 2, this.currentY - 4, priceWidth + 4, 6, 'FD');
      
      this.pdf.setTextColor(101, 67, 33);
      this.pdf.text(price, priceX, this.currentY);
      
      // Add vintage dots between name and price
      if (dotsWidth > 15) {
        this.pdf.setFont(undefined, 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(139, 115, 85); // Lighter brown for dots
        const dots = ' . '.repeat(Math.floor(dotsWidth / 8));
        this.pdf.text(dots, this.margins.left + nameWidth + 12, this.currentY);
      }
    }
    
    this.currentY += 8;

    // Item description - use language-specific description
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
      this.pdf.setFontSize(10);
      this.pdf.setFont(undefined, 'italic');
      this.pdf.setTextColor(120, 90, 60); // Slightly lighter brown for description
      const descLines = this.pdf.splitTextToSize(itemDescription, 155);
      this.pdf.text(descLines, this.margins.left + 12, this.currentY);
      this.currentY += descLines.length * 4 + 4;
    }

    // Allergens or dietary info (if available) with vintage styling
    if (item.allergens && item.allergens.length > 0) {
      this.pdf.setFontSize(8);
      this.pdf.setFont(undefined, 'italic');
      this.pdf.setTextColor(139, 115, 85); // Vintage brown
      this.pdf.text(`${language === 'al' ? 'Alergjene' : language === 'en' ? 'Allergens' : 'Allergeni'}: ${item.allergens.join(', ')}`, this.margins.left + 12, this.currentY);
      this.currentY += 5;
    }

    // Add subtle decorative line between items
    this.pdf.setLineWidth(0.2);
    this.pdf.setDrawColor(200, 190, 170); // Very light brown
    this.pdf.line(this.margins.left + 15, this.currentY + 1, 210 - this.margins.right - 15, this.currentY + 1);
    
    this.currentY += 4; // Space after item
  }

  // Add vintage-styled footer
  addFooter(language = 'al') {
    
    // Go to bottom of page
    this.currentY = this.pageHeight - this.margins.bottom - 25;
    
    // Decorative vintage separator
    this.pdf.setLineWidth(1);
    this.pdf.setDrawColor(139, 115, 85);
    const centerLine = 210 / 2;
    this.pdf.line(centerLine - 40, this.currentY, centerLine + 40, this.currentY);
    
    // Add decorative elements
    this.pdf.circle(centerLine - 35, this.currentY, 1.5);
    this.pdf.circle(centerLine, this.currentY, 2);
    this.pdf.circle(centerLine + 35, this.currentY, 1.5);
    
    this.currentY += 8;

    // Footer message with vintage styling
    this.pdf.setFontSize(10);
    this.pdf.setFont(undefined, 'italic');
    this.pdf.setTextColor(101, 67, 33);
    const footerText = language === 'al' 
      ? 'Përbërës të freskët nga ferma jonë ~ Përvojë Autentike Të Agroturizmit Shqiptar'
      : language === 'en' 
      ? 'Fresh ingredients from our farm ~ Authentic Albanian Agritourism Experience'
      : 'Ingredienti freschi dalla nostra fattoria ~ Autentica Esperienza Agrituristica Albanese';
    
    const footerLines = this.pdf.splitTextToSize(footerText, 165);
    const footerX = (210 - 165) / 2; // Center the footer text
    this.pdf.text(footerLines, footerX, this.currentY);
    this.currentY += footerLines.length * 4;

    // Website and contact in vintage frame
    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(139, 115, 85);
    const contactText = 'www.ullishtja-agroturizem.com';
    const contactWidth = this.pdf.getTextWidth(contactText);
    const contactX = (210 - contactWidth) / 2;
    
    // Small decorative frame around contact
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(contactX - 3, this.currentY - 3, contactWidth + 6, 6);
    
    this.pdf.text(contactText, contactX, this.currentY);
  }

  // Main method to generate PDF from menu data
  async generateMenuPDF(menuData, language = 'al', options = {}) {
    try {
      this.initializePDF();
      
      // Add header with logo
      await this.addHeader(language);

      // Add categories and items
      if (menuData && menuData.length > 0) {
        menuData.forEach(category => {
          this.addCategory(category, language);
        });
      } else {
        // Fallback message if no menu data
        this.pdf.setFontSize(14);
        this.pdf.text(
          language === 'al' ? 'Menu në përgatitje...' : 
          language === 'en' ? 'Menu in preparation...' : 
          'Menu in preparazione...',
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

  // Open PDF in new window
  async openPDFInNewWindow(menuData, language = 'al') {
    try {
      const pdf = await this.generateMenuPDF(menuData, language);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    } catch (error) {
      console.error('Error opening PDF:', error);
      throw error;
    }
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
}

const pdfExportService = new PDFExportService();
export default pdfExportService; 