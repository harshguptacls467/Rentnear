import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import Input from '../components/Input';
import Select from '../components/Select';
import TextArea from '../components/TextArea';
import FileUpload from '../components/FileUpload';
import Button from '../components/Button';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, PackageOpen } from 'lucide-react';
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
  const { id } = useParams(); // If id exists, we are in EDIT mode
  const { user } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(!!id);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    photos: [], // Array of File objects (or strings for existing images)
    condition: 'Good',
    price_per_day: '',
    price_per_hour: '',
    deposit_amount: '0',
    is_available: true,
  });
  
  // PRE-FILL FORM IF EDITING
  useEffect(() => {
    const fetchExistingProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user.id) // Ensure they own it
          .single();
          
        if (error) throw error;
        
        setFormData({
          title: data.title || '',
          category: data.category || '',
          description: data.description || '',
          photos: data.images || [], // In a robust app, we'd handle existing URLs mixed with new Files
          condition: data.condition || 'Good',
          price_per_day: data.price_per_day || '',
          price_per_hour: data.price_per_hour || '',
          deposit_amount: data.deposit_amount || '0',
          is_available: data.is_available !== false,
        });
      } catch {
        setError('Failed to load product for editing. You may not have permission.');
      } finally {
        setInitialFetchLoading(false);
      }
    };

    if (id && user) fetchExistingProduct();
  }, [id, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Prevent negative numbers for pricing/deposits
    let finalValue = type === 'checkbox' ? checked : value;
    if (type === 'number' && parseFloat(finalValue) < 0) {
      finalValue = '0';
    }

    setFormData({
      ...formData,
      [name]: finalValue
    });
  };

  const handleNext = () => {
    // Basic validation before moving next
    setError('');
    if (step === 1 && (!formData.title || !formData.category || !formData.description)) {
      setError('Please fill out all required fields.');
      return;
    }
    if (step === 2 && formData.photos.length === 0) {
      setError('Please upload at least one photo.');
      return;
    }
    setStep(s => s + 1);
  };

  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.price_per_day) {
      setError('Price per day is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const uploadedImageUrls = [];

      // 1. Upload Images Sequentially (Only if they are new File objects)
      for (const file of formData.photos) {
        if (typeof file === 'string') {
          // It's already an existing URL from a previous upload
          uploadedImageUrls.push(file);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      // 2. Prepare Payload
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
        owner_id: user.id // Supabase will enforce RLS based on this
      };

      // 3. Update Database (Directly using Supabase since backend API isn't fully active yet)
      let dbError;
      
      if (id) {
        // EDIT MODE: Update existing
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', id)
          .eq('owner_id', user.id); // Extra security layer
        dbError = error;
      } else {
        // CREATE MODE: Insert new
        const { error } = await supabase
          .from('products')
          .insert([productPayload]);
        dbError = error;
      }

      if (dbError) {
        throw new Error(dbError.message || 'Failed to save product');
      }

      navigate('/my-listings');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // KYC CHECK
  if (user && user.kyc_status !== 'verified') {
    return (
      <div className="max-w-2xl mx-auto p-4 py-12 text-center">
        <div className="bg-yellow-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-yellow-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Identity Verification Required</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          To build a safe community, we require all lenders to verify their identity before listing products.
        </p>
        <Button onClick={() => navigate('/kyc')} size="lg">
          {user.kyc_status === 'pending' ? 'Check Verification Status' : 'Complete KYC Now'}
        </Button>
      </div>
    );
  }

  if (initialFetchLoading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // UI rendering helpers
  const steps = ['Basic Info', 'Photos & Condition', 'Pricing'];

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header & Progress Indicator */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackageOpen size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">List an Item</h1>
          <p className="text-gray-500 mt-2">Turn your idle gear into a passive income stream.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            
            {steps.map((label, index) => {
              const isActive = step >= index + 1;
              const isCurrent = step === index + 1;
              return (
                <div key={label} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    isActive ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isActive && !isCurrent ? <CheckCircle2 size={16} /> : index + 1}
                  </div>
                  <span className={`mt-2 text-xs font-semibold ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-6">What are you listing?</h2>
              
              <Input 
                label="Item Title" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Sony A7III Mirrorless Camera"
              />
              
              <Select 
                label="Category" 
                name="category"
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={handleChange}
              />
              
              <TextArea 
                label="Description" 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your item, what's included, and any rules for renters..."
                rows={5}
                maxLength={1000}
              />
            </div>
          )}

          {/* STEP 2: Photos & Condition */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Show it off</h2>
              
              <FileUpload 
                label="Product Photos" 
                maxFiles={5}
                maxSizeMB={2}
                onChange={(files) => setFormData({...formData, photos: files})}
              />
              <p className="text-sm text-gray-500 -mt-2 mb-6">Upload up to 5 clear photos of your item. Good lighting helps rentals!</p>
              
              <Select 
                label="Item Condition" 
                name="condition"
                options={CONDITION_OPTIONS}
                value={formData.condition}
                onChange={handleChange}
              />
            </div>
          )}

          {/* STEP 3: Pricing */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Set your price</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input 
                  label="Price per day ($) *" 
                  name="price_per_day"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.price_per_day}
                  onChange={handleChange}
                  placeholder="25.00"
                />
                <Input 
                  label="Price per hour ($) (Optional)" 
                  name="price_per_hour"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.price_per_hour}
                  onChange={handleChange}
                  placeholder="5.00"
                />
              </div>

              <Input 
                label="Security Deposit ($)" 
                name="deposit_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.deposit_amount}
                onChange={handleChange}
                placeholder="100.00"
              />
              <p className="text-sm text-gray-500 -mt-4">This amount is held on the renter's card during the rental period.</p>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mt-4">
                <div>
                  <h4 className="font-bold text-gray-900">Make item available immediately?</h4>
                  <p className="text-sm text-gray-500">You can toggle this off later in your dashboard.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <Button type="button" onClick={handlePrev} variant="secondary" className="flex items-center gap-2 bg-white">
                <ChevronLeft size={16} /> Back
              </Button>
            ) : <div></div>}
            
            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="flex items-center gap-2">
                Continue <ChevronRight size={16} />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
                {loading ? 'Publishing...' : <><CheckCircle2 size={16} /> Publish Listing</>}
              </Button>
            )}
          </div>
          
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ListProduct;
