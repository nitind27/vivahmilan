function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / 31557600000);
}

function ageInRange(age, min, max) {
  if (age == null) return false;
  if (min && age < min) return false;
  if (max && age > max) return false;
  return true;
}

/** Weighted compatibility score 0–100 between viewer (me) and candidate profile row. */
export function computeMatchScore(me, candidate) {
  if (!me || !candidate) return 0;
  let score = 0;

  if (me.religion && candidate.religion && me.religion === candidate.religion) score += 22;
  else if (me.religion && candidate.religion) score += 5;

  if (me.caste && candidate.caste && me.caste === candidate.caste) score += 18;
  else if (me.caste && candidate.caste) score += 4;

  if (me.motherTongue && candidate.motherTongue && me.motherTongue === candidate.motherTongue) score += 8;

  if (me.city && candidate.city && me.city === candidate.city) score += 15;
  else if (me.state && candidate.state && me.state === candidate.state) score += 8;
  else if (me.country && candidate.country && me.country === candidate.country) score += 4;

  const myAge = calcAge(me.dob);
  const theirAge = calcAge(candidate.dob);
  if (ageInRange(theirAge, me.partnerAgeMin, me.partnerAgeMax)) score += 12;
  else if (myAge && theirAge && Math.abs(myAge - theirAge) <= 5) score += 6;

  if (me.partnerReligion && candidate.religion && me.partnerReligion === candidate.religion) score += 8;

  if (candidate.maritalStatus === 'NEVER_MARRIED') score += 5;
  if (candidate.adminVerified || candidate.u_adminVerified) score += 4;
  if ((candidate.profileComplete ?? 0) >= 80) score += 8;
  else if ((candidate.profileComplete ?? 0) >= 60) score += 4;

  if (candidate.isPremium || candidate.u_isPremium) score += 3;

  return Math.min(100, Math.max(0, score));
}

export function matchScoreLabel(score) {
  if (score >= 85) return { label: 'Excellent Match', color: 'green' };
  if (score >= 70) return { label: 'Great Match', color: 'blue' };
  if (score >= 55) return { label: 'Good Match', color: 'yellow' };
  if (score >= 40) return { label: 'Fair Match', color: 'orange' };
  return { label: 'Low Match', color: 'gray' };
}
