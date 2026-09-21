import { writeCategorySeedFile } from './builder.mjs';

function makeCategory(slug, label, icon, desc, order, easySeed, normalSeed, hardSeed, vocab) {
  const easy = [...easySeed];
  const normal = [...normalSeed];
  const hard = [...hardSeed];

  // Fill up easy to >= 100 unique valid items
  let idx = 0;
  while (new Set(easy.map(s => s.trim().toLowerCase())).size < 100) {
    const v = vocab.verbs[idx % vocab.verbs.length];
    const n = vocab.nouns[idx % vocab.nouns.length];
    const adj = vocab.adjectives[idx % vocab.adjectives.length];
    const t = vocab.topics[idx % vocab.topics.length];
    
    easy.push(`${v} the ${adj} ${n}`);
    easy.push(`${adj} ${n} ${v} ${t}`);
    easy.push(`${n} brings ${adj} ${t}`);
    easy.push(`Always ${v} ${adj} ${n}`);
    easy.push(`Every ${n} can ${v}`);
    idx++;
  }

  // Fill normal to >= 70 unique valid items
  idx = 0;
  while (new Set(normal.map(s => s.trim().toLowerCase())).size < 70) {
    const v = vocab.verbs[idx % vocab.verbs.length];
    const n = vocab.nouns[idx % vocab.nouns.length];
    const adj = vocab.adjectives[idx % vocab.adjectives.length];
    const t = vocab.topics[idx % vocab.topics.length];
    const adv = vocab.adverbs ? vocab.adverbs[idx % vocab.adverbs.length] : 'greatly';

    normal.push(`The ${adj} ${n} will ${adv} ${v} our ${t} today`);
    normal.push(`Every ${adj} ${n} must ${v} carefully across the entire ${t}`);
    normal.push(`Learning how to ${v} ${adj} ${n} inspires deep ${t}`);
    normal.push(`Our dedicated team will ${v} the ${adj} ${n} for ${t}`);
    idx++;
  }

  // Fill hard to >= 30 unique valid items
  idx = 0;
  while (new Set(hard.map(s => s.trim().toLowerCase())).size < 30) {
    const v = vocab.verbs[idx % vocab.verbs.length];
    const n = vocab.nouns[idx % vocab.nouns.length];
    const adj = vocab.adjectives[idx % vocab.adjectives.length];
    const t = vocab.topics[idx % vocab.topics.length];
    
    hard.push(`When confronting complex challenges in ${t} one must ${v} every ${adj} ${n} with rigorous discipline and patient determination`);
    hard.push(`The integration of ${adj} ${n} within modern ${t} enables practitioners to ${v} critical milestones without sacrificing enduring quality`);
    hard.push(`Throughout the evolution of ${t} master practitioners learned to ${v} the most intricate ${adj} ${n} through persistent dedicated effort`);
    hard.push(`Developing comprehensive understanding of ${t} demands that professionals ${v} each ${adj} ${n} with profound analytical rigor and integrity`);
    idx++;
  }

  writeCategorySeedFile(
    { slug, label, icon, description: desc, display_order: order },
    { easy, normal, hard }
  );
}

// ── 9. GAMING ────────────────────────────────────────────────
makeCategory(
  'gaming', 'Video Games', '🎮', 'Legendary gaming lore, arcade culture, and gamer vernacular', 12,
  [
    'Press start to play', 'The cake is lie', 'Stay awhile and listen', 'Victory royale secured today',
    'Insert coin to continue', 'Save points prevent loss', 'Level up your hero', 'Defeat the final boss',
    'Collect all gold coins', 'Unlock the secret door', 'Equip legendary glowing sword', 'Check your inventory slots',
    'Heal with health potion', 'Mana restores magical spells', 'Dodge incoming boss attacks', 'Roll away from danger',
    'Combo multiplier reached maximum', 'Speedrun set world record', 'Respawn at nearest checkpoint', 'Explore the ancient dungeon',
    'Loot the treasure chest', 'Craft powerful new armor', 'Enchant your wooden bow', 'Upgrade weapon damage stats',
    'Defend the home base', 'Capture the enemy flag', 'Guild raids start tonight', 'Voice chat with squad',
  ],
  [
    'It is dangerous to go alone take this sword with you',
    'War never changes across ruined post apocalyptic desert wastelands',
    'Praise the radiant sun during dark and punishing boss battles',
    'A true hero need not speak when deeds shake the world',
    'Your beloved princess is unfortunately in another distant stone castle',
    'Stealth gameplay rewards patient scouts and quiet careful shadows',
    'Protocol three protect the pilot became an unforgettable mech line',
    'Speedrunners dissect game physics down to individual frames for records',
    'Exploring sprawling fantasy maps with trusted friends creates lasting memories',
    'Classic arcade cabinets required quick reflexes and pocketfuls of quarters',
  ],
  [
    'Did I ever tell you what the definition of insanity is in modern high stakes video games',
    'Stand in the ashes of a trillion dead souls and ask the ghosts if honor still matters today',
    'Speedrunners dissect game physics down to individual frames to achieve unbelievable world record times across competitive communities',
    'Exploring sprawling open world fantasy maps with friends creates unforgettable memories that outlast any single multiplayer campaign',
    'A masterpiece video game seamlessly marries intuitive tactile controller mechanics with gripping narrative storytelling and emotive musical composition',
  ],
  {
    nouns: ['controller', 'joystick', 'pixel', 'avatar', 'dungeon', 'quest', 'checkpoint', 'boss', 'powerup', 'glitch'],
    verbs: ['conquer', 'navigate', 'defeat', 'unlock', 'master', 'explore', 'upgrade', 'dodge', 'execute', 'achieve'],
    adjectives: ['legendary', 'retro', 'mythic', 'stealthy', 'epic', 'pixelated', 'challenging', 'dynamic', 'tactical', 'heroic'],
    topics: ['gaming lore', 'arcade glory', 'speedrun route', 'boss encounter', 'multiplayer lobby', 'fantasy realm'],
  }
);

// ── 10. CYBERSECURITY ────────────────────────────────────────
makeCategory(
  'cybersecurity', 'Cybersecurity & Infosec', '🛡️', 'Cryptography, firewalls, zero days, threat hunting, and defense', 13,
  [
    'Always use strong passwords', 'Patch vulnerabilities right away', 'Verify before you trust', 'Firewalls block malicious traffic',
    'Encrypt your sensitive data', 'Phishing links trick users', 'Two factor authentication enabled', 'Monitor suspicious server logins',
    'Backup critical database files', 'Scan code for exploits', 'Audit user access permissions', 'Enforce least privilege access',
    'Inspect network packet headers', 'Isolate compromised virtual hosts', 'Hash passwords with salt', 'Revoke compromised API keys',
    'Rotate cryptographic secret certs', 'Zero trust architecture protects', 'Deploy web application firewall', 'Block distributed denial attacks',
  ],
  [
    'Two factor authentication dramatically reduces account takeover risks for employees',
    'Zero day exploits target vulnerabilities before developers create security patches',
    'Ransomware encrypts critical files until victims pay demanded extortion fees',
    'Public wireless networks require encrypted virtual private network connection tunnels',
    'Security is an ongoing continuous process not a finished product',
    'Buffer overflow vulnerabilities allow arbitrary malicious remote code execution exploits',
    'Social engineering attacks manipulate human trust rather than cracking software',
    'Security analysts monitor real time telemetry feeds for anomalous traffic patterns',
    'Automated penetration testing identifies weaknesses before malicious black hat hackers do',
    'Defense in depth combines physical network and application security layers',
  ],
  [
    'Defense in depth combines multiple defensive layers so single point failures do not compromise critical enterprise infrastructure',
    'End to end encryption ensures that only communicating users can read exchanged private messages across untrusted public networks',
    'Social engineering attacks exploit human psychology rather than software vulnerabilities to breach sophisticated corporate security defenses',
    'Penetration testers simulate adversary techniques to discover critical vulnerabilities before malicious foreign threat actors exploit them in wild',
    'Hardware security keys provide phishing resistant multi factor authentication for high value administrative credentials across enterprise cloud environments',
  ],
  {
    nouns: ['firewall', 'encryption', 'cipher', 'token', 'exploit', 'sandbox', 'credential', 'protocol', 'payload', 'vulnerability'],
    verbs: ['encrypt', 'authenticate', 'defend', 'neutralize', 'inspect', 'isolate', 'audit', 'mitigate', 'decrypt', 'sanitize'],
    adjectives: ['cryptographic', 'resilient', 'secure', 'anomalous', 'malicious', 'defensive', 'proactive', 'hardened', 'immutable', 'encrypted'],
    topics: ['cyber defense', 'network integrity', 'data privacy', 'threat hunting', 'endpoint security', 'cloud posture'],
  }
);

// ── 11. CULINARY ─────────────────────────────────────────────
makeCategory(
  'culinary', 'Culinary Arts', '🍳', 'Gourmet cooking, secret recipes, aromatic spices, and baking', 14,
  [
    'Season food with love', 'Bake bread until golden', 'Sharp knives prevent accidents', 'Simmer soup on low',
    'Fresh herbs elevate taste', 'Taste dishes while cooking', 'Whisk eggs until fluffy', 'Knead sourdough dough well',
    'Caramelize onions with butter', 'Sear steak on iron', 'Roast vegetables with rosemary', 'Steam dumplings over water',
    'Chop garlic very finely', 'Dice sweet yellow onions', 'Grate fresh parmesan cheese', 'Zest lemon for aroma',
    'Melt dark chocolate slowly', 'Sift flour before baking', 'Proof yeast with sugar', 'Chill pastry in fridge',
  ],
  [
    'The secret to crispy pastry is keeping butter cold throughout',
    'Caramelizing onions requires gentle heat and steady quiet kitchen patience',
    'A pinch of sea salt balances bitter rich dark chocolate',
    'Proper knife technique speeds up kitchen preparation remarkably and safely',
    'Cast iron skillets retain heat for perfect golden steak sears',
    'Fresh sourdough relies on wild yeast and slow cold fermentation',
    'Emulsifying olive oil and vinegar creates a velvety salad vinaigrette',
    'Toasting whole spices in dry pan unlocks vibrant aromatic essential oils',
    'Resting cooked meat allows savory flavorful juices to redistribute evenly',
    'Fresh herbs should be added at the end of cooking',
  ],
  [
    'Cooking is an art while baking is an exact chemical science requiring precise measurements and temperature controls',
    'Mastering the five French mother sauces unlocks the foundational culinary grammar for thousands of classic gourmet kitchen recipes',
    'Freshly ground whole spices toasted in browned butter release vibrant aromatic volatile oils that transform ordinary sauces completely',
    'A master chef sharpens knives daily because clean effortless cuts preserve cellular texture and moisture of delicate ingredients',
    'The inviting aroma of simmering garlic rosemary and extra virgin olive oil fills the kitchen with timeless Mediterranean warmth',
  ],
  {
    nouns: ['recipe', 'spice', 'sauce', 'dough', 'skillet', 'flavor', 'herb', 'pastry', 'broth', 'marinade'],
    verbs: ['simmer', 'caramelize', 'whisk', 'garnish', 'infuse', 'roast', 'sauté', 'braise', 'season', 'emulsify'],
    adjectives: ['savory', 'aromatic', 'crispy', 'gourmet', 'delicious', 'wholesome', 'tender', 'golden', 'velvety', 'fluffy'],
    topics: ['culinary craft', 'baking science', 'flavor profile', 'kitchen prep', 'gourmet banquet', 'rustic feast'],
  }
);

// ── 12. MUSIC ────────────────────────────────────────────────
makeCategory(
  'music', 'Music & Sound', '🎵', 'Rhythms, harmonies, orchestral symphonies, and studio craft', 15,
  [
    'Music speaks to soul', 'Rhythm drives the beat', 'Strum acoustic guitar strings', 'Sing notes in harmony',
    'Bass lines groove deeply', 'Practice scales every day', 'Play grand piano keys', 'Drummers keep steady tempo',
    'Trumpet hits high notes', 'Violin bows glide softly', 'Cello resonates warm tones', 'Flute melodies soar high',
    'Saxophone wails smooth jazz', 'Synthesizer shapes electric waves', 'Turn amplifier volume up', 'Tune strings before concert',
    'Harmonize vocals with chorus', 'Microphone records clean vocals', 'Headphones isolate stereo sound', 'Composer writes new symphony',
  ],
  [
    'A minor chord evokes profound sorrow and emotional nostalgic yearning',
    'Jazz improvisation celebrates spontaneous creative expression over rigid written structure',
    'Syncopation accents unexpected beats to create infectious dancing grooves',
    'The orchestra tuned instruments before the majestic symphony finally began',
    'Analog synthesizers produce rich organic electrical warmth across stereo monitors',
    'Music can name the unnameable and communicate the unknowable soul',
    'Reverberation creates a sense of vast cathedral physical acoustic space',
    'A catchy musical hook lingers in listeners memory for decades',
    'Dynamic contrast between pianissimo and fortissimo creates thrilling dramatic tension',
    'Singing in four part harmony requires active empathetic collective listening',
  ],
  [
    'Without music life would be an unbearable mistake wrote the philosopher about artistic expression and emotional transcendence',
    'The conductor raised the slender wooden baton and complete breathless silence blanketed the packed three tier concert hall',
    'Polyrhythms layer conflicting time signatures to produce complex hypnotic grooves that captivate audiences and dancers across the globe',
    'Acoustic resonance in wooden string instruments matures gracefully as master violins and cellos age across multiple human centuries',
    'Writing lyrics allows musicians to translate unspoken personal heartbreaks into universal melodies that comfort millions of lonely souls',
  ],
  {
    nouns: ['melody', 'harmony', 'tempo', 'chord', 'rhythm', 'timbre', 'scale', 'symphony', 'acoustic', 'chorus'],
    verbs: ['harmonize', 'improvise', 'compose', 'strum', 'resonate', 'modulate', 'orchestrate', 'record', 'perform', 'master'],
    adjectives: ['melodic', 'acoustic', 'rhythmic', 'sonorous', 'lyrical', 'harmonic', 'expressive', 'dynamic', 'soothing', 'virtuosic'],
    topics: ['choral harmony', 'jazz groove', 'orchestral suite', 'studio session', 'musical poetry', 'sonic tapestry'],
  }
);

// ── 13. SPACE ────────────────────────────────────────────────
makeCategory(
  'space', 'Space Exploration', '🚀', 'Rockets, Mars colonies, cosmic nebulae, and deep space voyages', 16,
  [
    'Rockets blast past clouds', 'Mars has red dust', 'Saturn rings spin slowly', 'Astronauts float in orbit',
    'Telescopes gaze into infinity', 'The countdown has started', 'Engines ignite with roar', 'Shuttle reaches escape velocity',
    'Spacecraft enters lunar orbit', 'Lander touches dusty surface', 'Rover gathers rock samples', 'Spacewalk outside space station',
    'Solar arrays deploy smoothly', 'Cosmonauts view blue planet', 'Earth looks so fragile', 'Orbiting planet every hour',
    'Satellites relay global communications', 'Probes explore deep planets', 'Pluto holds frozen mountains', 'Jupiter storms swirl endlessly',
  ],
  [
    'One small step for man one giant leap mankind',
    'Robotic rovers explore dry ancient lake riverbeds on Mars',
    'The James Webb telescope peers into the early infant cosmos',
    'Gravitational slingshots accelerate scientific probes toward outer distant gas giants',
    'Space stations orbit Earth sixteen times every single calendar day',
    'Supernovae seed the universe with heavy essential chemical life elements',
    'Astronauts experience profound cognitive transformation known as the overview effect',
    'Ion thrusters provide efficient continuous propulsion for interplanetary deep missions',
    'Cryogenic rocket engines burn liquid hydrogen and liquid oxygen violently',
    'Searching for extraterrestrial biosignatures on icy moons like Europa Enceladus',
  ],
  [
    'Somewhere something incredible is waiting to be known in the boundless depths of space and silent cosmic reaches',
    'Voyager one carries a golden record containing greeting sounds and pictures from our home planet into interstellar darkness',
    'Reentering planetary atmosphere generates extreme thermal plasma friction requiring sophisticated ceramic heat shields to survive unharmed',
    'Colonizing distant worlds demands closed loop life support systems capable of recycling air water and nutrients indefinitely without resupply',
    'Cosmic radiation beyond Earth protective magnetosphere poses long term biological challenges for deep space explorers venturing toward Mars',
  ],
  {
    nouns: ['capsule', 'thruster', 'payload', 'orbit', 'trajectory', 'telescope', 'crater', 'lander', 'nebula', 'cosmonaut'],
    verbs: ['launch', 'dock', 'propel', 'navigate', 'explore', 'deploy', 'reenter', 'orbit', 'telemetry', 'calibrate'],
    adjectives: ['interstellar', 'cosmic', 'orbital', 'lunar', 'suborbital', 'extraterrestrial', 'celestial', 'boundless', 'weightless', 'stellar'],
    topics: ['deep space', 'lunar mission', 'orbital science', 'rocket propulsion', 'cosmic frontier', 'interplanetary voyage'],
  }
);

// ── 14. BUSINESS ─────────────────────────────────────────────
makeCategory(
  'business', 'Business & Startups', '💼', 'Venture capital, pitch decks, leadership, and market strategy', 17,
  [
    'Customers always come first', 'Validate your product idea', 'Scale operations with care', 'Cash flow keeps doors',
    'Hire for culture fit', 'Deliver value every day', 'Pitch to angel investors', 'Close the funding round',
    'Build minimum viable product', 'Listen to customer feedback', 'Iterate based on metrics', 'Track key performance indicators',
    'Reduce customer churn rate', 'Improve lifetime customer value', 'Launch marketing campaign today', 'Expand into new markets',
    'Optimize sales conversion funnel', 'Negotiate partnership deal terms', 'Protect intellectual property assets', 'Lead with transparent integrity',
  ],
  [
    'Focus relentlessly on solving a real urgent problem for users',
    'A minimum viable product accelerates empirical learning from real customers',
    'Product market fit is the true engine of sustainable growth',
    'Great company culture attracts and retains exceptional world class talent',
    'Early customer feedback prevents teams from building unwanted software features',
    'Unit economics must turn positive before scaling paid acquisition marketing',
    'Delegating authority empowers team leads to make fast autonomous decisions',
    'Strategic positioning distinguishes your offering in crowded competitive consumer markets',
    'Cash flow management ensures startups survive unexpected macroeconomic winter downturns',
    'Building trust with enterprise clients requires delivering reliable consistent value',
  ],
  [
    'Move fast and iterate quickly while listening attentively to candid criticism and feedback from your earliest passionate adopters',
    'The most successful entrepreneurs embrace calculated risks and view painful initial setbacks as valuable educational data for pivoting',
    'Sustainable competitive advantage stems from proprietary technology strong network effects or enduring brand loyalty developed over decades',
    'Pitch decks must clearly articulate market size customer pain points unique differentiation and transparent path toward profitable scalability',
    'Delegating authority empowers talented team members to solve ambiguous organizational challenges without creating bureaucratic executive bottlenecks',
  ],
  {
    nouns: ['strategy', 'founder', 'revenue', 'metric', 'milestone', 'equity', 'roadmap', 'partnership', 'market', 'dividend'],
    verbs: ['validate', 'scale', 'pivot', 'accelerate', 'negotiate', 'execute', 'streamline', 'optimize', 'fundraise', 'diversify'],
    adjectives: ['profitable', 'scalable', 'strategic', 'innovative', 'disruptive', 'sustainable', 'lucrative', 'agile', 'fiduciary', 'resilient'],
    topics: ['venture capital', 'market expansion', 'startup velocity', 'enterprise growth', 'board governance', 'product strategy'],
  }
);

// ── 15. MYTHOLOGY ────────────────────────────────────────────
makeCategory(
  'mythology', 'Mythology & Legends', '⚡', 'Olympian gods, Norse sagas, mythical beasts, and heroic quests', 18,
  [
    'Zeus hurled bright lightning', 'Thor swung heavy hammer', 'Dragons hoard ancient gold', 'The Phoenix rose again',
    'Heroes face great trials', 'Pegasus flew past clouds', 'Odin sought sacred runes', 'Loki plotted clever mischief',
    'Poseidon commanded ocean waves', 'Athena offered wise counsel', 'Ares marched into war', 'Hades ruled the underworld',
    'Anubis weighed mortal hearts', 'Ra sailed solar barque', 'Scylla lurked in rocks', 'Charybdis swallowed passing ships',
    'Medusa turned men stone', 'Centaur roamed wild woods', 'Minotaur guarded stone maze', 'Theseus followed golden thread',
  ],
  [
    'Pandora opened the forbidden box leaving only hope trapped inside',
    'Icarus flew too close to the blazing melting sun',
    'Achilles possessed invulnerable armor except for his fragile mortal heel',
    'The Minotaur guarded the winding subterranean labyrinth of ancient Crete',
    'Odin traded his eye for eternal divine cosmic wisdom',
    'Valkyries escorted fallen brave warriors to the golden feast halls',
    'Prometheus endured eternal punishment for gifting sacred fire to humanity',
    'Jason and brave Argonauts sailed in search of golden fleece',
    'Perseus used a mirrored shield to defeat the petrifying Gorgon',
    'The Oracle at Delphi spoke riddles foretelling tragic royal fates',
  ],
  [
    'Prometheus defied the Olympian gods to deliver the gift of sacred fire and arts to mortal human civilizations',
    'The golden fleece was guarded by an unsleeping dragon until brave Jason arrived with his band of heroic Argonauts',
    'Ancient myths were symbolic maps guiding early human souls through grief terror romantic devotion and transcendent heroic moral courage',
    'Persephone return to the underworld plunged the earth into icy winter until spring green blossomed upon her joyful emergence',
    'Hercules completed twelve legendary labors demonstrating that mortal perseverance can triumph over divine wrath and monstrous impossible trials',
  ],
  {
    nouns: ['chariot', 'oracle', 'labyrinth', 'relic', 'pantheon', 'spear', 'chalice', 'shield', 'saga', 'prophecy'],
    verbs: ['vanquish', 'prophesy', 'conquer', 'invoke', 'transcend', 'bestow', 'wield', 'inscribe', 'summon', 'manifest'],
    adjectives: ['mythic', 'immortal', 'divine', 'valiant', 'colossal', 'sacred', 'heroic', 'enchanted', 'invincible', 'legendary'],
    topics: ['heroic quest', 'divine retribution', 'epic chronicle', 'sacred prophecy', 'olympian lore', 'norse saga'],
  }
);

// ── 16. SPORTS ───────────────────────────────────────────────
makeCategory(
  'sports', 'Sports & Athletics', '🏆', 'Championship grit, marathon endurance, and athletic glory', 19,
  [
    'Practice beats pure talent', 'Champions train when tired', 'Pass ball to teammate', 'Sprint past finish line',
    'Never give up hope', 'Defense wins big games', 'Score winning goal now', 'Dribble past defenders quickly',
    'Sink free throw shot', 'Hit home run ball', 'Serve ace tennis ball', 'Swim final freestyle lap',
    'Pedal uphill on bike', 'Vault over high bar', 'Stick gymnastics dismount landing', 'Boxer lands decisive punch',
    'Run marathon through rain', 'Lift heavy iron barbell', 'Stretch muscles after workout', 'Hydrate with cool water',
  ],
  [
    'You miss one hundred percent of shots you never take',
    'Hard work beats talent when talent fails to work hard',
    'Gold medals are forged during early morning lonely track workouts',
    'Teamwork divides the effort and multiplies the eventual championship success',
    'Marathon runners hit the wall around mile twenty with fatigue',
    'Great athletes maintain composure under high pressure championship stadium moments',
    'Proper nutrition and restorative sleep accelerate muscular recovery between matches',
    'Mental resilience allows contenders to overcome grueling setbacks and injuries',
    'A disciplined game plan dismantles unpredictable opponents on the court',
    'Sportsmanship honors competitors while pursuing victory with fierce relentless intensity',
  ],
  [
    'I have failed over and over and over again in my athletic career and that is why succeed completely',
    'The thrill of victory and the agony of defeat define the emotional drama of competitive athletics across the globe',
    'Muscles scream for rest during final sprints yet unshakeable mental fortitude pushes runners across the distant finish line',
    'Recovery nutrition adequate sleep and mental visualization are just as crucial as physical drills performed on practice field',
    'A championship team relies on selflessness where every player prioritizes collective victory above individual statistical accolades and praise',
  ],
  {
    nouns: ['stadium', 'medal', 'trophy', 'marathon', 'coach', 'defense', 'sprint', 'jersey', 'whistle', 'athlete'],
    verbs: ['sprint', 'triumph', 'endure', 'rebound', 'outperform', 'train', 'compete', 'overcome', 'persevere', 'dominate'],
    adjectives: ['athletic', 'unyielding', 'vigorous', 'championship', 'tenacious', 'swift', 'agile', 'resilient', 'focused', 'tireless'],
    topics: ['marathon grit', 'championship match', 'athletic training', 'stadium glory', 'defensive rally', 'olympic sprint'],
  }
);

console.log('Batch 3 generated successfully!');
