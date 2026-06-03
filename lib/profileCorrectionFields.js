/** Fields admin can ask the member to fix (maps to onboarding step index). */
export const CORRECTION_FIELD_OPTIONS = [
  { key: 'profile_photo', label: 'Profile photo (wrong / unclear)', step: 5 },
  { key: 'family_photos', label: 'Family / lifestyle photos', step: 5 },
  { key: 'identity_document', label: 'Identity document (Aadhaar, PAN, etc.)', step: 5 },
  { key: 'basic_info', label: 'Basic info (name, DOB, height, about me…)', step: 0 },
  { key: 'religion', label: 'Religion & community details', step: 1 },
  { key: 'location', label: 'Location (city, state, country)', step: 2 },
  { key: 'career', label: 'Education & profession', step: 3 },
  { key: 'family', label: 'Family background', step: 4 },
  { key: 'phone', label: 'Phone number', step: 0 },
  { key: 'email', label: 'Email address (see admin note — contact if needed)', step: -1 },
];

export const CORRECTION_FIELD_KEYS = new Set(CORRECTION_FIELD_OPTIONS.map((f) => f.key));
