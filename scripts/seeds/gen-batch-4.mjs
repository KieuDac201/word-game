import { writeCategorySeedFile } from './builder.mjs';

function makeCategory(slug, label, icon, desc, order, easySeed, normalSeed, hardSeed, vocab) {
  const easy = [...easySeed];
  const normal = [...normalSeed];
  const hard = [...hardSeed];

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

// ── 17. TRAVEL & WANDERLUST ──────────────────────────────────
makeCategory(
  'travel', 'Travel & Wanderlust', '✈️', 'Global expeditions, scenic cities, passports, and journeys', 20,
  [
    'Pack bags for adventure', 'Explore ancient cobblestone streets', 'Sunsets over tropical beaches', 'Travel opens your mind',
    'Passports collect colorful stamps', 'Wander off beaten path', 'Board the morning flight', 'Climb high mountain trails',
    'Sail across sapphire waters', 'Discover quiet hidden cafes', 'Photograph picturesque historic plazas', 'Taste street food dishes',
    'Meet friendly local people', 'Hear foreign language greetings', 'Watch sunrise over temples', 'Walk through bustling bazaars',
    'Camp under starry skies', 'Ride scenic alpine trains', 'Marvel at towering glaciers', 'Cherish lifelong travel memories',
  ],
  [
    'The world is an open book for adventurous lifelong travelers',
    'Boarding a night train into unfamiliar mountain territory brings excitement',
    'Local street food night markets reveal the true culinary soul cities',
    'Getting lost in Venice leads to enchanting quiet forgotten canals',
    'Catching sunrise over mist covered Buddhist temple spires inspires awe',
    'Memories gathered while traveling outlive any material possessions you purchase',
    'Navigating bustling foreign transit systems builds confidence and personal independence',
    'A scenic coastal road trip offers spontaneous detour discoveries daily',
    'Immersing yourself in local customs deepens cross cultural empathy worldwide',
    'Traveling with an open heart transforms ordinary encounters into friendships',
  ],
  [
    'Not until we are lost do we begin to understand ourselves and the vast beautiful world around us',
    'Backpacking across foreign continents teaches resilience adaptability and gratitude for everyday comforts often taken for granted at home',
    'The smell of fresh morning espresso on a Parisian boulevard awakens memories of carefree European summers spent wandering cobblestone streets',
    'Traveling reminds us that beneath different languages and traditions all humans share similar hopes fears and universal desires for peace',
    'Standing before towering glacial fjords makes one realize how small and fragile our footprint truly is upon ancient majestic Earth',
  ],
  {
    nouns: ['journey', 'passport', 'voyage', 'destination', 'itinerary', 'expedition', 'harbor', 'glacier', 'trail', 'horizon'],
    verbs: ['explore', 'discover', 'traverse', 'navigate', 'wander', 'uncover', 'embark', 'journey', 'document', 'witness'],
    adjectives: ['panoramic', 'exotic', 'breathtaking', 'scenic', 'adventurous', 'picturesque', 'ancient', 'remote', 'tranquil', 'coastal'],
    topics: ['wanderlust voyage', 'global travel', 'mountain expedition', 'scenic getaway', 'cultural immersion', 'nomadic journey'],
  }
);

// ── 18. POETRY & VERSE ───────────────────────────────────────
makeCategory(
  'poetry', 'Poetry & Verse', '🖋️', 'Lyrical rhymes, romantic sonnets, and evocative verses', 21,
  [
    'Rose petals fall softly', 'Stars whisper at night', 'Shadows dance in moonlight', 'Hope has gentle feathers',
    'Rivers hum sweet tunes', 'Time flows like water', 'Morning dew greets dawn', 'Autumn winds sigh gently',
    'Candle flickers in dark', 'Silence speaks to sorrow', 'Golden leaves drift down', 'Moonlight silver on sea',
    'Echoes fade across hills', 'A lonely bird sings', 'Dreams wake with sunrise', 'Words woven like tapestry',
    'Heart beats in rhythm', 'Rain taps window pane', 'Gentle breeze stirs branches', 'Beauty lingers in silence',
  ],
  [
    'Two roads diverged in a yellow quiet autumn wood',
    'I took the one less traveled by today',
    'Shall I compare thee to a summer warm day',
    'Do not go gentle into that good night',
    'Rage against the dying of the fading light',
    'The woods are lovely dark and deep tonight',
    'Because I could not stop for death he stopped',
    'Tell me what you plan to do with life',
    'Poetry is the rhythmical creation of beauty through language',
    'Hope is the thing with feathers that perches soul',
  ],
  [
    'Because I could not stop for death he kindly stopped for me along the slow carriage ride through town',
    'Water water everywhere nor any drop to drink lamented the weary sailor on open vast and desolate oceans',
    'Tell me what is it you plan to do with your one wild and precious life under the sun',
    'Poetry is the rhythmical creation of beauty through language that touches the most guarded and vulnerable human hearts',
    'In the desert I saw a creature naked bestial who squatting upon the ground ate his own burning heart',
  ],
  {
    nouns: ['verse', 'stanza', 'rhyme', 'sonnet', 'metaphor', 'rhythm', 'whisper', 'shadow', 'twilight', 'melody'],
    verbs: ['whisper', 'awaken', 'resonate', 'echo', 'breathe', 'illuminate', 'caress', 'quiver', 'transcend', 'enchant'],
    adjectives: ['lyrical', 'ethereal', 'poetic', 'melodic', 'haunting', 'wistful', 'golden', 'tender', 'radiant', 'melancholic'],
    topics: ['poetic verse', 'moonlit sonnet', 'lyrical rhyme', 'twilight stanza', 'silent rhythm', 'whispering wind'],
  }
);

// ── 19. ARTIFICIAL INTELLIGENCE ──────────────────────────────
makeCategory(
  'ai', 'Artificial Intelligence', '🤖', 'Neural networks, autonomous agents, and synthetic minds', 22,
  [
    'Machines learn from data', 'Neural nets recognize patterns', 'Prompts steer language models', 'Robots navigate warehouse floors',
    'Algorithms optimize complex routes', 'Compute scales intelligence up', 'Weights update during training', 'Loss function minimizes errors',
    'Embeddings capture semantic meaning', 'Transformers attend to tokens', 'Fine tune pretrained models', 'Diffusion generates photorealistic images',
    'Reinforcement learning optimizes rewards', 'Agents collaborate to solve', 'Compute gradients with backpropagation', 'GPUs accelerate matrix calculations',
    'Computer vision detects tumors', 'Speech models transcribe audio', 'Evaluate benchmark test accuracy', 'Deploy inference at edge',
  ],
  [
    'Deep learning models process billions of statistical parameters effortlessly',
    'Reinforcement learning trains autonomous agents through iterative feedback rewards',
    'Transformer architecture revolutionized natural language processing capabilities globally worldwide',
    'Autonomous vehicles interpret lidar and camera vision streams in realtime',
    'Synthetic intelligence assists researchers in folding complex biological proteins',
    'Computer vision detects microscopic cellular tumors faster than human doctors',
    'Large language models synthesize vast repositories of human written knowledge',
    'Neural networks learn hierarchical feature representations directly from raw data',
    'Prompt engineering guides foundation models toward producing structured verifiable outputs',
    'Ethical AI governance ensures fairness accountability and transparency across deployments',
  ],
  [
    'Can machines think was the famous provocative question posed by Alan Turing at dawn of modern digital computation',
    'Large language models predict upcoming tokens based on probabilities learned from trillions of written words across global internet',
    'Aligning advanced artificial intelligence with human values remains one of the most critical and challenging tasks of century',
    'Diffusion models generate photorealistic artwork by reversing a gradual process of adding Gaussian noise to pristine training images',
    'Edge computing enables lightweight neural networks to perform inference directly on consumer smartphones without requiring cloud server roundtrips',
  ],
  {
    nouns: ['neuron', 'tensor', 'gradient', 'token', 'embedding', 'transformer', 'dataset', 'parameter', 'inference', 'latency'],
    verbs: ['converge', 'synthesize', 'optimize', 'generalize', 'classify', 'backpropagate', 'predict', 'align', 'fine-tune', 'quantize'],
    adjectives: ['neural', 'algorithmic', 'autonomous', 'generative', 'predictive', 'synthetic', 'probabilistic', 'intelligent', 'scalable', 'latent'],
    topics: ['machine intelligence', 'neural architecture', 'gradient descent', 'foundation model', 'autonomous agent', 'deep learning'],
  }
);

// ── 20. ARCHITECTURE & DESIGN ────────────────────────────────
makeCategory(
  'architecture', 'Architecture & Design', '📐', 'Skyscrapers, brutalism, Bauhaus, and spatial harmony', 23,
  [
    'Form follows intended function', 'Arches distribute heavy loads', 'Concrete and steel rise', 'Skylights flood rooms sunshine',
    'Minimalism embraces clean space', 'Blueprints guide the builders', 'Columns support marble roof', 'Cantilevers extend over cliffs',
    'Timber beams span ceilings', 'Glass facades reflect clouds', 'Geometric symmetry pleases eye', 'Atrium brings natural light',
    'Staircases spiral toward sky', 'Vaulted ceilings echo footsteps', 'Brutalist concrete shows texture', 'Gothic arches reach high',
    'Flying buttresses support walls', 'Domes distribute stress evenly', 'Sustainable design saves energy', 'Renovate historic brick buildings',
  ],
  [
    'Good architectural design is as little design as possible',
    'Flying buttresses allowed gothic cathedrals soaring stained glass windows',
    'Natural ambient lighting transforms the emotional quality of interior spaces',
    'Brutalist buildings showcase raw exposed textured poured architectural concrete',
    'Sustainable architecture incorporates passive solar heating and natural cross ventilation',
    'Cantilever balconies appear to defy gravity over steep cliffside drops',
    'The Bauhaus movement unified fine craftsmanship with industrial mass manufacturing',
    'Urban architects design pedestrian friendly plazas to foster community connection',
    'Acoustic design ensures sound distributes warmly throughout concert hall auditoriums',
    'Proportion scale and rhythm define the architectural character of structures',
  ],
  [
    'Architecture is frozen music composed of physical proportions materials shadows and the subtle interplay of natural ambient light',
    'The Bauhaus movement unified fine craftsmanship with industrial mass production to create functional elegant objects for everyday human life',
    'Urban planners design walkable neighborhoods with green parks to foster healthy social connections among diverse metropolitan city residents',
    'Geodesic domes distribute stress evenly across interlocking triangular facets creating incredibly strong and lightweight structural building enclosures',
    'Restoring historic brick facades preserves cultural heritage while integrating modern energy efficient thermal insulation within ancient masonry walls',
  ],
  {
    nouns: ['facade', 'cantilever', 'arch', 'blueprint', 'scaffold', 'column', 'atrium', 'dome', 'pediment', 'colonnade'],
    verbs: ['construct', 'engineer', 'sculpt', 'articulate', 'balance', 'renovate', 'elevate', 'proportion', 'integrate', 'harmonize'],
    adjectives: ['geometric', 'structural', 'brutalist', 'minimalist', 'gothic', 'monumental', 'sustainable', 'spatial', 'cantilevered', 'ornate'],
    topics: ['spatial design', 'urban planning', 'structural engineering', 'monumental craft', 'bauhaus design', 'modernist form'],
  }
);

// ── 21. FINANCE & ECONOMICS ──────────────────────────────────
makeCategory(
  'finance', 'Finance & Economics', '📈', 'Capital markets, compound interest, assets, and wealth', 24,
  [
    'Compound interest builds wealth', 'Diversify your investment portfolio', 'Save before you spend', 'Inflation erodes purchasing power',
    'Assets generate passive income', 'Budget every single dollar', 'Stocks represent business ownership', 'Bonds yield steady interest',
    'Reinvest dividend cash payments', 'Dollar cost average monthly', 'Emergency fund brings security', 'Live below your means',
    'Pay down high debt', 'Track net worth growth', 'Automate monthly retirement savings', 'Index funds beat stockpicking',
    'Bull markets climb walls', 'Bear markets test conviction', 'Compound interest eighth wonder', 'Patience pays massive dividends',
  ],
  [
    'Do not put all your financial eggs in one basket',
    'Index funds provide low cost broad market diversification for investors',
    'Supply and demand dictate market equilibrium pricing levels across industries',
    'Liquidity allows prudent investors to convert assets to cash quickly',
    'Time in the market beats timing the volatile stock market',
    'Central banks raise interest rates to cool overheating economic inflation',
    'A disciplined budget provides freedom and eliminates lingering financial anxiety',
    'Compound interest accelerates asset growth dramatically over long multi decades',
    'Real estate investment provides tangible collateral and recurring rental yields',
    'Diversification mitigates idiosyncratic portfolio risk without sacrificing long term returns',
  ],
  [
    'Compound interest is the eighth wonder of the world he who understands it earns it pays it',
    'Dollar cost averaging reduces the psychological stress of investing by purchasing shares at regular disciplined intervals regardless of volatility',
    'A bull market climbs a wall of worry while bear markets test the emotional conviction and discipline of prudent investors',
    'Emergency funds covering six months of essential living expenses protect households from sudden unexpected economic shocks or employment disruptions',
    'Understanding balance sheets cash flow statements and income reports is fundamental to analyzing the intrinsic long term health of businesses',
  ],
  {
    nouns: ['dividend', 'portfolio', 'asset', 'equity', 'yield', 'capital', 'index', 'valuation', 'ledger', 'balance'],
    verbs: ['compound', 'diversify', 'invest', 'rebalance', 'allocate', 'accrue', 'hedge', 'audit', 'appreciate', 'amortize'],
    adjectives: ['fiduciary', 'liquid', 'fiscal', 'compound', 'equitable', 'lucrative', 'diversified', 'solvent', 'monetary', 'prudent'],
    topics: ['capital markets', 'asset allocation', 'wealth generation', 'economic policy', 'portfolio yield', 'fiscal discipline'],
  }
);

// ── 22. MINDFULNESS & HEALTH ─────────────────────────────────
makeCategory(
  'wellness', 'Mindfulness & Health', '🧘', 'Meditation, breathing, physical vitality, and inner peace', 25,
  [
    'Inhale peace exhale tension', 'Drink clean fresh water', 'Sleep heals body mind', 'Walk outside in nature',
    'Breathe deeply right now', 'Be present this moment', 'Notice your breathing rhythm', 'Relax your shoulder muscles',
    'Release mental heavy clutter', 'Practice gratitude every morning', 'Listen to your body', 'Stretch muscles upon waking',
    'Eat wholesome nourishing meals', 'Drink calming herbal tea', 'Soak in warm bath', 'Rest in quiet stillness',
    'Let go of worries', 'Embrace calm peaceful thoughts', 'Smile with gentle heart', 'Kindness starts with yourself',
  ],
  [
    'Quiet your mind and the soul will speak soft wisdom',
    'Consistent restful sleep restores physical vitality and sharp mental focus',
    'Mindfulness is paying attention on purpose without harsh critical judgment',
    'Gratitude turns what we currently have into more than enough',
    'Stretching tight muscles relieves tension accumulated during prolonged desk work',
    'Disconnecting from digital screens promotes calmer restful thoughts before bedtime',
    'Deep diaphragmatic breathing activates the body parasympathetic calming nervous system',
    'Taking short mindful walks outdoors rejuvenates energy during demanding workdays',
    'Self compassion is treating yourself with kindness during challenging painful moments',
    'A peaceful morning routine grounds your energy for the day ahead',
  ],
  [
    'You cannot stop the turbulent waves of life but you can certainly learn how to surf them with grace',
    'Taking five slow deep breaths activates the parasympathetic nervous system reducing stress hormones and calming rapid heart rate naturally',
    'True wellness is not merely the absence of illness but dynamic state of physical mental emotional and spiritual vitality',
    'Setting healthy personal boundaries allows individuals to protect their emotional energy and nurture relationships that truly enrich their lives',
    'A mindful morning routine of silent meditation gentle stretching and mindful warm tea sets a grounded peaceful tone for the day',
  ],
  {
    nouns: ['breath', 'vitality', 'serenity', 'meditation', 'balance', 'clarity', 'mindfulness', 'posture', 'nourishment', 'gratitude'],
    verbs: ['inhale', 'restore', 'rejuvenate', 'center', 'meditate', 'nourish', 'unwind', 'breathe', 'harmonize', 'ground'],
    adjectives: ['serene', 'tranquil', 'mindful', 'restorative', 'holistic', 'calming', 'grounded', 'rejuvenating', 'peaceful', 'vital'],
    topics: ['inner peace', 'breathwork practice', 'mental clarity', 'physical vitality', 'mindful living', 'restorative calm'],
  }
);

console.log('Batch 4 generated successfully!');
