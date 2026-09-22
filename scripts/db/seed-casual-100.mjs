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

export const casual100Sentences = [
  // ── Easy (35 sentences, 3-5 words) ──
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

  // ── Normal (40 sentences, 6-10 words) ──
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

  // ── Hard (25 sentences, 11-18 words) ──
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
];

function getDifficulty(wordCount) {
  if (wordCount <= 5) return 'easy';
  if (wordCount <= 10) return 'normal';
  return 'hard';
}

async function run() {
  console.log(`Seeding ${casual100Sentences.length} sentences into 'casual' category...`);

  let insertedCount = 0;
  const countsByDiff = { easy: 0, normal: 0, hard: 0 };

  for (const text of casual100Sentences) {
    const wordCount = text.trim().split(/\s+/).length;
    const difficulty = getDifficulty(wordCount);
    countsByDiff[difficulty]++;

    await sql`
      INSERT INTO sentences (category_slug, text, word_count, difficulty)
      VALUES ('casual', ${text}, ${wordCount}, ${difficulty})
      ON CONFLICT (category_slug, text) DO UPDATE
      SET word_count = EXCLUDED.word_count,
          difficulty = EXCLUDED.difficulty;
    `;
    insertedCount++;
  }

  // Get total count for casual
  const result = await sql`
    SELECT COUNT(*)::int AS count FROM sentences WHERE category_slug = 'casual';
  `;

  console.log(`✅ Successfully upserted ${insertedCount} sentences!`);
  console.log(`📊 Breakdown added: Easy: ${countsByDiff.easy}, Normal: ${countsByDiff.normal}, Hard: ${countsByDiff.hard}`);
  console.log(`🎉 Total sentences in 'casual' category now: ${result[0].count}`);
}

run().catch((err) => {
  console.error('Error seeding casual sentences:', err);
  process.exit(1);
});
