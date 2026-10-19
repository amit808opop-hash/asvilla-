import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Hotel,
  Room,
  Booking,
  Payment,
  Review,
  ContactMessage,
  Offer,
  HotelOwner,
  EmailNotification,
} from './types';

// Storage file location: use /tmp on serverless platforms (e.g. Vercel) where root is read-only
const DATA_DIR = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  ? path.join('/tmp', '.data')
  : path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'asvilla_db.json');

export interface DatabaseSchema {
  users: User[];
  hotels: Hotel[];
  rooms: Room[];
  bookings: Booking[];
  payments: Payment[];
  reviews: Review[];
  contactMessages: ContactMessage[];
  offers: Offer[];
  notifications?: EmailNotification[];
}

export const HOTEL_OWNERS: Record<string, HotelOwner> = {
  htl_varanasi_01: {
    name: 'Pandit Shailendra Nath Mishra',
    role: 'Heritage Custodian & Resident Palace Host',
    phone: '+91 98390 41285',
    deskPhone: '+91 542 245 1010',
    email: 'host.brijrama@asvilla.com',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    languages: ['Hindi', 'English', 'Sanskrit', 'Bhojpuri'],
    experienceYears: 22,
    checkInInstructions: 'Private royal Bajra boat will await you at Rajghat or Assi Ghat jetty with liveried luggage porters. Classical sitar welcome and royal saffron thandai served upon arrival at Darbhanga Ghat.',
  },
  htl_jaipur_02: {
    name: 'Kunwar Ranvijay Singh Rathore',
    role: 'Estate Director & Royal Rajput Host',
    phone: '+91 98290 88214',
    deskPhone: '+91 141 268 0101',
    email: 'director.rajvilas@asvilla.com',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Hindi', 'Rajasthani', 'French'],
    experienceYears: 19,
    checkInInstructions: 'Arrive via the grand fort gateway. Valet chauffeur service is complimentary. Our courtyard concierge will greet you with a fragrant marigold garland, traditional aarti, and sandalwood tikka ceremony.',
  },
  htl_goa_03: {
    name: 'Maria Clarissa Fernandez',
    role: 'Managing Villa Owner & Coastal Experience Lead',
    phone: '+91 98221 75390',
    deskPhone: '+91 832 277 4000',
    email: 'maria.capella@asvilla.com',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Portuguese', 'Konkani', 'Hindi'],
    experienceYears: 14,
    checkInInstructions: 'Drive directly up the private cliffside lane to Villa Capella gates. Direct keyless or host check-in is available. Chilled tender coconut water and Portuguese fado music await your private poolside arrival.',
  },
  htl_delhi_04: {
    name: 'Vikramaditya Oberoi Sen',
    role: 'Executive General Manager',
    phone: '+91 98110 56230',
    deskPhone: '+91 11 2334 1234',
    email: 'gm.imperial@asvilla.com',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Hindi', 'German'],
    experienceYears: 24,
    checkInInstructions: "Pull up to the Royal Portico under the imperial palm drive. Our Chief Clefs d'Or Concierge coordinates instant VIP escort straight to your heritage suite with priority registration in your salon.",
  },
  htl_mumbai_05: {
    name: 'Farokh J. Cama',
    role: 'Palace Resident Manager & Master Concierge',
    phone: '+91 98200 44192',
    deskPhone: '+91 22 6665 3366',
    email: 'manager.marinebay@asvilla.com',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Hindi', 'Gujarati', 'Marathi'],
    experienceYears: 26,
    checkInInstructions: 'Valet greets you at the historic sea-facing driveway opposite Gateway of India. Personal butler introduces you to sea-view suite amenities and schedules your evening sunset tea.',
  },
  htl_agra_06: {
    name: 'Aditya Pratap Shekhawat',
    role: 'General Manager & Taj Heritage Liaison',
    phone: '+91 98370 29481',
    deskPhone: '+91 562 223 1515',
    email: 'gm.amarvilas@asvilla.com',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Hindi', 'Urdu', 'Italian'],
    experienceYears: 17,
    checkInInstructions: 'Private battery-operated golf buggies escort guests from security gates directly to the Mughal terrace. Unobstructed Taj Mahal view binoculars and champagne flutes provided upon entering your private balcony.',
  },
  htl_manali_07: {
    name: 'Captain Tenzing Dorjee Thakur',
    role: 'Chalet Owner & Alpine Expedition Guide',
    phone: '+91 98160 37190',
    deskPhone: '+91 1902 253 200',
    email: 'host.himalayan@asvilla.com',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Hindi', 'Pahari', 'Tibetan'],
    experienceYears: 16,
    checkInInstructions: '4x4 snow-assist vehicles meet you in Old Manali. The fireplace is pre-lit with aromatic cedar logs, and hot spiced Kashmiri Kahwa tea is served at check-in.',
  },
  htl_bengaluru_08: {
    name: 'Rohini Devaraj Urs',
    role: 'Director of Hospitality & Guest Relations',
    phone: '+91 98450 62819',
    deskPhone: '+91 80 2521 1234',
    email: 'director.gardenpalace@asvilla.com',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Kannada', 'Tamil', 'Hindi'],
    experienceYears: 18,
    checkInInstructions: 'Arrive at the grand Mysore-domed reception. Executive Club guests enjoy express check-in on the 6th floor Royal Club lounge with complimentary high tea and botanical garden vistas.',
  },
};

let dbCache: DatabaseSchema | null = null;

// Initial high-quality luxury seed data
async function createInitialData(): Promise<DatabaseSchema> {
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordGuest = await bcrypt.hash('guest123', 10);

  const adminUser: User = {
    _id: 'usr_admin_001',
    name: 'Asvilla Concierge Admin',
    email: 'admin@asvilla.com',
    phone: '+91 98765 43210',
    passwordHash: hashedPasswordAdmin,
    role: 'admin',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  };

  const guestUser: User = {
    _id: 'usr_guest_001',
    name: 'Aarav Sharma',
    email: 'guest@asvilla.com',
    phone: '+91 98123 45678',
    passwordHash: hashedPasswordGuest,
    role: 'user',
    createdAt: new Date('2026-01-10').toISOString(),
    updatedAt: new Date('2026-01-10').toISOString(),
  };

  const hotels: Hotel[] = [
    {
      _id: 'htl_varanasi_01',
      name: 'Brijrama Heritage Palace',
      slug: 'brijrama-heritage-palace-varanasi',
      tagline: '18th-century riverside palace overlooking Darbhanga Ghat',
      description: 'One of the oldest landmarks on the sacred riverfront of Varanasi, Brijrama Palace is an architectural marvel built in 1812 by the Royal House of Nagpur. Accessible exclusively by private riverboat, this heritage sanctuary offers hand-carved sandstone corridors, classical sitar recitals at twilight, royal dining at Darbhanga, and unparalleled sunrise views over the holy Ganga.',
      address: 'Darbhanga Ghat, Dashashwamedh',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      country: 'India',
      pincode: '221001',
      latitude: 25.3045,
      longitude: 83.0112,
      coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Private Boat Transfer', 'Ghat Ganga View', 'Ayurvedic Wellness Spa', 'Heritage Dining', '24/7 Butler Service', 'Complimentary High-speed WiFi', 'Evening Cultural Concerts'],
      starRating: 5,
      guestRating: 4.9,
      reviewCount: 248,
      featured: true,
      published: true,
      priceStartingFrom: 18500,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Non-refundable thereafter.',
      petFriendly: false,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'htl_jaipur_02',
      name: 'The Rajvilas Oberoi Resort',
      slug: 'the-rajvilas-oberoi-resort-jaipur',
      tagline: 'Fort-style royal sanctuary spread across 32 acres of lush gardens',
      description: 'Built in the regal architectural idiom of traditional Rajasthan, The Rajvilas features Mughal pavilions, reflection pools, and manicured courtyards. Experience authentic pink sandstone architecture, private plunge pools, royal archery, and decadent Rajasthani thalis prepared by royal master chefs.',
      address: 'Goner Road, Babaji Ka Modh',
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      pincode: '302031',
      latitude: 26.8572,
      longitude: 75.8924,
      coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Private Plunge Pools', 'Royal Spa', 'Tennis Courts', 'Fine Dining Pavilions', 'Airport Chauffeur', 'Valet Parking', 'Kids Activity Club'],
      starRating: 5,
      guestRating: 4.95,
      reviewCount: 312,
      featured: true,
      published: true,
      priceStartingFrom: 29000,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 72 hours before check-in.',
      petFriendly: false,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'htl_goa_03',
      name: 'Villa Capella Azure Bay',
      slug: 'villa-capella-azure-bay-goa',
      tagline: 'Private cliffside luxury villas overlooking the Arabian Sea',
      description: 'Perched on the serene cliffs of North Goa, Villa Capella Azure Bay blends Portuguese colonial elegance with barefoot tropical luxury. Floor-to-ceiling glass reveals uninterrupted ocean sunsets, infinity lap pools, personalized mixologist cocktails, and direct beach access.',
      address: 'Cavelossim Beach Road, Aguada Bay',
      city: 'Goa',
      state: 'Goa',
      country: 'India',
      pincode: '403515',
      latitude: 15.4989,
      longitude: 73.7692,
      coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Oceanfront Infinity Pool', 'Direct Private Beach', 'Sunset Lounge Bar', 'Water Sports Desk', 'Seafood Grill', 'Spa & Yoga Pavilion'],
      starRating: 5,
      guestRating: 4.85,
      reviewCount: 194,
      featured: true,
      published: true,
      priceStartingFrom: 16500,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Free cancellation up to 5 days prior to arrival.',
      petFriendly: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'htl_delhi_04',
      name: 'The Imperial Lutyens',
      slug: 'the-imperial-lutyens-delhi',
      tagline: 'Iconic art deco heritage grand hotel in the heart of the capital',
      description: 'An oasis of calm amidst the vibrant energy of New Delhi, The Imperial showcases world-class colonial charm, sprawling royal palm gardens, award-winning restaurants including 1911 and Spice Route, and a museum-quality art collection spanning the British Raj.',
      address: 'Janpath, Connaught Place',
      city: 'Delhi',
      state: 'Delhi NCR',
      country: 'India',
      pincode: '110001',
      latitude: 28.6219,
      longitude: 77.2183,
      coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Historic Art Gallery', 'Heated Outdoor Pool', 'Imperial Spa', '7 Gourmet Restaurants', 'Executive Business Club', 'Airport Limousine'],
      starRating: 5,
      guestRating: 4.88,
      reviewCount: 420,
      featured: true,
      published: true,
      priceStartingFrom: 14500,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
      petFriendly: false,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'htl_mumbai_05',
      name: 'The Marine Bay Palace',
      slug: 'the-marine-bay-palace-mumbai',
      tagline: 'Stately waterfront elegance overlooking Marine Drive & Queen\'s Necklace',
      description: 'Standing proudly along the Arabian Sea waterfront in South Mumbai, The Marine Bay Palace commands breathtaking ocean vistas. With legendary hospitality, Michelin-calibre dining, and lavish suites, it represents Mumbai luxury at its finest.',
      address: 'Apollo Bunder, Colaba',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      latitude: 18.9220,
      longitude: 72.8347,
      coverImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Sea View Rooms', 'Harbor Cruise Charters', 'Rooftop Bar', 'High Tea Lounge', 'Luxury Wellness Club', '24hr Concierge'],
      starRating: 5,
      guestRating: 4.92,
      reviewCount: 512,
      featured: true,
      published: true,
      priceStartingFrom: 22000,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 48 hours prior to arrival.',
      petFriendly: false,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'htl_agra_06',
      name: 'Amarvilas Taj Estate',
      slug: 'amarvilas-taj-estate-agra',
      tagline: 'Uninterrupted private balconies facing the majestic Taj Mahal',
      description: 'Located just 600 meters from the Taj Mahal, every single guest room and villa at Amarvilas offers unobstructed views of the world wonder. Inspired by Moorish and Mughal architecture, with cascading fountains, terraced lawns, and royal pavilions.',
      address: 'Taj East Gate Road, Tajganj',
      city: 'Agra',
      state: 'Uttar Pradesh',
      country: 'India',
      pincode: '282001',
      latitude: 27.1691,
      longitude: 78.0494,
      coverImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Taj Mahal View Balconies', 'Private Golf Cart Transfers', 'Mughal Spa', 'Poolside Dinners', 'Classical Sitar Music', 'Artisan Boutique'],
      starRating: 5,
      guestRating: 4.96,
      reviewCount: 380,
      featured: true,
      published: true,
      priceStartingFrom: 34000,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 72 hours before check-in.',
      petFriendly: false,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'htl_manali_07',
      name: 'The Himalayan Cedar Chalet',
      slug: 'the-himalayan-cedar-chalet-manali',
      tagline: 'Gothic castle and cedar timber chalets amidst snow-capped peaks',
      description: 'Set at 2,000 meters elevation amidst apple orchards and towering deodar cedars, this European-style stone castle retreat offers wood-burning fireplaces, panoramic Pir Panjal mountain panoramas, heated alpine pool, and guided valley expeditions.',
      address: 'Hadimba Road, Log Huts Area',
      city: 'Manali',
      state: 'Himachal Pradesh',
      country: 'India',
      pincode: '175131',
      latitude: 32.2432,
      longitude: 77.1892,
      coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Snow Peak Views', 'Wood Fireplaces', 'Heated Outdoor Pool', 'Orchard Walks', 'Himalayan Herbal Spa', 'Mountain Biking'],
      starRating: 4,
      guestRating: 4.82,
      reviewCount: 165,
      featured: false,
      published: true,
      priceStartingFrom: 11500,
      checkInTime: '13:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
      petFriendly: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'htl_bengaluru_08',
      name: 'The Leela Garden Palace',
      slug: 'the-leela-garden-palace-bengaluru',
      tagline: 'Artisanal grand palace surrounded by nine acres of tropical gardens',
      description: 'Drawing architectural grandeur from the royal Mysore Palace, The Leela Bengaluru is adorned with copper domes, ornate arches, gold leaf ceilings, and ornate crystal chandeliers, combining modern silicon city convenience with majestic heritage warmth.',
      address: 'Old Airport Road, Kodihalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560008',
      latitude: 12.9606,
      longitude: 77.6484,
      coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Lush Tropical Gardens', 'Olympic-size Swimming Pool', 'Royal Spa by ESPA', 'Citrus & Zen Restaurants', 'Executive Heli-pad Transfers', 'High-Speed Business Centre'],
      starRating: 5,
      guestRating: 4.89,
      reviewCount: 290,
      featured: false,
      published: true,
      priceStartingFrom: 15500,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
      petFriendly: false,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    }
  ];

  // Rooms for each hotel
  const rooms: Room[] = [
    // Varanasi Hotel Rooms
    {
      _id: 'rm_varanasi_01',
      hotelId: 'htl_varanasi_01',
      roomType: 'Maharaja Ghat View Suite',
      slug: 'maharaja-ghat-view-suite',
      description: 'Expansive royal suite with antique jharokha balcony directly overlooking the sacred Ganga. Hand-painted fresco ceilings and Carrara marble ensuite.',
      pricePerNight: 28500,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 4,
      bedType: 'Royal King Bed',
      sizeSqFt: 680,
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Private Balcony', 'River View', 'Bathtub', 'Butler Service', 'Espresso Machine', 'Pillow Menu'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'rm_varanasi_02',
      hotelId: 'htl_varanasi_01',
      roomType: 'Heritage Courtyard Room',
      slug: 'heritage-courtyard-room',
      description: 'Warm sandstone chamber featuring traditional brass detailing, handcrafted silk furnishings, and serene inner courtyard views.',
      pricePerNight: 18500,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 8,
      bedType: 'Queen Bed',
      sizeSqFt: 450,
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Courtyard View', 'Rain Shower', 'Complimentary Mini-bar', 'High-Speed WiFi', 'Tea Selection'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },

    // Jaipur Rooms
    {
      _id: 'rm_jaipur_01',
      hotelId: 'htl_jaipur_02',
      roomType: 'Royal Tent with Private Garden',
      slug: 'royal-tent-private-garden',
      description: 'Luxury air-conditioned canopied pavilion with embroidered Mughal draperies, teakwood floors, and private walled garden courtyard.',
      pricePerNight: 39000,
      capacity: { adults: 2, children: 2, total: 4 },
      totalRooms: 6,
      bedType: 'Four-Poster King Bed',
      sizeSqFt: 750,
      images: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Private Garden', 'Freestanding Clawfoot Tub', 'Outdoor Daybed', 'Butler Service', 'Welcome Champagne'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'rm_jaipur_02',
      hotelId: 'htl_jaipur_02',
      roomType: 'Premier Fort View Room',
      slug: 'premier-fort-view-room',
      description: 'Spacious sandstone retreat with sunken marble bath overlooking traditional lily ponds and flaming mashaal torches.',
      pricePerNight: 29000,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 10,
      bedType: 'King Bed',
      sizeSqFt: 520,
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Sunken Marble Bath', 'Reflection Pool View', 'Personal Bar', 'Sound System', 'Silk Bathrobes'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },

    // Goa Rooms
    {
      _id: 'rm_goa_01',
      hotelId: 'htl_goa_03',
      roomType: 'Cliffside Oceanfront Villa',
      slug: 'cliffside-oceanfront-villa',
      description: 'Private 1-bedroom villa with cantilevered sundeck, plunge pool, and floor-to-ceiling vistas of the azure Arabian Sea waves.',
      pricePerNight: 26000,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 5,
      bedType: 'Super King Bed',
      sizeSqFt: 920,
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Private Plunge Pool', 'Direct Ocean Panorama', 'Sun Loungers', 'Wine Cellarette', 'Open-air Rain Shower'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'rm_goa_02',
      hotelId: 'htl_goa_03',
      roomType: 'Portuguese Garden Chalet',
      slug: 'portuguese-garden-chalet',
      description: 'Artisanal Portuguese villa suite with terracotta tiled roof, hammock veranda, and tropical bougainvillea garden surroundings.',
      pricePerNight: 16500,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 8,
      bedType: 'Queen Bed',
      sizeSqFt: 480,
      images: [
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Private Veranda', 'Garden View', 'Hammock', 'Smart TV', 'Beach Bag & Towels'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },

    // Delhi Rooms
    {
      _id: 'rm_delhi_01',
      hotelId: 'htl_delhi_04',
      roomType: 'Lutyens Heritage Suite',
      slug: 'lutyens-heritage-suite',
      description: 'Grand suite showcasing original colonial art pieces, high ceilings, separate drawing room, and dining lounge.',
      pricePerNight: 25000,
      capacity: { adults: 3, children: 1, total: 4 },
      totalRooms: 6,
      bedType: 'King Bed',
      sizeSqFt: 850,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Art Deco Salon', 'Walk-in Wardrobe', 'Marble Bathroom', 'Executive Lounge Access', 'Complimentary Breakfast'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'rm_delhi_02',
      hotelId: 'htl_delhi_04',
      roomType: 'Heritage Deluxe Room',
      slug: 'heritage-deluxe-room',
      description: 'Classic art-deco appointed room with mahogany writing desk, Italian marble bathroom, and garden outlook.',
      pricePerNight: 14500,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 12,
      bedType: 'King or Twin Beds',
      sizeSqFt: 460,
      images: [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Garden View', 'Work Desk', 'Marble Bath', 'Premium Linens', 'Coffee Maker'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },

    // Mumbai Rooms
    {
      _id: 'rm_mumbai_01',
      hotelId: 'htl_mumbai_05',
      roomType: 'Grand Harbour Oceanfront Suite',
      slug: 'grand-harbour-oceanfront-suite',
      description: 'Panoramic corner suite framing the Gateway of India and Arabian Sea yachts. Italian marble ensuite with sea-view soaking tub.',
      pricePerNight: 36000,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 5,
      bedType: 'Presidential King Bed',
      sizeSqFt: 900,
      images: [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['180° Ocean View', 'Jacuzzi Soaking Tub', '24/7 Butler', 'Champagne on Arrival', 'Airport Mercedes Transfer'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'rm_mumbai_02',
      hotelId: 'htl_mumbai_05',
      roomType: 'Luxury City View Room',
      slug: 'luxury-city-view-room',
      description: 'Elegantly furnished luxury room with plush velvet furnishings, high-speed connectivity, and Colaba heritage views.',
      pricePerNight: 22000,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 10,
      bedType: 'King Bed',
      sizeSqFt: 480,
      images: [
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['City Skyline View', 'Workstation', 'Deep Soak Tub', 'Espresso Machine', '24h Room Dining'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },

    // Agra Rooms
    {
      _id: 'rm_agra_01',
      hotelId: 'htl_agra_06',
      roomType: 'Premier Taj View Balcony Suite',
      slug: 'premier-taj-view-balcony-suite',
      description: 'Exclusive suite featuring a private open-air terrace with an uninterrupted, front-row view of the Taj Mahal monument.',
      pricePerNight: 48000,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 4,
      bedType: 'Emperor King Bed',
      sizeSqFt: 880,
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Direct Taj Mahal View', 'Private Open Terrace', 'Telescope', 'Butler Service', 'Signature Afternoon Tea'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'rm_agra_02',
      hotelId: 'htl_agra_06',
      roomType: 'Mughal Garden Deluxe',
      slug: 'mughal-garden-deluxe',
      description: 'Opulent room with arched doorways, hand-tufted carpets, and direct views of the terraced fountains and Mughal gardens.',
      pricePerNight: 34000,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 8,
      bedType: 'King Bed',
      sizeSqFt: 510,
      images: [
        'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Garden View', 'Marble Rain Shower', 'Handcrafted Chocolates', 'High-Speed WiFi', 'Soundbar'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },

    // Manali Rooms
    {
      _id: 'rm_manali_01',
      hotelId: 'htl_manali_07',
      roomType: 'Alpine Fir Timber Chalet',
      slug: 'alpine-fir-timber-chalet',
      description: 'Two-story wooden cottage nestled in ancient apple orchards with stone fireplace, heated floorboards, and glacier mountain vistas.',
      pricePerNight: 19500,
      capacity: { adults: 4, children: 2, total: 6 },
      totalRooms: 4,
      bedType: 'King Bed + Loft Twin Beds',
      sizeSqFt: 980,
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Stone Fireplace', 'Glacier Views', 'Heated Flooring', 'Balcony Sundeck', 'Mountain Gear Kit'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'rm_manali_02',
      hotelId: 'htl_manali_07',
      roomType: 'Cedar Mountain Lodge Room',
      slug: 'cedar-mountain-lodge-room',
      description: 'Cozy timber retreat with bay window daybed overlooking snow peaks, plush duvet bedding, and warm pine interiors.',
      pricePerNight: 11500,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 8,
      bedType: 'King Bed',
      sizeSqFt: 460,
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Mountain Panorama', 'Bay Window Seating', 'Hot Chocolate Bar', 'Electric Blankets', 'Board Games'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },

    // Bengaluru Rooms
    {
      _id: 'rm_bengaluru_01',
      hotelId: 'htl_bengaluru_08',
      roomType: 'Royal Maharaja Suite',
      slug: 'royal-maharaja-suite-bengaluru',
      description: 'Palatial suite featuring Mysore-inspired brass and mother-of-pearl craftsmanship, personal dining rotunda, and spa bath.',
      pricePerNight: 28000,
      capacity: { adults: 2, children: 2, total: 4 },
      totalRooms: 5,
      bedType: 'King Bed',
      sizeSqFt: 820,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Private Dining Table', 'Pool View', 'Jacuzzi Bath', 'Club Lounge Cocktails', 'Limousine Transfer'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      _id: 'rm_bengaluru_02',
      hotelId: 'htl_bengaluru_08',
      roomType: 'Premier Garden Wing Room',
      slug: 'premier-garden-wing-room',
      description: 'Peaceful luxury sanctuary overlooking 9 acres of blooming tropical greenery, water lilies, and palms.',
      pricePerNight: 15500,
      capacity: { adults: 2, children: 1, total: 3 },
      totalRooms: 12,
      bedType: 'King or Twin Beds',
      sizeSqFt: 490,
      images: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
      ],
      amenities: ['Tropical Garden View', 'Walk-in Shower', 'Ergonomic Desk', 'High-Speed Wi-Fi', 'Artisan Coffee'],
      isAvailable: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    }
  ];

  const offers: Offer[] = [
    {
      _id: 'off_welcome20',
      code: 'ASVILLA20',
      title: 'Grand Welcome Privilege',
      description: 'Receive 20% savings on bookings over ₹25,000 across all luxury heritage suites.',
      discountPercent: 20,
      maxDiscount: 10000,
      minBookingAmount: 25000,
      validUntil: '2026-12-31',
      isActive: true,
    },
    {
      _id: 'off_palace15',
      code: 'ROYAL15',
      title: 'Royal Heritage Escapes',
      description: 'Enjoy 15% instant savings on palatial villas in Jaipur, Varanasi, and Agra.',
      discountPercent: 15,
      maxDiscount: 7500,
      minBookingAmount: 15000,
      validUntil: '2026-12-31',
      isActive: true,
    },
    {
      _id: 'off_summer10',
      code: 'COMFORT10',
      title: 'Comfort First Stays',
      description: 'Flat 10% discount on all retreats with complimentary daily champagne breakfast.',
      discountPercent: 10,
      maxDiscount: 5000,
      minBookingAmount: 10000,
      validUntil: '2026-12-31',
      isActive: true,
    }
  ];

  const reviews: Review[] = [
    {
      _id: 'rev_001',
      hotelId: 'htl_varanasi_01',
      userId: 'usr_guest_001',
      userName: 'Aarav Sharma',
      rating: 5,
      title: 'Unmatched spiritual luxury by the Ganga',
      comment: 'Arriving at Brijrama Palace on a private wooden boat at sunset was unforgettable. The flute melodies at dusk, the view of evening Ganga Aarti from our jharokha balcony, and the impeccable staff made this the finest stay of our lives.',
      createdAt: '2026-02-14T10:30:00Z',
    },
    {
      _id: 'rev_002',
      hotelId: 'htl_jaipur_02',
      userId: 'usr_guest_001',
      userName: 'Priya & Vikram Malhotra',
      rating: 5,
      title: 'True royal treatment like kings and queens',
      comment: 'The luxury tents at Rajvilas are beyond words. The attention to detail, private garden dinner under starlit skies, and warm hospitality represent the pinnacle of Indian hospitality.',
      createdAt: '2026-03-01T14:20:00Z',
    },
    {
      _id: 'rev_003',
      hotelId: 'htl_goa_03',
      userId: 'usr_guest_001',
      userName: 'Rohan Deshmukh',
      rating: 5,
      title: 'Breathtaking ocean views and serenity',
      comment: 'Far away from crowded tourist spots, Villa Capella in Goa offered peace and sheer comfort. Waking up to crashing waves and watching the sunset from the cliffside pool was magical.',
      createdAt: '2026-03-12T09:15:00Z',
    },
    {
      _id: 'rev_004',
      hotelId: 'htl_agra_06',
      userId: 'usr_guest_001',
      userName: 'Elena Rostova',
      rating: 5,
      title: 'Waking up to the Taj Mahal from our bed',
      comment: 'There is nothing in the world comparable to drinking morning tea on the balcony watching dawn illuminate the Taj Mahal dome. Worth every rupee.',
      createdAt: '2026-03-25T16:45:00Z',
    }
  ];

  const bookings: Booking[] = [
    {
      _id: 'bk_demo_001',
      bookingReference: 'ASV-2026-8921',
      userId: 'usr_guest_001',
      hotelId: 'htl_varanasi_01',
      roomId: 'rm_varanasi_01',
      guestName: 'Aarav Sharma',
      guestEmail: 'guest@asvilla.com',
      guestPhone: '+91 98123 45678',
      specialRequests: 'High floor ghat view requested; arriving via airport boat transfer at 3 PM.',
      checkIn: '2026-11-10',
      checkOut: '2026-11-13',
      numberOfGuests: 2,
      numberOfRooms: 1,
      priceBreakdown: {
        basePrice: 28500,
        nights: 3,
        rooms: 1,
        roomTotal: 85500,
        gstAmount: 10260,
        serviceFee: 1500,
        discountAmount: 10000,
        promoCode: 'ASVILLA20',
        totalAmount: 87260,
      },
      paymentStatus: 'success',
      bookingStatus: 'confirmed',
      razorpayOrderId: 'order_ASVILLA_rzp_981203',
      razorpayPaymentId: 'pay_ASVILLA_rzp_774129',
      createdAt: '2026-03-10T11:00:00Z',
      updatedAt: '2026-03-10T11:05:00Z',
    }
  ];

  const payments: Payment[] = [
    {
      _id: 'pay_demo_001',
      bookingId: 'bk_demo_001',
      bookingReference: 'ASV-2026-8921',
      userId: 'usr_guest_001',
      provider: 'razorpay',
      providerOrderId: 'order_ASVILLA_rzp_981203',
      providerPaymentId: 'pay_ASVILLA_rzp_774129',
      providerSignature: 'sig_mock_verified_hmac_9921827419',
      amount: 87260,
      amountInPaise: 8726000,
      currency: 'INR',
      status: 'captured',
      method: 'Razorpay UPI (Verified)',
      verifiedAt: '2026-03-10T11:05:00Z',
      createdAt: '2026-03-10T11:04:00Z',
    }
  ];

  const contactMessages: ContactMessage[] = [
    {
      _id: 'msg_001',
      name: 'Sunita Kapoor',
      email: 'sunita.k@example.com',
      phone: '+91 98200 11223',
      subject: 'Palace wedding inquiry for December 2026',
      message: 'We are planning an intimate 50-guest destination wedding in Jaipur and would love to check full estate reservation rates.',
      status: 'in_review',
      createdAt: '2026-03-18T14:10:00Z',
    }
  ];

  return {
    users: [adminUser, guestUser],
    hotels,
    rooms,
    bookings,
    payments,
    reviews,
    contactMessages,
    offers,
  };
}

export async function getDb(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      if (dbCache) {
        if (!dbCache.notifications) {
          dbCache.notifications = [];
        }
        let updated = false;
        dbCache.hotels.forEach(h => {
          if (!h.owner && HOTEL_OWNERS[h._id]) {
            h.owner = HOTEL_OWNERS[h._id];
            updated = true;
          }
        });
        if (updated) {
          saveDb(dbCache);
        }
        return dbCache;
      }
    }
  } catch (err) {
    console.error('Error reading database file, re-initializing seed data:', err);
  }

  // Create initial seed
  dbCache = await createInitialData();
  // Ensure seed has owners
  dbCache.hotels.forEach(h => {
    if (!h.owner && HOTEL_OWNERS[h._id]) {
      h.owner = HOTEL_OWNERS[h._id];
    }
  });
  saveDb(dbCache);
  return dbCache;
}

export function saveDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    dbCache = data;
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Utility: Check room availability for date range
export async function checkRoomAvailability(
  roomId: string,
  checkIn: string,
  checkOut: string,
  requestedRooms: number = 1
): Promise<{ available: boolean; totalRooms: number; bookedRooms: number; remainingRooms: number }> {
  const db = await getDb();
  const room = db.rooms.find(r => r._id === roomId);
  if (!room) {
    return { available: false, totalRooms: 0, bookedRooms: 0, remainingRooms: 0 };
  }

  const requestedStart = new Date(checkIn).getTime();
  const requestedEnd = new Date(checkOut).getTime();

  // Find all active bookings for this room that overlap with the date range
  const overlappingBookings = db.bookings.filter(b => {
    if (b.roomId !== roomId) return false;
    if (b.bookingStatus === 'cancelled') return false;

    const bStart = new Date(b.checkIn).getTime();
    const bEnd = new Date(b.checkOut).getTime();

    // Check overlap: start < bEnd and end > bStart
    return requestedStart < bEnd && requestedEnd > bStart;
  });

  const bookedRooms = overlappingBookings.reduce((sum, b) => sum + b.numberOfRooms, 0);
  const remainingRooms = Math.max(0, room.totalRooms - bookedRooms);

  return {
    available: remainingRooms >= requestedRooms,
    totalRooms: room.totalRooms,
    bookedRooms,
    remainingRooms,
  };
}
