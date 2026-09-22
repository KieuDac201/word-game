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

export const ieltsCategory = {
  slug: 'ielts',
  label: 'IELTS Academic',
  icon: '🎓',
  description: 'Academic vocabulary, essay arguments, and collocations',
  display_order: 2,
};

// ── 100 Easy Sentences (3-5 words) ──
export const ieltsEasy = [
  'Education fosters critical thinking',
  'Technology transforms modern society',
  'Climate change threatens biodiversity',
  'Governments should fund healthcare',
  'Globalization encourages cultural exchange',
  'Urbanization causes traffic congestion',
  'Renewable energy reduces pollution',
  'Reading expands personal vocabulary',
  'Research requires rigorous evidence',
  'Universities promote academic excellence',
  'Tourism boosts local economies',
  'Public transport reduces emissions',
  'Children learn through imitation',
  'Exercise improves mental health',
  'Strict laws deter crime',
  'Fast food harms health',
  'Advertising influences consumer choices',
  'Art enriches human culture',
  'Language shapes human thought',
  'Automation creates new jobs',
  'Wealth gap is widening',
  'Parents guide young children',
  'Schools nurture future leaders',
  'Science drives human progress',
  'Fossil fuels are finite',
  'Poverty hinders social mobility',
  'Clean water is vital',
  'Diet influences long lifespan',
  'Sleep enhances brain memory',
  'Stress reduces work productivity',
  'Teamwork produces better results',
  'Competition drives creative innovation',
  'Media affects public perception',
  'Deforestation destroys wildlife habitats',
  'Global trade creates wealth',
  'Higher taxes fund infrastructure',
  'Remote work offers flexibility',
  'Libraries preserve historical knowledge',
  'Museums safeguard cultural heritage',
  'Discipline ensures academic success',
  'Online learning increases accessibility',
  'Solar panels generate power',
  'Electric vehicles reduce pollution',
  'Physical fitness boosts immunity',
  'Overpopulation strains municipal resources',
  'Censorship restricts free speech',
  'Recycling minimizes plastic waste',
  'Healthy habits prolong life',
  'Financial literacy prevents debt',
  'Scholarships support underprivileged students',
  'Evidence supports this hypothesis',
  'Studies show positive correlations',
  'Statistics illustrate upward trends',
  'Data reveals significant differences',
  'Experts advocate sustainable development',
  'Economists predict steady growth',
  'Researchers conducted extensive surveys',
  'Critics question these findings',
  'Proponents argue for reform',
  'Opponents cite safety concerns',
  'The graph shows growth',
  'Sales peaked in December',
  'Figures dropped sharply recently',
  'Numbers fluctuate throughout year',
  'Rates remained remarkably stable',
  'Income increased by twenty',
  'Trends indicate steady rise',
  'Population grew rapidly worldwide',
  'Costs surged during winter',
  'Prices leveled off gradually',
  'First and foremost consider',
  'In contrast however consider',
  'On the other hand',
  'Taking into account factors',
  'As a direct consequence',
  'In light of evidence',
  'With respect to economy',
  'Contrary to popular belief',
  'In summary we observe',
  'It is widely acknowledged',
  'Hard work yields success',
  'Mentors inspire young learners',
  'Books broaden cultural horizons',
  'Travel fosters mutual understanding',
  'Traditions preserve national identity',
  'Innovation solves difficult problems',
  'Curiosity fuels scientific discovery',
  'Motivation drives academic achievement',
  'Knowledge empowers individuals worldwide',
  'Collaboration solves complex challenges',
  'Equal opportunity promotes fairness',
  'Healthcare is fundamental right',
  'Green spaces enhance wellbeing',
  'Walking improves cardiovascular fitness',
  'Creativity enriches everyday life',
  'Balanced nutrition prevents illness',
  'Literacy breaks poverty cycles',
  'Clean air promotes longevity',
  'Ethical standards guide scientists',
  'Education transforms entire communities',
];

// ── 70 Normal Sentences (6-10 words) ──
export const ieltsNormal = [
  'There is a positive correlation between education and income',
  'Governments must allocate more funding to public transport systems',
  'The table illustrates changes in household expenditure over time',
  'Proponents argue that nuclear power provides reliable green energy',
  'Many developing countries face severe shortages of qualified doctors',
  'The rapid rise of artificial intelligence raises ethical questions',
  'Excessive screen time can impair cognitive development in children',
  'Higher education should be accessible to all qualified applicants',
  'Tourism often causes irreversible environmental damage to pristine ecosystems',
  'The bar chart compares literacy rates across five continents',
  'Strict government regulations are necessary to curb industrial emissions',
  'Flexible working hours can significantly improve employee job satisfaction',
  'Preserving endangered languages protects rich cultural wisdom and heritage',
  'Rapid urbanisation places immense pressure on municipal water supplies',
  'Vocational training equips young adults with practical employment skills',
  'The proportion of elderly citizens has increased markedly worldwide',
  'Consumers are increasingly demanding ethically sourced and organic products',
  'International collaboration is indispensable for combating global climate change',
  'Investing in early childhood education yields lifelong societal benefits',
  'The pie charts demonstrate regional energy consumption by source',
  'Many species face extinction due to rampant deforestation activities',
  'Remote learning offers unprecedented convenience for non traditional learners',
  'Economic globalization has transformed national labor markets across continents',
  'A balanced diet and regular physical exercise prevent illness',
  'Wealth inequality continues to pose significant threats to cohesion',
  'Public awareness campaigns can discourage wasteful single use plastics',
  'Fast food consumption contributes directly to escalating obesity rates',
  'The line graph depicts unemployment trends over ten years',
  'High living costs force many young graduates into debt',
  'Renewable resources such as solar and wind are inexhaustible',
  'Social media platforms often amplify political polarization among citizens',
  'Autonomous vehicles could drastically reduce highway fatalities and accidents',
  'Apprenticeships offer valuable hands on experience in technical trades',
  'Implementing congestion charges discourages unnecessary private vehicular commuting',
  'The percentage of female university graduates rose steadily throughout',
  'Biodiversity loss threatens the stability of natural food chains',
  'Traditional customs provide a vital sense of community belonging',
  'Governments should subsidize green energy technologies to lower costs',
  'Space exploration fosters groundbreaking scientific discoveries for all mankind',
  'Regular physical activity reduces chronic stress and mental fatigue',
  'Overfishing has severely depleted marine populations in international waters',
  'Affordable housing remains a pressing crisis in major capitals',
  'Access to clean sanitation facilities is an undeniable right',
  'The diagram outlines the multi stage manufacturing recycling process',
  'Critical thinking allows students to evaluate complex societal arguments',
  'Financial literacy curricula should be mandatory in secondary schools',
  'International student exchanges promote diplomacy and mutual cultural understanding',
  'Carbon pricing mechanisms incentivize corporations to adopt cleaner practices',
  'Extensive homework assignments can induce excessive stress in adolescents',
  'Genetic engineering holds tremendous promise for drought resistant agriculture',
  'Cultural diversity enriches metropolitan societies through varied artistic perspectives',
  'The flow chart explains how water is purified industrially',
  'Mental health awareness must be prioritized across modern workplaces',
  'Telecommuting reduces traffic jams and daily carbon footprint emissions',
  'Excessive commercial advertising promotes an unsustainable consumerist lifestyle worldwide',
  'Modern architectural designs increasingly embrace energy efficient solar materials',
  'High tariffs on imported goods can trigger international disputes',
  'Preserving historic monuments fosters tourism and national historical pride',
  'Children who read daily develop superior verbal communication abilities',
  'Industrial automation displaces routine manual labor while creating specializations',
  'Effective leadership demands emotional intelligence alongside strategic technical competence',
  'The statistics reveal noticeable disparities between rural and urban',
  'Universal basic income could alleviate extreme poverty in societies',
  'Public libraries serve as indispensable community hubs for learning',
  'Deforestation accelerates global warming by releasing stored terrestrial carbon',
  'Multinational corporations should bear responsibility for their environmental footprints',
  'Early bilingual education enhances cognitive agility and problem solving',
  'The sales figure experienced a dramatic downturn during autumn',
  'Adequate sleep is vital for neural consolidation and memory',
  'Sustainable agricultural practices safeguard fertile soil for future generations',
];

// ── 30 Hard Sentences (11-20 words) ──
export const ieltsHard = [
  'It is often argued that universities should prioritize vocational training over purely theoretical academic disciplines',
  'While some contend that technological advancements foster isolation others maintain they enhance global interconnectedness across borders',
  'Although economic expansion generates material prosperity it frequently exacerbates socioeconomic inequality and accelerates severe environmental degradation',
  'The bar chart illustrates the dramatic divergence between renewable energy investments and traditional fossil fuel subsidies',
  'A significant proportion of modern urban dwellers report experiencing isolation despite living within densely populated metropolitan centers',
  'Proponents advocate for universal healthcare arguing that medical well being constitutes a fundamental human right for everyone',
  'Conversely opponents maintain that privatized medical systems encourage scientific innovation and deliver superior clinical efficiency to patients',
  'In conclusion while autonomous technologies may displace manual labor they simultaneously cultivate novel high skilled technical professions',
  'The line graph demonstrates that carbon emissions experienced a meteoric increase before finally plateauing in recent decades',
  'To mitigate climate change international governing bodies must implement stringent binding emissions targets across industrialized economies globally',
  'Access to tertiary education ought not to be contingent upon an applicant socioeconomic background or financial status',
  'Despite substantial financial investments into public transport infrastructure automobile congestion remains an intractable dilemma in megacities',
  'Excessive dependency on synthetic fertilizers degrades delicate soil ecosystems leading to long term decreases in agricultural productivity',
  'Extensive academic literature confirms that maternal education exerts an overwhelmingly positive impact upon child mortality rates globally',
  'Rather than imposing punitive custodial sentences judicial systems should emphasize rehabilitative programs to curtail recidivism among offenders',
  'The demographic transition toward aging populations imposes unprecedented fiscal burdens upon national pension and medical welfare systems',
  'Globalization enables developing nations to access international capital markets yet it exposes vulnerable domestic industries to competition',
  'It is widely acknowledged that preserving linguistic diversity is quintessential for safeguarding indigenous traditions and ancestral knowledge',
  'While renewable energy sources like wind and solar are sustainable their intermittent generation necessitates massive battery storage',
  'Governments must strike a delicate equilibrium between promoting industrial deregulation and enforcing rigorous consumer safety and environmental protections',
  'The illustration delineates the sequential cyclical procedure through which plastic waste is recycled into consumer textiles',
  'In summary the aforementioned evidence indicates that early pedagogical intervention yields profound dividends for subsequent cognitive development',
  'Urban green spaces not only temper the urban heat island effect but also foster indispensable psychological tranquility',
  'Although censorship is occasionally defended on national security grounds it inherently undermines journalistic freedom and democratic accountability',
  'Rapid automation across manufacturing sectors necessitates comprehensive retraining programs to prevent prolonged structural unemployment among blue collar workers',
  'Many sociologists argue that social media algorithms intentionally prioritize sensationalist content thereby fragmenting public discourse into polarized echo chambers',
  'The data reveals that domestic household consumption surged remarkably following the implementation of targeted government economic stimulus packages',
  'Addressing persistent gender disparities within science and engineering disciplines requires proactive institutional recruitment strategies alongside mentorship initiatives',
  'While international travel broadens cultural appreciation excessive commercial tourism can irrevocably despoil fragile coastal habitats and historic architectures',
  'To summarize although globalization poses cultural homogenization risks it simultaneously accelerates cross cultural synthesis and mutual tolerance worldwide',
];

async function run() {
  console.log('1. Upserting IELTS category with order 2...');

  // Shift other categories with order >= 2 by 1 to make clean space for IELTS at order 2
  await sql`
    UPDATE categories 
    SET display_order = display_order + 1 
    WHERE display_order >= 2 AND slug != 'ielts';
  `;

  // Upsert ielts category
  await sql`
    INSERT INTO categories (slug, label, icon, description, display_order)
    VALUES (${ieltsCategory.slug}, ${ieltsCategory.label}, ${ieltsCategory.icon}, ${ieltsCategory.description}, ${ieltsCategory.display_order})
    ON CONFLICT (slug) DO UPDATE
    SET label = EXCLUDED.label,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        display_order = ${ieltsCategory.display_order};
  `;

  console.log('2. Inserting 200 IELTS sentences (100 easy, 70 normal, 30 hard)...');

  const allSentences = [
    ...ieltsEasy.map((text) => ({ text, diff: 'easy' })),
    ...ieltsNormal.map((text) => ({ text, diff: 'normal' })),
    ...ieltsHard.map((text) => ({ text, diff: 'hard' })),
  ];

  let totalInserted = 0;
  const counts = { easy: 0, normal: 0, hard: 0 };

  for (const item of allSentences) {
    const wordCount = item.text.trim().split(/\s+/).length;
    counts[item.diff]++;

    await sql`
      INSERT INTO sentences (category_slug, text, word_count, difficulty)
      VALUES ('ielts', ${item.text}, ${wordCount}, ${item.diff})
      ON CONFLICT (category_slug, text) DO UPDATE
      SET word_count = EXCLUDED.word_count,
          difficulty = EXCLUDED.difficulty;
    `;
    totalInserted++;
  }

  // Verification
  const catRes = await sql`
    SELECT slug, label, icon, display_order FROM categories WHERE slug = 'ielts';
  `;
  const senRes = await sql`
    SELECT difficulty, COUNT(*)::int AS count 
    FROM sentences 
    WHERE category_slug = 'ielts' 
    GROUP BY difficulty;
  `;
  const totalCount = await sql`
    SELECT COUNT(*)::int AS total FROM sentences WHERE category_slug = 'ielts';
  `;

  console.log(`✅ Success! Category:`, catRes[0]);
  console.log(`📊 Sentences inserted: ${totalInserted}`);
  console.log(`📈 Breakdown in DB:`, senRes);
  console.log(`🎉 Total sentences in 'ielts': ${totalCount[0].total}`);
}

if (process.argv[1]?.endsWith('seed-ielts-200.mjs')) {
  run().catch((err) => {
    console.error('Error seeding IELTS category:', err);
    process.exit(1);
  });
}
