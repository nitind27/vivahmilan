'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SearchableSelect from '@/components/SearchableSelect';
import LocationPicker from '@/components/LocationPicker';
import { PhotoUploadSection, DocumentUploadSection } from '@/components/PhotoUpload';
import { Save, ChevronRight, ChevronLeft, Check, User, MapPin, Heart, Briefcase, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ALL_RELIGIONS, getHoroscopeConfig,
  getExtraFields, getMotherTongues, getSects, getGotra, RELIGION_DATA
} from '@/lib/religionData';
import { getCastesByReligion } from '@/lib/casteData';

// ── Reusable field components ─────────────────────────────────────────────────
const inputCls = "w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/20 transition-all";
const selectCls = inputCls + " appearance-none cursor-pointer";
const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

function Field({ label, children }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function Select({ label, value, onChange, options, placeholder = 'Select' }) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} className={selectCls}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={typeof o === 'string' ? o : o.val} value={typeof o === 'string' ? o : o.val}>{typeof o === 'string' ? o : o.label}</option>)}
      </select>
    </Field>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <Field label={label}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </Field>
  );
}

function Textarea({ label, value, onChange, placeholder = '', rows = 4 }) {
  return (
    <Field label={label}>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={inputCls + ' resize-none'} />
    </Field>
  );
}

function RadioGroup({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o} type="button" onClick={() => onChange(o)}
            className={`px-3 py-1.5 rounded-xl text-sm border-2 transition-all ${value === o ? 'gradient-bg text-white border-transparent' : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'}`}>
            {o}
          </button>
        ))}
      </div>
    </Field>
  );
}

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 'basic',     label: 'Basic Info',    icon: User },
  { id: 'religion',  label: 'Religion',      icon: Star },
  { id: 'location',  label: 'Location',      icon: MapPin },
  { id: 'career',    label: 'Career',        icon: Briefcase },
  { id: 'lifestyle', label: 'Lifestyle',     icon: Heart },
  { id: 'family',    label: 'Family',        icon: Users },
  { id: 'partner',   label: 'Partner Prefs', icon: Heart },
  { id: 'photos',    label: 'Photos & ID',   icon: Star },
];

const EDUCATIONS = ["High School", "Diploma", "Bachelor's", "Master's", "PhD", "MBBS", "CA", "LLB", "B.Tech", "MBA", "Other"];
const PROFESSIONS = ['Software Engineer', 'Doctor', 'Teacher', 'Business / Entrepreneur', 'Lawyer', 'Engineer', 'Accountant / CA', 'Government Employee', 'Defence / Military', 'Banker', 'Scientist', 'Artist / Designer', 'Other'];
const INCOMES = ['Below ₹2 Lakh', '₹2-5 Lakh', '₹5-10 Lakh', '₹10-20 Lakh', '₹20-30 Lakh', '₹30-50 Lakh', '₹50 Lakh - 1 Crore', 'Above 1 Crore', 'Not Disclosed'];
const HEIGHTS = Array.from({ length: 31 }, (_, i) => { const cm = 150 + i; const ft = Math.floor(cm / 30.48); const inch = Math.round((cm / 30.48 - ft) * 12); return { val: String(cm), label: `${cm} cm (${ft}'${inch}")` }; });
const BODY_TYPES = ['Slim', 'Athletic', 'Average', 'Heavy'];
const COMPLEXIONS = ['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark'];
const DIETS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Jain Vegetarian', 'Occasionally Non-Veg'];
const FAMILY_TYPES = ['Nuclear', 'Joint', 'Extended'];
const FAMILY_STATUS = ['Middle Class', 'Upper Middle Class', 'Rich / Affluent', 'High Net Worth'];
const MARITAL_STATUS = [{ val: 'NEVER_MARRIED', label: 'Never Married' }, { val: 'DIVORCED', label: 'Divorced' }, { val: 'WIDOWED', label: 'Widowed' }, { val: 'SEPARATED', label: 'Separated' }];

// ── Main Component ────────────────────────────────────────────────────────────
function EditProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams?.get('welcome') === '1';
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSteps, setSavedSteps] = useState([]);

  const [form, setForm] = useState({
    // Basic
    name: '', phone: '', gender: '', dob: '', height: '', weight: '',
    maritalStatus: 'NEVER_MARRIED', bodyType: '', complexion: '',
    aboutMe: '',
    // Religion
    religion: '', caste: '', subCaste: '', sect: '', gotra: '',
    motherTongue: '',
    // Horoscope (Hindu specific)
    horoscopeSign: '', nakshatra: '', manglik: 'No',
    kundliMatch: 'Not Required', amritdhari: '',
    // Location
    country: '', state: '', city: '',
    // Career
    education: '', profession: '', income: '',
    // Lifestyle
    smoking: 'NO', drinking: 'NO', diet: '',
    hidePhone: false, hidePhoto: false,
    // Family
    fatherOccupation: '', motherOccupation: '', siblings: '',
    familyType: '', familyStatus: '',
    // Partner prefs
    partnerAgeMin: '', partnerAgeMax: '',
    partnerHeightMin: '', partnerHeightMax: '',
    partnerReligion: '', partnerCaste: '',
    partnerEducation: '', partnerProfession: '',
    partnerLocation: '', partnerMaritalStatus: '',
    partnerManglik: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/profile').then(r => r.json()).then(data => {
      const p = data.profile || {};
      setForm(prev => ({
        ...prev,
        name: data.name || '',
        phone: data.phone || '',
        gender: p.gender || '',
        dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
        height: p.height ? String(p.height) : '',
        weight: p.weight ? String(p.weight) : '',
        maritalStatus: p.maritalStatus || 'NEVER_MARRIED',
        bodyType: p.bodyType || '',
        complexion: p.complexion || '',
        aboutMe: p.aboutMe || '',
        religion: p.religion || '',
        caste: p.caste || '',
        subCaste: p.subCaste || '',
        sect: p.sect || '',
        gotra: p.gotra || '',
        motherTongue: p.motherTongue || '',
        horoscopeSign: p.horoscopeSign || '',
        nakshatra: p.nakshatra || '',
        manglik: p.manglik || 'No',
        kundliMatch: p.kundliMatch || 'Not Required',
        amritdhari: p.amritdhari || '',
        country: p.country || '',
        state: p.state || '',
        city: p.city || '',
        education: p.education || '',
        profession: p.profession || '',
        income: p.income || '',
        smoking: p.smoking || 'NO',
        drinking: p.drinking || 'NO',
        diet: p.diet || '',
        hidePhone: p.hidePhone || false,
        hidePhoto: p.hidePhoto || false,
        fatherOccupation: p.fatherOccupation || '',
        motherOccupation: p.motherOccupation || '',
        siblings: p.siblings != null ? String(p.siblings) : '',
        familyType: p.familyType || '',
        familyStatus: p.familyStatus || '',
        partnerAgeMin: p.partnerAgeMin ? String(p.partnerAgeMin) : '',
        partnerAgeMax: p.partnerAgeMax ? String(p.partnerAgeMax) : '',
        partnerHeightMin: p.partnerHeightMin ? String(p.partnerHeightMin) : '',
        partnerHeightMax: p.partnerHeightMax ? String(p.partnerHeightMax) : '',
        partnerReligion: p.partnerReligion || '',
        partnerEducation: p.partnerEducation || '',
        partnerProfession: p.partnerProfession || '',
        partnerLocation: p.partnerLocation || '',
        partnerMaritalStatus: p.partnerMaritalStatus || '',
        partnerManglik: p.partnerManglik || '',
      }));
      setLoading(false);
    });
  }, [status]);

  const saveCurrentStep = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Saved!');
        setSavedSteps(prev => [...new Set([...prev, step])]);
      } else {
        toast.error('Save failed');
      }
    } catch { toast.error('Error saving'); }
    finally { setSaving(false); }
  };

  const saveAndNext = async () => {
    await saveCurrentStep();
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  // Religion-dependent data
  const sects = getSects(form.religion);
  const gotraList = getGotra(form.religion);
  const motherTongues = getMotherTongues(form.religion);
  const horoConfig = getHoroscopeConfig(form.religion);
  const extraFields = getExtraFields(form.religion);
  const subCastes = form.religion === 'Hindu' && form.caste
    ? (RELIGION_DATA.Hindu.subCastes[form.caste] || [])
    : [];

  const profileComplete = (() => {
    const fields = ['gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe', 'caste', 'motherTongue'];
    return Math.round(fields.filter(f => form[f]).length / fields.length * 100);
  })();

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Welcome banner for new Google users */}
        {isWelcome && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 gradient-bg rounded-2xl p-5 text-white flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">🎉</div>
            <div>
              <p className="font-bold text-lg">Welcome to Vivah Milan!</p>
              <p className="text-white/85 text-sm mt-1">
                You've signed in with Google. Please complete your profile — our admin team will review and approve it within 24 hours. After approval you can start finding matches!
              </p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <p className="text-gray-500 text-sm mt-0.5">Profile {profileComplete}% complete</p>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#grad)" strokeWidth="3"
                strokeDasharray={`${profileComplete} ${100 - profileComplete}`} strokeLinecap="round" />
              <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{profileComplete}%</span>
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${step === i ? 'gradient-bg text-white shadow-md' : savedSteps.includes(i) ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-pink-300'}`}>
              {savedSteps.includes(i) && step !== i ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
              {s.label}
            </button>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">

            {/* ── STEP 0: Basic Info ── */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><User className="w-5 h-5 text-pink-500" /> Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Input label="Full Name" value={form.name} onChange={v => set('name', v)} placeholder="Your full name" /></div>
                  <Select label="Gender" value={form.gender} onChange={v => set('gender', v)} options={[{ val: 'MALE', label: 'Male' }, { val: 'FEMALE', label: 'Female' }, { val: 'OTHER', label: 'Other' }]} />
                  <Input label="Date of Birth" value={form.dob} onChange={v => set('dob', v)} type="date" />
                  <Select label="Height" value={form.height} onChange={v => set('height', v)} options={HEIGHTS} placeholder="Select height" />
                  <Input label="Weight (kg)" value={form.weight} onChange={v => set('weight', v)} type="number" placeholder="65" />
                  <Select label="Marital Status" value={form.maritalStatus} onChange={v => set('maritalStatus', v)} options={MARITAL_STATUS} />
                  <Select label="Body Type" value={form.bodyType} onChange={v => set('bodyType', v)} options={BODY_TYPES} />
                  <Select label="Complexion" value={form.complexion} onChange={v => set('complexion', v)} options={COMPLEXIONS} />
                  <Input label="Phone Number" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 9999999999" />
                  <div className="col-span-2"><Textarea label="About Me" value={form.aboutMe} onChange={v => set('aboutMe', v)} placeholder="Describe yourself, your interests, what you're looking for..." rows={4} /></div>
                </div>
              </div>
            )}

            {/* ── STEP 1: Religion ── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-pink-500" /> Religion & Community</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Religion" value={form.religion} onChange={v => { set('religion', v); set('caste', ''); set('sect', ''); set('gotra', ''); }} options={ALL_RELIGIONS} />
                  {form.religion && (
                    <SearchableSelect
                      label={form.religion === 'Muslim' ? 'Community / Biradari' : form.religion === 'Christian' ? 'Denomination' : 'Caste / Community'}
                      value={form.caste}
                      onChange={v => { set('caste', v); set('subCaste', ''); }}
                      options={getCastesByReligion(form.religion)}
                      placeholder="Search caste…"
                    />
                  )}
                  {subCastes.length > 0 && (
                    <SearchableSelect label="Sub-Caste" value={form.subCaste} onChange={v => set('subCaste', v)} options={subCastes} placeholder="Search sub-caste…" />
                  )}
                  {sects.length > 0 && (
                    <Select label="Sect / Denomination" value={form.sect} onChange={v => set('sect', v)} options={sects} />
                  )}
                  {gotraList.length > 0 && (
                    <SearchableSelect label="Gotra" value={form.gotra} onChange={v => set('gotra', v)} options={gotraList} placeholder="Search gotra…" />
                  )}
                  <SearchableSelect label="Mother Tongue" value={form.motherTongue} onChange={v => set('motherTongue', v)} options={motherTongues.length > 0 ? motherTongues : ['Hindi', 'English', 'Other']} placeholder="Select language…" />

                  {/* Muslim specific */}
                  {form.religion === 'Muslim' && RELIGION_DATA.Muslim.maslak && (
                    <Select label="Maslak" value={form.sect} onChange={v => set('sect', v)} options={RELIGION_DATA.Muslim.maslak} />
                  )}

                  {/* Sikh specific */}
                  {form.religion === 'Sikh' && (
                    <Select label="Amritdhari" value={form.amritdhari} onChange={v => set('amritdhari', v)} options={RELIGION_DATA.Sikh.amritdhari} />
                  )}
                </div>

                {/* Hindu Horoscope Section */}
                {horoConfig.required && form.religion === 'Hindu' && (
                  <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                      <span className="text-xl">🔯</span> Horoscope / Kundli Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Rashi (Moon Sign)" value={form.horoscopeSign} onChange={v => set('horoscopeSign', v)} options={horoConfig.signs || []} />
                      <Select label="Nakshatra (Birth Star)" value={form.nakshatra} onChange={v => set('nakshatra', v)} options={horoConfig.nakshatra || []} />
                      <div className="col-span-2">
                        <RadioGroup label="Manglik Status" value={form.manglik} onChange={v => set('manglik', v)} options={horoConfig.manglik || ['Yes', 'No', 'Don\'t Know']} />
                      </div>
                      <div className="col-span-2">
                        <RadioGroup label="Kundli Match Required?" value={form.kundliMatch} onChange={v => set('kundliMatch', v)} options={horoConfig.kundliMatch || ['Must Match', 'Preferred', 'Not Required']} />
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl text-xs text-orange-700 dark:text-orange-400">
                      💡 Kundli details help in finding compatible matches based on Vedic astrology.
                    </div>
                  </div>
                )}

                {/* Non-Hindu horoscope optional */}
                {!horoConfig.required && form.religion && form.religion !== 'Hindu' && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs text-gray-500">
                    Horoscope matching is not typically required for {form.religion} profiles.
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Location ── */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-pink-500" /> Location</h2>
                <LocationPicker
                  country={form.country}
                  state={form.state}
                  city={form.city}
                  onCountryChange={(name) => set('country', name)}
                  onStateChange={(name) => set('state', name)}
                  onCityChange={(name) => set('city', name)}
                />
              </div>
            )}

            {/* ── STEP 3: Career ── */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-pink-500" /> Education & Career</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Highest Education" value={form.education} onChange={v => set('education', v)} options={EDUCATIONS} />
                  <Select label="Profession" value={form.profession} onChange={v => set('profession', v)} options={PROFESSIONS} />
                  <div className="col-span-2"><Select label="Annual Income" value={form.income} onChange={v => set('income', v)} options={INCOMES} /></div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Lifestyle ── */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500" /> Lifestyle & Privacy</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Diet" value={form.diet} onChange={v => set('diet', v)} options={DIETS} />
                  <div className="col-span-2">
                    <RadioGroup label="Smoking" value={form.smoking} onChange={v => set('smoking', v)} options={['NO', 'OCCASIONALLY', 'YES']} />
                  </div>
                  <div className="col-span-2">
                    <RadioGroup label="Drinking" value={form.drinking} onChange={v => set('drinking', v)} options={['NO', 'OCCASIONALLY', 'YES']} />
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Privacy Settings</p>
                  {[{ key: 'hidePhone', label: 'Hide phone number from non-premium users' }, { key: 'hidePhoto', label: 'Hide photos from non-premium users' }].map(s => (
                    <label key={s.key} className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => set(s.key, !form[s.key])} className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${form[s.key] ? 'gradient-bg' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form[s.key] ? 'left-6' : 'left-1'}`} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 5: Family ── */}
            {step === 5 && (
              <div className="space-y-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-pink-500" /> Family Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Family Type" value={form.familyType} onChange={v => set('familyType', v)} options={FAMILY_TYPES} />
                  <Select label="Family Status" value={form.familyStatus} onChange={v => set('familyStatus', v)} options={FAMILY_STATUS} />
                  <Input label="Father's Occupation" value={form.fatherOccupation} onChange={v => set('fatherOccupation', v)} placeholder="e.g. Business" />
                  <Input label="Mother's Occupation" value={form.motherOccupation} onChange={v => set('motherOccupation', v)} placeholder="e.g. Homemaker" />
                  <Input label="Number of Siblings" value={form.siblings} onChange={v => set('siblings', v)} type="number" placeholder="0" />
                </div>
              </div>
            )}

            {/* ── STEP 6: Partner Preferences ── */}
            {step === 6 && (
              <div className="space-y-5">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500" /> Partner Preferences</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Min Age" value={form.partnerAgeMin} onChange={v => set('partnerAgeMin', v)} type="number" placeholder="22" />
                  <Input label="Max Age" value={form.partnerAgeMax} onChange={v => set('partnerAgeMax', v)} type="number" placeholder="35" />
                  <Select label="Min Height" value={form.partnerHeightMin} onChange={v => set('partnerHeightMin', v)} options={HEIGHTS} placeholder="Any" />
                  <Select label="Max Height" value={form.partnerHeightMax} onChange={v => set('partnerHeightMax', v)} options={HEIGHTS} placeholder="Any" />
                  <Select label="Preferred Religion" value={form.partnerReligion} onChange={v => set('partnerReligion', v)} options={['Any', ...ALL_RELIGIONS]} />
                  {form.partnerReligion && form.partnerReligion !== 'Any' && (
                    <SearchableSelect label="Preferred Caste" value={form.partnerCaste} onChange={v => set('partnerCaste', v)} options={[{ val: "Any / Doesn't Matter", label: "Any / Doesn't Matter", group: '' }, ...getCastesByReligion(form.partnerReligion)]} placeholder="Search caste…" />
                  )}
                  <Select label="Preferred Education" value={form.partnerEducation} onChange={v => set('partnerEducation', v)} options={['Any', ...EDUCATIONS]} />
                  <Select label="Preferred Profession" value={form.partnerProfession} onChange={v => set('partnerProfession', v)} options={['Any', ...PROFESSIONS]} />
                  <Select label="Preferred Marital Status" value={form.partnerMaritalStatus} onChange={v => set('partnerMaritalStatus', v)} options={[{ val: '', label: 'Any' }, ...MARITAL_STATUS]} />
                  <Input label="Preferred Location" value={form.partnerLocation} onChange={v => set('partnerLocation', v)} placeholder="e.g. India, USA, Any" />
                  {form.religion === 'Hindu' && (
                    <div className="col-span-2">
                      <RadioGroup label="Partner Manglik Preference" value={form.partnerManglik} onChange={v => set('partnerManglik', v)} options={["Doesn't Matter", 'Manglik Only', 'Non-Manglik Only']} />
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ── STEP 7: Photos & Documents ── */}
            {step === 7 && (
              <div className="space-y-8">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-pink-500" /> Photos & ID Verification</h2>
                <PhotoUploadSection />
                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                  <DocumentUploadSection />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:border-pink-300 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex gap-2">
            {/* Save only */}
            <button onClick={saveCurrentStep} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-pink-400 text-pink-600 dark:text-pink-400 text-sm font-semibold hover:bg-pink-50 dark:hover:bg-pink-900/10 disabled:opacity-60 transition-all">
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
            </button>

            {/* Save & Next */}
            {step < STEPS.length - 1 ? (
              <button onClick={saveAndNext} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                Save & Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={async () => { await saveCurrentStep(); router.push('/dashboard'); }} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                <Check className="w-4 h-4" /> Finish
              </button>
            )}
          </div>
        </div>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 mt-4">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`transition-all rounded-full ${i === step ? 'w-6 h-2 gradient-bg' : savedSteps.includes(i) ? 'w-2 h-2 bg-green-400' : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Suspense wrapper (required for useSearchParams at build time) ─────────────
export default function EditProfilePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EditProfilePage />
    </Suspense>
  );
}
