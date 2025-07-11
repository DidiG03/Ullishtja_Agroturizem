// Google Reviews Service
// Note: For production, you would need to integrate with Google Places API
// This service provides a structure for handling Google Reviews data

class GoogleReviewsService {
  constructor() {
    // Your actual Google Place ID and API Key
    this.placeId = process.env.REACT_APP_GOOGLE_PLACE_ID || "ChIJ_6oztHnbTxMRmn95pUlRg40"
    this.apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY || "AIzaSyBVqtCAyNk4YFM_rn3tOII_uJ8-a5WgCHY"
    this.useRealData = process.env.REACT_APP_USE_REAL_REVIEWS === 'true' || true // Enable by default
  }

  // Mock data structure - updated to match actual business rating
  getMockReviewsData() {
    return {
      averageRating: 4.6,
      totalReviews: 387,
      reviews: [
        {
          id: "1",
          authorName: "Maria Rossi",
          authorPhotoUrl: null,
          rating: 5,
          text: "Amazing authentic Albanian experience! The food was incredible and the mountain views are breathtaking. Staff was very welcoming and the traditional recipes were perfectly executed.",
          time: "2024-01-15",
          relativeTimeDescription: "2 weeks ago"
        },
        {
          id: "2",
          authorName: "John Smith",
          authorPhotoUrl: null,
          rating: 5,
          text: "Best agritourism experience we've had! Fresh ingredients, beautiful location, and excellent service. The traditional byrek was outstanding. Highly recommend!",
          time: "2024-01-10",
          relativeTimeDescription: "3 weeks ago"
        },
        {
          id: "3",
          authorName: "Elena Martínez",
          authorPhotoUrl: null,
          rating: 4,
          text: "Lovely place with authentic Albanian cuisine. The mountain location is stunning and the food quality is excellent. Service could be a bit faster but overall great experience.",
          time: "2024-01-08",
          relativeTimeDescription: "3 weeks ago"
        },
        {
          id: "4",
          authorName: "Francesco Bianchi",
          authorPhotoUrl: null,
          rating: 5,
          text: "Exceptional farm-to-table dining experience. Everything was fresh and delicious. The olive oil and cheese selection was particularly impressive. Will definitely return!",
          time: "2024-01-05",
          relativeTimeDescription: "1 month ago"
        },
        {
          id: "5",
          authorName: "Anna Kowalski",
          authorPhotoUrl: null,
          rating: 4,
          text: "Great traditional Albanian food and beautiful scenery. The tave kosi was amazing! The atmosphere is very peaceful and relaxing. Perfect for a weekend getaway.",
          time: "2024-01-02",
          relativeTimeDescription: "1 month ago"
        },
        {
          id: "6",
          authorName: "David Wilson",
          authorPhotoUrl: null,
          rating: 5,
          text: "Outstanding agritourism destination! The combination of delicious food, beautiful views, and warm hospitality made our visit unforgettable. The wine selection was excellent too.",
          time: "2023-12-28",
          relativeTimeDescription: "1 month ago"
        }
      ]
    };
  }

  // Fetch real Google Reviews or return mock data
  async fetchGoogleReviews() {
    try {
      // Use real Google Places API if configured
      if (this.useRealData && this.apiKey && this.placeId && this.placeId !== "ChIJ...") {
        console.log('Fetching real Google Reviews for Place ID:', this.placeId);
        
        // Call our backend API to avoid CORS issues
        const response = await fetch('http://localhost:3001/api/google-reviews');
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('Successfully fetched real Google Reviews');
          return result.data;
        } else if (result.fallback) {
          console.warn('API error, falling back to mock data:', result.error);
          return this.getMockReviewsData(); // Fallback to mock data
        } else {
          console.warn('Unexpected API response:', result);
          return this.getMockReviewsData(); // Fallback to mock data
        }
      }
      
      // Return mock data if real API is not configured
      console.log('Using mock review data');
      return this.getMockReviewsData();
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
      return this.getMockReviewsData(); // Fallback to mock data
    }
  }

  // Process Google Places API response
  processGoogleReviewsData(placeData) {
    return {
      averageRating: placeData.rating || 0,
      totalReviews: placeData.user_ratings_total || 0,
      reviews: (placeData.reviews || []).map(review => ({
        id: review.time.toString(),
        authorName: review.author_name,
        authorPhotoUrl: review.profile_photo_url,
        rating: review.rating,
        text: review.text,
        time: new Date(review.time * 1000).toISOString().split('T')[0],
        relativeTimeDescription: review.relative_time_description
      }))
    };
  }

  // Filter reviews to get only 4 and 5 star reviews
  getHighRatingReviews(reviewsData) {
    return {
      ...reviewsData,
      reviews: reviewsData.reviews.filter(review => review.rating >= 4)
    };
  }

  // Format rating for display
  formatRating(rating) {
    return parseFloat(rating).toFixed(1);
  }

  // Generate star display
  generateStarDisplay(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  // Generate URL to view reviews
  getReviewsUrl() {
    // Always use the Place ID for Ullishtja Agroturizem
    return `https://search.google.com/local/reviews?placeid=${this.placeId}`;
  }

  // Generate URL to write a review
  getWriteReviewUrl() {
    // Always use the Place ID for Ullishtja Agroturizem
    return `https://search.google.com/local/writereview?placeid=${this.placeId}`;
  }
}

const googleReviewsService = new GoogleReviewsService();
export default googleReviewsService; 