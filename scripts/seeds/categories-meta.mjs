import { writeCategorySeedFile } from './builder.mjs';

// We have predefined rich core data from seed-20-categories.mjs and seed-neon.mjs
// We'll expand each category systematically to guarantee:
// - 100 Easy (3 to 5 words)
// - 70 Normal (6 to 10 words)
// - 30 Hard (11 to 20 words)

export const CATEGORY_DEFINITIONS = [
  { slug: 'casual', label: 'Casual Daily', icon: '☀️', description: 'Everyday phrases, greetings, and common chatter', display_order: 1 },
  { slug: 'quotes', label: 'Famous Quotes', icon: '💬', description: 'Inspirational quotes and wisdom from historical figures', display_order: 3 },
  { slug: 'programming', label: 'Pro Programming', icon: '💻', description: 'Tech jargon, architecture, engineering lore, and developer wit', display_order: 4 },
  { slug: 'idioms', label: 'Compound Idioms', icon: '🧩', description: 'Tricky English idioms, colorful expressions, and figures of speech', display_order: 5 },
  { slug: 'science', label: 'Science & Cosmos', icon: '🔬', description: 'Astronomy, quantum physics, biology, and the wonder of universe', display_order: 6 },
  { slug: 'cinema', label: 'Cinema & Movies', icon: '🎬', description: 'Iconic movie lines, cinematic craft, and Hollywood lore', display_order: 7 },
  { slug: 'philosophy', label: 'Philosophy & Wisdom', icon: '🏛️', description: 'Stoicism, existentialism, ethics, and timeless meditations', display_order: 8 },
  { slug: 'literature', label: 'Classic Literature', icon: '📚', description: 'Timeless opening lines and prose from world masterworks', display_order: 9 },
  { slug: 'nature', label: 'Nature & Wildlife', icon: '🌲', description: 'Forests, oceans, animal kingdoms, and wilderness landscapes', display_order: 10 },
  { slug: 'history', label: 'World History', icon: '🏺', description: 'Ancient empires, revolutions, treaties, and pivotal historical eras', display_order: 11 },
  { slug: 'gaming', label: 'Video Games', icon: '🎮', description: 'Legendary gaming quotes, arcade culture, and gamer lore', display_order: 12 },
  { slug: 'cybersecurity', label: 'Cybersecurity & Infosec', icon: '🛡️', description: 'Cryptography, firewalls, zero days, threat hunting, and defense', display_order: 13 },
  { slug: 'culinary', label: 'Culinary Arts', icon: '🍳', description: 'Gourmet cooking, secret recipes, aromatic spices, and baking', display_order: 14 },
  { slug: 'music', label: 'Music & Sound', icon: '🎵', description: 'Rhythms, harmonies, orchestral symphonies, and studio craft', display_order: 15 },
  { slug: 'space', label: 'Space Exploration', icon: '🚀', description: 'Rockets, Mars colonies, cosmic nebulae, and deep space voyages', display_order: 16 },
  { slug: 'business', label: 'Business & Startups', icon: '💼', description: 'Venture capital, pitch decks, leadership, and market strategy', display_order: 17 },
  { slug: 'mythology', label: 'Mythology & Legends', icon: '⚡', description: 'Olympian gods, Norse sagas, mythical beasts, and heroic quests', display_order: 18 },
  { slug: 'sports', label: 'Sports & Athletics', icon: '🏆', description: 'Championship grit, marathon endurance, and athletic glory', display_order: 19 },
  { slug: 'travel', label: 'Travel & Wanderlust', icon: '✈️', description: 'Global expeditions, scenic cities, passports, and journeys', display_order: 20 },
  { slug: 'poetry', label: 'Poetry & Verse', icon: '🖋️', description: 'Lyrical rhymes, romantic sonnets, and evocative verses', display_order: 21 },
  { slug: 'ai', label: 'Artificial Intelligence', icon: '🤖', description: 'Neural networks, autonomous agents, and synthetic minds', display_order: 22 },
  { slug: 'architecture', label: 'Architecture & Design', icon: '📐', description: 'Skyscrapers, brutalism, Bauhaus, and spatial harmony', display_order: 23 },
  { slug: 'finance', label: 'Finance & Economics', icon: '📈', description: 'Capital markets, compound interest, assets, and wealth', display_order: 24 },
  { slug: 'wellness', label: 'Mindfulness & Health', icon: '🧘', description: 'Meditation, breathing, physical vitality, and inner peace', display_order: 25 },
];
