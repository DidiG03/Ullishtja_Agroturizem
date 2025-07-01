const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const menuData = {
  categories: [
    {
      nameAL: "Meze",
      nameEN: "Appetizers", 
      nameIT: "Antipasti",
      slug: "meze",
      displayOrder: 1
    },
    {
      nameAL: "Supa",
      nameEN: "Soups",
      nameIT: "Zuppe", 
      slug: "supa",
      displayOrder: 2
    },
    {
      nameAL: "Pjata Kryesore",
      nameEN: "Main Courses",
      nameIT: "Piatti Principali",
      slug: "pjata-kryesore",
      displayOrder: 3
    },
    {
      nameAL: "Të Pjekura në Skarë",
      nameEN: "Grilled Dishes", 
      nameIT: "Grigliate",
      slug: "te-pjekura-ne-skare",
      displayOrder: 4
    },
    {
      nameAL: "Makarona",
      nameEN: "Pasta",
      nameIT: "Pasta",
      slug: "makarona",
      displayOrder: 5
    },
    {
      nameAL: "Peshk dhe Frutë Deti",
      nameEN: "Seafood",
      nameIT: "Pesce e Frutti di Mare",
      slug: "peshk-dhe-frute-deti",
      displayOrder: 6
    },
    {
      nameAL: "Sallata",
      nameEN: "Salads",
      nameIT: "Insalate",
      slug: "sallata",
      displayOrder: 7
    },
    {
      nameAL: "Ëmbëlsira",
      nameEN: "Desserts",
      nameIT: "Dolci",
      slug: "embelisira",
      displayOrder: 8
    },
    {
      nameAL: "Pije",
      nameEN: "Beverages",
      nameIT: "Bevande",
      slug: "pije",
      displayOrder: 9
    }
  ],
  
  items: {
    meze: [
      {
        nameAL: "Byrek me Spinaq",
        nameEN: "Spinach Byrek",
        nameIT: "Byrek con Spinaci",
        descriptionAL: "Byrek tradicional me spinaq dhe erbëra të freskëta",
        descriptionEN: "Traditional byrek with spinach and fresh herbs",
        descriptionIT: "Byrek tradizionale con spinaci ed erbe fresche",
        ingredientsAL: "Spinaq, djathë, vezë, erbëra",
        ingredientsEN: "Spinach, cheese, eggs, herbs",
        ingredientsIT: "Spinaci, formaggio, uova, erbe",
        price: 800,
        isVegetarian: true,
        displayOrder: 1
      },
      {
        nameAL: "Turshi i Shtëpisë",
        nameEN: "House Pickles",
        nameIT: "Sottaceti della Casa",
        descriptionAL: "Perime të turshira në mënyrë tradicionale",
        descriptionEN: "Traditionally pickled vegetables",
        descriptionIT: "Verdure sottaceto tradizionali",
        ingredientsAL: "Lakra, karota, spec, uthull",
        ingredientsEN: "Cabbage, carrots, peppers, vinegar",
        ingredientsIT: "Cavolo, carote, peperoni, aceto",
        price: 600,
        isVegetarian: true,
        displayOrder: 2
      },
      {
        nameAL: "Djathë i Bardhë me Ullinje",
        nameEN: "White Cheese with Olives",
        nameIT: "Formaggio Bianco con Olive",
        descriptionAL: "Djathë lokal i freskët me ullinje të zonës",
        descriptionEN: "Fresh local cheese with regional olives",
        descriptionIT: "Formaggio locale fresco con olive regionali",
        ingredientsAL: "Djathë kope, ullinje, vaj ulliri",
        ingredientsEN: "Sheep cheese, olives, olive oil",
        ingredientsIT: "Formaggio di pecora, olive, olio d'oliva",
        price: 700,
        isVegetarian: true,
        displayOrder: 3
      },
      {
        nameAL: "Suxhuk i Shtëpisë",
        nameEN: "House Sausage",
        nameIT: "Salsiccia della Casa",
        descriptionAL: "Suxhuk tradicional i bërë në shtëpi",
        descriptionEN: "Traditional homemade sausage",
        descriptionIT: "Salsiccia tradizionale fatta in casa",
        ingredientsAL: "Mish viçi, erëza, zorrë natyrale",
        ingredientsEN: "Beef, spices, natural casing",
        ingredientsIT: "Manzo, spezie, budello naturale",
        price: 1200,
        displayOrder: 4
      },
      {
        nameAL: "Byrek me Mish",
        nameEN: "Meat Byrek", 
        nameIT: "Byrek con Carne",
        descriptionAL: "Byrek i bollshëm me mish dhe qepë",
        descriptionEN: "Hearty byrek with meat and onions",
        descriptionIT: "Byrek sostanzioso con carne e cipolle",
        ingredientsAL: "Mish qengji, qepë, erëza",
        ingredientsEN: "Lamb meat, onions, spices",
        ingredientsIT: "Carne di agnello, cipolle, spezie",
        price: 1000,
        displayOrder: 5
      }
    ],
    
    supa: [
      {
        nameAL: "Supë Koke",
        nameEN: "Head Soup",
        nameIT: "Zuppa di Testa",
        descriptionAL: "Supë tradicionale me koke qengji",
        descriptionEN: "Traditional soup with lamb head",
        descriptionIT: "Zuppa tradizionale con testa di agnello",
        ingredientsAL: "Koke qengji, perime, erëza",
        ingredientsEN: "Lamb head, vegetables, spices",
        ingredientsIT: "Testa di agnello, verdure, spezie",
        price: 1500,
        isRecommended: true,
        displayOrder: 1
      },
      {
        nameAL: "Supë Pule",
        nameEN: "Chicken Soup",
        nameIT: "Zuppa di Pollo",
        descriptionAL: "Supë e ngrohtë me pulë dhe perime",
        descriptionEN: "Warm soup with chicken and vegetables",
        descriptionIT: "Zuppa calda con pollo e verdure",
        ingredientsAL: "Pulë, karota, selino, patate",
        ingredientsEN: "Chicken, carrots, celery, potatoes",
        ingredientsIT: "Pollo, carote, sedano, patate",
        price: 1200,
        displayOrder: 2
      },
      {
        nameAL: "Supë Lëngj",
        nameEN: "Vegetable Soup",
        nameIT: "Zuppa di Verdure",
        descriptionAL: "Supë e lehtë me perime të stinës",
        descriptionEN: "Light soup with seasonal vegetables",
        descriptionIT: "Zuppa leggera con verdure di stagione",
        ingredientsAL: "Perime të ndryshme, erëza",
        ingredientsEN: "Mixed vegetables, herbs",
        ingredientsIT: "Verdure miste, erbe",
        price: 800,
        isVegetarian: true,
        displayOrder: 3
      }
    ],
    
    "pjata-kryesore": [
      {
        nameAL: "Tavë Kosi",
        nameEN: "Baked Lamb with Yogurt",
        nameIT: "Agnello al Forno con Yogurt",
        descriptionAL: "Pjata kombëtare shqiptare me mish qengji",
        descriptionEN: "Albanian national dish with lamb",
        descriptionIT: "Piatto nazionale albanese con agnello",
        ingredientsAL: "Mish qengji, kos, oriz, vezë",
        ingredientsEN: "Lamb meat, yogurt, rice, eggs",
        ingredientsIT: "Carne di agnello, yogurt, riso, uova",
        price: 1800,
        isRecommended: true,
        displayOrder: 1
      },
      {
        nameAL: "Qofte të Fërguara",
        nameEN: "Fried Meatballs",
        nameIT: "Polpette Fritte",
        descriptionAL: "Qofte tradicionale me perime",
        descriptionEN: "Traditional meatballs with vegetables",
        descriptionIT: "Polpette tradizionali con verdure",
        ingredientsAL: "Mish i përzier, qepë, bukë",
        ingredientsEN: "Mixed meat, onions, bread",
        ingredientsIT: "Carne mista, cipolle, pane",
        price: 1400,
        displayOrder: 2
      },
      {
        nameAL: "Pilaf me Mish",
        nameEN: "Rice Pilaf with Meat",
        nameIT: "Pilaf di Riso con Carne",
        descriptionAL: "Oriz me mish dhe perime",
        descriptionEN: "Rice with meat and vegetables",
        descriptionIT: "Riso con carne e verdure",
        ingredientsAL: "Oriz, mish viçi, karota, bizele",
        ingredientsEN: "Rice, beef, carrots, peas",
        ingredientsIT: "Riso, manzo, carote, piselli",
        price: 1600,
        displayOrder: 3
      },
      {
        nameAL: "Mish Koke në Tigan",
        nameEN: "Pan-fried Head Meat",
        nameIT: "Carne di Testa in Padella",
        descriptionAL: "Mish koke i pjekur në tigan me perime",
        descriptionEN: "Head meat fried in pan with vegetables",
        descriptionIT: "Carne di testa fritta in padella con verdure",
        ingredientsAL: "Mish koke, patate, spec, domate",
        ingredientsEN: "Head meat, potatoes, peppers, tomatoes",
        ingredientsIT: "Carne di testa, patate, peperoni, pomodori",
        price: 2000,
        displayOrder: 4
      }
    ]
  }
};

async function seedMenu() {
  try {
    console.log('🌱 Starting menu seeding...');
    
    // Create categories
    const createdCategories = {};
    for (const categoryData of menuData.categories) {
      console.log(`📁 Creating category: ${categoryData.nameAL}`);
      const category = await prisma.menuCategory.create({
        data: categoryData
      });
      createdCategories[categoryData.slug] = category;
    }
    
    // Create menu items
    for (const [categorySlug, items] of Object.entries(menuData.items)) {
      const category = createdCategories[categorySlug];
      if (!category) {
        console.log(`⚠️  Category not found for slug: ${categorySlug}`);
        continue;
      }
      
      console.log(`📋 Creating ${items.length} items for category: ${category.nameAL}`);
      
      for (const itemData of items) {
        await prisma.menuItem.create({
          data: {
            ...itemData,
            categoryId: category.id
          }
        });
        console.log(`   ✅ Created: ${itemData.nameAL}`);
      }
    }
    
    console.log('🎉 Menu seeding completed successfully!');
    
    // Display summary
    const categoriesCount = await prisma.menuCategory.count();
    const itemsCount = await prisma.menuItem.count();
    
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categoriesCount}`);
    console.log(`   Menu Items: ${itemsCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding menu:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedMenu().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { seedMenu }; 