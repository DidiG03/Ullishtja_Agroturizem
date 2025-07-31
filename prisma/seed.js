import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.adminActivity.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.restaurantSettings.deleteMany();

  // Create Restaurant Settings
  const settings = await prisma.restaurantSettings.create({
    data: {
      restaurantName: 'Ullishtja Agriturizem',
      email: 'hi@ullishtja-agroturizem.com',
      phone: '+355 68 409 0405',
      address: 'Rruga e Ullishtes, Tirane, Albania',
      websiteUrl: 'https://ullishtja-agriturizem.com',
      maxCapacity: 60,
    },
  });

  // Create Menu Categories
  const appetizers = await prisma.menuCategory.create({
    data: {
      name: 'Appetizers',
      nameAlbanian: 'Antipasta',
      nameItalian: 'Antipasti',
      description: 'Start your meal with our traditional appetizers',
      displayOrder: 1,
    },
  });

  const mainCourses = await prisma.menuCategory.create({
    data: {
      name: 'Main Courses',
      nameAlbanian: 'Pjata Kryesore',
      nameItalian: 'Piatti Principali',
      description: 'Hearty traditional dishes with fresh ingredients',
      displayOrder: 2,
    },
  });

  const desserts = await prisma.menuCategory.create({
    data: {
      name: 'Desserts',
      nameAlbanian: 'Ëmbëlsira',
      nameItalian: 'Dolci',
      description: 'Sweet endings to your perfect meal',
      displayOrder: 3,
    },
  });

  const beverages = await prisma.menuCategory.create({
    data: {
      name: 'Beverages',
      nameAlbanian: 'Pije',
      nameItalian: 'Bevande',
      description: 'Refreshing drinks and traditional Albanian beverages',
      displayOrder: 4,
    },
  });

  // Create Menu Items
  const menuItems = [
    // Appetizers
    {
      name: 'Traditional Albanian Cheese Platter',
      nameAlbanian: 'Pjatë Djathi Shqiptar',
      nameItalian: 'Piatto di Formaggi Albanesi',
      description: 'Selection of local artisan cheeses with honey and nuts',
      descriptionAlbanian: 'Përzgjedhje djathërash vendas me mjaltë dhe arra',
      descriptionItalian: 'Selezione di formaggi artigianali locali con miele e noci',
      price: 12.50,
      categoryId: appetizers.id,
      isVegetarian: true,
      displayOrder: 1,
    },
    {
      name: 'Village Salad',
      nameAlbanian: 'Sallatë Fshatare',
      nameItalian: 'Insalata del Villaggio',
      description: 'Fresh tomatoes, cucumber, peppers, olives, and feta cheese',
      descriptionAlbanian: 'Domate të freskëta, kastravec, speca, ullinje dhe djathë feta',
      descriptionItalian: 'Pomodori freschi, cetrioli, peperoni, olive e feta',
      price: 8.00,
      categoryId: appetizers.id,
      isVegetarian: true,
      displayOrder: 2,
    },

    // Main Courses
    {
      name: 'Grilled Mountain Lamb',
      nameAlbanian: 'Mish Qengji në Skara',
      nameItalian: 'Agnello alla Griglia di Montagna',
      description: 'Tender lamb grilled with herbs, served with roasted vegetables',
      descriptionAlbanian: 'Mish qengji i njomë në skara me erëza, i shërbyer me perime të pjekura',
      descriptionItalian: 'Tenero agnello grigliato con erbe, servito con verdure arrostite',
      price: 22.00,
      categoryId: mainCourses.id,
      displayOrder: 1,
    },
    {
      name: 'Traditional Albanian Byrek',
      nameAlbanian: 'Byrek Tradicional',
      nameItalian: 'Byrek Tradizionale',
      description: 'Flaky pastry filled with spinach and cheese',
      descriptionAlbanian: 'Brumë të holla të mbushura me spinaq dhe djathë',
      descriptionItalian: 'Pasta sfoglia ripiena di spinaci e formaggio',
      price: 14.00,
      categoryId: mainCourses.id,
      isVegetarian: true,
      displayOrder: 2,
    },
    {
      name: 'Fresh Trout from Ulza River',
      nameAlbanian: 'Trofta e Freskët nga Lumi i Ulzës',
      nameItalian: 'Trota Fresca dal Fiume Ulza',
      description: 'Grilled fresh trout with lemon and Mediterranean herbs',
      descriptionAlbanian: 'Trofta e freskët në skara me limon dhe erëza mesdhetare',
      descriptionItalian: 'Trota fresca grigliata con limone ed erbe mediterranee',
      price: 18.50,
      categoryId: mainCourses.id,
      displayOrder: 3,
    },

    // Desserts
    {
      name: 'Traditional Baklava',
      nameAlbanian: 'Bakllava Tradicionale',
      nameItalian: 'Baklava Tradizionale',
      description: 'Layers of filo pastry with nuts and honey syrup',
      descriptionAlbanian: 'Shtresa brumi filo me arra dhe shurup mjaltë',
      descriptionItalian: 'Strati di pasta filo con noci e sciroppo di miele',
      price: 6.50,
      categoryId: desserts.id,
      isVegetarian: true,
      displayOrder: 1,
    },
    {
      name: 'Mountain Honey Ice Cream',
      nameAlbanian: 'Akullore me Mjaltë Mali',
      nameItalian: 'Gelato al Miele di Montagna',
      description: 'Homemade ice cream with local mountain honey',
      descriptionAlbanian: 'Akullore shtëpie me mjaltë mali vendor',
      descriptionItalian: 'Gelato fatto in casa con miele di montagna locale',
      price: 5.00,
      categoryId: desserts.id,
      isVegetarian: true,
      displayOrder: 2,
    },

    // Beverages
    {
      name: 'Albanian Mountain Tea',
      nameAlbanian: 'Çaj Mali Shqiptar',
      nameItalian: 'Tè di Montagna Albanese',
      description: 'Herbal tea blend from local mountain herbs',
      descriptionAlbanian: 'Përzierje çaji bimor nga erëza vendase mali',
      descriptionItalian: 'Miscela di tè alle erbe di montagna locali',
      price: 3.50,
      categoryId: beverages.id,
      isVegetarian: true,
      isVegan: true,
      displayOrder: 1,
    },
    {
      name: 'Local Wine Selection',
      nameAlbanian: 'Përzgjedhje Verërash Vendase',
      nameItalian: 'Selezione di Vini Locali',
      description: 'Glass of premium Albanian wine',
      descriptionAlbanian: 'Gotë verë shqiptare premium',
      descriptionItalian: 'Bicchiere di vino albanese premium',
      price: 4.50,
      categoryId: beverages.id,
      displayOrder: 2,
    },
    {
      name: 'Fresh Mountain Spring Water',
      nameAlbanian: 'Ujë i Freskët Burimi Mali',
      nameItalian: 'Acqua Fresca di Sorgente di Montagna',
      description: 'Natural spring water from local mountains',
      descriptionAlbanian: 'Ujë burim natyral nga malet vendase',
      descriptionItalian: 'Acqua di sorgente naturale dalle montagne locali',
      price: 2.00,
      categoryId: beverages.id,
      isVegetarian: true,
      isVegan: true,
      displayOrder: 3,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }

  // Create Sample Customers
  const customers = [
    {
      name: 'Maria Rossi',
      email: 'maria.rossi@email.com',
      phone: '+39 333 123 4567',
      totalVisits: 3,
      preferences: JSON.stringify({ dietary: 'vegetarian', favorite_dish: 'byrek' }),
      notes: 'Regular customer, prefers window table',
    },
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 555 987 6543',
      totalVisits: 1,
      preferences: JSON.stringify({ dietary: 'none', favorite_dish: 'lamb' }),
    },
    {
      name: 'Ana Popovic',
      email: 'ana.popovic@email.com',
      phone: '+381 64 123 456',
      totalVisits: 5,
      preferences: JSON.stringify({ dietary: 'pescatarian', favorite_dish: 'trout' }),
      notes: 'VIP customer, loves fish dishes',
    },
  ];

  for (const customer of customers) {
    await prisma.customer.create({ data: customer });
  }

  // Create Sample Reservations
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const reservations = [
    {
      name: 'Elena Bianchi',
      email: 'elena.bianchi@email.com',
      phone: '+39 348 765 4321',
      date: tomorrow,
      time: '19:00',
      guests: 4,
      specialRequests: 'Table with mountain view please',
      status: 'CONFIRMED',
    },
    {
      name: 'Marco Gentile',
      email: 'marco.gentile@email.com',
      phone: '+39 347 123 9876',
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      time: '20:30',
      guests: 2,
      specialRequests: 'Anniversary dinner, vegetarian options',
      status: 'PENDING',
    },
    {
      name: 'Dimitri Kovac',
      email: 'dimitri.kovac@email.com',
      phone: '+381 63 456 789',
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      time: '18:30',
      guests: 6,
      status: 'CONFIRMED',
    },
  ];

  for (const reservation of reservations) {
    await prisma.reservation.create({ data: reservation });
  }

  // Create Sample Reviews
  const reviews = [
    {
      customerName: 'Sofia Petrova',
      customerEmail: 'sofia.petrova@email.com',
      rating: 5,
      title: 'Amazing authentic experience!',
      comment: 'The food was incredible and the atmosphere was perfect. The lamb was cooked to perfection and the mountain views are breathtaking. Will definitely return!',
      status: 'APPROVED',
      isPublic: true,
      source: 'website',
    },
    {
      customerName: 'Giuseppe Romano',
      customerEmail: 'giuseppe.romano@email.com',
      rating: 5,
      title: 'Best Albanian food I\'ve ever had',
      comment: 'Exceptional service and delicious traditional dishes. The byrek was amazing and the staff was very welcoming.',
      status: 'APPROVED',
      isPublic: true,
      source: 'google',
    },
    {
      customerName: 'Anonymous Guest',
      customerEmail: null,
      rating: 4,
      title: 'Great experience with minor issues',
      comment: 'Food was great but service was a bit slow. Overall good experience though.',
      status: 'PENDING',
      isPublic: false,
      source: 'website',
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`Created:
  - ${menuItems.length} menu items across 4 categories
  - ${customers.length} sample customers  
  - ${reservations.length} sample reservations
  - ${reviews.length} sample reviews
  - Restaurant settings initialized`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 