// src/pages/Settings.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  const [generalSettings, setGeneralSettings] = useState({
    instituteName: 'My Library',
    contactEmail: 'library@example.com',
    contactPhone: '123-456-7890',
    address: '123 Library Street, City, Country'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    dailyReports: true
  });

  const [userSettings, setUserSettings] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setUserSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }

    fetchSettings();
  }, [user, fetchSettings]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setGeneralSettings(response.data.general || generalSettings);
      setNotificationSettings(response.data.notifications || notificationSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [generalSettings, notificationSettings]);

  const handleGeneralSettingsChange = (e) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationSettingsChange = (e) => {
    setNotificationSettings({
      ...notificationSettings,
      [e.target.name]: e.target.checked
    });
  };

  const handleUserSettingsChange = (e) => {
    setUserSettings({
      ...userSettings,
      [e.target.name]: e.target.value
    });
  };

  const saveGeneralSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/settings/general`, generalSettings, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('General settings saved successfully!');
    } catch (error) {
      console.error('Error saving general settings:', error);
      setError('Failed to save general settings');
    }
  };

  const saveNotificationSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/settings/notifications`, notificationSettings, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setError('Failed to save notification settings');
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/users/profile`, {
        name: userSettings.name,
        email: userSettings.email
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (userSettings.newPassword !== userSettings.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/users/password`, {
        currentPassword: userSettings.currentPassword,
        newPassword: userSettings.newPassword
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setUserSettings({
        ...userSettings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setSuccess('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">General Settings</h2>
          <form onSubmit={saveGeneralSettings}>
            <label>Institution Name</label>
            <input
              type="text"
              name="instituteName"
              value={generalSettings.instituteName}
              onChange={handleGeneralSettingsChange}
              className="form-input"
            />

            <label>Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              value={generalSettings.contactEmail}
              onChange={handleGeneralSettingsChange}
              className="form-input"
            />

            <label>Contact Phone</label>
            <input
              type="text"
              name="contactPhone"
              value={generalSettings.contactPhone}
              onChange={handleGeneralSettingsChange}
              className="form-input"
            />

            <label>Address</label>
            <textarea
              name="address"
              value={generalSettings.address}
              onChange={handleGeneralSettingsChange}
              className="form-input"
            />

            <button type="submit" className="btn-primary mt-4">Save General Settings</button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
          <form onSubmit={saveNotificationSettings}>
            <label>
              <input
                type="checkbox"
                name="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onChange={handleNotificationSettingsChange}
              />
              Email Notifications
            </label>
            <label>
              <input
                type="checkbox"
                name="smsNotifications"
                checked={notificationSettings.smsNotifications}
                onChange={handleNotificationSettingsChange}
              />
              SMS Notifications
            </label>
            <label>
              <input
                type="checkbox"
                name="dailyReports"
                checked={notificationSettings.dailyReports}
                onChange={handleNotificationSettingsChange}
              />
              Daily Reports
            </label>
            <button type="submit" className="btn-primary mt-4">Save Notification Settings</button>
          </form>
        </div>

        {/* User Profile */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">User Profile</h2>
          <form onSubmit={updateProfile}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={userSettings.name}
              onChange={handleUserSettingsChange}
              className="form-input"
            />
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={userSettings.email}
              onChange={handleUserSettingsChange}
              className="form-input"
            />
            <button type="submit" className="btn-primary mt-4">Update Profile</button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <form onSubmit={changePassword}>
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={userSettings.currentPassword}
              onChange={handleUserSettingsChange}
              className="form-input"
            />
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={userSettings.newPassword}
              onChange={handleUserSettingsChange}
              className="form-input"
            />
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={userSettings.confirmPassword}
              onChange={handleUserSettingsChange}
              className="form-input"
            />
            <button type="submit" className="btn-primary mt-4">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
