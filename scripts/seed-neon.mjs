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
  console.error('No DATABASE_URL found.');
  process.exit(1);
}

const sql = neon(databaseUrl);

const categories = [
  {
    slug: 'casual',
    label: 'Casual Daily',
    icon: '☀️',
    description: 'Everyday phrases and common expressions',
    display_order: 1,
  },
  {
    slug: 'quotes',
    label: 'Famous Quotes',
    icon: '💬',
    description: 'Inspirational quotes from notable figures',
    display_order: 2,
  },
  {
    slug: 'programming',
    label: 'Pro Programming',
    icon: '💻',
    description: 'Tech jargon, code concepts, and dev speak',
    display_order: 3,
  },
  {
    slug: 'idioms',
    label: 'Compound Idioms',
    icon: '🧩',
    description: 'Tricky English idioms and compound phrases',
    display_order: 4,
  },
];

const sentencesData = {
  casual: [
    'The weather is nice today',
    'I need to buy some groceries',
    'Let me check my schedule',
    'Can you pass the salt please',
    'I will be there soon',
    'Have a great weekend',
    'That sounds like a plan',
    'Where did you park the car',
    'I just finished my coffee',
    'Do you want to grab lunch',
    'The train arrives at noon',
    'Please close the door behind you',
    'I forgot my umbrella at home',
    'The meeting starts in five minutes',
    'Can we reschedule for tomorrow',
    'I am running a bit late today',
    'The store closes at nine',
    'Let us take the shortcut through the park',
    'Did you see the news this morning',
    'I think we should head home now',
    'The traffic was terrible this morning',
    'Can you help me carry these bags',
    'I left my phone on the table',
    'What time does the movie start',
    'The pizza should be here any minute',
    'I need to charge my laptop soon',
    'Do you remember her birthday is Friday',
    'The kids are playing in the backyard',
    'I have a dentist appointment this afternoon',
    'We should try that new restaurant downtown',
    // ── Easy (3-5 words) ──
    'Good morning everyone',
    'How are you today',
    'See you tomorrow morning',
    'Take care of yourself',
    'Keep in touch often',
    'Call me back later',
    'Time to wake up',
    'Dinner is ready now',
    'Enjoy your fresh meal',
    'Catch you later friend',
    'Thanks for your help',
    'Nice to meet you',
    'Have a nice flight',
    'Please wait outside here',
    'I need some water',
    'The bus is here',
    'Let us eat lunch',
    'What a wonderful day',
    'Sounds good to me',
    'Turn on the lights',
    'Sleep well tonight friend',
    'Have fun this evening',
    'Keep up good work',
    'Coffee smells so good',
    'Welcome to our neighborhood',
    'Grab your warm coat',
    'The sun is shining',
    'Let me know soon',
    'I am feeling great',
    'Walk with me today',
    'Put on your shoes',
    'Open the front window',
    'Pack your school bag',
    'Wash your hands first',
    'Turn off the television',
    // ── Normal (6-10 words) ──
    'I am going to the grocery store right now',
    'Could you please send me that recipe later',
    'Let me know when you arrive at the station',
    'We are planning a small picnic this coming Saturday',
    'I forgot to turn off the kitchen lights downstairs',
    'Do you prefer drinking hot tea or iced coffee',
    'It looks like it might rain later this afternoon',
    'Can you pick up some fresh milk on your way',
    'I need to take the dog out for a walk',
    'Let us meet at the coffee shop around noon',
    'She recommended a really great book for me to read',
    'How was your trip to the coast last weekend',
    'Please remember to lock the front door when leaving',
    'I had a really productive afternoon at the office',
    'What time does the movie start at the cinema',
    'I think I left my keys on the counter',
    'We should order takeout for dinner tonight instead of cooking',
    'The train was surprisingly on time during morning rush',
    'My phone battery is running low so charge it',
    'Let me check what we have in the refrigerator',
    'I am looking forward to seeing everyone this holiday',
    'He baked homemade chocolate chip cookies for the party',
    'Could you turn down the volume just a bit',
    'I usually take a quick walk during lunch break',
    'The morning air feels remarkably crisp and refreshing today',
    'Don’t forget your warm jacket because it gets chilly',
    'We spent the entire evening chatting on the porch',
    'Can someone help me move this heavy wooden table',
    'I finally finished folding all of the clean laundry',
    'That was one of the funniest stories I heard',
    'I need to buy a birthday card this afternoon',
    'Did anyone remember to water the house plants today',
    'Let us take the stairs instead of the elevator',
    'I hope you have a relaxing and peaceful Sunday',
    'It took twenty minutes to find a parking spot',
    'Can you grab an extra napkin from the dispenser',
    'We should catch up properly over dinner next week',
    'The flowers in the garden are starting to bloom',
    'I always enjoy listening to gentle acoustic guitar music',
    'Everything went according to the original plan this morning',
    // ── Hard (11-18 words) ──
    'I was thinking we could invite our neighbors over for a casual backyard barbecue this weekend',
    'If you have some free time this afternoon could you help me assemble this new bookshelf',
    'The grocery store was completely out of ripe avocados so I had to buy green ones instead',
    'Whenever the weather gets this warm I love sitting on the balcony reading a good novel',
    'Make sure you set your alarm clock fifteen minutes earlier so you do not miss the bus',
    'We had to wait in line for nearly forty minutes just to order our morning coffee',
    'I ran into an old high school friend while shopping at the supermarket yesterday afternoon',
    'Could you please double check if the garage door is completely closed before you go to sleep',
    'After walking through the botanical gardens all morning we stopped at a quiet little noodle place',
    'It has been such a hectic week at work that I cannot wait to sleep in tomorrow',
    'I promised my sister I would water her houseplants and feed her cat while she is away',
    'The local farmers market on Saturday mornings always has the sweetest fresh strawberries and homemade pastries',
    'We decided to take the scenic coastal highway instead of rushing down the crowded toll road',
    'Before we head out for the day let us make sure we packed sunscreen and water bottles',
    'She spent the rainy afternoon organizing old family photo albums and sipping hot peppermint tea',
    'If everyone chips in to clean up the kitchen we will finish in no time at all',
    'I usually try to stretch for ten minutes right after waking up to get my energy going',
    'The neighborhood bakery down the street opens at sunrise and fills the entire block with fresh bread aromas',
    'We should probably leave twenty minutes ahead of schedule to account for potential highway construction delays',
    'It was so relaxing to sit by the open window and listen to the gentle evening rain',
    'Can you remind me to pick up the dry cleaning tomorrow morning on the way to work',
    'Cooking a hearty homemade soup from scratch takes patience but the delicious flavor is always worth the effort',
    'Everyone gathered in the cozy living room with warm mugs of cider to play board games together',
    'After spending all day unpacking cardboard boxes we finally settled down to enjoy our very first home dinner',
    'Taking a slow evening stroll around the quiet neighborhood block helps clear my head before heading to sleep',
  ],
  quotes: [
    'The only way to do great work is to love what you do',
    'In the middle of difficulty lies opportunity',
    'Life is what happens when you are busy making other plans',
    'The future belongs to those who believe in the beauty of their dreams',
    'It does not matter how slowly you go as long as you do not stop',
    'The best time to plant a tree was twenty years ago',
    'Be the change that you wish to see in the world',
    'Success is not final failure is not fatal it is the courage to continue that counts',
    'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment',
    'The mind is everything what you think you become',
    'Imagination is more important than knowledge',
    'You miss one hundred percent of the shots you never take',
    'The journey of a thousand miles begins with a single step',
    'Not everything that is faced can be changed but nothing can be changed until it is faced',
    'What we think we become',
    'Stay hungry stay foolish',
    'The only impossible journey is the one you never begin',
    'It always seems impossible until it is done',
    'Believe you can and you are halfway there',
    'We are what we repeatedly do excellence is not an act but a habit',
    'Happiness is not something ready made it comes from your own actions',
    'The greatest glory in living lies not in never falling but in rising every time we fall',
    'Do what you can with what you have where you are',
    'In three words I can sum up everything I learned about life it goes on',
    'Life is really simple but we insist on making it complicated',
  ],
  programming: [
    'Always write code as if the person maintaining it is a violent psychopath who knows where you live',
    'There are only two hard things in computer science cache invalidation and naming things',
    'The best error message is the one that never shows up',
    'Code is like humor when you have to explain it it is bad',
    'First solve the problem then write the code',
    'Simplicity is the soul of efficiency',
    'Make it work make it right make it fast',
    'A function should do one thing and do it well',
    'Testing leads to failure and failure leads to understanding',
    'The most dangerous phrase in the English language is we have always done it this way',
    'Programs must be written for people to read and only incidentally for machines to execute',
    'Any fool can write code that a computer can understand good programmers write code that humans can understand',
    'Talk is cheap show me the code',
    'Every great developer you know got there by solving problems they were unqualified to solve',
    'Deleted code is debugged code',
    'The best performance improvement is the transition from the nonworking state to the working state',
    'Premature optimization is the root of all evil',
    'It is not a bug it is an undocumented feature',
    'Nine people cannot make a baby in one month',
    'Give a man a program frustrate him for a day teach a man to program frustrate him for a lifetime',
    'The most disastrous thing you can ever learn is your first programming language',
    'Software is like entropy it is difficult to grasp and always increases',
    'Walking on water and developing software from a specification are easy if both are frozen',
    'Debugging is twice as hard as writing the code in the first place',
    'Programming is not about typing it is about thinking',
  ],
  idioms: [
    'A penny saved is a penny earned in the long run',
    'Actions speak louder than words so show me what you got',
    'You cannot judge a book by its cover no matter how pretty',
    'The early bird catches the worm but the second mouse gets the cheese',
    'Do not put all your eggs in one basket if you can help it',
    'Every cloud has a silver lining so keep looking up',
    'A picture is worth a thousand words especially in presentations',
    'When it rains it pours and you better have an umbrella',
    'Better late than never but better never late they say',
    'Curiosity killed the cat but satisfaction brought it back',
    'Rome was not built in a day and neither was this project',
    'The grass is always greener on the other side of the fence',
    'Do not bite the hand that feeds you or you will go hungry',
    'You can lead a horse to water but you cannot make it drink',
    'A watched pot never boils so go do something productive',
    'Two heads are better than one especially when solving hard problems',
    'The pen is mightier than the sword in the battle for hearts and minds',
    'If you cannot beat them you might as well join them instead',
    'People who live in glass houses should not throw stones at others',
    'An apple a day keeps the doctor away or so the saying goes',
    'The squeaky wheel gets the grease but sometimes gets replaced',
    'Do not count your chickens before they hatch because surprises happen',
    'Birds of a feather flock together and they fly in formation',
    'A stitch in time saves nine so fix it while you can',
    'When in Rome do as the Romans do and enjoy the pasta',
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

  console.log('2. Upserting categories...');
  for (const cat of categories) {
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

  console.log('3. Inserting sentences...');
  let totalInserted = 0;
  for (const [categorySlug, sentences] of Object.entries(sentencesData)) {
    for (const text of sentences) {
      const wordCount = text.trim().split(/\s+/).length;
      const difficulty = getDifficulty(wordCount);
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

  console.log(`✅ Done! Successfully seeded ${categories.length} categories and ${totalInserted} sentences into Neon.`);
}

run().catch((err) => {
  console.error('Error seeding Neon database:', err);
  process.exit(1);
});
