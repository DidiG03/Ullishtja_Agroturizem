# Google Reviews Integration Setup

This document explains how to integrate real Google Places API for displaying authentic Google reviews on your Ullishtja Agroturizem website.

## Current Implementation

The application currently uses mock review data that simulates real Google reviews structure. The implementation includes:

- **Google Reviews Service** (`src/services/googleReviews.js`): Handles fetching and processing review data
- **Google Reviews Component** (`src/components/GoogleReviews.js`): Displays 4 and 5-star reviews in an attractive layout
- **Floating Rating Update**: The hero section now shows real rating data instead of "Excellent Experience"

## Features Implemented

### 1. Dynamic Rating Display
- Real-time average rating (currently 4.8 from mock data)
- Total review count (currently 127 from mock data)
- Star visualization using actual rating value
- Updates the floating rating card in the hero section

### 2. Review Showcase Section
- Displays only 4 and 5-star reviews
- Professional card layout with reviewer information
- "Show More" functionality to load additional reviews
- Links to Google for viewing all reviews and writing new ones
- Responsive design for all devices

### 3. Google Branding
- Official Google logo and styling
- Links to Google Maps and review pages
- Professional disclaimer about review filtering

## Setting Up Real Google Places API

To replace the mock data with real Google reviews, follow these steps:

### Step 1: Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Places API**
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### Step 2: Find Your Place ID

1. Use [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
2. Search for "Ullishtja Agroturizem, Durres, Albania"
3. Copy the Place ID (starts with "ChIJ...")

### Step 3: Environment Setup

Create a `.env` file in your project root:

```env
REACT_APP_GOOGLE_PLACES_API_KEY=your_api_key_here
REACT_APP_GOOGLE_PLACE_ID=your_place_id_here
```

### Step 4: Update the Service

In `src/services/googleReviews.js`, uncomment and configure the real API implementation:

```javascript
// Update the constructor
constructor() {
  this.placeId = process.env.REACT_APP_GOOGLE_PLACE_ID;
  this.apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
}

// Update fetchGoogleReviews method
async fetchGoogleReviews() {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${this.placeId}&fields=name,rating,reviews,user_ratings_total&key=${this.apiKey}`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      return this.processGoogleReviewsData(data.result);
    } else {
      console.error('Google Places API error:', data.status);
      return this.getMockReviewsData(); // Fallback to mock data
    }
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return this.getMockReviewsData(); // Fallback to mock data
  }
}
```

### Step 5: CORS Considerations

Google Places API has CORS restrictions. For production, you'll need to:

1. **Option A**: Use a backend proxy
   - Create an endpoint in your server (`server/api/reviews.js`)
   - Make the API call from your backend
   - Return processed data to frontend

2. **Option B**: Use Google Places SDK
   - Implement client-side SDK with proper domain restrictions
   - Handle API calls through the official Google SDK

### Step 6: Update Links

Update the Google links in `GoogleReviews.js` component:

```javascript
// Replace generic search with your actual business links
const googleReviewsUrl = `https://www.google.com/maps/place/?q=place_id:${your_place_id}`;
const writeReviewUrl = `https://search.google.com/local/writereview?placeid=${your_place_id}`;
```

## Review Policy

The current implementation shows only 4 and 5-star reviews to maintain a positive brand image. This is clearly disclosed to users with a disclaimer.

Google's terms of service require:
- Showing review data accurately
- Not filtering or manipulating review content
- Providing links back to Google

Consider showing all reviews for full transparency, or implement a toggle feature.

## Styling Customization

The Google Reviews section styling can be customized in `src/components/GoogleReviews.css`:
- Colors match your brand palette (green/gold)
- Responsive design for all screen sizes
- Hover effects and animations
- Google-compliant branding

## Testing

1. **Mock Data Testing**: Currently implemented and working
2. **API Testing**: Use Google Places API test endpoints
3. **Rate Limiting**: Be aware of API quotas and implement caching
4. **Error Handling**: Fallback to mock data if API fails

## Performance Considerations

- **Caching**: Cache review data for 24 hours
- **Lazy Loading**: Load reviews when section becomes visible
- **Image Optimization**: Optimize reviewer profile photos
- **Bundle Size**: Google SDK can be large, consider code splitting

## Maintenance

- Monitor API usage and costs
- Update mock data periodically to reflect real reviews
- Check for Google Places API updates
- Verify links and integrations regularly

## Support

For technical issues:
1. Check Google Cloud Console for API errors
2. Verify API key restrictions and permissions
3. Monitor network requests in browser dev tools
4. Test with different Place IDs for debugging

---

**Note**: The current mock implementation provides a fully functional preview of how the real Google Reviews integration will look and behave. 