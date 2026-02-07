// services/firebaseService.js
import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../firebase';

class FirebaseService {
  constructor() {
    this.listeners = new Map();
  }

  // Check database connection
  async checkConnection() {
    try {
      const testRef = ref(database, '.info/connected');
      return new Promise((resolve) => {
        const unsubscribe = onValue(testRef, (snapshot) => {
          resolve(snapshot.val() === true);
          unsubscribe();
        }, { onlyOnce: true });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          resolve(false);
        }, 5000);
      });
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  // Validate token
  async validateToken(token) {
    if (!token || !database) {
      return { valid: false, error: 'Invalid token or database not available' };
    }

    try {
      const tokenRef = ref(database, `QRTokens/${token}`);
      const snapshot = await get(tokenRef);
      
      if (!snapshot.exists()) {
        return { valid: false, error: 'Token not found' };
      }

      const tokenData = snapshot.val();
      const now = new Date();
      const expiresAt = new Date(tokenData.expiresAt);
      
      if (expiresAt < now) {
        return { 
          valid: false, 
          error: 'QR code has expired',
          expiredAt: tokenData.expiresAt 
        };
      }

      if (tokenData.used) {
        return { 
          valid: false, 
          error: 'QR code has already been used',
          usedAt: tokenData.usedAt 
        };
      }

      if (tokenData.status !== 'active') {
        return { 
          valid: false, 
          error: 'QR code is not active',
          status: tokenData.status 
        };
      }

      return { 
        valid: true, 
        data: tokenData,
        expiresIn: Math.round((expiresAt - now) / (1000 * 60)) // minutes
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, error: 'Failed to validate token' };
    }
  }

  // Submit registration
  async submitRegistration(token, formData) {
    if (!token || !formData || !database) {
      throw new Error('Invalid parameters or database not available');
    }

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
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: now.getTime()
      };

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'city', 'canadianStatus'];
      const missingFields = requiredFields.filter(field => !registrationData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Step 1: Save to RawRegisterData
      const rawRegisterRef = ref(database, `RawRegisterData/${registrationId}`);
      await set(rawRegisterRef, registrationData);
      console.log('✅ Saved to RawRegisterData:', registrationId);

      // Step 2: Save to token's registrations
      const tokenRegistrationsRef = ref(database, `QRTokens/${token}/registrations/${registrationId}`);
      await set(tokenRegistrationsRef, registrationData);
      console.log('✅ Saved to token registrations:', token);

      // Step 3: Update token's total registrations count
      const tokenRef = ref(database, `QRTokens/${token}`);
      const tokenSnap = await get(tokenRef);
      
      if (tokenSnap.exists()) {
        const currentData = tokenSnap.val();
        const updates = {
          totalRegistrations: (currentData.totalRegistrations || 0) + 1,
          lastRegistrationAt: now.toISOString(),
          lastRegistrationId: registrationId
        };

        // If this is the first registration, mark as used
        if ((currentData.totalRegistrations || 0) === 0) {
          updates.used = false; // Don't mark as used, keep active for more registrations
          updates.usedAt = null;
        }

        await update(tokenRef, updates);
        console.log('✅ Updated token statistics');
      }

      // Step 4: Send notification to karyakar
      const tokenData = tokenSnap.val();
      if (tokenData?.generatedBy?.id) {
        const notificationRef = ref(database, `Notifications/${tokenData.generatedBy.id}/${registrationId}`);
        await set(notificationRef, {
          type: 'new_registration',
          registrationId: registrationId,
          token: token,
          userName: registrationData.fullName,
          phoneNumber: registrationData.phoneNumber,
          city: registrationData.city,
          status: registrationData.canadianStatus,
          createdAt: now.toISOString(),
          read: false,
          priority: 'high'
        });
        console.log('✅ Notification sent to karyakar:', tokenData.generatedBy.id);
      }

      // Step 5: Create audit log
      const auditRef = push(ref(database, 'RegistrationAudit'));
      await set(auditRef, {
        ...registrationData,
        auditTimestamp: now.getTime(),
        action: 'registration_submitted'
      });

      return {
        success: true,
        registrationId: registrationId,
        data: registrationData,
        timestamp: now.toISOString()
      };

    } catch (error) {
      console.error('❌ Registration submission error:', error);
      
      // Create error log
      try {
        const errorRef = push(ref(database, 'RegistrationErrors'));
        await set(errorRef, {
          token: token,
          formData: formData,
          error: error.message,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      throw error;
    }
  }

  // Get client IP (approximate)
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not get IP address:', error);
      return 'unknown';
    }
  }

  // Listen for token changes
  listenToToken(token, callback) {
    if (!token || !database) {
      console.warn('Cannot listen to token: invalid parameters');
      return () => {};
    }

    const tokenRef = ref(database, `QRTokens/${token}`);
    
    const handleSnapshot = (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    };

    onValue(tokenRef, handleSnapshot);
    
    // Store listener for cleanup
    const listenerId = `token_${token}`;
    this.listeners.set(listenerId, { ref: tokenRef, handler: handleSnapshot });

    // Return unsubscribe function
    return () => {
      off(tokenRef, 'value', handleSnapshot);
      this.listeners.delete(listenerId);
    };
  }

  // Cleanup all listeners
  cleanup() {
    this.listeners.forEach((listener, id) => {
      off(listener.ref, 'value', listener.handler);
      console.log('Cleaned up listener:', id);
    });
    this.listeners.clear();
  }

  // Check if phone number already exists
  async checkPhoneNumberExists(phoneNumber) {
    try {
      // Check in Attendance Data
      const attendanceRef = ref(database, `Attendance Data/${phoneNumber}`);
      const attendanceSnap = await get(attendanceRef);
      
      // Check in RawRegisterData (partial match)
      const rawRegisterRef = ref(database, 'RawRegisterData');
      const rawSnap = await get(rawRegisterRef);
      
      let existsInRaw = false;
      if (rawSnap.exists()) {
        const rawData = rawSnap.val();
        existsInRaw = Object.values(rawData).some(
          reg => reg.phoneNumber === phoneNumber
        );
      }
      
      return {
        existsInAttendance: attendanceSnap.exists(),
        existsInRawRegister: existsInRaw,
        existingData: attendanceSnap.exists() ? attendanceSnap.val() : null
      };
    } catch (error) {
      console.error('Error checking phone number:', error);
      return { existsInAttendance: false, existsInRawRegister: false, existingData: null };
    }
  }

  // Get registration statistics
  async getRegistrationStats(token) {
    try {
      const tokenRef = ref(database, `QRTokens/${token}`);
      const snapshot = await get(tokenRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const data = snapshot.val();
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);
      
      return {
        token: data.token,
        generatedBy: data.generatedBy,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        isExpired: expiresAt < now,
        totalRegistrations: data.totalRegistrations || 0,
        pendingAssignments: data.registrations 
          ? Object.values(data.registrations).filter(r => !r.assigned && !r.rejected).length
          : 0,
        timeRemaining: expiresAt > now 
          ? Math.round((expiresAt - now) / (1000 * 60 * 60)) 
          : 0 // hours
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();

export default firebaseService;