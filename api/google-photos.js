// Serverless function to fetch Google Place Photos
// This avoids CORS issues when calling Google Places API from the browser

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const placeId = process.env.GOOGLE_PLACE_ID || process.env.REACT_APP_GOOGLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

    if (!placeId || !apiKey) {
      console.error('Missing Google Places configuration. Please set REACT_APP_GOOGLE_PLACE_ID and REACT_APP_GOOGLE_PLACES_API_KEY');
    }

    if (!apiKey || !placeId) {
      console.warn('Missing API key or Place ID for Google Photos. Returning mock data.');
      return res.status(200).json({ success: true, data: getMockPhotosData(), source: 'mock' });
    }

    // Fetch place details with photos from Google Places API
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photo&key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      // Process the photos data
      const processedData = {
        photos: (data.result.photos || []).slice(0, 12).map((photo, index) => ({
          id: `photo_${index}`,
          photoReference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`,
          highResUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${photo.photo_reference}&key=${apiKey}`,
          attributions: photo.html_attributions || []
        }))
      };

      // Set cache headers (cache for 2 hours)
      res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=86400');
      
      return res.status(200).json({
        success: true,
        data: processedData
      });
    } else {
      console.warn('Google Places API error:', data.status, data.error_message);
      return res.status(200).json({ success: true, data: getMockPhotosData(), source: 'mock_fallback_api_error' });
    }
  } catch (error) {
    console.error('Error fetching Google place photos:', error);
    return res.status(200).json({ success: true, data: getMockPhotosData(), source: 'mock_fallback' });
  }
}

// Local mock used by server when Google API unavailable
function getMockPhotosData() {
  return {
    photos: [
      { id: 'mock_1', url: '/images/food.jpeg', width: 1024, height: 768, attributions: ['Customer Photo'] },
      { id: 'mock_2', url: '/images/panorama.jpeg', width: 1200, height: 800, attributions: ['Customer Photo'] },
      { id: 'mock_3', url: '/images/logo_wall.jpeg', width: 800, height: 600, attributions: ['Customer Photo'] },
      { id: 'mock_4', url: '/images/posters/hero-poster.jpg', width: 1200, height: 800, attributions: ['Customer Photo'] },
    ],
  };
}