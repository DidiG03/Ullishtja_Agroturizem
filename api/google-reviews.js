// Serverless function to fetch Google Reviews
// Uses Google Business Profile API when configured (50+ reviews),
// otherwise falls back to Google Places API (max 5 reviews).

const STAR_RATINGS = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

function processReviews(reviews) {
  return reviews
    .filter((review) => Number(review.rating) === 5)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

function hasBusinessProfileConfig() {
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  return Boolean(accountId && locationId && clientId && clientSecret && refreshToken);
}

async function getBusinessProfileAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to refresh Google OAuth token');
  }

  return data.access_token;
}

function mapBusinessProfileReview(review) {
  const timestamp = review.updateTime || review.createTime;
  const date = timestamp ? new Date(timestamp) : new Date();

  return {
    id: review.reviewId || review.name || timestamp,
    authorName: review.reviewer?.displayName || 'Google User',
    authorPhotoUrl: review.reviewer?.profilePhotoUrl || null,
    rating: STAR_RATINGS[review.starRating] || 0,
    text: review.comment || '',
    time: date.toISOString().split('T')[0],
    relativeTimeDescription: null,
  };
}

async function fetchFromBusinessProfile() {
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID;
  const maxReviews = Math.min(
    Math.max(parseInt(process.env.GOOGLE_REVIEWS_MAX || '50', 10), 1),
    250
  );

  const accessToken = await getBusinessProfileAccessToken();
  const allReviews = [];
  let pageToken;
  let averageRating = 0;
  let totalReviews = 0;

  do {
    const url = new URL(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`
    );
    url.searchParams.set('pageSize', '50');
    url.searchParams.set('orderBy', 'updateTime desc');

    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Business Profile API error (${response.status})`);
    }

    if (typeof data.averageRating === 'number') {
      averageRating = data.averageRating;
    }
    if (typeof data.totalReviewCount === 'number') {
      totalReviews = data.totalReviewCount;
    }

    allReviews.push(...(data.reviews || []).map(mapBusinessProfileReview));
    pageToken = data.nextPageToken;
  } while (pageToken && allReviews.length < maxReviews);

  const fiveStarReviews = processReviews(allReviews).slice(0, maxReviews);

  return {
    averageRating,
    totalReviews,
    reviews: fiveStarReviews,
  };
}

async function fetchFromPlaces(placeId, apiKey) {
  const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.status !== 'OK' || !data.result) {
    throw new Error(data.error_message || data.status || 'Places API error');
  }

  const allReviews = (data.result.reviews || []).map((review) => ({
    id: review.time.toString(),
    authorName: review.author_name,
    authorPhotoUrl: review.profile_photo_url,
    rating: review.rating,
    text: review.text,
    time: new Date(review.time * 1000).toISOString().split('T')[0],
    relativeTimeDescription: review.relative_time_description,
  }));

  return {
    averageRating: data.result.rating || 0,
    totalReviews: data.result.user_ratings_total || 0,
    reviews: processReviews(allReviews),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const placeId = process.env.GOOGLE_PLACE_ID || process.env.REACT_APP_GOOGLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

    if (hasBusinessProfileConfig()) {
      try {
        const processedData = await fetchFromBusinessProfile();
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json({
          success: true,
          data: processedData,
          source: 'google_business_profile',
        });
      } catch (businessProfileError) {
        console.warn('Google Business Profile API failed, falling back to Places API:', businessProfileError.message);
      }
    }

    if (!placeId || !apiKey) {
      console.warn('Missing Google Places configuration. Returning mock data.');
      return res.status(200).json({
        success: true,
        data: getMockReviewsData(),
        source: 'mock',
      });
    }

    const processedData = await fetchFromPlaces(placeId, apiKey);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return res.status(200).json({
      success: true,
      data: processedData,
      source: 'google_places',
    });
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return res.status(200).json({
      success: true,
      data: getMockReviewsData(),
      source: 'mock_fallback',
    });
  }
}

// Mock reviews data for when API is not configured
function getMockReviewsData() {
  return {
    averageRating: 4.8,
    totalReviews: 387,
    reviews: processReviews([
      {
        id: "1",
        authorName: "Maria Korsgaard",
        authorPhotoUrl: null,
        rating: 5,
        text: "Amazing authentic Albanian experience! The food was incredible and the mountain views are breathtaking. Staff was very welcoming and the traditional recipes were perfectly executed.",
        time: "2024-03-15",
        relativeTimeDescription: "2 weeks ago"
      },
      {
        id: "2",
        authorName: "John Smith",
        authorPhotoUrl: null,
        rating: 5,
        text: "Best agritourism experience we've had! Fresh ingredients, beautiful location, and excellent service. The traditional byrek was outstanding. Highly recommend!",
        time: "2024-03-10",
        relativeTimeDescription: "3 weeks ago"
      },
      {
        id: "3",
        authorName: "Francesco Bianchi",
        authorPhotoUrl: null,
        rating: 5,
        text: "Exceptional farm-to-table dining experience. Everything was fresh and delicious. The olive oil and cheese selection was particularly impressive. Will definitely return!",
        time: "2024-02-28",
        relativeTimeDescription: "1 month ago"
      },
      {
        id: "4",
        authorName: "Marco Gentile",
        authorPhotoUrl: null,
        rating: 5,
        text: "Incredible experience! The food was outstanding, especially the lamb dishes. The view from the terrace is spectacular. Highly recommended for authentic Albanian cuisine.",
        time: "2024-02-20",
        relativeTimeDescription: "1 month ago"
      },
      {
        id: "5",
        authorName: "David Johnson",
        authorPhotoUrl: null,
        rating: 5,
        text: "Perfect place for a traditional Albanian meal. The ingredients are fresh and local. The staff is very welcoming and the atmosphere is authentic. Will come back!",
        time: "2024-02-12",
        relativeTimeDescription: "2 months ago"
      },
      {
        id: "6",
        authorName: "Elena Martínez",
        authorPhotoUrl: null,
        rating: 5,
        text: "Lovely place with authentic Albanian cuisine. The mountain location is stunning and the food quality is excellent. A truly memorable dining experience.",
        time: "2024-01-28",
        relativeTimeDescription: "2 months ago"
      },
      {
        id: "7",
        authorName: "Sophie Laurent",
        authorPhotoUrl: null,
        rating: 5,
        text: "Wonderful traditional Albanian food in a beautiful mountain setting. The staff was friendly and the atmosphere was cozy. Great value for money!",
        time: "2024-01-18",
        relativeTimeDescription: "3 months ago"
      },
      {
        id: "8",
        authorName: "Anna Kowalski",
        authorPhotoUrl: null,
        rating: 5,
        text: "Great location with amazing mountain views. The food is authentic and delicious. Service was excellent and the homemade wine was a perfect complement.",
        time: "2024-01-05",
        relativeTimeDescription: "3 months ago"
      },
      {
        id: "9",
        authorName: "Giuseppe Romano",
        authorPhotoUrl: null,
        rating: 5,
        text: "A hidden gem in the Albanian countryside. Every dish tasted like it was made with love. The terrace views at sunset are absolutely unforgettable.",
        time: "2023-12-22",
        relativeTimeDescription: "4 months ago"
      },
      {
        id: "10",
        authorName: "Claire Dubois",
        authorPhotoUrl: null,
        rating: 5,
        text: "We celebrated our anniversary here and it was perfect. Traditional recipes, warm hospitality, and the freshest ingredients. Cannot recommend enough!",
        time: "2023-12-08",
        relativeTimeDescription: "4 months ago"
      },
      {
        id: "11",
        authorName: "Thomas Müller",
        authorPhotoUrl: null,
        rating: 5,
        text: "Outstanding agritourism restaurant. The lamb slow-cooked in traditional style was the best I've ever had. Friendly staff and peaceful surroundings.",
        time: "2023-11-25",
        relativeTimeDescription: "5 months ago"
      },
      {
        id: "12",
        authorName: "Isabella Costa",
        authorPhotoUrl: null,
        rating: 5,
        text: "From the moment we arrived, we felt at home. The farm-fresh produce shines in every plate. A must-visit when exploring the Durrës region.",
        time: "2023-11-10",
        relativeTimeDescription: "5 months ago"
      }
    ])
  };
}
