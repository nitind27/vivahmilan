/**
 * Strict matrimonial SQL filters — same rules as website matches/search.
 * Gender: opposite only. Hindu: same religion + same caste. Gotra: must differ.
 */

export function applyStrictMatchFilters(conditions, params, viewer, overrides = {}) {
  const myGender = viewer?.gender;
  const myReligion = viewer?.religion;
  const myCaste = viewer?.caste;
  const myGotra = viewer?.gotra;
  const religionOverride = overrides.religion || null;
  const genderOverride = overrides.gender || null;

  if (myGender) {
    const strictOpposite = String(myGender).toUpperCase() === 'MALE' ? 'FEMALE' : 'MALE';
    conditions.push('p.gender = ?');
    params.push(strictOpposite);
  } else if (genderOverride) {
    conditions.push('p.gender = ?');
    params.push(genderOverride);
  }

  if (myReligion) {
    if (String(myReligion).toLowerCase() === 'hindu') {
      conditions.push('p.religion = ?');
      params.push(myReligion);
      if (myCaste) {
        conditions.push('p.caste = ?');
        params.push(myCaste);
      }
    } else {
      conditions.push('p.religion = ?');
      params.push(myReligion);
    }
  } else if (religionOverride) {
    conditions.push('p.religion = ?');
    params.push(religionOverride);
  }

  if (myGotra?.trim()) {
    conditions.push("(p.gotra IS NULL OR p.gotra = '' OR p.gotra != ?)");
    params.push(myGotra.trim());
  }
}

export const VIEWER_MATCH_SELECT = 'p.gender, p.religion, p.caste, p.gotra';
