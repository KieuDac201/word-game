import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
  if (match) databaseUrl = match[1];
}

if (!databaseUrl) {
  console.error('No DATABASE_URL found in .env.local or process.env');
  process.exit(1);
}

const sql = neon(databaseUrl);

export const newCategories = [
  {
    slug: 'science',
    label: 'Science & Cosmos',
    icon: '🔬',
    description: 'Astronomy, quantum physics, and biology',
    display_order: 5,
  },
  {
    slug: 'cinema',
    label: 'Cinema & Movies',
    icon: '🎬',
    description: 'Iconic movie lines, cinema culture, and Hollywood lore',
    display_order: 6,
  },
  {
    slug: 'philosophy',
    label: 'Philosophy & Wisdom',
    icon: '🏛️',
    description: 'Stoicism, existentialism, and timeless meditations',
    display_order: 7,
  },
  {
    slug: 'literature',
    label: 'Classic Literature',
    icon: '📚',
    description: 'Timeless opening lines and prose from masterworks',
    display_order: 8,
  },
  {
    slug: 'nature',
    label: 'Nature & Wildlife',
    icon: '🌲',
    description: 'Oceans, forests, animal kingdoms, and wilderness',
    display_order: 9,
  },
  {
    slug: 'history',
    label: 'World History',
    icon: '🏺',
    description: 'Ancient civilizations, revolutions, and pivotal eras',
    display_order: 10,
  },
  {
    slug: 'gaming',
    label: 'Video Games',
    icon: '🎮',
    description: 'Legendary gaming quotes, arcade culture, and gamer lore',
    display_order: 11,
  },
  {
    slug: 'cybersecurity',
    label: 'Cybersecurity & Infosec',
    icon: '🛡️',
    description: 'Cryptography, firewalls, threat intel, and hacking',
    display_order: 12,
  },
  {
    slug: 'culinary',
    label: 'Culinary Arts',
    icon: '🍳',
    description: 'Gourmet cooking, Michelin kitchens, and savory dishes',
    display_order: 13,
  },
  {
    slug: 'music',
    label: 'Music & Sound',
    icon: '🎵',
    description: 'Rhythms, harmonies, symphonies, and studio craft',
    display_order: 14,
  },
  {
    slug: 'space',
    label: 'Space Exploration',
    icon: '🚀',
    description: 'Rockets, Mars missions, lunar landers, and orbiters',
    display_order: 15,
  },
  {
    slug: 'business',
    label: 'Business & Startups',
    icon: '💼',
    description: 'Venture capital, pitch decks, and market strategy',
    display_order: 16,
  },
  {
    slug: 'mythology',
    label: 'Mythology & Legends',
    icon: '⚡',
    description: 'Olympian gods, Norse sagas, and mythical monsters',
    display_order: 17,
  },
  {
    slug: 'sports',
    label: 'Sports & Athletics',
    icon: '🏆',
    description: 'Championship glory, marathon grit, and athletic drive',
    display_order: 18,
  },
  {
    slug: 'travel',
    label: 'Travel & Wanderlust',
    icon: '✈️',
    description: 'Global expeditions, scenic cities, and passports',
    display_order: 19,
  },
  {
    slug: 'poetry',
    label: 'Poetry & Verse',
    icon: '🖋️',
    description: 'Lyrical rhymes, romantic sonnets, and spoken words',
    display_order: 20,
  },
  {
    slug: 'ai',
    label: 'Artificial Intelligence',
    icon: '🤖',
    description: 'Neural networks, autonomous agents, and synthetic minds',
    display_order: 21,
  },
  {
    slug: 'architecture',
    label: 'Architecture & Design',
    icon: '📐',
    description: 'Skyscrapers, brutalism, Bauhaus, and spatial harmony',
    display_order: 22,
  },
  {
    slug: 'finance',
    label: 'Finance & Economics',
    icon: '📈',
    description: 'Capital markets, compound interest, and asset wealth',
    display_order: 23,
  },
  {
    slug: 'wellness',
    label: 'Mindfulness & Health',
    icon: '🧘',
    description: 'Daily meditation, breathwork, and mental serenity',
    display_order: 24,
  },
];

export const newSentencesData = {
  // 1. Science & Cosmos
  science: [
    // Easy (3-5 words)
    'Gravity pulls objects downward',
    'Light travels extremely fast',
    'Cells divide to reproduce',
    'Atoms form all matter',
    'Stars burn bright hydrogen',
    'Energy cannot be destroyed',
    // Normal (6-10 words)
    'Photosynthesis converts sunlight into chemical energy for plants',
    'DNA carries genetic instructions for all living organisms',
    'Black holes possess gravitational pulls that trap light',
    'The speed of sound depends on the medium',
    'Quantum particles can exist in multiple states simultaneously',
    'Plate tectonics shape the continents of our planet',
    // Hard (11-18 words)
    'Every action has an equal and opposite reaction throughout the entire universe',
    'The expansion of the cosmos accelerates due to the mysterious pressure of dark energy',
    'General relativity demonstrates that massive celestial objects warp the fabric of spacetime',
    'Mitochondria generate adenosine triphosphate through complex chemical reactions inside human cells',
    'Radioactive decay provides a reliable clock for determining the age of ancient rocks',
  ],

  // 2. Cinema & Movies
  cinema: [
    // Easy (3-5 words)
    'May the force assist',
    'Here is looking kid',
    'Lights camera and action',
    'Cinema captures human dreams',
    'Popcorn at the movies',
    'Cut print that take',
    // Normal (6-10 words)
    'There is no place like home after a storm',
    'I am going to make him an irresistible offer',
    'Fasten your seatbelts it is going to be bumpy',
    'Keep your friends close and your enemies even closer',
    'You cannot handle the unvarnished truth about reality',
    'Cinema allows audiences to experience thousand lives in darkness',
    // Hard (11-18 words)
    'Frankly my dear I do not give a damn about yesterday troubles or regrets',
    'To infinity and beyond became the eternal motto of dreamers across all generations',
    'A classic film reveals fresh emotional depths every single time you choose to rewatch',
    'Cinematography balances lighting shadows and composition to create unforgettable visual emotional experiences',
    'Great directors orchestrate actors sound and camera motion into a singular artistic vision',
  ],

  // 3. Philosophy & Wisdom
  philosophy: [
    // Easy (3-5 words)
    'I think therefore exist',
    'Know yourself deeply first',
    'Virtue is its reward',
    'Time heals all wounds',
    'Silence is often golden',
    'Seek wisdom not riches',
    // Normal (6-10 words)
    'We suffer more in imagination than in reality',
    'The unexamined life is truly not worth living',
    'Waste no more time arguing what a good person should be',
    'Happiness depends upon the quality of your thoughts',
    'You have power over your mind not outside events',
    'He who has a why can bear almost any how',
    // Hard (11-18 words)
    'Man is condemned to be free because once thrown into the world he is responsible',
    'The only true wisdom is in knowing you know absolutely nothing about the cosmos',
    'When you arise in the morning think of what a precious privilege it is to live',
    'Do not explain your philosophy rather embody its core virtues in your daily actions',
    'He who overcomes his desires is braver than him who conquers his formidable enemies',
  ],

  // 4. Classic Literature
  literature: [
    // Easy (3-5 words)
    'Call me Ishmael today',
    'Winter came to stay',
    'Words hold great magic',
    'Books unlock ancient minds',
    'The great story begins',
    'Read between the lines',
    // Normal (6-10 words)
    'It was the best and worst of times',
    'All happy families resemble one another in joy',
    'Not all those who wander are truly lost',
    'Whatever our souls are made of theirs are alike',
    'In a hole in the ground lived a quiet hobbit',
    'There is some good in this world worth fighting for',
    // Hard (11-18 words)
    'It is a truth universally acknowledged that a single man in possession of fortune must want',
    'So we beat on boats against the current borne back ceaselessly into the romantic past',
    'The only way out of the labyrinth of human suffering is to choose forgiveness over malice',
    'All that is gold does not glitter and not all those who wander are aimlessly lost',
    'Beware for I am fearless and therefore extraordinarily powerful in my dark revenge',
  ],

  // 5. Nature & Wildlife
  nature: [
    // Easy (3-5 words)
    'Wolves howl at moon',
    'Rivers carve deep canyons',
    'Leaves turn amber gold',
    'Eagles soar over peaks',
    'Whales breach ocean waves',
    'Rain falls on moss',
    // Normal (6-10 words)
    'The coral reef shelters thousands of colorful marine creatures',
    'Redwood trees survive centuries by weaving roots together',
    'Monarch butterflies migrate thousands of miles every autumn',
    'Alpine flowers bloom resiliently upon steep frozen rock',
    'Lightning illuminates dark towering thunderclouds during midnight storms',
    'Fresh morning dew glistens across green spider webs',
    // Hard (11-18 words)
    'Look deep into nature and then you will understand everything much better and clearer',
    'The clearest way into the universe is through a forest wilderness untouched by human hands',
    'In every walk with nature one receives far more than he ever sought to discover',
    'Ancient glaciers slowly carve majestic valleys as they grind quietly against continental bedrock',
    'A solitary wolf tracks prey through dense snow covered pine forests beneath the northern aurora',
  ],

  // 6. World History
  history: [
    // Easy (3-5 words)
    'Empires rise and fall',
    'History repeats its lessons',
    'Monuments withstand the centuries',
    'Ancient scrolls hold secrets',
    'Kings ruled ancient realms',
    'Peace demands vigilance always',
    // Normal (6-10 words)
    'The silk road connected civilizations across vast continents',
    'The invention of the printing press revolutionized human knowledge',
    'Roman aqueducts supplied clean water across entire provinces',
    'The renaissance ignited explosions of European artistic brilliance',
    'Discovery of bronze marked a giant leap forward',
    'Revolutions reshape political landscapes across generations of struggle',
    // Hard (11-18 words)
    'Those who cannot remember the past are condemned to repeat its tragic mistakes forever',
    'The construction of the great pyramids remains a testament to human engineering and relentless ambition',
    'Treaties signed in palace halls often determined the fates of millions across distant lands',
    'Ancient libraries preserved precious manuscripts through ages of political turmoil and dark fires',
    'Archeologists unearth forgotten pottery shards that tell stories of everyday life millenniums ago',
  ],

  // 7. Video Games
  gaming: [
    // Easy (3-5 words)
    'Press start to play',
    'The cake is lie',
    'Stay awhile and listen',
    'Victory royale secured today',
    'Insert coin to continue',
    'Save points prevent loss',
    // Normal (6-10 words)
    'It is dangerous to go alone take this sword',
    'War never changes across ruined post apocalyptic wastelands',
    'Praise the sun during dark and punishing boss battles',
    'A hero need not speak when deeds shake world',
    'Your princess is unfortunately in another distant castle',
    'Stealth gameplay rewards patient scouts and quiet shadows',
    // Hard (11-18 words)
    'Did I ever tell you what the definition of insanity is in modern video games',
    'Stand in the ashes of a trillion dead souls and ask the ghosts if honor matters',
    'Protocol three protect the pilot became the most heartbreaking line in modern mech history',
    'Speedrunners dissect game physics down to individual frames to achieve unbelievable world record times',
    'Exploring sprawling fantasy maps with friends creates unforgettable memories that outlast the campaign',
  ],

  // 8. Cybersecurity & Infosec
  cybersecurity: [
    // Easy (3-5 words)
    'Always use strong passwords',
    'Patch vulnerabilities right away',
    'Verify before you trust',
    'Firewalls block malicious traffic',
    'Encrypt your sensitive data',
    'Phishing links trick users',
    // Normal (6-10 words)
    'Two factor authentication dramatically reduces account takeover risks',
    'Zero day exploits target flaws before developers create patches',
    'Ransomware encrypts critical files until victims pay attackers',
    'Public wireless networks require encrypted virtual private tunnels',
    'Security is a continuous process not a finished product',
    'Buffer overflow vulnerabilities allow arbitrary remote code execution',
    // Hard (11-18 words)
    'Defense in depth combines multiple defensive layers so single failures do not compromise infrastructure',
    'End to end encryption ensures that only communicating users can read exchanged private messages',
    'Social engineering attacks exploit human psychology rather than software vulnerabilities to breach company defenses',
    'Penetration testers simulate adversary techniques to discover critical vulnerabilities before malicious hackers do',
    'Hardware security keys provide phishing resistant multi factor authentication for high value administrative credentials',
  ],

  // 9. Culinary Arts
  culinary: [
    // Easy (3-5 words)
    'Season food with love',
    'Bake bread until golden',
    'Sharp knives prevent accidents',
    'Simmer soup on low',
    'Fresh herbs elevate taste',
    'Taste dishes while cooking',
    // Normal (6-10 words)
    'The secret to crispy pastry is keeping butter cold',
    'Caramelizing onions requires gentle heat and steady patience',
    'A pinch of sea salt balances bitter dark chocolate',
    'Proper knife technique speeds up kitchen preparation remarkably',
    'Cast iron skillets retain heat for perfect steak sears',
    'Fresh sourdough relies on wild yeast and slow fermentation',
    // Hard (11-18 words)
    'Cooking is an art while baking is an exact chemical science requiring precise measurements',
    'Mastering the five French mother sauces unlocks the foundation for thousands of classic gourmet dishes',
    'Freshly ground whole spices toasted in brown butter release vibrant aromatic oils that transform sauces',
    'A chef sharpens knives daily because clean cuts preserve the texture and moisture of ingredients',
    'The aroma of simmering garlic rosemary and olive oil fills the kitchen with warmth',
  ],

  // 10. Music & Sound
  music: [
    // Easy (3-5 words)
    'Music speaks to soul',
    'Rhythm drives the beat',
    'Strum acoustic guitar strings',
    'Sing notes in harmony',
    'Bass lines groove deeply',
    'Practice scales every day',
    // Normal (6-10 words)
    'A minor chord evokes profound sorrow and yearning',
    'Jazz improvisation celebrates spontaneity over rigid structure',
    'Syncopation accents unexpected beats to create dance grooves',
    'The orchestra tuned instruments before the symphony began',
    'Analog synthesizers produce rich organic electrical warmth',
    'Music can name the unnameable and communicate the unknowable',
    // Hard (11-18 words)
    'Without music life would be an unbearable mistake wrote the philosopher about artistic expression',
    'The conductor raised the wooden baton and complete silence blanketed the packed concert auditorium',
    'Polyrhythms layer conflicting time signatures to produce complex hypnotic grooves that captivate listeners worldwide',
    'Acoustic resonance in wooden violins matures gracefully as master instruments age across multiple centuries',
    'Writing lyrics allows musicians to translate unspoken heartbreaks into melodies that comfort millions',
  ],

  // 11. Space Exploration
  space: [
    // Easy (3-5 words)
    'Rockets blast past clouds',
    'Mars has red dust',
    'Saturn rings spin slowly',
    'Astronauts float in orbit',
    'Telescopes gaze into infinity',
    'The countdown has started',
    // Normal (6-10 words)
    'One small step for man one giant leap for mankind',
    'Robotic rovers explore dry ancient riverbeds on Mars',
    'The James Webb telescope peers into the early cosmos',
    'Gravitational slingshots accelerate probes toward outer gas giants',
    'Space stations orbit Earth sixteen times every single day',
    'Supernovae seed the universe with heavy essential elements',
    // Hard (11-18 words)
    'Somewhere something incredible is waiting to be known in the boundless depths of space',
    'Voyager one carries a golden record containing sounds and pictures from our home planet',
    'Reentering planetary atmosphere generates extreme thermal friction requiring sophisticated heat shields to survive',
    'Colonizing distant worlds demands closed loop life support systems capable of recycling air water and nutrients',
    'Cosmic radiation beyond Earth magnetosphere poses long term biological challenges for deep space explorers',
  ],

  // 12. Business & Startups
  business: [
    // Easy (3-5 words)
    'Customers always come first',
    'Validate your product idea',
    'Scale operations with care',
    'Cash flow keeps doors',
    'Hire for culture fit',
    'Deliver value every day',
    // Normal (6-10 words)
    'Focus on solving a real problem for users',
    'A minimum viable product accelerates learning from customers',
    'Product market fit is the engine of rapid growth',
    'Great company culture attracts and retains exceptional talent',
    'Early feedback prevents teams from building unwanted features',
    'Unit economics must turn positive before scaling marketing spend',
    // Hard (11-18 words)
    'Move fast and iterate quickly while listening attentively to candid criticism from your earliest adopters',
    'The most successful entrepreneurs embrace calculated risks and view painful setbacks as valuable educational data',
    'Sustainable competitive advantage stems from proprietary technology network effects or strong brand loyalty over time',
    'Pitch decks must clearly articulate problem market size unique differentiation and path to profitable revenue',
    'Delegating authority empowers talented team members to solve ambiguous challenges without managerial bottlenecks',
  ],

  // 13. Mythology & Legends
  mythology: [
    // Easy (3-5 words)
    'Zeus hurled bright lightning',
    'Thor swung heavy hammer',
    'Dragons hoard ancient gold',
    'The Phoenix rose again',
    'Heroes face great trials',
    'Pegasus flew past clouds',
    // Normal (6-10 words)
    'Pandora opened the box leaving only hope inside',
    'Icarus flew too close to the blazing sun',
    'Achilles possessed invulnerable armor except for his heel',
    'The Minotaur guarded the winding stone labyrinth of Crete',
    'Odin traded his eye for eternal divine wisdom',
    'Valkyries escorted fallen warriors to the golden feast',
    // Hard (11-18 words)
    'Prometheus defied the Olympian gods to deliver the gift of sacred fire to mortal mankind',
    'The golden fleece was guarded by an unsleeping dragon until Jason arrived with brave Argonauts',
    'Ancient myths were symbolic maps guiding early human souls through grief terror love and heroic courage',
    'Persephone return to the underworld plunged the earth into icy winter until spring green returned',
    'Hercules completed twelve legendary labors demonstrating that mortal perseverance can triumph over divine wrath',
  ],

  // 14. Sports & Athletics
  sports: [
    // Easy (3-5 words)
    'Practice beats pure talent',
    'Champions train when tired',
    'Pass ball to teammate',
    'Sprint past finish line',
    'Never give up hope',
    'Defense wins big games',
    // Normal (6-10 words)
    'You miss one hundred percent of shots never taken',
    'Hard work beats talent when talent fails to work',
    'Gold medals are forged during early morning lonely workouts',
    'Teamwork divides the effort and multiplies the eventual success',
    'Marathon runners hit the wall around mile twenty',
    'Great athletes maintain composure under high pressure championship moments',
    // Hard (11-18 words)
    'I have failed over and over and over again in my life and that is why succeed',
    'The thrill of victory and the agony of defeat define the emotional drama of competitive athletics',
    'Muscles scream for rest during final sprints yet mental fortitude pushes runners across the finish line',
    'Recovery nutrition adequate sleep and mental preparation are just as crucial as physical drills on field',
    'A championship team relies on selflessness where every player prioritizes collective victory above individual statistics',
  ],

  // 15. Travel & Wanderlust
  travel: [
    // Easy (3-5 words)
    'Pack bags for adventure',
    'Explore ancient cobblestone streets',
    'Sunsets over tropical beaches',
    'Travel opens your mind',
    'Passports collect colorful stamps',
    'Wander off beaten path',
    // Normal (6-10 words)
    'The world is a book for adventurous travelers',
    'Boarding a night train into unfamiliar mountain territory',
    'Street food markets reveal the true soul of cities',
    'Getting lost in Venice leads to enchanting quiet canals',
    'Catching sunrise over mist covered Buddhist temple spires',
    'Memories gathered while traveling outlive any material possessions',
    // Hard (11-18 words)
    'Not until we are lost do we begin to understand ourselves and the vast world around us',
    'Backpacking across foreign continents teaches resilience adaptability and gratitude for everyday comforts often taken for granted',
    'The smell of fresh morning espresso on a Parisian boulevard awakens memories of carefree European summers',
    'Traveling reminds us that beneath different languages and traditions all humans share similar hopes and dreams',
    'Standing before towering glacial fjords makes one realize how small and fragile our footprint truly is',
  ],

  // 16. Poetry & Verse
  poetry: [
    // Easy (3-5 words)
    'Rose petals fall softly',
    'Stars whisper at night',
    'Shadows dance in moonlight',
    'Hope has gentle feathers',
    'Rivers hum sweet tunes',
    'Time flows like water',
    // Normal (6-10 words)
    'Two roads diverged in a yellow autumn wood',
    'I took the one less traveled by today',
    'Shall I compare thee to a summer day',
    'Do not go gentle into that good night',
    'Rage against the dying of the fading light',
    'The woods are lovely dark and deep tonight',
    // Hard (11-18 words)
    'Because I could not stop for death he kindly stopped for me along the carriage ride',
    'Water water everywhere nor any drop to drink lamented the weary sailor on open oceans',
    'Tell me what is it you plan to do with your one wild and precious life',
    'Poetry is the rhythmical creation of beauty through language that touches the most guarded human hearts',
    'In the desert I saw a creature naked bestial who squatting upon the ground ate his heart',
  ],

  // 17. Artificial Intelligence
  ai: [
    // Easy (3-5 words)
    'Machines learn from data',
    'Neural nets recognize patterns',
    'Prompts steer language models',
    'Robots navigate warehouse floors',
    'Algorithms optimize complex routes',
    'Compute scales intelligence up',
    // Normal (6-10 words)
    'Deep learning models process billions of statistical parameters',
    'Reinforcement learning trains agents through feedback and rewards',
    'Transformer architecture revolutionized natural language processing capabilities globally',
    'Autonomous vehicles interpret lidar and camera streams in realtime',
    'Synthetic intelligence assists researchers in folding complex proteins',
    'Computer vision detects microscopic tumors faster than human doctors',
    // Hard (11-18 words)
    'Can machines think was the famous provocative question posed by Alan Turing at the dawn of computation',
    'Large language models predict upcoming tokens based on probabilities learned from trillions of written words across internet',
    'Aligning advanced artificial intelligence with human values remains one of the most critical challenges of this century',
    'Diffusion models generate photorealistic artwork by reversing a gradual process of adding Gaussian noise to images',
    'Edge computing enables lightweight neural networks to perform inference directly on consumer smartphones without server roundtrips',
  ],

  // 18. Architecture & Design
  architecture: [
    // Easy (3-5 words)
    'Form follows intended function',
    'Arches distribute heavy loads',
    'Concrete and steel rise',
    'Skylights flood rooms sunshine',
    'Minimalism embraces clean space',
    'Blueprints guide the builders',
    // Normal (6-10 words)
    'Good design is as little design as possible',
    'Flying buttresses allowed gothic cathedrals soaring stained glass',
    'Natural lighting transforms the emotional quality of interior spaces',
    'Brutalist buildings showcase raw exposed textured poured concrete',
    'Sustainable architecture incorporates passive solar heating and ventilation',
    'Cantilever balconies appear to defy gravity over cliffside drops',
    // Hard (11-18 words)
    'Architecture is frozen music composed of physical proportions materials shadows and interplay of natural ambient light',
    'The Bauhaus movement unified fine craftsmanship with industrial mass production to create functional elegant everyday objects',
    'Urban planners design walkable neighborhoods with green parks to foster healthy social connections among city residents',
    'Geodesic domes distribute stress evenly across triangular facets creating incredibly strong and lightweight structural enclosures',
    'Restoring historic brick facades preserves cultural heritage while integrating modern energy efficient insulation within old walls',
  ],

  // 19. Finance & Economics
  finance: [
    // Easy (3-5 words)
    'Compound interest builds wealth',
    'Diversify your investment portfolio',
    'Save before you spend',
    'Inflation erodes purchasing power',
    'Assets generate passive income',
    'Budget every single dollar',
    // Normal (6-10 words)
    'Do not put all your eggs in one basket',
    'Index funds provide low cost broad market diversification',
    'Supply and demand dictate market equilibrium pricing levels',
    'Liquidity allows investors to convert assets to cash quickly',
    'Time in the market beats timing the volatile market',
    'Central banks raise interest rates to cool economic inflation',
    // Hard (11-18 words)
    'Compound interest is the eighth wonder of the world he who understands it earns it pays it',
    'Dollar cost averaging reduces the psychological stress of investing by purchasing shares at regular disciplined intervals',
    'A bull market climbs a wall of worry while bear markets test the emotional conviction of investors',
    'Emergency funds covering six months of essential living expenses protect households from sudden unexpected economic shocks',
    'Understanding balance sheets cash flow statements and income reports is fundamental to analyzing the health of businesses',
  ],

  // 20. Mindfulness & Health
  wellness: [
    // Easy (3-5 words)
    'Inhale peace exhale tension',
    'Drink clean fresh water',
    'Sleep heals body mind',
    'Walk outside in nature',
    'Breathe deeply right now',
    'Be present this moment',
    // Normal (6-10 words)
    'Quiet your mind and the soul will speak softly',
    'Consistent restful sleep restores physical vitality and mental sharpness',
    'Mindfulness is paying attention on purpose without harsh judgment',
    'Gratitude turns what we currently have into more than enough',
    'Stretching tight muscles relieves tension accumulated during seated work',
    'Disconnecting from digital screens promotes calmer thoughts before bed',
    // Hard (11-18 words)
    'You cannot stop the turbulent waves of life but you can certainly learn how to surf them',
    'Taking five slow deep breaths activates the parasympathetic nervous system reducing stress hormones and calming heart rate',
    'True wellness is not merely the absence of illness but dynamic state of physical mental and spiritual vitality',
    'Setting healthy personal boundaries allows individuals to protect their emotional energy and nurture relationships that truly matter',
    'A mindful morning routine of silent meditation gentle movement and mindful tea sets a grounded tone for the day',
  ],
};

function getDifficulty(wordCount) {
  if (wordCount <= 5) return 'easy';
  if (wordCount <= 10) return 'normal';
  return 'hard';
}

async function run() {
  console.log('1. Ensuring tables exist...');
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      slug VARCHAR(50) PRIMARY KEY,
      label VARCHAR(100) NOT NULL,
      icon VARCHAR(10) NOT NULL,
      description TEXT,
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sentences (
      id SERIAL PRIMARY KEY,
      category_slug VARCHAR(50) NOT NULL REFERENCES categories(slug) ON DELETE CASCADE,
      text TEXT NOT NULL,
      word_count INT NOT NULL,
      difficulty VARCHAR(20) DEFAULT 'normal',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_category_text UNIQUE(category_slug, text)
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_sentences_category_slug ON sentences(category_slug);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sentences_difficulty ON sentences(difficulty);
  `;

  console.log(`2. Upserting ${newCategories.length} new categories...`);
  for (const cat of newCategories) {
    await sql`
      INSERT INTO categories (slug, label, icon, description, display_order)
      VALUES (${cat.slug}, ${cat.label}, ${cat.icon}, ${cat.description}, ${cat.display_order})
      ON CONFLICT (slug) DO UPDATE
      SET label = EXCLUDED.label,
          icon = EXCLUDED.icon,
          description = EXCLUDED.description,
          display_order = EXCLUDED.display_order;
    `;
  }

  console.log('3. Upserting sentences with difficulty breakdown...');
  let totalInserted = 0;
  const countsByDiff = { easy: 0, normal: 0, hard: 0 };

  for (const [categorySlug, sentences] of Object.entries(newSentencesData)) {
    for (const text of sentences) {
      const words = text.trim().split(/\s+/);
      const wordCount = words.length;
      const difficulty = getDifficulty(wordCount);
      countsByDiff[difficulty]++;

      await sql`
        INSERT INTO sentences (category_slug, text, word_count, difficulty)
        VALUES (${categorySlug}, ${text}, ${wordCount}, ${difficulty})
        ON CONFLICT (category_slug, text) DO UPDATE
        SET word_count = EXCLUDED.word_count,
            difficulty = EXCLUDED.difficulty;
      `;
      totalInserted++;
    }
  }

  console.log(`✅ Success! Seeded ${newCategories.length} new categories and ${totalInserted} sentences into Neon.`);
  console.log(`📊 Difficulty breakdown: Easy: ${countsByDiff.easy}, Normal: ${countsByDiff.normal}, Hard: ${countsByDiff.hard}`);
}

run().catch((err) => {
  console.error('Error seeding 20 categories:', err);
  process.exit(1);
});
