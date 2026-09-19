import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaPhone } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: { day: '', month: '', year: '' },
    referralCode: '',
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const calculateAge = (day, month, year) => {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.dateOfBirth.day || !formData.dateOfBirth.month || !formData.dateOfBirth.year) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(
        parseInt(formData.dateOfBirth.day),
        months.indexOf(formData.dateOfBirth.month) + 1,
        parseInt(formData.dateOfBirth.year)
      );
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      const dob = `${formData.dateOfBirth.year}-${String(months.indexOf(formData.dateOfBirth.month) + 1).padStart(2, '0')}-${String(formData.dateOfBirth.day).padStart(2, '0')}`;
      const result = await register({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: dob,
        referralCode: formData.referralCode || undefined,
      });
      if (result.success) {
        navigate('/login', { 
          state: { message: 'Registration successful! Please check your email to verify your account.' }
        });
      }
    } catch (error) {
      // Error handled by auth context
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (field, value) => {
    setFormData(prev => ({ ...prev, dateOfBirth: { ...prev.dateOfBirth, [field]: value } }));
    if (errors.dateOfBirth) {
      setErrors(prev => ({ ...prev, dateOfBirth: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 p-4">
      <div className="bg-dark-200 rounded-2xl p-8 max-w-md w-full border border-gold-500/20 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <Link to="/">
            <h1 className="text-3xl font-bold">
              <span className="text-white">MIKA</span>
              <span className="text-gold-500">-BET</span>
            </h1>
          </Link>
          <p className="text-gray-400 text-sm mt-2">Create your account and start winning!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm"
                placeholder="First name" disabled={loading} />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm"
                placeholder="Last name" disabled={loading} />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">Email *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-500 text-sm" />
              </div>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full bg-dark-100 text-white pl-9 pr-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm"
                placeholder="your@email.com" disabled={loading} />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">Phone Number *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="text-gray-500 text-sm" />
              </div>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full bg-dark-100 text-white pl-9 pr-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm"
                placeholder="+251 912 345 678" disabled={loading} />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">Date of Birth *</label>
            <div className="grid grid-cols-3 gap-2">
              <select value={formData.dateOfBirth.day} onChange={(e) => handleDateChange('day', e.target.value)}
                className="bg-dark-100 text-white px-2 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm" disabled={loading}>
                <option value="">Day</option>
                {days.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
              <select value={formData.dateOfBirth.month} onChange={(e) => handleDateChange('month', e.target.value)}
                className="bg-dark-100 text-white px-2 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm" disabled={loading}>
                <option value="">Month</option>
                {months.map(month => <option key={month} value={month}>{month.slice(0, 3)}</option>)}
              </select>
              <select value={formData.dateOfBirth.year} onChange={(e) => handleDateChange('year', e.target.value)}
                className="bg-dark-100 text-white px-2 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm" disabled={loading}>
                <option value="">Year</option>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">Referral Code (Optional)</label>
            <input type="text" name="referralCode" value={formData.referralCode} onChange={handleChange}
              className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm uppercase"
              placeholder="Enter referral code" disabled={loading} />
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">Password *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-500 text-sm" />
              </div>
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                className="w-full bg-dark-100 text-white pl-9 pr-10 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm"
                placeholder="Min 8 chars with uppercase & number" disabled={loading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition">
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">Confirm Password *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-500 text-sm" />
              </div>
              <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                className="w-full bg-dark-100 text-white pl-9 pr-10 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition text-sm"
                placeholder="Confirm your password" disabled={loading} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition">
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="flex items-start space-x-2">
            <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange}
              className="w-4 h-4 accent-gold-500 mt-0.5" disabled={loading} />
            <label className="text-gray-400 text-xs">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-gold-500 hover:underline">Terms & Conditions</Link> and{' '}
              <Link to="/privacy" className="text-gold-500 hover:underline">Privacy Policy</Link>
            </label>
          </div>
          {errors.agreeTerms && <p className="text-red-500 text-xs">{errors.agreeTerms}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-gold-500 text-dark-100 font-bold py-3 rounded-lg hover:bg-gold-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-dark-100"></div>
                <span>Creating account...</span>
              </div>
            ) : 'CREATE ACCOUNT'}
          </button>

          <p className="text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-500 hover:text-gold-400 font-semibold transition">LOGIN</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;