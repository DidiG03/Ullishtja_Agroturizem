// Serverless function to fetch Google Reviews
// This avoids CORS issues when calling Google Places API from the browser

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const placeId = process.env.REACT_APP_GOOGLE_PLACE_ID || "ChIJ_6oztHnbTxMRmn95pUlRg40";
    const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY || "AIzaSyBVqtCAyNk4YFM_rn3tOII_uJ8-a5WgCHY";

    if (!apiKey || !placeId) {
      console.error('Missing API key or Place ID');
      return res.status(500).json({ 
        error: 'Server configuration error',
        fallback: true 
      });
    }

    console.log('Fetching Google Reviews for Place ID:', placeId);

    // Fetch place details from Google Places API
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      console.log('Successfully fetched Google Reviews');
      
      // Process the reviews data
      const processedData = {
        averageRating: data.result.rating || 0,
        totalReviews: data.result.user_ratings_total || 0,
        reviews: (data.result.reviews || []).map(review => ({
          id: review.time.toString(),
          authorName: review.author_name,
          authorPhotoUrl: review.profile_photo_url,
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
} 