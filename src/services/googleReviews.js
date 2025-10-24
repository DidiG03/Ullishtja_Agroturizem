// Google Reviews Service
// Note: For production, you would need to integrate with Google Places API
// This service provides a structure for handling Google Reviews data

class GoogleReviewsService {
  constructor() {
    // Note: API keys are handled server-side for security
    // This service fetches reviews from our backend API which handles Google Places API calls
    this.placeId = process.env.REACT_APP_GOOGLE_PLACE_ID || 'configured-server-side'
    this.apiKey = 'configured-server-side' // API key handled server-side for security
    this.useRealData = process.env.REACT_APP_USE_REAL_REVIEWS === 'true' || true // Enable by default
  }

  // Get today's date as a string (YYYY-MM-DD)
  getTodaysDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Simple seeded random number generator
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Generate a seed from today's date
  getDateSeed() {
    const dateStr = this.getTodaysDate();
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed += dateStr.charCodeAt(i) * (i + 1);
    }
    return seed;
  }

  // Shuffle array using seeded random (Fisher-Yates algorithm)
  shuffleWithSeed(array, seed) {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    let randomIndex;
    
    // Create a seeded random function
    let seedValue = seed;
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };

    while (currentIndex !== 0) {
      randomIndex = Math.floor(random() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
  }

  // Get daily shuffled reviews that cycle through all 4-5 star reviews
  getDailyShuffledReviews(reviewsData, displayCount = 3) {
    const highRatingReviews = reviewsData.reviews.filter(review => review.rating >= 4);
    
    if (highRatingReviews.length === 0) {
      return {
        ...reviewsData,
        reviews: []
      };
    }

    // Get today's date seed
    const dateSeed = this.getDateSeed();
    
    // If we have fewer high rating reviews than display count, show all
    if (highRatingReviews.length <= displayCount) {
      return {
        ...reviewsData,
        reviews: this.shuffleWithSeed(highRatingReviews, dateSeed)
      };
    }

    // Calculate which "batch" of reviews to show today
    const totalReviews = highRatingReviews.length;
    const batchSize = displayCount;
    const totalBatches = Math.ceil(totalReviews / batchSize);
    
    // Use date to determine which batch to show (cycles through all batches)
    const today = new Date();
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const currentBatch = daysSinceEpoch % totalBatches;
    
    // Shuffle all reviews first with today's seed
    const shuffledReviews = this.shuffleWithSeed(highRatingReviews, dateSeed);
    
    // Get the batch for today
    const startIndex = currentBatch * batchSize;
    const endIndex = Math.min(startIndex + batchSize, totalReviews);
    const todaysReviews = shuffledReviews.slice(startIndex, endIndex);
    
    // If we don't have enough reviews in this batch, fill from the beginning
    if (todaysReviews.length < batchSize && totalReviews >= batchSize) {
      const remaining = batchSize - todaysReviews.length;
      const additionalReviews = shuffledReviews.slice(0, remaining);
      todaysReviews.push(...additionalReviews);
    }

    return {
      ...reviewsData,
      reviews: todaysReviews,
      allHighRatingReviews: shuffledReviews // Keep all reviews for "show more" functionality
    };
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
          authorName: "Sophie Laurent",
          authorPhotoUrl: null,
          rating: 4,
          text: "Wonderful traditional Albanian food in a beautiful mountain setting. The staff was friendly and the atmosphere was cozy. Great value for money!",
          time: "2024-01-02",
          relativeTimeDescription: "1 month ago"
        },
        {
          id: "6",
          authorName: "Marco Gentile",
          authorPhotoUrl: null,
          rating: 5,
          text: "Incredible experience! The food was outstanding, especially the lamb dishes. The view from the terrace is spectacular. Highly recommended for authentic Albanian cuisine.",
          time: "2023-12-28",
          relativeTimeDescription: "1 month ago"
        },
        {
          id: "7",
          authorName: "Anna Kowalski",
          authorPhotoUrl: null,
          rating: 4,
          text: "Great location with amazing mountain views. The food is authentic and delicious. Service was good, though we had to wait a bit longer during peak hours.",
          time: "2023-12-20",
          relativeTimeDescription: "1 month ago"
        },
        {
          id: "8",
          authorName: "David Johnson",
          authorPhotoUrl: null,
          rating: 5,
          text: "Perfect place for a traditional Albanian meal. The ingredients are fresh and local. The staff is very welcoming and the atmosphere is authentic. Will come back!",
          time: "2023-12-15",
          relativeTimeDescription: "2 months ago"
        }
      ]
    };
  }

  // Fetch real Google Reviews or return mock data
  async fetchGoogleReviews() {
    try {
      // Always try to fetch real reviews from our backend API first
      const response = await fetch('/api/google-reviews');
      
      // Check if response is ok
      if (!response.ok) {
        console.info('Google Reviews API not available (status:', response.status, '), using mock data');
        return this.getMockReviewsData();
      }
      
      // Check if response is HTML (common in development when API routes aren't available)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.info('Google Reviews API returned non-JSON response (likely development environment), using mock data');
        return this.getMockReviewsData();
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        if (result.source === 'mock' || result.source === 'mock_fallback') {
          console.info('Using mock Google Reviews data (API keys not configured)');
        } else {
          console.info('Successfully fetched real Google Reviews data');
        }
        return result.data;
      } else {
        console.info('API response indicates failure, using local mock data:', result.error || 'Unknown error');
        return this.getMockReviewsData(); // Fallback to local mock data
      }
    } catch (error) {
      // Only show this as info since it's expected in development without proper API setup
      console.info('Google Reviews API not available, using mock data for development');
      return this.getMockReviewsData(); // Fallback to local mock data
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

  // Filter reviews to get only 4 and 5 star reviews (DEPRECATED - use getDailyShuffledReviews instead)
  getHighRatingReviews(reviewsData) {
    return {
      ...reviewsData,
      reviews: reviewsData.reviews.filter(review => review.rating >= 4)
    };
  }

  // Format rating for display
  formatRating(rating) {
    return rating.toFixed(1);
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

  // Fetch place photos from Google Places API
  async fetchGooglePlacePhotos() {
    try {
      // Use relative path for production, localhost for development
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? '' 
        : process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const desiredLimit = 30; // ask for more photos than before
      const apiUrl = `${apiBaseUrl}/api/google-photos?limit=${desiredLimit}`;
      
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.warn('API response indicates failure or no data for photos, using mock data:', result.error || 'Unknown error');
        return this.getMockPhotosData(); // Fallback to mock data
      }
    } catch (error) {
      console.error('Error fetching Google place photos:', error);
      return this.getMockPhotosData(); // Fallback to mock data
    }
  }

  // Mock photos data for fallback
  getMockPhotosData() {
    return {
      photos: [
        {
          id: "mock_1",
          url: "/images/food.jpeg",
          width: 1024,
          height: 768,
          attributions: ["Customer Photo"]
        },
        {
          id: "mock_2", 
          url: "/images/panorama.jpeg",
          width: 1200,
          height: 800,
          attributions: ["Customer Photo"]
        },
        {
          id: "mock_3",
          url: "/images/logo_wall.jpeg", 
          width: 800,
          height: 600,
          attributions: ["Customer Photo"]
        },
        {
          id: "mock_4",
          url: "/images/test.jpeg",
          width: 900,
          height: 675,
          attributions: ["Customer Photo"]
        }
      ]
    };
  }
}

const googleReviewsService = new GoogleReviewsService();
export default googleReviewsService; 