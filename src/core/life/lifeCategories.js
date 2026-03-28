/**
 * lifeCategories.js — Pure data. All life activity types with metadata.
 *
 * Each activity defines: id, label, category, defaultDuration (minutes),
 * icon, energyZoneAffinity (which energy zones it fits best), color.
 */

export const LIFE_CATEGORIES = [
  { id: 'fitness',     label: 'Fitness',      icon: '💪' },
  { id: 'wellness',    label: 'Wellness',     icon: '🧘' },
  { id: 'nutrition',   label: 'Nutrition',    icon: '🍽' },
  { id: 'personalDev', label: 'Growth',       icon: '📖' },
  { id: 'social',      label: 'Social',       icon: '👥' },
  { id: 'recovery',    label: 'Recovery',     icon: '☕' },
  { id: 'planning',    label: 'Planning',     icon: '📋' },
];

export const LIFE_ACTIVITIES = [
  // ── Fitness ──────────────────────────────────────────────────────────────────
  { id: 'fitness-gym',        label: 'Gym',         category: 'fitness',     defaultDuration: 60,  icon: '🏋️', energyZoneAffinity: ['moderate', 'high'],            color: '#6fcf97' },
  { id: 'fitness-running',    label: 'Running',     category: 'fitness',     defaultDuration: 40,  icon: '🏃', energyZoneAffinity: ['moderate', 'high'],            color: '#6fcf97' },
  { id: 'fitness-yoga',       label: 'Yoga',        category: 'fitness',     defaultDuration: 45,  icon: '🧘', energyZoneAffinity: ['low', 'moderate', 'recovery'], color: '#a78bfa' },
  { id: 'fitness-stretching', label: 'Stretching',  category: 'fitness',     defaultDuration: 15,  icon: '🤸', energyZoneAffinity: ['low', 'recovery'],             color: '#a78bfa' },
  { id: 'fitness-walk',       label: 'Walk',        category: 'fitness',     defaultDuration: 20,  icon: '🚶', energyZoneAffinity: ['low', 'moderate', 'recovery'], color: '#34d399' },
  { id: 'fitness-cycling',    label: 'Cycling',     category: 'fitness',     defaultDuration: 45,  icon: '🚴', energyZoneAffinity: ['moderate', 'high'],            color: '#6fcf97' },
  { id: 'fitness-swimming',   label: 'Swimming',    category: 'fitness',     defaultDuration: 45,  icon: '🏊', energyZoneAffinity: ['moderate', 'high'],            color: '#3b82f6' },

  // ── Wellness ─────────────────────────────────────────────────────────────────
  { id: 'wellness-meditation',  label: 'Meditation',   category: 'wellness', defaultDuration: 15, icon: '🧠', energyZoneAffinity: ['low', 'recovery'],             color: '#a78bfa' },
  { id: 'wellness-breathing',   label: 'Breathing',    category: 'wellness', defaultDuration: 5,  icon: '🌬', energyZoneAffinity: ['low', 'moderate', 'recovery'], color: '#a78bfa' },
  { id: 'wellness-cold-shower', label: 'Cold Shower',  category: 'wellness', defaultDuration: 10, icon: '🚿', energyZoneAffinity: ['moderate'],                    color: '#22d3ee' },
  { id: 'wellness-nap',         label: 'Power Nap',   category: 'wellness', defaultDuration: 20, icon: '😴', energyZoneAffinity: ['low'],                         color: '#3b82f6' },
  { id: 'wellness-journal',     label: 'Journaling',  category: 'wellness', defaultDuration: 15, icon: '📝', energyZoneAffinity: ['low', 'recovery'],             color: '#f59e0b' },
  { id: 'wellness-gratitude',   label: 'Gratitude',   category: 'wellness', defaultDuration: 5,  icon: '🙏', energyZoneAffinity: ['recovery'],                    color: '#f59e0b' },

  // ── Nutrition ────────────────────────────────────────────────────────────────
  { id: 'nutrition-breakfast', label: 'Breakfast',  category: 'nutrition', defaultDuration: 20, icon: '🥣', energyZoneAffinity: ['moderate'],              color: '#f59e0b' },
  { id: 'nutrition-lunch',     label: 'Lunch',      category: 'nutrition', defaultDuration: 40, icon: '🍽', energyZoneAffinity: ['low', 'moderate'],       color: '#f59e0b' },
  { id: 'nutrition-dinner',    label: 'Dinner',     category: 'nutrition', defaultDuration: 45, icon: '🍷', energyZoneAffinity: ['low', 'recovery'],       color: '#f59e0b' },
  { id: 'nutrition-cooking',   label: 'Cooking',    category: 'nutrition', defaultDuration: 45, icon: '👨‍🍳', energyZoneAffinity: ['moderate', 'recovery'], color: '#f59e0b' },
  { id: 'nutrition-mealprep',  label: 'Meal Prep',  category: 'nutrition', defaultDuration: 60, icon: '🥗', energyZoneAffinity: ['moderate'],              color: '#f59e0b' },
  { id: 'nutrition-snack',     label: 'Snack Break', category: 'nutrition', defaultDuration: 10, icon: '🍎', energyZoneAffinity: ['low', 'moderate'],      color: '#f59e0b' },

  // ── Personal Development ─────────────────────────────────────────────────────
  { id: 'dev-reading',     label: 'Reading',          category: 'personalDev', defaultDuration: 30, icon: '📖', energyZoneAffinity: ['low', 'moderate', 'recovery'], color: '#6b7cff' },
  { id: 'dev-learning',    label: 'Learning / Course', category: 'personalDev', defaultDuration: 45, icon: '🎓', energyZoneAffinity: ['moderate', 'high'],          color: '#6b7cff' },
  { id: 'dev-language',    label: 'Language Practice', category: 'personalDev', defaultDuration: 20, icon: '🗣', energyZoneAffinity: ['moderate'],                   color: '#6b7cff' },
  { id: 'dev-sideproject', label: 'Side Project',     category: 'personalDev', defaultDuration: 60, icon: '🔧', energyZoneAffinity: ['high', 'peak'],               color: '#6b7cff' },
  { id: 'dev-podcast',     label: 'Podcast',          category: 'personalDev', defaultDuration: 30, icon: '🎧', energyZoneAffinity: ['low', 'moderate'],             color: '#6b7cff' },
  { id: 'dev-writing',     label: 'Writing',          category: 'personalDev', defaultDuration: 30, icon: '✍️', energyZoneAffinity: ['moderate', 'high'],            color: '#6b7cff' },

  // ── Social ───────────────────────────────────────────────────────────────────
  { id: 'social-family',     label: 'Family Time',  category: 'social', defaultDuration: 60, icon: '👨‍👩‍👧', energyZoneAffinity: ['moderate', 'recovery'],  color: '#f472b6' },
  { id: 'social-call',       label: 'Social Call',  category: 'social', defaultDuration: 30, icon: '📱', energyZoneAffinity: ['moderate', 'low'],        color: '#f472b6' },
  { id: 'social-networking', label: 'Networking',   category: 'social', defaultDuration: 30, icon: '🤝', energyZoneAffinity: ['moderate', 'high'],       color: '#f472b6' },
  { id: 'social-datenight',  label: 'Date Night',   category: 'social', defaultDuration: 120, icon: '❤️', energyZoneAffinity: ['recovery'],              color: '#f472b6' },
  { id: 'social-friends',    label: 'Friends',      category: 'social', defaultDuration: 60, icon: '🍻', energyZoneAffinity: ['moderate', 'recovery'],   color: '#f472b6' },

  // ── Recovery ─────────────────────────────────────────────────────────────────
  { id: 'recovery-break',    label: 'Break',         category: 'recovery', defaultDuration: 15, icon: '☕', energyZoneAffinity: ['low', 'moderate', 'recovery'], color: '#22d3ee' },
  { id: 'recovery-nature',   label: 'Nature / Park', category: 'recovery', defaultDuration: 30, icon: '🌳', energyZoneAffinity: ['low', 'moderate'],             color: '#34d399' },
  { id: 'recovery-music',    label: 'Music',         category: 'recovery', defaultDuration: 20, icon: '🎵', energyZoneAffinity: ['low', 'recovery'],              color: '#a78bfa' },
  { id: 'recovery-gaming',   label: 'Gaming',        category: 'recovery', defaultDuration: 45, icon: '🎮', energyZoneAffinity: ['recovery'],                     color: '#6b7cff' },
  { id: 'recovery-tv',       label: 'TV / Film',     category: 'recovery', defaultDuration: 60, icon: '📺', energyZoneAffinity: ['recovery'],                     color: '#6b7cff' },
  { id: 'recovery-sauna',    label: 'Sauna',         category: 'recovery', defaultDuration: 30, icon: '🧖', energyZoneAffinity: ['low', 'recovery'],              color: '#f59e0b' },

  // ── Planning & Review ────────────────────────────────────────────────────────
  { id: 'planning-morning',  label: 'Morning Planning',  category: 'planning', defaultDuration: 15, icon: '🌅', energyZoneAffinity: ['moderate'],          color: '#f59e0b' },
  { id: 'planning-evening',  label: 'Evening Review',    category: 'planning', defaultDuration: 15, icon: '🌙', energyZoneAffinity: ['recovery'],          color: '#a78bfa' },
  { id: 'planning-weekly',   label: 'Weekly Review',     category: 'planning', defaultDuration: 30, icon: '📊', energyZoneAffinity: ['moderate'],          color: '#f59e0b' },
  { id: 'planning-goals',    label: 'Goal Setting',      category: 'planning', defaultDuration: 20, icon: '🎯', energyZoneAffinity: ['moderate', 'high'], color: '#ff4d6d' },
  { id: 'planning-inbox',    label: 'Inbox Zero',        category: 'planning', defaultDuration: 20, icon: '📬', energyZoneAffinity: ['low', 'moderate'],   color: '#f59e0b' },
];

/**
 * Filter activities by category.
 */
export function getActivitiesByCategory(categoryId) {
  return LIFE_ACTIVITIES.filter((a) => a.category === categoryId);
}

/**
 * Get activities that fit a given energy zone, sorted by best fit.
 */
export function getActivitiesForZone(zoneId) {
  return LIFE_ACTIVITIES
    .filter((a) => a.energyZoneAffinity.includes(zoneId))
    .sort((a, b) => {
      const aIdx = a.energyZoneAffinity.indexOf(zoneId);
      const bIdx = b.energyZoneAffinity.indexOf(zoneId);
      return aIdx - bIdx;
    });
}
