import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, set, update } from 'firebase/database';
import { database } from './firebase';
import { 
  FiUser, FiPhone, FiMapPin, FiBriefcase, 
  FiCheckCircle, FiAlertCircle, FiArrowRight, FiLoader, FiShield
} from 'react-icons/fi';
import './form.css'; // See CSS below

const RegistrationForm = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phoneNumber: '', city: '', canadianStatus: ''
  });

  const cities = ['Brampton', 'Etobicoke', 'Mississauga', 'Toronto', 'Hamilton', 'London', 'Kitchener', 'Ottawa', 'Other'];
  const canadianStatuses = ['Citizen', 'Permanent Resident', 'Student', 'Work Permit', 'Visitor', 'Other'];

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No token provided');
        setLoading(false);
        return;
      }
      try {
        const tokenRef = ref(database, `QRTokens/${token}`);
        const snapshot = await get(tokenRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const now = new Date();
          const expiresAt = new Date(data.expiresAt);
          
          if (expiresAt < now) {
            setError('This QR code has expired. Please ask the volunteer for a new one.');
          } else if (data.used) {
            setError('This QR code has already been used.');
          } else {
            setTokenValid(true);
            setTokenData(data);
          }
        } else {
          setError('Invalid QR code. Please scan a valid code from a volunteer.');
        }
      } catch (err) {
        setError('Connection error. Please check your internet.');
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const handleInputChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'phoneNumber') value = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || formData.phoneNumber.length !== 10 || !formData.city || !formData.canadianStatus) {
      setError('Please fill all required fields correctly.');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const registrationData = {
        ...formData,
        id: registrationId,
        fullName: `${formData.firstName} ${formData.lastName}`,
        token,
        registeredAt: now.toISOString(),
        status: 'pending_assignment',
        karyakarInfo: tokenData?.generatedBy || null,
      };

      await set(ref(database, `RawRegisterData/${registrationId}`), registrationData);
      
      const tokenRef = ref(database, `QRTokens/${token}`);
      const tokenSnap = await get(tokenRef);
      if (tokenSnap.exists()) {
        await update(tokenRef, {
          totalRegistrations: (tokenSnap.val().totalRegistrations || 0) + 1,
          lastRegistrationAt: now.toISOString()
        });
      }

      setSuccess(true);
    } catch (err) {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rs-container center">
        <div className="rs-loader-card">
          <FiLoader className="rs-spinner" />
          <p>Verifying Security Token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="rs-container center">
        <div className="rs-card error-card">
          <div className="rs-icon-badge error"><FiAlertCircle /></div>
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button className="rs-btn secondary" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rs-container center">
        <div className="rs-card success-card animate-in">
          <div className="rs-icon-badge success"><FiCheckCircle /></div>
          <h2>Registration Sent!</h2>
          <p>Thank you for joining Ravisabha. A volunteer will contact you shortly.</p>
          <div className="rs-divider" />
          <button className="rs-btn primary" onClick={() => setSuccess(false)}>Register Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rs-container">
      <div className="rs-form-wrapper animate-in">
        <header className="rs-header">
          <div className="rs-logo-area">
            <FiShield className="rs-main-icon" />
          </div>
          <h1>Ravisabha Portal</h1>
          <p>Registration session with <strong>{tokenData?.generatedBy?.name || 'Volunteer'}</strong></p>
          <div className="rs-badge-row">
            <span className="rs-status-badge">Secure Session</span>
            <span className="rs-status-badge">Expires: {new Date(tokenData?.expiresAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </header>

        <form className="rs-card rs-form" onSubmit={handleSubmit}>
          {error && <div className="rs-alert"><FiAlertCircle /> {error}</div>}
          
          <div className="rs-input-group row">
            <div className="rs-field">
              <label>First Name</label>
              <div className="rs-input-wrapper">
                <FiUser className="rs-input-icon" />
                <input type="text" placeholder="e.g. Aarav" value={formData.firstName} onChange={handleInputChange('firstName')} required />
              </div>
            </div>
            <div className="rs-field">
              <label>Last Name</label>
              <div className="rs-input-wrapper">
                <FiUser className="rs-input-icon" />
                <input type="text" placeholder="e.g. Patel" value={formData.lastName} onChange={handleInputChange('lastName')} required />
              </div>
            </div>
          </div>

          <div className="rs-field">
            <label>Phone Number</label>
            <div className="rs-input-wrapper">
              <FiPhone className="rs-input-icon" />
              <input type="tel" placeholder="10-digit number" value={formData.phoneNumber} onChange={handleInputChange('phoneNumber')} required />
            </div>
          </div>

          <div className="rs-field">
            <label>Current City</label>
            <div className="rs-input-wrapper">
              <FiMapPin className="rs-input-icon" />
              <select value={formData.city} onChange={handleInputChange('city')} required>
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="rs-field">
            <label>Canadian Status</label>
            <div className="rs-input-wrapper">
              <FiBriefcase className="rs-input-icon" />
              <select value={formData.canadianStatus} onChange={handleInputChange('canadianStatus')} required>
                <option value="">Select Status</option>
                {canadianStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="rs-btn primary rs-submit" disabled={submitting}>
            {submitting ? <FiLoader className="rs-spinner" /> : <>Complete Registration <FiArrowRight /></>}
          </button>
        </form>
        
        <footer className="rs-footer">
          Encrypted Registration System &bull; ID: {token?.substring(0, 8)}
        </footer>
      </div>
    </div>
  );
};

export default RegistrationForm;