import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HelpCircle, Shield, Mail, ChevronDown, ChevronUp,
  Search, MapPin, Calendar, CheckCircle, Package,
  ArrowRight, MessageSquare, Phone, Zap, ShieldCheck,
  RefreshCw, Star, AlertCircle, Send, User
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// ─── FAQ Item ────────────────────────────────────────────────────────────────
const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        <span className="flex-shrink-0 text-primary">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      {open && (
        <div className="px-6 pb-6 text-gray-600 leading-relaxed text-sm border-t border-gray-50 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
};

// ─── Step Card ───────────────────────────────────────────────────────────────
const StepCard = ({ step, title, desc, icon: Icon, color }) => (
  <div className="relative flex gap-5 group">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step}</span>
      </div>
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ─── How It Works Tab ────────────────────────────────────────────────────────
const HowItWorksTab = () => (
  <div className="space-y-16">
    {/* Renting flow */}
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Search size={20} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">How to Rent an Item</h3>
          <p className="text-sm text-gray-500">From browsing to handover in minutes</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StepCard step={1} title="Browse & Discover" icon={Search} color="bg-blue-500"
          desc="Use the Products page or Map View to find items available near you. Filter by category, price, or distance." />
        <StepCard step={2} title="Pick Your Dates" icon={Calendar} color="bg-indigo-500"
          desc="Select your pick-up and return dates on the product page. The price and deposit breakdown are shown instantly." />
        <StepCard step={3} title="Send a Booking Request" icon={MessageSquare} color="bg-violet-500"
          desc="Submit your request with an optional introduction message. The owner is instantly notified and will respond within 24 hours." />
        <StepCard step={4} title="Complete the Handover" icon={Package} color="bg-primary"
          desc="Once approved, meet the owner for a documented condition check handover. Both parties sign off on the item's state." />
      </div>
    </div>

    {/* Listing flow */}
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">How to List Your Item</h3>
          <p className="text-sm text-gray-500">Start earning passive income in under 2 minutes</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StepCard step={1} title="Verify Your Identity" icon={ShieldCheck} color="bg-emerald-500"
          desc="Complete the KYC identity verification process once. This builds trust with renters and unlocks the ability to list." />
        <StepCard step={2} title="Create Your Listing" icon={MapPin} color="bg-teal-500"
          desc="Upload 3–5 photos, write a description, set your daily price and security deposit. Add your location to appear on Map View." />
        <StepCard step={3} title="Manage Requests" icon={CheckCircle} color="bg-cyan-500"
          desc="Review incoming booking requests from your Bookings dashboard. Approve, reject, or message renters directly." />
        <StepCard step={4} title="Get Paid" icon={Star} color="bg-amber-500"
          desc="After the rental is completed and the item returned in good condition, the rental payment is released to you." />
      </div>
    </div>

    {/* FAQ */}
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
      <div className="space-y-3">
        <FAQItem
          question="What happens if the item gets damaged during a rental?"
          answer="If damage occurs, the owner can initiate a dispute from their Bookings dashboard. Our team reviews the pre-rental and post-return condition check photos to make a fair decision. The security deposit covers any verified damage up to its value."
        />
        <FAQItem
          question="Is there a fee for using RentNear?"
          answer="RentNear charges a small platform service fee of 8–12% on each completed transaction. This covers identity verification, dispute resolution infrastructure, and payment processing. Listing an item is always free."
        />
        <FAQItem
          question="How are security deposits handled?"
          answer="Security deposits are held in escrow during the rental period. They are released to the owner if damage is confirmed, or refunded to the renter after a successful return check is completed by both parties."
        />
        <FAQItem
          question="Can I cancel a booking after it's been approved?"
          answer="Yes, but cancellation policies vary. If you cancel more than 48 hours before the rental start date, you receive a full refund. Cancellations within 48 hours may incur a 25% fee. Check the item listing for the owner's specific policy."
        />
      </div>
    </div>
  </div>
);

// ─── Trust & Safety Tab ──────────────────────────────────────────────────────
const TrustSafetyTab = () => (
  <div className="space-y-10">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        {
          icon: ShieldCheck, color: 'bg-primary/10 text-primary', title: 'KYC Identity Verification',
          desc: 'Every user completes a government-ID-backed identity check before they can list items or make bookings. This ensures every person on the platform is who they say they are.'
        },
        {
          icon: Package, color: 'bg-blue-50 text-blue-600', title: 'Condition Check System',
          desc: 'Before any handover, both parties document the item\'s condition with photos and a checklist. On return, the same process is repeated so there\'s no ambiguity about damage.'
        },
        {
          icon: RefreshCw, color: 'bg-purple-50 text-purple-600', title: 'Dispute Resolution',
          desc: 'If a disagreement arises, our trained team reviews all documentation — booking history, condition checks, photos, and messages — to mediate a fair outcome for both parties.'
        },
      ].map(({ icon: Icon, color, title, desc }) => (
        <div key={title} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-5`}>
            <Icon size={26} />
          </div>
          <h4 className="font-bold text-gray-900 mb-3">{title}</h4>
          <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>

    <div className="bg-navy rounded-3xl p-10 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={24} className="text-primary-light" />
          <h3 className="text-xl font-bold">Our Zero-Tolerance Policy</h3>
        </div>
        <p className="text-gray-300 leading-relaxed max-w-3xl">
          Any attempt to circumvent the platform (e.g., completing transactions off-platform to avoid fees), 
          fraudulent identity documents, or deliberate damage to rental items results in permanent account suspension 
          and referral to appropriate authorities. We take the safety of our community extremely seriously.
        </p>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">Safety Tips for Renters & Owners</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          'Always complete the condition check — never skip it.',
          'Meet in a well-lit, public location for handovers.',
          'Do not share personal financial details in chat.',
          'Take clear photos from multiple angles before handing over.',
          'Report suspicious profiles or requests to our support team.',
          'Keep all communication inside the RentNear platform.',
        ].map((tip) => (
          <div key={tip} className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <CheckCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Contact Tab ─────────────────────────────────────────────────────────────
const ContactTab = () => {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setSubmitting(true);
    // Simulate API call
    await new Promise(res => setTimeout(res, 1500));
    setSubmitting(false);
    setSubmitted(true);
    showToast('Your message has been sent! We\'ll respond within 24 hours.', 'success');
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Message Sent!</h3>
        <p className="text-gray-500 mb-8">
          Thank you for reaching out. Our support team will get back to you at <strong>{form.email}</strong> within 24 hours.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
      {/* Contact Info */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Get in Touch</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Our support team is available 7 days a week. Average response time is under 4 hours on business days.
          </p>
        </div>
        {[
          { icon: Mail, label: 'Email Support', value: 'support@rentnear.app', color: 'bg-blue-50 text-blue-600' },
          { icon: Phone, label: 'Phone (Mon–Fri, 9am–6pm)', value: '+1 (800) RENT-NEAR', color: 'bg-emerald-50 text-emerald-600' },
          { icon: MessageSquare, label: 'Live Chat', value: 'Available in the app (response < 2 min)', color: 'bg-purple-50 text-purple-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Send us a Message</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
          <select
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          >
            <option value="">Select a topic...</option>
            <option value="booking">Booking Issue</option>
            <option value="payment">Payment or Deposit</option>
            <option value="dispute">Dispute Resolution</option>
            <option value="kyc">Identity Verification (KYC)</option>
            <option value="account">Account & Profile</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Describe your issue or question in detail..."
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <><Send size={18} /> Send Message</>
          )}
        </button>
      </form>
    </div>
  );
};

// ─── Main Support Page ────────────────────────────────────────────────────────
const TABS = [
  { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
  { id: 'trust-safety',  label: 'Trust & Safety', icon: Shield },
  { id: 'contact',       label: 'Contact Support', icon: Mail },
];

const Support = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('how-it-works');

  // Auto-select tab based on URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (TABS.some(t => t.id === hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-navy py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm text-gray-300 mb-6">
            <HelpCircle size={14} className="text-primary-light" />
            Help & Support Center
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            How can we help you?
          </h1>
          <p className="text-gray-400 text-lg">
            Find answers, learn how RentNear works, or reach our team directly.
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {activeTab === 'how-it-works' && <HowItWorksTab />}
        {activeTab === 'trust-safety' && <TrustSafetyTab />}
        {activeTab === 'contact' && <ContactTab />}
      </div>

      {/* Still need help CTA */}
      {activeTab !== 'contact' && (
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Still need help?</h3>
              <p className="text-gray-500 text-sm">Our support team is ready to assist you.</p>
            </div>
            <button
              onClick={() => setActiveTab('contact')}
              className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Contact Support <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
