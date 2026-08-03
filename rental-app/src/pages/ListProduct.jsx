import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { getLocalProducts, saveLocalProducts } from '../utils/localDb';
import Input from '../components/Input';
import Select from '../components/Select';
import TextArea from '../components/TextArea';
import FileUpload from '../components/FileUpload';
import Button from '../components/Button';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, PackageOpen, Camera, ShieldCheck, Tag } from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';

const CATEGORY_OPTIONS = [
  { value: 'Cameras', label: 'Cameras & Lenses' },
  { value: 'Tools', label: 'Power Tools' },
  { value: 'Bikes', label: 'Bicycles & Scooters' },
  { value: 'Electronics', label: 'Electronics & Tech' },
  { value: 'Books', label: 'Books & Textbooks' },
  { value: 'Speakers', label: 'Audio & Speakers' },
  { value: 'Sports', label: 'Sports & Outdoors' },
  { value: 'Gaming', label: 'Gaming Consoles' },
  { value: 'Other', label: 'Other' },
];

const CONDITION_OPTIONS = [
  { value: 'Excellent', label: 'Excellent (Like New)' },
  { value: 'Good', label: 'Good (Minor wear)' },
  { value: 'Fair', label: 'Fair (Visible wear)' },
];

const ListProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isMock } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(!!id);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '', category: '', description: '', photos: [], condition: 'Good',
    price_per_day: '', price_per_hour: '', deposit_amount: '0', is_available: true,
    instant_booking_enabled: false, calendar_blocked_dates: [], blockDateInput: '',
    location: '', latitude: null, longitude: null
  });

  const [pricingRec, setPricingRec] = useState({ min: 15, max: 45, avg: 25 });

  useEffect(() => {
    if (formData.category) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/products/pricing-recommendation?category=${encodeURIComponent(formData.category)}`)
        .then(r => r.json())
        .then(d => { if (d.recommendation) setPricingRec(d.recommendation); })
        .catch(() => {});
    }
  }, [formData.category]);

  // Auto-detect GPS location on load for new listings
  useEffect(() => {
    if (!id && navigator.geolocation) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location: prev.location || `GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
          }));
          setDetectingLocation(false);
        },
        (err) => {
          console.warn("GPS location permission denied or error:", err.message);
          setDetectingLocation(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  }, [id]);

  const detectGpsLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location: `GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
        }));
        setDetectingLocation(false);
      },
      (err) => {
        setError("Failed to get device location. Please grant location permissions.");
        setDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const fetchExistingProduct = async () => {
      try {
        if (isMock) {
          throw new Error('mock');
        }
        const { data, error } = await supabase.from('products').select('*').eq('id', id).eq('owner_id', user.id).maybeSingle();
        if (error) throw error;
        setFormData({
          title: data.title || '', category: data.category || '', description: data.description || '',
          photos: data.images || [], condition: data.condition || 'Good', price_per_day: data.price_per_day || '',
          price_per_hour: data.price_per_hour || '', deposit_amount: data.deposit_amount || '0', is_available: data.is_available !== false,
          instant_booking_enabled: data.instant_booking_enabled === true, calendar_blocked_dates: data.calendar_blocked_dates || [], blockDateInput: '',
          location: data.location || '', latitude: data.latitude || null, longitude: data.longitude || null,
        });
      } catch (err) {
        if (isMock && id) {
          const allProducts = getLocalProducts();
          const foundProduct = allProducts.find(p => p.id === id && p.owner_id === user?.id);
          if (foundProduct) {
            setFormData({
              title: foundProduct.title || '', category: foundProduct.category || '', description: foundProduct.description || '',
              photos: foundProduct.images || [], condition: foundProduct.condition || 'Good', price_per_day: foundProduct.price_per_day || '',
              price_per_hour: foundProduct.price_per_hour || '', deposit_amount: foundProduct.deposit_amount || '0', is_available: foundProduct.is_available !== false,
              instant_booking_enabled: foundProduct.instant_booking_enabled === true, calendar_blocked_dates: foundProduct.calendar_blocked_dates || [], blockDateInput: '',
              location: foundProduct.location || '', latitude: foundProduct.latitude || null, longitude: foundProduct.longitude || null,
            });
          } else {
            setError('Failed to load product for editing.');
          }
        } else {
          setError('Failed to load product for editing.');
        }
      } finally {
        setInitialFetchLoading(false);
      }
    };
    if (id && user) fetchExistingProduct();
  }, [id, user, isMock]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    if (type === 'number' && parseFloat(finalValue) < 0) finalValue = '0';
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && (!formData.title || !formData.category || !formData.description)) { setError('Please fill out all required fields.'); return; }
    if (step === 2 && formData.photos.length === 0) { setError('Please upload at least one photo.'); return; }
    setStep(s => s + 1);
  };

  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.price_per_day) { setError('Price per day is required.'); return; }
    try {
      setLoading(true);
      setError('');
      
      const uploadedImageUrls = [];
      if (isMock) {
        for (const file of formData.photos) {
          if (typeof file === 'string') {
            uploadedImageUrls.push(file);
          } else {
            uploadedImageUrls.push(URL.createObjectURL(file));
          }
        }
        if (uploadedImageUrls.length === 0) {
          uploadedImageUrls.push('https://via.placeholder.com/400x300?text=' + encodeURIComponent(formData.title));
        }

        const productPayload = {
          id: id || 'mock-prod-id-' + Math.random().toString(36).substring(2, 11),
          title: formData.title,
          category: formData.category,
          description: formData.description,
          condition: formData.condition,
          price_per_day: parseFloat(formData.price_per_day),
          price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
          deposit_amount: parseFloat(formData.deposit_amount),
          is_available: formData.is_available,
          instant_booking_enabled: formData.instant_booking_enabled,
          calendar_blocked_dates: formData.calendar_blocked_dates,
          images: uploadedImageUrls,
          location: formData.location || 'New Delhi, India',
          latitude: formData.latitude || 28.6139,
          longitude: formData.longitude || 77.2090,
          owner_id: user.id,
          created_at: new Date().toISOString()
        };

        const localProducts = getLocalProducts();
        if (id) {
          const updated = localProducts.map(p => p.id === id ? productPayload : p);
          saveLocalProducts(updated);
        } else {
          localProducts.push(productPayload);
          saveLocalProducts(localProducts);
        }

        navigate('/my-listings');
        return;
      }

      for (const file of formData.photos) {
        if (typeof file === 'string') { uploadedImageUrls.push(file); continue; }
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        uploadedImageUrls.push(publicUrl);
      }
      const productPayload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        condition: formData.condition,
        price_per_day: parseFloat(formData.price_per_day),
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
        deposit_amount: parseFloat(formData.deposit_amount),
        is_available: formData.is_available,
        images: uploadedImageUrls,
        owner_id: user.id,
        location: formData.location || 'New Delhi',
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: 'approved',
      };
      let dbError;
      if (id) {
        const { error } = await supabase.from('products').update(productPayload).eq('id', id).eq('owner_id', user.id);
        dbError = error;
      } else {
        const { error } = await supabase.from('products').insert([productPayload]);
        dbError = error;
      }
      if (dbError) throw new Error(dbError.message || 'Failed to save product');
      navigate('/my-listings');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user && user.kyc_status !== 'verified') {
    return (
      <div className="min-h-screen pt-24 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto p-12 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center">
          <div className="bg-yellow-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6"><AlertCircle className="text-yellow-600" size={48} /></div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Identity Verification Required</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg leading-relaxed">To build a safe community, we require all lenders to verify their identity before listing products. It takes just 2 minutes.</p>
          <Button onClick={() => navigate('/kyc')} className="px-8 py-4 text-lg rounded-2xl">{user.kyc_status === 'pending' ? 'Check Verification Status' : 'Complete KYC Now'}</Button>
        </div>
      </div>
    );
  }

  if (initialFetchLoading) return <div className="min-h-screen pt-20 flex justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;

  const steps = ['Basic Info', 'Photos & Condition', 'Pricing'];

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><PackageOpen size={40} /></div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{id ? 'Edit Listing' : 'List an Item'}</h1>
          <p className="text-gray-500 text-lg">Turn your idle gear into a passive income stream safely and securely.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Main Form Area */}
          <div className="flex-1 w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-10">
            
            <div className="mb-10 px-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-100 rounded-full -z-10"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full transition-all duration-500 -z-10" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                {steps.map((label, index) => {
                  const isActive = step >= index + 1;
                  const isCurrent = step === index + 1;
                  return (
                    <div key={label} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400 border-2 border-white'}`}>
                        {isActive && !isCurrent ? <CheckCircle2 size={20} /> : index + 1}
                      </div>
                      <span className={`mt-3 text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {error && <div className="mb-8 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start"><AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" /><p className="text-sm text-red-700 font-medium">{error}</p></div>}

            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-black text-gray-900 mb-6">What are you listing?</h2>
                <Input label="Item Title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Sony A7III Mirrorless Camera" className="bg-gray-50 border-gray-200 focus:bg-white" />
                <Select label="Category" name="category" options={CATEGORY_OPTIONS} value={formData.category} onChange={handleChange} className="bg-gray-50 border-gray-200 focus:bg-white" />
                <TextArea label="Detailed Description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe your item, what's included, and any rules for renters..." rows={6} maxLength={1000} className="bg-gray-50 border-gray-200 focus:bg-white resize-none" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Show it off</h2>
                <FileUpload label="Product Photos (Max 5)" maxFiles={5} maxSizeMB={2} onChange={(files) => setFormData({...formData, photos: files})} />
                <p className="text-xs text-gray-500 mb-6 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">Upload up to 5 clear photos. Items with well-lit photos get rented 3x faster.</p>
                <Select label="Item Condition" name="condition" options={CONDITION_OPTIONS} value={formData.condition} onChange={handleChange} className="bg-gray-50 border-gray-200 focus:bg-white" />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Set your price</h2>
                
                {pricingRec && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        ⚡ Smart Pricing Engine Recommendation
                      </h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        Recommended daily rate for <strong>{formData.category || 'this item'}</strong>: <strong>${pricingRec.min} – ${pricingRec.max}</strong> / day (Market avg: ${pricingRec.avg}).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, price_per_day: pricingRec.avg })}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all whitespace-nowrap"
                    >
                      Apply ${pricingRec.avg}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="Price per day ($) *" name="price_per_day" type="number" min="1" step="0.01" value={formData.price_per_day} onChange={handleChange} placeholder="25.00" className="bg-gray-50 border-gray-200 focus:bg-white text-lg font-bold" />
                  <Input label="Price per hour ($) (Optional)" name="price_per_hour" type="number" min="1" step="0.01" value={formData.price_per_hour} onChange={handleChange} placeholder="5.00" className="bg-gray-50 border-gray-200 focus:bg-white text-lg" />
                </div>
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <Input label="Security Deposit ($)" name="deposit_amount" type="number" min="0" step="0.01" value={formData.deposit_amount} onChange={handleChange} placeholder="100.00" className="bg-white border-blue-200" />
                  <p className="text-xs text-blue-600 mt-2 font-medium">This amount is held securely on the renter's card to cover potential damage or loss.</p>
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 mt-4">
                  <div><h4 className="font-bold text-gray-900 mb-1">Make item available immediately?</h4><p className="text-xs text-gray-500">You can toggle this off later in your dashboard.</p></div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} className="sr-only peer" />
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-5 bg-amber-50/50 border border-amber-200 rounded-2xl mt-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">⚡ Enable Instant Booking</h4>
                    <p className="text-xs text-gray-600">Auto-approve requests for verified renters without waiting for manual confirmation.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="instant_booking_enabled" checked={formData.instant_booking_enabled} onChange={handleChange} className="sr-only peer" />
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mt-4 space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm">Owner Unavailable Dates (Blackout Calendar)</h4>
                  <p className="text-xs text-gray-500">Block specific dates when you'll be using the item or traveling.</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={formData.blockDateInput}
                      onChange={(e) => setFormData({ ...formData, blockDateInput: e.target.value })}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.blockDateInput && !formData.calendar_blocked_dates.includes(formData.blockDateInput)) {
                          setFormData({
                            ...formData,
                            calendar_blocked_dates: [...formData.calendar_blocked_dates, formData.blockDateInput],
                            blockDateInput: ''
                          });
                        }
                      }}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Block Date
                    </button>
                  </div>
                  {formData.calendar_blocked_dates.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.calendar_blocked_dates.map((d) => (
                        <span key={d} className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold">
                          {d}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              calendar_blocked_dates: formData.calendar_blocked_dates.filter(item => item !== d)
                            })}
                            className="hover:text-red-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
              {step > 1 ? <Button type="button" onClick={handlePrev} variant="secondary" className="bg-gray-50 hover:bg-gray-100 px-6 py-3 rounded-xl"><ChevronLeft size={20} /> Back</Button> : <div></div>}
              {step < 3 ? <Button type="button" onClick={handleNext} className="px-8 py-3 rounded-xl text-base shadow-lg hover:shadow-xl">Continue <ChevronRight size={20} /></Button> : <Button type="button" onClick={handleSubmit} disabled={loading} className="px-8 py-3 rounded-xl text-base shadow-lg hover:shadow-xl">{loading ? 'Publishing...' : 'Publish Listing'}</Button>}
            </div>
          </div>

          {/* Right Column: Tips (Hidden on small mobile) */}
          <div className="w-full lg:w-80 hidden md:block space-y-6 sticky top-24">
            <div className="bg-gradient-to-br from-navy to-navy-light rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px]"></div>
              <h3 className="text-xl font-black mb-6 relative z-10 flex items-center gap-2"><Tag className="text-primary-light" size={24}/> Listing Tips</h3>
              <ul className="space-y-6 relative z-10">
                <li className="flex items-start gap-3">
                  <Camera size={20} className="text-gray-400 flex-shrink-0" />
                  <div><h4 className="font-bold text-sm mb-1">Clear Lighting</h4><p className="text-xs text-gray-400 leading-relaxed">Take photos during the day. Avoid messy backgrounds.</p></div>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck size={20} className="text-gray-400 flex-shrink-0" />
                  <div><h4 className="font-bold text-sm mb-1">Be Honest</h4><p className="text-xs text-gray-400 leading-relaxed">Point out any scratches or defects in the description to avoid disputes later.</p></div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-gray-400 flex-shrink-0" />
                  <div><h4 className="font-bold text-sm mb-1">Fair Pricing</h4><p className="text-xs text-gray-400 leading-relaxed">Check similar listings to price competitively. 5-10% of retail value per day is standard.</p></div>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default ListProduct;
