export const USER_ROLE = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  USER: 'user',
  OPTIONAL: 'optional', // For routes that can be accessed by both authenticated and non-authenticated users
} as const;


export type USER_ROLE_INTERFACE = typeof USER_ROLE[keyof typeof USER_ROLE];
export const USER_ROLE_ENUM = Object.values(USER_ROLE);

export const gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  NO: "N/A"
} as const;

export type GENDER_INTERFACE = typeof gender[keyof typeof gender];
export const GENDER_ENUM = Object.values(gender);

// category and voice specialty types for scripts and user profiles
export const VOICE_SPECIALIST_TYPES = {
  E_LEARNING: 'E-Learning',
  CHARACTER: 'Character',
  NARRATION: 'Narration',
  VIDEO_GAME: 'Video Game',
  ANIMATION: 'Animation',
  COMMERCIAL: 'Commercial',
  ANNOUNCER: "Announcer",



} as const;

export type VOICE_SPECIALIST_TYPES_INTERFACE = typeof VOICE_SPECIALIST_TYPES[keyof typeof VOICE_SPECIALIST_TYPES];

export const VOICE_SPECIALIST_TYPES_ENUM = Object.values(VOICE_SPECIALIST_TYPES);


export const SUBSCRIPTION_TYPES = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium',
} as const;

export type SUBSCRIPTION_INTERFACE =
  typeof SUBSCRIPTION_TYPES[keyof typeof SUBSCRIPTION_TYPES];

export const SUBSCRIPTION_TYPES_ENUM = Object.values(SUBSCRIPTION_TYPES);