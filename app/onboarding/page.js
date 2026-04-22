'use client';
import { useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  User, MapPin, Star, Briefcase, Users, Camera,
  ChevronRight, ChevronLeft, Check, Upload, FileText,
  Loader2, CheckCircle, Clock, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from '@/components/SearchableSelect';
import LocationPicker from '@/components/LocationPicker';
import {
  ALL_RELIGIONS, getHoroscopeConfig, getMotherTongues,
  getSects, getGotra, RELIGION_DATA
} from '@/lib/religionData';
import { getCastesByReligion } from '@/lib/casteData';

const inputCls = "w-full px-4 py-3 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all";
const labelCls = "block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide";

const STEPS = [
  { id: 'basic',    label: 'Basic Info',   icon: User },
  { id: 'religion', label: 'Religion',     icon: Star },
  { id: 'location', label: 'Location',     icon: MapPin },
  { id: 'career',   label: 'Career',       icon: Briefcase },
  { id: 'family',   label: 'Family',       icon: Users },
  { id: 'photos',   label: 'Photo & ID',   icon: Camera },
];

const HEIGHTS = Array.from({ length: 31 }, (_, i) => {
  const cm = 150 + i;
  const ft = Math.floor(cm / 30.48);
  const inch = Math.round((cm / 30.48 - ft) * 12);
  return { val: String(cm), label: `${cm} cm (${ft}'${inch}")` };
});

const EDUCATIONS = ["High School","Diploma","Bachelor's","Master's","PhD","MBBS","CA","LLB","B.Tech","MBA","Other"];
const PROFESSIONS = ['Software Engineer','Doctor','Teacher','Business / Entrepreneur','Lawyer','Engineer','Accountant / CA','Government Employee','Defence / Military','Banker','Scientist','Other'];
const INCOMES = ['Below ₹2 Lakh','₹2-5 Lakh','₹5-10 Lakh','₹10-20 Lakh','₹20-30 Lakh','₹30-50 Lakh','₹50 Lakh - 1 Crore','Above 1 Crore','Not Disclosed'];
const MARITAL = [{ val: 'NEVER_MARRIED', label: 'Never Married' },{ val: 'DIVORCED', label: 'Divorced' },{ val: 'WIDOWED', label: 'Widowed' }];
const DIETS = ['Vegetarian','Non-Vegetarian','Eggetarian','Vegan','Jain Vegetarian'];
const DOC_TYPES = ['Aadhaar Card','PAN Card','Voter ID Card','Passport','Driving License'];

function Field({ label, children }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}
function Sel({ label, value, onChange, options, placeholder = 'Select' }) {
  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
    />
  );
}
function Inp({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <Field label={label}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </Field>
  );
}
function Radio({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o} type="button" onClick={() => onChange(o)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium border-2 transition-all ${
              value === o
                ? 'vd-gradient-gold text-white border-transparent shadow-sm'
                : 'border-vd-border text-vd-text-sub hover:border-vd-primary hover:bg-vd-accent-soft'
            }`}>
            {o}
          </button>
        ))}
      </div>
    </Field>
  );
}

function OnboardingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docStatus, setDocStatus] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState('Aadhaar Card');
  const photoRef = useRef(null);
  const docRef = useRef(null);

  const [form, setForm] = useState({
    name: '', phone: '', gender: '', dob: '', height: '', weight: '',
    maritalStatus: 'NEVER_MARRIED', bodyType: '', complexion: '', aboutMe: '',
    religion: '', caste: '', subCaste: '', sect: '', gotra: '', motherTongue: '',
    horoscopeSign: '', nakshatra: '', manglik: 'No', kundliMatch: 'Not Required',
    country: '', state: '', city: '',
    education: '', profession: '', income: '',
    smoking: 'NO', drinking: 'NO', diet: '',
    fatherOccupation: '', motherOccupation: '', siblings: '',
    familyType: '', familyStatus: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = (s) => {
    const errs = [];
    if (s === 0) {
      if (!form.name.trim()) errs.push('Full name is required');
      else if (form.name.trim().length < 2) errs.push('Name must be at least 2 characters');
      if (!form.gender) errs.push('Gender is required');
      if (!form.dob) errs.push('Date of birth is required');
      else {
        const age = Math.floor((Date.now() - new Date(form.dob)) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) errs.push('You must be at least 18 years old');
        if (age > 80) errs.push('Please enter a valid date of birth');
      }
      if (form.phone && !/^[+]?[\d\s\-()]{7,15}$/.test(form.phone)) errs.push('Enter a valid phone number');
      if (form.weight && (isNaN(form.weight) || form.weight < 30 || form.weight > 200)) errs.push('Enter a valid weight (30–200 kg)');
    }
    if (s === 1) {
      if (!form.religion) errs.push('Religion is required');
    }
    if (s === 2) {
      if (!form.country) errs.push('Country is required');
      if (!form.state) errs.push('State is required');
      if (!form.city) errs.push('City is required');
    }
    if (s === 3) {
      if (!form.education) errs.push('Education is required');
      if (!form.profession) errs.push('Profession is required');
    }
    return errs;
  };

  const horoConfig = getHoroscopeConfig(form.religion);
  const sects = getSects(form.religion);
  const gotraList = getGotra(form.religion);
  const motherTongues = getMotherTongues(form.religion);

  const compressImage = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width: w, height: h } = img;
        const maxW = 800;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.82);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const uploadPhoto = async (file) => {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    setPhotoUploading(true);
    try {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.append('photo', blob, 'photo.jpg');
      fd.append('email', email);
      const res = await fetch('/api/onboarding/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setPhotoPreview(data.url);
      toast.success('Photo uploaded!');
    } finally { setPhotoUploading(false); }
  };

  const uploadDoc = async (file) => {
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('email', email);
      fd.append('type', selectedDocType);
      const res = await fetch('/api/onboarding/document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setDocStatus({ type: data.type, status: data.status });
      toast.success(`${selectedDocType} uploaded!`);
    } finally { setDocUploading(false); }
  };

  const saveStep = async (isFinal = false) => {
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...form }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return false; }
      return true;
    } catch { toast.error('Save failed'); return false; }
    finally { setSaving(false); }
  };

  const next = async () => {
    const errs = validateStep(step);
    if (errs.length > 0) {
      errs.forEach(e => toast.error(e));
      return;
    }
    const ok = await saveStep(false);
    if (ok && step < STEPS.length - 1) setStep(s => s + 1);
  };

  const submit = async () => {
    if (!photoPreview) { toast.error('Please upload a profile photo'); return; }
    if (!docStatus) { toast.error('Please upload an ID document'); return; }
    const ok = await saveStep(true);
    if (ok) setSubmitted(true);
  };

  if (!email) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Invalid link. <Link href="/register" className="text-vd-primary">Register again</Link></p>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-vd-bg px-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-vd-border">
        <div className="w-20 h-20 vd-gradient-gold rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Profile Submitted! 🎉</h2>
        <p className="text-vd-text-sub text-sm mb-2">Your profile is under review by our admin team.</p>
        <p className="text-vd-text-light text-sm mb-6">You'll receive an email at <strong className="text-vd-primary">{email}</strong> once your profile is approved. This usually takes 24-48 hours.</p>
        <div className="space-y-2 text-left bg-vd-bg-alt rounded-2xl p-4 mb-6">
          {['Profile details saved','Photo uploaded','ID document submitted','Awaiting admin review'].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-vd-primary flex-shrink-0" />
              <span className="text-vd-text-sub">{s}</span>
            </div>
          ))}
        </div>
        <Link href="/login" className="block vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity text-sm">
          Back to Login
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-vd-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex justify-center">
            <img src="/logo/logo.png" alt="Vivah Dwar" className="h-20 w-auto object-contain" />
          </Link>
          <p className="text-vd-text-light text-sm mt-1">Complete your profile to get started</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-vd-text-light mb-2">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span className="text-vd-primary font-medium">{Math.round(((step + 1) / STEPS.length) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-vd-border rounded-full">
            <div className="h-2 vd-gradient-gold rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              i === step ? 'vd-gradient-gold text-white shadow-sm' :
              i < step ? 'bg-vd-accent-soft text-vd-primary border border-vd-primary/30' :
              'bg-vd-bg-section text-vd-text-light border border-vd-border'
            }`}>
              {i < step ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
              {s.label}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl border border-vd-border shadow-sm p-6">

            {/* STEP 0: Basic */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><User className="w-5 h-5 text-vd-primary" /> Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Inp label="Full Name *" value={form.name} onChange={v => set('name', v)} placeholder="Your full name" /></div>
                  <Sel label="Gender *" value={form.gender} onChange={v => set('gender', v)} options={[{ val: 'MALE', label: 'Male' },{ val: 'FEMALE', label: 'Female' },{ val: 'OTHER', label: 'Other' }]} />
                  <Inp label="Date of Birth *" value={form.dob} onChange={v => set('dob', v)} type="date" />
                  <SearchableSelect label="Height" value={form.height} onChange={v => set('height', v)} options={HEIGHTS} placeholder="Select height" />
                  <Inp label="Weight (kg)" value={form.weight} onChange={v => set('weight', v)} type="number" placeholder="65" />
                  <Sel label="Marital Status" value={form.maritalStatus} onChange={v => set('maritalStatus', v)} options={MARITAL} />
                  <Inp label="Phone Number" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 9999999999" />
                  <div className="col-span-2">
                    <Field label="About Me">
                      <textarea value={form.aboutMe} onChange={e => set('aboutMe', e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="Tell us about yourself, your interests, what you're looking for..." />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Religion */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><Star className="w-5 h-5 text-vd-primary" /> Religion & Community</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Sel label="Religion *" value={form.religion} onChange={v => { set('religion', v); set('caste', ''); set('sect', ''); set('gotra', ''); }} options={ALL_RELIGIONS} />
                  {form.religion && (
                    <SearchableSelect label={form.religion === 'Muslim' ? 'Community' : form.religion === 'Christian' ? 'Denomination' : 'Caste *'} value={form.caste} onChange={v => set('caste', v)} options={getCastesByReligion(form.religion)} placeholder="Search caste…" />
                  )}
                  {sects.length > 0 && <Sel label="Sect" value={form.sect} onChange={v => set('sect', v)} options={sects} />}
                  {gotraList.length > 0 && <SearchableSelect label="Gotra" value={form.gotra} onChange={v => set('gotra', v)} options={gotraList} placeholder="Search gotra…" />}
                  <SearchableSelect label="Mother Tongue" value={form.motherTongue} onChange={v => set('motherTongue', v)} options={motherTongues.length > 0 ? motherTongues : ['Hindi','English','Other']} placeholder="Select language…" />
                  {form.religion === 'Sikh' && RELIGION_DATA.Sikh?.amritdhari && (
                    <Sel label="Amritdhari" value={form.sect} onChange={v => set('sect', v)} options={RELIGION_DATA.Sikh.amritdhari} />
                  )}
                </div>
                {horoConfig.required && form.religion === 'Hindu' && (
                  <div className="border-t border-vd-border pt-4 mt-4">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">🔯 Horoscope Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Sel label="Rashi (Moon Sign)" value={form.horoscopeSign} onChange={v => set('horoscopeSign', v)} options={horoConfig.signs || []} />
                      <Sel label="Nakshatra" value={form.nakshatra} onChange={v => set('nakshatra', v)} options={horoConfig.nakshatra || []} />
                      <div className="col-span-2"><Radio label="Manglik Status" value={form.manglik} onChange={v => set('manglik', v)} options={horoConfig.manglik || ['Yes','No',"Don't Know"]} /></div>
                      <div className="col-span-2"><Radio label="Kundli Match Required?" value={form.kundliMatch} onChange={v => { set('kundliMatch', v); if (v !== 'Must Match') setKundali(null); }} options={horoConfig.kundliMatch || ['Must Match','Preferred','Not Required']} /></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-vd-primary" /> Location</h2>
                <LocationPicker country={form.country} state={form.state} city={form.city}
                  onCountryChange={n => set('country', n)} onStateChange={n => set('state', n)} onCityChange={n => set('city', n)} />
              </div>
            )}

            {/* STEP 3: Career */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-vd-primary" /> Education & Career</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Sel label="Highest Education *" value={form.education} onChange={v => set('education', v)} options={EDUCATIONS} />
                  <Sel label="Profession *" value={form.profession} onChange={v => set('profession', v)} options={PROFESSIONS} />
                  <div className="col-span-2"><Sel label="Annual Income" value={form.income} onChange={v => set('income', v)} options={INCOMES} /></div>
                  <Sel label="Diet" value={form.diet} onChange={v => set('diet', v)} options={DIETS} />
                  <div className="col-span-2"><Radio label="Smoking" value={form.smoking} onChange={v => set('smoking', v)} options={['NO','OCCASIONALLY','YES']} /></div>
                  <div className="col-span-2"><Radio label="Drinking" value={form.drinking} onChange={v => set('drinking', v)} options={['NO','OCCASIONALLY','YES']} /></div>
                </div>
              </div>
            )}

            {/* STEP 4: Family */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-vd-primary" /> Family Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Sel label="Family Type" value={form.familyType} onChange={v => set('familyType', v)} options={['Nuclear','Joint','Extended']} />
                  <Sel label="Family Status" value={form.familyStatus} onChange={v => set('familyStatus', v)} options={['Middle Class','Upper Middle Class','Rich / Affluent']} />
                  <Inp label="Father's Occupation" value={form.fatherOccupation} onChange={v => set('fatherOccupation', v)} placeholder="e.g. Business" />
                  <Inp label="Mother's Occupation" value={form.motherOccupation} onChange={v => set('motherOccupation', v)} placeholder="e.g. Homemaker" />
                  <Inp label="Number of Siblings" value={form.siblings} onChange={v => set('siblings', v)} type="number" placeholder="0" />
                </div>
              </div>
            )}

            {/* STEP 5: Photo & ID */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg flex items-center gap-2"><Camera className="w-5 h-5 text-vd-primary" /> Profile Photo & ID Verification</h2>

                {/* Profile Photo */}
                <div>
                  <p className={labelCls}>Profile Photo <span className="text-red-500">*</span></p>
                  <div className="flex items-center gap-5">
                    <div className="w-28 h-28 rounded-3xl overflow-hidden bg-vd-accent-soft dark:bg-vd-accent/20 flex-shrink-0 relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      {photoUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-3">Clear face photo required for profile verification. Max 8MB.</p>
                      <label className="cursor-pointer vd-gradient-gold text-white text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 w-fit">
                        <Upload className="w-4 h-4" /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* ID Document */}
                <div className="border-t border-vd-border pt-5">
                  <p className={labelCls}>Government ID Document <span className="text-red-500">*</span></p>
                  <div className="p-3 bg-vd-accent-soft border border-vd-border rounded-2xl mb-4">
                    <p className="text-xs text-vd-text-sub">Upload any one government-issued ID for verification. Admin will review and approve your profile.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {DOC_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => setSelectedDocType(t)}
                        className={`px-3 py-1.5 rounded-2xl text-xs font-medium border-2 transition-all ${
                          selectedDocType === t
                            ? 'vd-gradient-gold text-white border-transparent shadow-sm'
                            : 'border-vd-border text-vd-text-sub hover:border-vd-primary hover:bg-vd-accent-soft'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {docStatus ? (
                    <div className="flex items-center gap-3 p-3 bg-vd-accent-soft border border-vd-border rounded-2xl">
                      <CheckCircle className="w-5 h-5 text-vd-primary" />
                      <div>
                        <p className="text-sm font-medium text-vd-text-heading">{docStatus.type} uploaded</p>
                        <p className="text-xs text-vd-text-light">Pending admin review</p>
                      </div>
                      <label className="ml-auto cursor-pointer text-xs text-vd-text-light hover:text-vd-primary underline">
                        Change
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && uploadDoc(e.target.files[0])} />
                      </label>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-vd-border rounded-2xl p-8 text-center hover:border-vd-primary hover:bg-vd-accent-soft transition-all">
                        {docUploading ? <Loader2 className="w-8 h-8 text-vd-primary animate-spin mx-auto mb-2" /> : <FileText className="w-8 h-8 text-vd-text-light mx-auto mb-2" />}
                        <p className="text-sm font-medium text-vd-text-sub">{docUploading ? 'Uploading…' : `Upload ${selectedDocType}`}</p>
                        <p className="text-xs text-vd-text-light mt-1">JPG, PNG or PDF — Max 5MB</p>
                      </div>
                      <input ref={docRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && uploadDoc(e.target.files[0])} disabled={docUploading} />
                    </label>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-vd-border text-sm font-medium text-vd-text-sub disabled:opacity-40 hover:bg-vd-accent-soft hover:border-vd-primary transition-all">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl vd-gradient-gold text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              style={{ boxShadow: '0 4px 16px rgba(200,164,92,0.35)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save & Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={saving || !photoPreview || !docStatus}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl vd-gradient-gold text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              style={{ boxShadow: '0 4px 16px rgba(200,164,92,0.35)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Submit for Review
            </button>
          )}
        </div>
        <p className="text-center text-xs text-vd-text-light mt-3">Your data is saved at each step</p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-vd-primary animate-spin" /></div>}>
      <OnboardingInner />
    </Suspense>
  );
}
