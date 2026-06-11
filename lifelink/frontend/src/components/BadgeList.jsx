import { useEffect, useState } from 'react';
import { badgesAPI } from '../services/api';

const COLOR_MAP = {
  blue:    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  red:     'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  green:   'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  amber:   'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  yellow:  'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  rose:    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
};

function Badge({ badge }) {
  return (
    <div
      title={badge.desc}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold cursor-default
        ${COLOR_MAP[badge.color] || COLOR_MAP.blue}`}
    >
      <span>{badge.icon}</span>
      <span>{badge.label}</span>
    </div>
  );
}

export default function BadgeList({ userId, badges: propBadges }) {
  const [badges, setBadges] = useState(propBadges || null);

  useEffect(() => {
    if (propBadges) return;
    if (!userId) return;
    badgesAPI.getForUser(userId)
      .then(r => setBadges(r.data))
      .catch(() => setBadges([]));
  }, [userId, propBadges]);

  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map(b => <Badge key={b.id} badge={b} />)}
    </div>
  );
}
