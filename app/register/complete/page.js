'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Heart, CheckCircle, Clock, ChevronRight, ChevronLeft, User, MapPin, BookOpen, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const RELIGIONS = ['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Jewish','Parsi','Other'];
const GENDERS   = ['MALE','FEMALE','OTHER'];
const MARITAL   = ['NEVER_MARRIED','DIVORCED','WIDOWED','SEPARATED'];
const EDUCATIONS = ["High School","Diploma","Bachelor's","Master's","PhD","MBBS","CA","Other"];
const PROFESSIONS = ['Software Engineer','Doctor','Teacher','Business / Entrepreneur','Lawyer','Engineer','Accountant / CA','Government Employee','Defence / Military','Banker','Other'];
const INCOMES = ['Below ₹2 Lakh','₹2-5 Lakh','₹5-10 Lakh','₹10-20 Lakh','₹20-50 Lakh','Above ₹50 Lakh','Not Disclosed'];

const STEPS = [
  { id: 'basic',    label: 'Basic Info',   icon: User },
  { id: 'religion', label: 'Religion',     icon: BookOpen },
  { id: 'location', label: 'Location',     icon: MapPin },
  { id: 'career',   label: 'Career',       icon: Users },
];

function sel(label, value, onChange, options, placeholder = 'Select') {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-pink-500">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function inp(label, value, onChange, type = 'text', placeholder = '') {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-pink-500" />
    </div>
  );
}

function CompleteInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const name  = searchParams.get('name')  || '';

  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [form, setForm]       = useState({
    gender: '', dob: '', phone: '', maritalStatus: 'NEVER_MARRIED',
    religion: '', caste: '', motherTongue: '', gotra: '',
    country: 'India', state: '', city: '',
    education: '', profession: '', income: '',
    aboutMe: '',
  });

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  // If no email param, redirect to login
  useEffect(() => {
    if (!email) router.replace('/login');
  }, [email, router]);

  const handleSubmit = async () => {
    if (!form.gender || !form.dob || !form.religion) {
      toast.error('Please fill Gender, Date of Birth and Religion');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/register/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      setDone(true);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // ── Done / Pending screen ─────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Profile Submitted!</h2>
          <p className="text-gray-500 text-sm mb-5">
            Your profile is under review. Admin will approve it within <strong>24 hours</strong>. You'll receive an email once approved.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 text-left space-y-2">
            {[
              { icon: CheckCircle, color: 'text-green-500', text: 'Google account connected' },
              { icon: CheckCircle, color: 'text-green-500', text: 'Profile information saved' },
              { icon: Clock,       color: 'text-amber-500', text: 'Waiting for admin approval' },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <span className="text-gray-600 dark:text-gray-400">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Approval email will be sent to <strong className="text-pink-500">{email}</strong>
          </p>
          <Link href="/login"
            className="block w-full gradient-bg text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity">
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Milan</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Hi <strong>{name || email}</strong>! Fill in your details to get started.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'gradient-bg text-white' :
                i === step ? 'gradient-bg text-white ring-4 ring-pink-200 dark:ring-pink-900' :
                'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'gradient-bg' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">

          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 gradient-bg rounded-xl flex items-center justify-center">
              <currentStep.icon className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-lg">{currentStep.label}</h2>
          </div>

          <div className="space-y-4">
            {/* Step 0: Basic */}
            {step === 0 && <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {GENDERS.map(g => (
                    <button key={g} type="button" onClick={() => set('gender')(g)}
                      className={`flex-1 py-2.5 rounded-2xl text-sm font-medium border-2 transition-all ${form.gender === g ? 'gradient-bg text-white border-transparent' : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'}`}>
                      {g === 'MALE' ? '👨 Male' : g === 'FEMALE' ? '👩 Female' : '⚧ Other'}
                    </button>
                  ))}
                </div>
              </div>
              {inp('Date of Birth *', form.dob, set('dob'), 'date')}
              {inp('Phone Number', form.phone, set('phone'), 'tel', '+91 9999999999')}
              {sel('Marital Status', form.maritalStatus, set('maritalStatus'), MARITAL)}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About Me</label>
                <textarea value={form.aboutMe} onChange={e => set('aboutMe')(e.target.value)} rows={3} placeholder="Tell something about yourself..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-pink-500 resize-none" />
              </div>
            </>}

            {/* Step 1: Religion */}
            {step === 1 && <>
              {sel('Religion *', form.religion, set('religion'), RELIGIONS)}
              {inp('Caste', form.caste, set('caste'), 'text', 'e.g. Brahmin, Rajput')}
              {inp('Gotra', form.gotra, set('gotra'), 'text', 'e.g. Kashyap')}
              {inp('Mother Tongue', form.motherTongue, set('motherTongue'), 'text', 'e.g. Hindi, Marathi')}
            </>}

            {/* Step 2: Location */}
            {step === 2 && <>
              {inp('Country', form.country, set('country'), 'text', 'India')}
              {inp('State', form.state, set('state'), 'text', 'e.g. Maharashtra')}
              {inp('City', form.city, set('city'), 'text', 'e.g. Mumbai')}
            </>}

            {/* Step 3: Career */}
            {step === 3 && <>
              {sel('Education', form.education, set('education'), EDUCATIONS)}
              {sel('Profession', form.profession, set('profession'), PROFESSIONS)}
              {sel('Annual Income', form.income, set('income'), INCOMES)}
            </>}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => {
                if (step === 0 && (!form.gender || !form.dob)) { toast.error('Gender and Date of Birth are required'); return; }
                if (step === 1 && !form.religion) { toast.error('Religion is required'); return; }
                setStep(s => s + 1);
              }}
                className="flex-1 flex items-center justify-center gap-1 gradient-bg text-white py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 gradient-bg text-white py-3 rounded-2xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                {saving ? 'Submitting...' : '🎉 Submit Profile'}
              </button>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account? <Link href="/login" className="text-pink-500 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CompleteInner />
    </Suspense>
  );
}
