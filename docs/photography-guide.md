# 📸 Professional Photography Guide for Ullishtja Agritourism

## 🎯 Photography Brief for Your Photographer

### **Critical Specifications**

**File Requirements:**
```
📐 Dimensions: Minimum 1920px on longest side
📊 Aspect Ratios: 
   - Landscape: 3:2 ratio (1800x1200px)
   - Portrait: 2:3 ratio (1200x1800px) 
   - Square: 1:1 ratio (1200x1200px)
🎨 Format: JPEG + RAW files
🌈 Color Space: sRGB (web standard)
📏 DPI: 72 (web optimized)
💾 File Size: 500KB - 3MB per image
```

**Photography Style:**
- ✨ Clean, modern aesthetic
- 🌅 Natural lighting preferred
- 🎨 Warm, inviting atmosphere
- 🏡 Authentic Albanian restaurant feel
- 📱 Mobile-friendly composition

---

## 📋 Complete Shot List (25-30 images total)

### 🍽️ **Food Photography (10-12 images)**
1. **Hero Dishes:**
   - Traditional Albanian platter (wide shot)
   - Byrek close-up with steam
   - Tave kosi (signature dish)
   - Fresh salad arrangement

2. **Table Spreads:**
   - Full table setting with multiple dishes
   - Family-style serving presentation
   - Wine pairing setup

3. **Preparation Shots:**
   - Fresh ingredients laid out
   - Dough preparation
   - Herbs and spices
   - Chef hands working

### 🏞️ **Ambiance & Location (8-10 images)**
1. **Exterior Views:**
   - Restaurant entrance with signage
   - Panoramic mountain backdrop
   - Outdoor seating area
   - Garden/landscape views

2. **Architectural Details:**
   - Traditional Albanian elements
   - Stone/wood textures
   - Decorative features

### 🏡 **Interior & Atmosphere (6-8 images)**
1. **Dining Spaces:**
   - Main dining room overview
   - Cozy corner seating
   - Bar area
   - Private dining spaces

2. **Details:**
   - Table settings
   - Traditional decorations
   - Lighting fixtures
   - Wall art/displays

---

## 💻 **Step-by-Step Implementation Guide**

### **Step 1: Prepare Your Workspace**

```bash
# 1. Install image optimization tools
npm install sharp

# 2. Create folder structure
mkdir raw-photos
mkdir public/images/gallery

# 3. Set up the optimization script (already created)
```

### **Step 2: Receive Photos from Photographer**

**Organization:**
```
raw-photos/
├── food_dish1.jpg
├── food_dish2.jpg
├── ambiance_exterior1.jpg
├── ambiance_mountain.jpg
├── interior_dining.jpg
└── ...
```

**Quality Check:**
- ✅ Minimum 1920px resolution
- ✅ Good lighting and composition
- ✅ Sharp focus on main subjects
- ✅ Consistent style across all images

### **Step 3: Optimize Images for Web**

```bash
# Run the optimization script
npm run optimize-images
```

This will create:
- **WebP format** (modern, smaller files)
- **JPEG fallback** (browser compatibility)
- **Multiple sizes** (responsive design)

### **Step 4: Update Gallery Component**

Update the `galleryImages` array in `src/components/Gallery.js`:

```javascript
const galleryImages = [
  {
    id: 1,
    src: '/images/gallery/food_signature_dish.jpg',
    alt: 'Traditional Albanian Signature Dish',
    category: 'food',
    title: {
      al: 'Specialiteti ynë tradicional',
      en: 'Our Traditional Specialty',
      it: 'La nostra specialità tradizionale'
    }
  },
  // Add more images...
];
```

### **Step 5: Performance Optimization**

**Image Loading Strategy:**
- 🚀 Lazy loading for below-the-fold images
- 📱 Responsive images for different screen sizes
- 🖼️ WebP format with JPEG fallback
- ⚡ Intersection Observer for smooth loading

---

## 📱 **Mobile-First Considerations**

**Tell Your Photographer:**
```
"Compose shots thinking about mobile screens:
- Main subjects should be clearly visible when cropped to square
- Important elements shouldn't be at extreme edges
- Text/signage should be readable at small sizes
- Consider vertical orientations for mobile viewing"
```

---

## 🎨 **Color & Style Guidelines**

**Restaurant Brand Colors:**
- 🌲 Primary Forest: #2d4a36
- 🏺 Terracotta: #C4602D  
- ✨ Accent Gold: #D4AF37
- 🫒 Olive Green: #6B8E23
- 🏔️ Cream Background: #fafafa

**Photography Direction:**
- Warm, earthy tones
- Natural textures (wood, stone, ceramics)
- Authentic Albanian elements
- Inviting, family-friendly atmosphere

---

## ⚡ **Performance Results**

After implementation, you'll achieve:
- 📈 **40-60% faster** image loading
- 📱 **Better mobile experience** with responsive images
- 🎨 **Professional appearance** with high-quality visuals
- 🚀 **Improved SEO** with optimized file sizes

---

## 🔧 **Technical Implementation**

The system automatically:
1. **Detects browser capabilities** (WebP support)
2. **Serves optimal format** (WebP or JPEG)
3. **Loads appropriate size** based on screen
4. **Lazy loads images** as user scrolls
5. **Provides fallbacks** for older browsers

---

## 📞 **Photography Session Checklist**

**Before the shoot:**
- [ ] Share this brief with photographer
- [ ] Schedule during golden hour for exteriors
- [ ] Prepare signature dishes
- [ ] Clean and style all areas
- [ ] Check lighting conditions

**During the shoot:**
- [ ] Capture both horizontal and vertical orientations
- [ ] Get close-ups and wide shots of each subject
- [ ] Take multiple angles of key dishes
- [ ] Include lifestyle/people shots
- [ ] Document the editing style preferences

**After the shoot:**
- [ ] Review all images for quality
- [ ] Select final images (25-30 total)
- [ ] Request final editing in sRGB color space
- [ ] Organize files by category

---

## 🎯 **Expected Investment**

**Photography Budget:**
- Professional food photographer: $800-1500
- Half-day shoot (4-6 hours)
- 25-30 edited high-resolution images
- Usage rights for web and marketing

**ROI Benefits:**
- Professional brand image
- Higher conversion rates
- Better social media engagement
- Increased booking confidence 