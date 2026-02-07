/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiPhone, FiMapPin, FiArrowRight, 
  FiLoader, FiShield, FiCheckCircle, FiAlertCircle,
  FiMail, FiXCircle, FiInfo, FiLock
} from 'react-icons/fi';
import { database } from './firebase';
import { ref, set, push, update, get } from 'firebase/database';
import './form.css';

// Carousel Images
const bapsImages = [
  "https://img.peapix.com/15944424508851487235_1080.jpg",
  "https://www.baps.org/Data/Sites/1/Media/GalleryImages/27390/WebImages/055a_Ashmita_Din_Toronto_June18__NYN0225_001.jpg",
  "https://www.baps.org/Data/Sites/1/Media/GalleryImages/27390/WebImages/056dd_Ashmita_Din_Toronto_June18_DBRT4531_001.jpg",
  "https://www.baps.org/Data/Sites/1/Media/GalleryImages/27390/WebImages/066a_Ashmita_Din_Toronto_June18_DBRT4743.jpg",
  "https://www.baps.org/Data/Sites/1/Media/GalleryImages/27390/WebImages/053i_Ashmita_Din_Toronto_June18_MGB02374.jpg",
  "https://www.baps.org/Data/Sites/1/Media/GalleryImages/27390/WebImages/053e_Ashmita_Din_Toronto_June18__NYN0150A_001.jpg",
  "https://www.baps.org/Data/Sites/1/Media/GalleryImages/27390/WebImages/053e_Ashmita_Din_Toronto_June18__NYN0174A_001.jpg",
  "https://www.baps.org/Data/Sites/1/Media/GalleryImages/27390/WebImages/056a_Ashmita_Din_Toronto_June18__NYN0257_001.jpg"
];

const RegistrationForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoSlide, setIsAutoSlide] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', city: '', email: ''
  });

  useEffect(() => {
    const checkTokenStatus = async () => {
      if (!token) { setTokenValid(false); setError('No registration token provided.'); return; }
      try {
        const tokenRef = ref(database, `QRTokens/${token}`);
        const snapshot = await get(tokenRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.used) { setTokenValid(false); setError('This QR code has already been used.'); }
          else if (data.status === 'deactive') { setTokenValid(false); setError('This registration session is inactive.'); }
          else { setTokenValid(true); }
        } else { setTokenValid(false); setError('Invalid registration token.'); }
      } catch (e) { setTokenValid(false); setError('Connection error. Please try again.'); }
    };
    checkTokenStatus();
  }, [token]);

  useEffect(() => {
    if (!isAutoSlide) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((p) => (p === bapsImages.length - 1 ? 0 : p + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoSlide]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const regId = `reg_${Date.now()}`;
      await set(push(ref(database, 'RawQRdata')), { ...formData, id: regId, token, timestamp: new Date().toISOString() });
      await update(ref(database, `QRTokens/${token}`), { status: 'deactive', used: true, registername: `${formData.firstName} ${formData.lastName}` });
      setSuccess(true);
    } catch (err) {
      setError('System busy. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="rs-app-wrapper">
      {/* Cinematic Carousel */}
      <section className="rs-hero-section">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={bapsImages[currentImageIndex]}
            className="rs-hero-img"
            initial={{ opacity: 0, filter: 'grayscale(0.5)' }}
            animate={{ opacity: 1, filter: 'grayscale(0)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        </AnimatePresence>
        <div className="rs-hero-overlay">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             {/* <h1 className="rs-hero-title">Ravisabha</h1> */}
             <p className="rs-hero-subtitle">students registraion</p>
          </motion.div>
        </div>
      </section>

      {/* Main Registration Area */}
      <main className="rs-content-area">
        <div className="rs-form-container">
          {tokenValid === null ? (
            <div className="rs-loader-card">
              <FiLoader className="spin" />
              <p>Securing Connection...</p>
            </div>
          ) : !tokenValid ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rs-status-card error">
              <FiXCircle className="status-icon" />
              <h2>Invalid Access</h2>
              <p>{error}</p>
              <button className="rs-btn-outline" onClick={() => navigate('/')}>Back to Portal</button>
            </motion.div>
          ) : !success ? (
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rs-main-card">
              <div className="rs-card-accent" />
              <div className="rs-card-header">
                <div className="rs-lock-indicator"><FiLock /> Secure Form</div>
                <h2>New Registration</h2>

              </div>

              {error && <div className="rs-error-toast"><FiAlertCircle /> {error}</div>}

              <form className="rs-form-stack" onSubmit={handleSubmit}>
                <div className="rs-form-row">
                  <div className="rs-input-wrapper">
                    <label>First Name</label>
                    <div className="rs-field">
                      <FiUser className="f-icon" />
                      <input name="firstName" placeholder="John" onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="rs-input-wrapper">
                    <label>Last Name</label>
                    <div className="rs-field">
                      <FiUser className="f-icon" />
                      <input name="lastName" placeholder="Doe" onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>

                <div className="rs-input-wrapper">
                  <label>Mobile Number</label>
                  <div className="rs-field">
                    <FiPhone className="f-icon" />
                    <input type="tel" name="phone" placeholder="Phone" onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="rs-input-wrapper">
                  <label>Email Address</label>
                  <div className="rs-field">
                    <FiMail className="f-icon" />
                    <input type="email" name="email" placeholder="example@mail.com" onChange={handleInputChange} />
                  </div>
                </div>

                <div className="rs-input-wrapper">
                  <label>City</label>
                  <div className="rs-field">
                    <FiMapPin className="f-icon" />
                    <select name="city" onChange={handleInputChange} required>
                      <option value="">Select Region</option>
                      <option>Toronto</option>
                      <option>Brampton</option>
                      <option>Mississauga</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="rs-btn-submit" disabled={submitting}>
                  {submitting ? <FiLoader className="spin" /> : <>Complete Registration <FiArrowRight /></>}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rs-status-card success"
          >
            <div className="rs-success-badge">
              <FiCheckCircle />
            </div>
          
            <h2>Jai Swaminarayan</h2>
          
            <p>
              Registration successful for <strong>{formData.firstName}</strong>.
            </p>
          
            <div className="rs-info-banner">
              <FiInfo />
              Thank you for registering.
            </div>
          
          
          
            <a
  href="https://chat.whatsapp.com/BtTPvZ0nrcoImclC9MMskF"
  target="_blank"
  rel="noopener noreferrer"
  className="rs-btn-submit"
>
  Join WhatsApp Community
</a>

          </motion.div>
          
          )}
        </div>
      </main>

   
    </div>
  );
};

export default RegistrationForm;