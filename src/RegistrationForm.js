// src/RegistrationForm.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, set, update } from 'firebase/database';
import { database } from './firebase';
import { 
  FiUser, FiPhone, FiMapPin, FiBriefcase, 
  FiCheckCircle, FiAlertCircle, FiArrowRight
} from 'react-icons/fi';

const RegistrationForm = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    city: '',
    canadianStatus: ''
  });

  // Available options
  const cities = ['Brampton', 'Etobicoke', 'Mississauga', 'Toronto', 'Hamilton', 'London', 'Kitchener', 'Ottawa', 'Other'];
  const canadianStatuses = ['Citizen', 'Permanent Resident', 'Student', 'Work Permit', 'Visitor', 'Other'];

  // Validate token on load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setLoading(false);
        return;
      }

      try {
        const tokenRef = ref(database, `QRTokens/${token}`);
        const snapshot = await get(tokenRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Check if token is expired or used
          const now = new Date();
          const expiresAt = new Date(data.expiresAt);
          
          if (expiresAt < now || data.used) {
            setTokenValid(false);
            setError('This QR code has expired or has been used');
          } else {
            setTokenValid(true);
            setTokenData(data);
          }
        } else {
          setTokenValid(false);
          setError('Invalid QR code');
        }
      } catch (err) {
        console.error('Error validating token:', err);
        setTokenValid(false);
        setError('Failed to validate QR code');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Handle form input changes
  const handleInputChange = (field) => (e) => {
    let value = e.target.value;
    
    if (field === 'phoneNumber') {
      // Only allow numbers and limit to 10 digits
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Validate form
  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    
    if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
      setError('Valid 10-digit phone number is required');
      return false;
    }
    
    if (!formData.city) {
      setError('City is required');
      return false;
    }
    
    if (!formData.canadianStatus) {
      setError('Canadian status is required');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const now = new Date();
      const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare registration data
      const registrationData = {
        id: registrationId,
        ...formData,
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        token: token,
        registeredAt: now.toISOString(),
        registrationMethod: 'qr_scan',
        status: 'pending_assignment',
        assigned: false,
        rejected: false,
        karyakarInfo: tokenData.generatedBy || null
      };

      // Save to RawRegisterData
      const rawRegisterRef = ref(database, `RawRegisterData/${registrationId}`);
      await set(rawRegisterRef, registrationData);

      // Also save to token's registrations
      const tokenRegistrationsRef = ref(database, `QRTokens/${token}/registrations/${registrationId}`);
      await set(tokenRegistrationsRef, registrationData);

      // Update token's total registrations count
      const tokenRef = ref(database, `QRTokens/${token}`);
      const tokenSnap = await get(tokenRef);
      if (tokenSnap.exists()) {
        const currentData = tokenSnap.val();
        await update(tokenRef, {
          totalRegistrations: (currentData.totalRegistrations || 0) + 1,
          lastRegistrationAt: now.toISOString()
        });
      }

      // Send notification to karyakar
      if (tokenData.generatedBy?.id) {
        const notificationRef = ref(database, `Notifications/${tokenData.generatedBy.id}/${registrationId}`);
        await set(notificationRef, {
          type: 'new_registration',
          registrationId: registrationId,
          token: token,
          userName: `${formData.firstName} ${formData.lastName}`,
          phoneNumber: formData.phoneNumber,
          city: formData.city,
          status: formData.canadianStatus,
          createdAt: now.toISOString(),
          read: false
        });
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        city: '',
        canadianStatus: ''
      });

    } catch (err) {
      console.error('Error submitting registration:', err);
      setError('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Validating QR code...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="h-16 w-16 mx-auto mb-6 flex items-center justify-center bg-red-100 rounded-full">
            <FiAlertCircle className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid QR Code</h2>
          <p className="text-gray-600 mb-6">{error || 'This QR code is invalid or has expired.'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="h-16 w-16 mx-auto mb-6 flex items-center justify-center bg-green-100 rounded-full">
            <FiCheckCircle className="text-green-500 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for registering. The Karyakar ({tokenData.generatedBy?.name}) will review your registration and contact you soon.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Your registration is pending assignment to a Karyakar. You will be notified once assigned.
            </p>
          </div>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center bg-blue-100 rounded-full">
            <FiUser className="text-blue-600 text-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Register with Ravisabha</h1>
          <p className="text-gray-600 mt-2">
            Scan by: <span className="font-semibold text-blue-600">{tokenData.generatedBy?.name}</span>
            {tokenData.generatedBy?.city && ` (${tokenData.generatedBy.city})`}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            QR Code Valid for {Math.round((new Date(tokenData.expiresAt) - new Date()) / (1000 * 60 * 60))} more hours
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <FiAlertCircle size={20} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiUser size={18} />
                </div>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  placeholder="John"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiUser size={18} />
                </div>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  placeholder="Doe"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiPhone size={18} />
              </div>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
                placeholder="000-000-0000"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                required
                disabled={submitting}
                maxLength="10"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiMapPin size={18} />
              </div>
              <select
                value={formData.city}
                onChange={handleInputChange('city')}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                required
                disabled={submitting}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 1rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.2em'
                }}
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Canadian Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Canadian Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiBriefcase size={18} />
              </div>
              <select
                value={formData.canadianStatus}
                onChange={handleInputChange('canadianStatus')}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                required
                disabled={submitting}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 1rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.2em'
                }}
              >
                <option value="">Select Status</option>
                {canadianStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                Register Now
                <FiArrowRight />
              </>
            )}
          </button>

          {/* Info */}
          <div className="text-center text-sm text-gray-500">
            <p>By registering, you agree to be contacted by Ravisabha volunteers.</p>
            <p className="mt-1">Your information will be reviewed and assigned to a Karyakar.</p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by Ravisabha Registration System</p>
          <p className="mt-1">Token: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{token.substring(0, 12)}...</code></p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;