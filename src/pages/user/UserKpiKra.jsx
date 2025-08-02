import React, { useEffect, useState } from 'react';
import UserKpiKraTable from './UserKpiKraTable';
import { useAuth } from "../../contexts/AuthContext";

function UserKpiKra() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [availableDesignations, setAvailableDesignations] = useState([]);
  const [showLoadingSymbol, setShowLoadingSymbol] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Google Apps Script configuration
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxf0N7THEB3Sj_7O0Gf9Gpa-2RAxoEymLNcFPnX6O6OcH8RWvDZiwZIWrODEk-wwDMtBA/exec";
  const SHEET_ID = "1GHb1qDJ1ZaUFzIrb1ezXqYd-6ePFAAe4upYotiP92JY";
  const SHEET_NAME = "Dashboard";
  const HEADER_NAME = "PERCHASER";

  useEffect(() => {
    if (user) {
      if (user.designations?.length > 0) {
        setAvailableDesignations(user.designations);
        const firstDesignation = user.designations[0];
        setSelectedDesignation(firstDesignation);
        handleInitialDesignationSubmit(firstDesignation);
      } else {
        setIsLoading(false);
      }
    }
  }, [user]);

  const submitToGoogleSheet = async (designation) => {
    try {
      const formData = new FormData();
      formData.append('action', 'updateDesignation');
      formData.append('sheetId', SHEET_ID);
      formData.append('sheetName', SHEET_NAME);
      formData.append('header', HEADER_NAME);
      formData.append('column', 'A');
      formData.append('designation', designation);
      formData.append('userName', user?.name || 'Unknown User');
      formData.append('userEmail', user?.email || '');
      formData.append('timestamp', new Date().toISOString());

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });

      return true;
    } catch (error) {
      console.error('Error submitting to Google Sheet:', error);
      throw error;
    }
  };

  const handleInitialDesignationSubmit = async (designation) => {
    setShowLoadingSymbol(true);
    
    try {
      await submitToGoogleSheet(designation);
      setRefreshTrigger(prev => prev + 1);
      
      // Show loading symbol for just 500ms minimum
      setTimeout(() => {
        setShowLoadingSymbol(false);
        setIsLoading(false);
      }, 500);
      
    } catch (error) {
      console.error("Error:", error);
      setShowLoadingSymbol(false);
      setIsLoading(false);
    }
  };

  const handleDropdownChange = async (newDesignation) => {
    if (newDesignation === selectedDesignation) return;

    setSelectedDesignation(newDesignation);
    setShowLoadingSymbol(true);
    setSubmitMessage("");

    try {
      await submitToGoogleSheet(newDesignation);
      setRefreshTrigger(prev => prev + 1);
      setSubmitMessage("✅ Saved successfully!");
    } catch (error) {
      console.error("Error:", error);
      setSubmitMessage("❌ Failed to save");
      setSelectedDesignation(availableDesignations[0]);
    } finally {
      setTimeout(() => {
        setShowLoadingSymbol(false);
        setSubmitMessage("");
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-sm">
        <div className="flex items-center space-x-4">
          {user?.imageUrl && (
            <img 
              src={user.imageUrl} 
              alt="Profile" 
              className="w-12 h-12 rounded-full border-2 border-white object-cover"
            />
          )}
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.name}</h1>
        </div>
        
        {availableDesignations.length > 0 && (
          <div className="relative">
            <select
              value={selectedDesignation}
              onChange={(e) => handleDropdownChange(e.target.value)}
              disabled={isLoading}
              className="appearance-none px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 focus:border-transparent disabled:opacity-50 pr-12 text-lg font-semibold min-w-[150px] cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              {availableDesignations.map((designation) => (
                <option key={designation} value={designation}>
                  {designation}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Ultra-fast loading symbol (500ms minimum) */}
      {showLoadingSymbol && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Success/Error Messages */}
      {submitMessage && (
        <div className={`p-3 rounded-md ${submitMessage.includes("✅") ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {submitMessage}
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && selectedDesignation && (
        <UserKpiKraTable 
          designation={selectedDesignation}
          key={`${selectedDesignation}-${refreshTrigger}`}
          isAdmin={false}
          userDepartment={user?.department}
        />
      )}
    </div>
  );
}

export default UserKpiKra;