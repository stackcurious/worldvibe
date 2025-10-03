import React from 'react';

interface AvatarProps {
  variant: 'alex' | 'jordan' | 'sam' | 'casey' | 'taylor';
  size?: number;
  className?: string;
}

export function AvatarHead({ variant, size = 80, className = '' }: AvatarProps) {
  const avatars = {
    alex: {
      // Young person with short dark hair
      skinTone: '#F4A460',
      hairColor: '#2C1810',
      eyeColor: '#4A3728',
      accessories: 'glasses',
    },
    jordan: {
      // Person with curly hair and warm smile
      skinTone: '#8D5524',
      hairColor: '#1A0F0A',
      eyeColor: '#3E2723',
      accessories: 'earring',
    },
    sam: {
      // Person with blonde hair
      skinTone: '#FFE0BD',
      hairColor: '#DDA15E',
      eyeColor: '#6F4E37',
      accessories: 'headband',
    },
    casey: {
      // Person with gray hair, older
      skinTone: '#E8BEAC',
      hairColor: '#9E9E9E',
      eyeColor: '#5D4037',
      accessories: 'none',
    },
    taylor: {
      // Young person with vibrant style
      skinTone: '#C68642',
      hairColor: '#4A148C',
      eyeColor: '#3E2723',
      accessories: 'hat',
    },
  };

  const avatar = avatars[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}
    >
      {/* Face */}
      <circle cx="50" cy="50" r="35" fill={avatar.skinTone} />

      {/* Hair */}
      {variant === 'alex' && (
        <>
          {/* Short dark hair */}
          <ellipse cx="50" cy="35" rx="35" ry="20" fill={avatar.hairColor} />
          <rect x="15" y="35" width="70" height="15" fill={avatar.hairColor} />
        </>
      )}

      {variant === 'jordan' && (
        <>
          {/* Curly hair */}
          <circle cx="30" cy="30" r="12" fill={avatar.hairColor} />
          <circle cx="50" cy="25" r="14" fill={avatar.hairColor} />
          <circle cx="70" cy="30" r="12" fill={avatar.hairColor} />
          <circle cx="25" cy="45" r="10" fill={avatar.hairColor} />
          <circle cx="75" cy="45" r="10" fill={avatar.hairColor} />
        </>
      )}

      {variant === 'sam' && (
        <>
          {/* Blonde hair with headband */}
          <ellipse cx="50" cy="35" rx="36" ry="22" fill={avatar.hairColor} />
          <rect x="14" y="35" width="72" height="18" fill={avatar.hairColor} />
          <rect x="20" y="38" width="60" height="4" fill="#E91E63" rx="2" />
        </>
      )}

      {variant === 'casey' && (
        <>
          {/* Gray hair, short */}
          <ellipse cx="50" cy="35" rx="34" ry="18" fill={avatar.hairColor} />
          <rect x="16" y="35" width="68" height="12" fill={avatar.hairColor} />
        </>
      )}

      {variant === 'taylor' && (
        <>
          {/* Purple hair with hat */}
          <ellipse cx="50" cy="28" rx="30" ry="15" fill="#FF5722" />
          <rect x="20" y="28" width="60" height="6" fill="#FF5722" />
          <ellipse cx="50" cy="38" rx="35" ry="20" fill={avatar.hairColor} />
        </>
      )}

      {/* Eyes */}
      <circle cx="38" cy="48" r="3" fill={avatar.eyeColor} />
      <circle cx="62" cy="48" r="3" fill={avatar.eyeColor} />
      <circle cx="39" cy="47" r="1.5" fill="white" opacity="0.7" />
      <circle cx="63" cy="47" r="1.5" fill="white" opacity="0.7" />

      {/* Glasses for Alex */}
      {variant === 'alex' && (
        <g stroke="#2C3E50" strokeWidth="2" fill="none">
          <circle cx="38" cy="48" r="8" opacity="0.3" fill="rgba(255,255,255,0.1)" />
          <circle cx="62" cy="48" r="8" opacity="0.3" fill="rgba(255,255,255,0.1)" />
          <line x1="46" y1="48" x2="54" y2="48" />
        </g>
      )}

      {/* Nose */}
      <path
        d={`M 50 52 Q 48 56 50 58`}
        stroke={avatar.skinTone}
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />

      {/* Mouth - subtle smile */}
      <path
        d="M 42 63 Q 50 68 58 63"
        stroke={avatar.skinTone}
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />

      {/* Earring for Jordan */}
      {variant === 'jordan' && (
        <circle cx="20" cy="55" r="3" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
      )}

      {/* Neck/shoulders */}
      <path
        d="M 20 75 Q 50 90 80 75"
        fill={avatar.skinTone}
        opacity="0.8"
      />
    </svg>
  );
}

export const AVATAR_OPTIONS = [
  { id: 'alex', name: 'Alex', description: 'The Thinker' },
  { id: 'jordan', name: 'Jordan', description: 'The Free Spirit' },
  { id: 'sam', name: 'Sam', description: 'The Optimist' },
  { id: 'casey', name: 'Casey', description: 'The Wise One' },
  { id: 'taylor', name: 'Taylor', description: 'The Creative' },
] as const;
