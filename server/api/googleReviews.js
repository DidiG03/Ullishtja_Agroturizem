const express = require('express');
const router = express.Router();

// GET /api/google-reviews
router.get('/', async (req, res) => {
  try {
    const placeId = process.env.REACT_APP_GOOGLE_PLACE_ID;
const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

if (!placeId || !apiKey) {
  console.error('Missing Google Places configuration. Please set REACT_APP_GOOGLE_PLACE_ID and REACT_APP_GOOGLE_PLACES_API_KEY');
}

    if (!apiKey || !placeId) {
      console.error('Missing API key or Place ID');
      return res.status(500).json({ 
        error: 'Server configuration error',
        fallback: true 
      });
    }


    // Use dynamic import for fetch in Node.js
    const fetch = (await import('node-fetch')).default;
    
    // Fetch place details from Google Places API
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      
      // Process the reviews data
      const processedData = {
        averageRating: data.result.rating || 0,
        totalReviews: data.result.user_ratings_total || 0,
        reviews: (data.result.reviews || []).map(review => ({
          id: review.time.toString(),
          authorName: review.author_name,
          authorPhotoUrl: review.profile_photo_url ? 
            review.profile_photo_url.replace('=s128-', '=s200-') : null, // Higher resolution
          rating: review.rating,
          text: review.text,
          time: new Date(review.time * 1000).toISOString().split('T')[0],
          relativeTimeDescription: review.relative_time_description
        }))
      };

      // Set cache headers (cache for 1 hour)
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      
      return res.status(200).json({
        success: true,
        data: processedData
      });
    } else {
      console.warn('Google Places API error:', data.status, data.error_message);
      return res.status(500).json({ 
        error: 'Failed to fetch reviews from Google',
        details: data.error_message,
        fallback: true 
      });
    }
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return res.status(500).json({ 
      error: 'Server error fetching reviews',
      fallback: true 
    });
  }
});

module.exports = router; 