


// import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// import { Briefcase, CheckSquare, Target, Users, MessageSquare, Database, Link, AlertCircle, PlayCircle, User, TrendingUp, Send, Clock, RefreshCw } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";

// const CompleteKpiDashboard = () => {
//   console.log("🚀 COMPLETE KPI DASHBOARD STARTED");
//   console.log("🕐 Component loaded at:", new Date().toISOString());
  
//   const { user } = useAuth();
//   console.log("👤 User from Auth:", user);
  
//   // State management
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedDesignation, setSelectedDesignation] = useState('');
//   const [availableDesignations, setAvailableDesignations] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitMessage, setSubmitMessage] = useState("");
//   const [refreshTrigger, setRefreshTrigger] = useState(0);
//   const [dashboardData, setDashboardData] = useState(null);
//   const [isDataLoading, setIsDataLoading] = useState(false);
  
//   // Persistent data storage
//   const persistentData = useRef(null);
//   const hasFetched = useRef(false);
//   const abortControllerRef = useRef(null);

//   // Google Sheets configuration
//   const SPREADSHEET_ID = "1h8lu66_hZlHm3tkaUhypmM_HhKP2WCaCfOPmAsisqKY";
//   const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzcGGAZCqsDQRRiRkzIWev2jgYjcuVDoHYac1C7ZGpt5VsfREYRcaOEwAcCLh59O2KV/exec";
  
//   // Dynamic sheet name based on user and designation
//   const getSheetName = (designation, userId) => {
//     // Try multiple sheet naming patterns
//     return [
//       `PersonalData_${userId}_${designation}`, // User-specific sheet
//       `User_${designation}`, // Designation-specific sheet
//       `${designation}`, // Simple designation sheet
//       'Dashboard' // Fallback general sheet
//     ];
//   };

//   console.log("📊 Config:", { SPREADSHEET_ID, SCRIPT_URL });

//   // Restore data from localStorage on mount
//   useEffect(() => {
//     console.log("🔄 Restoring data from localStorage...");
    
//     const storedDesignation = localStorage.getItem('kpi_selected_designation');
    
//     if (storedDesignation) {
//       setSelectedDesignation(storedDesignation);
//       console.log('✅ Restored designation:', storedDesignation);
      
//       // Try to restore data for this specific designation
//       const stored = localStorage.getItem(`kpi_dashboard_data_${storedDesignation}`);
//       if (stored) {
//         try {
//           const parsedData = JSON.parse(stored);
//           setDashboardData(parsedData);
//           persistentData.current = parsedData;
//           hasFetched.current = true;
//           console.log('✅ Restored designation-specific data:', parsedData.length, 'rows for', storedDesignation);
//         } catch (e) {
//           console.error('❌ Failed to restore data:', e);
//           localStorage.removeItem(`kpi_dashboard_data_${storedDesignation}`);
//         }
//       }
//     }
//   }, []);

//   // Handle user authentication and designation setup
//   useEffect(() => {
//     console.log("👤 User effect triggered:", user);
    
//     if (user) {
//       console.log('👤 User loaded:', {
//         name: user.name,
//         id: user.id || user.username, // fallback to username if no id
//         designations: user.designations
//       });
      
//       if (user.designations && user.designations.length > 0) {
//         setAvailableDesignations(user.designations);
        
//         // Auto-select designation if not already set
//         if (!selectedDesignation) {
//           const firstDesignation = user.designations[0];
//           setSelectedDesignation(firstDesignation);
//           localStorage.setItem('kpi_selected_designation', firstDesignation);
//           console.log('🎯 Auto-selected designation:', firstDesignation);
          
//           // Fetch data for the auto-selected designation
//           fetchDashboardData(firstDesignation);
//         } else {
//           // If designation is already set, check if we need to fetch data
//           const hasDataForCurrentDesignation = localStorage.getItem(`kpi_dashboard_data_${selectedDesignation}`);
//           if (!hasDataForCurrentDesignation) {
//             console.log('🔍 No data found for current designation, fetching...');
//             fetchDashboardData(selectedDesignation);
//           }
//         }
//       } else {
//         console.warn('⚠️ No designations found for user:', user.name);
//         setAvailableDesignations([]);
//       }
//       setIsLoading(false);
//     } else {
//       console.log("❌ No user data available");
//     }
//   }, [user]);

//   // Submit designation change to Google Apps Script
//   const submitToGoogleSheet = async (designation) => {
//     console.log('📤 Submitting to Google Sheet:', designation);
    
//     try {
//       const params = {
//         action: 'updateDesignation',
//         sheetId: SPREADSHEET_ID,
//         designation: designation,
//         userName: user?.name || 'Unknown User',
//         userEmail: user?.email || '',
//         userId: user?.id || user?.username || '',
//         timestamp: new Date().toISOString()
//       };

//       const url = new URL(SCRIPT_URL);
//       Object.keys(params).forEach(key => {
//         url.searchParams.append(key, params[key]);
//       });

//       console.log('🌐 Submitting to URL:', url.toString());

//       const response = await fetch(url.toString(), {
//         method: "GET",
//         mode: "cors",
//         redirect: "follow",
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }

//       const result = await response.json();
//       console.log('✅ Submission successful:', result);
//       return result;
//     } catch (error) {
//       console.error('❌ Error submitting to Google Sheet:', error);
//       throw error;
//     }
//   };

//   // Fetch dashboard data from Google Sheets for specific designation
//   const fetchDashboardData = useCallback(async (designationToFetch = selectedDesignation) => {
//     if (isDataLoading) {
//       console.log('⏳ Already loading data, skipping...');
//       return;
//     }

//     if (!designationToFetch) {
//       console.log('❌ No designation provided for fetch');
//       return;
//     }

//     try {
//       if (abortControllerRef.current) {
//         console.log("🛑 Aborting previous request");
//         abortControllerRef.current.abort();
//       }

//       abortControllerRef.current = new AbortController();
//       setIsDataLoading(true);
//       setError(null);
      
//       const userId = user?.id || user?.username || 'unknown';
//       console.log('🔍 Fetching dashboard data for designation:', designationToFetch);
//       console.log('👤 User:', user?.name, 'ID:', userId);
//       console.log('📊 Spreadsheet ID:', SPREADSHEET_ID);
      
//       // Get possible sheet names for this designation
//       const possibleSheetNames = getSheetName(designationToFetch, userId);
//       console.log('📋 Trying sheet names:', possibleSheetNames);
      
//       let successfulFetch = false;
//       let fetchedData = null;
//       let usedSheetName = '';
      
//       // Try each possible sheet name until one works
//       for (const sheetName of possibleSheetNames) {
//         try {
//           console.log(`🔍 Attempting to fetch from sheet: ${sheetName}`);
          
//           const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
//           console.log('🌐 Fetch URL:', url);
          
//           const response = await fetch(url, {
//             signal: abortControllerRef.current.signal
//           });
          
//           console.log(`📥 Response status for ${sheetName}:`, response.status);
          
//           if (response.ok) {
//             const text = await response.text();
//             console.log(`✅ Successfully fetched from sheet: ${sheetName}`);
//             console.log('📄 Response length:', text.length);
            
//             // Parse the response
//             const jsonStart = text.indexOf('{');
//             const jsonEnd = text.lastIndexOf('}') + 1;
            
//             if (jsonStart === -1 || jsonEnd === 0) {
//               throw new Error('Invalid JSON response format');
//             }
            
//             const json = JSON.parse(text.substring(jsonStart, jsonEnd));
            
//             if (!json.table || !json.table.rows || json.table.rows.length === 0) {
//               console.log(`⚠️ Sheet ${sheetName} is empty, trying next...`);
//               continue;
//             }
            
//             // Process the data
//             fetchedData = json.table.rows.map((row, rowIndex) => {
//               const itemObj = { 
//                 _id: `${designationToFetch}-${rowIndex}-${Date.now()}`,
//                 _rowIndex: rowIndex + 1,
//                 _userId: userId,
//                 _designation: designationToFetch,
//                 _sheetSource: sheetName,
//                 _fetchTime: new Date().toISOString()
//               };
              
//               if (row.c) {
//                 row.c.forEach((cell, i) => {
//                   itemObj[`col${i}`] = cell?.v ?? cell?.f ?? "";
//                 });
//               }
              
//               return itemObj;
//             });
            
//             successfulFetch = true;
//             usedSheetName = sheetName;
//             break; // Exit the loop on successful fetch
            
//           } else {
//             console.log(`❌ Failed to fetch from ${sheetName}: HTTP ${response.status}`);
//           }
//         } catch (sheetError) {
//           console.log(`❌ Error fetching from ${sheetName}:`, sheetError.message);
//           continue; // Try next sheet name
//         }
//       }
      
//       if (!successfulFetch) {
//         throw new Error(`No data sheet found for designation: ${designationToFetch}. Tried: ${possibleSheetNames.join(', ')}`);
//       }

//       console.log('✅ Data processed successfully:', {
//         designation: designationToFetch,
//         sheetUsed: usedSheetName,
//         totalRows: fetchedData.length,
//         sampleRow: fetchedData[0],
//         columns: Object.keys(fetchedData[0] || {}).filter(key => key.startsWith('col'))
//       });
      
//       // Store data persistently with designation-specific key
//       setDashboardData(fetchedData);
//       persistentData.current = fetchedData;
//       hasFetched.current = true;
      
//       // Save to localStorage with designation-specific key
//       const storageKey = `kpi_dashboard_data_${designationToFetch}`;
//       localStorage.setItem(storageKey, JSON.stringify(fetchedData));
//       console.log('💾 Data saved to localStorage with key:', storageKey);
      
//       return fetchedData;
//     } catch (error) {
//       console.error('💥 Fetch error:', error);
      
//       if (error.name !== 'AbortError') {
//         let errorMessage = error.message;
        
//         if (error.message.includes('Failed to fetch')) {
//           errorMessage = 'Network error - please check your internet connection';
//         } else if (error.message.includes('No data sheet found')) {
//           errorMessage = `No data sheet found for ${designationToFetch}. Please contact admin to create the sheet.`;
//         } else if (error.message.includes('403')) {
//           errorMessage = 'Access denied. Please check sheet sharing permissions.';
//         }
        
//         setError({ message: errorMessage });
//       }
//     } finally {
//       setIsDataLoading(false);
//       abortControllerRef.current = null;
//       console.log("🏁 Fetch operation completed for:", designationToFetch);
//     }
//   }, [isDataLoading, user?.id, user?.username, selectedDesignation]);

//   // Handle designation dropdown change
//   const handleDropdownChange = async (newDesignation) => {
//     if (newDesignation === selectedDesignation) {
//       console.log('⚠️ Same designation selected, skipping...');
//       return;
//     }

//     console.log('🔄 Changing designation from', selectedDesignation, 'to', newDesignation);

//     // Clear current data when changing designation
//     setDashboardData(null);
//     persistentData.current = null;
//     hasFetched.current = false;

//     setSelectedDesignation(newDesignation);
//     localStorage.setItem('kpi_selected_designation', newDesignation);
//     setIsSubmitting(true);
//     setSubmitMessage("");

//     try {
//       // Check if we have cached data for this designation
//       const cachedData = localStorage.getItem(`kpi_dashboard_data_${newDesignation}`);
//       if (cachedData) {
//         try {
//           const parsedData = JSON.parse(cachedData);
//           console.log('📦 Using cached data for', newDesignation, ':', parsedData.length, 'rows');
//           setDashboardData(parsedData);
//           persistentData.current = parsedData;
//           hasFetched.current = true;
//         } catch (e) {
//           console.error('❌ Failed to parse cached data, will fetch fresh');
//           localStorage.removeItem(`kpi_dashboard_data_${newDesignation}`);
//         }
//       }

//       // Submit to Google Sheet
//       await submitToGoogleSheet(newDesignation);
      
//       // Fetch fresh data for the new designation
//       await fetchDashboardData(newDesignation);
      
//       setRefreshTrigger(prev => prev + 1);
//       setSubmitMessage("✅ Designation updated successfully!");
//       console.log('✅ Designation change completed');
//     } catch (error) {
//       console.error("❌ Error changing designation:", error);
//       setSubmitMessage("❌ Failed to update designation");
//     } finally {
//       setIsSubmitting(false);
//       setTimeout(() => setSubmitMessage(""), 3000);
//     }
//   };

//   // Manual refresh function
//   const handleManualRefresh = () => {
//     console.log('🔄 Manual refresh triggered for designation:', selectedDesignation);
    
//     if (!selectedDesignation) {
//       console.log('❌ No designation selected for refresh');
//       return;
//     }
    
//     // Clear current data
//     hasFetched.current = false;
//     localStorage.removeItem(`kpi_dashboard_data_${selectedDesignation}`);
//     setDashboardData(null);
//     persistentData.current = null;
    
//     // Fetch fresh data
//     fetchDashboardData(selectedDesignation);
//   };

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//   }, []);

//   // Get current data (from state or persistent ref)
//   const currentData = dashboardData || persistentData.current;

//   // Process data for UI components
//   const { firstRowData, row6Data, tableData } = useMemo(() => {
//     if (!currentData || currentData.length === 0) {
//       return {
//         firstRowData: {},
//         row6Data: {},
//         tableData: []
//       };
//     }

//     return {
//       firstRowData: currentData[0] || {},
//       row6Data: currentData[5] || {},
//       tableData: currentData.slice(4) || []
//     };
//   }, [currentData]);

//   // Process communication team data
//   const communicationTeam = useMemo(() => {
//     if (!row6Data.col1) return [];
//     return row6Data.col1.split(",").map(item => item.trim()).filter(item => item.length > 0);
//   }, [row6Data]);

//   const howToCommunicate = row6Data.col2 || "No communication process defined";
//   const keyPerson = row6Data.col0 || "No key person assigned";

//   console.log('📊 Current UI Data:', {
//     hasCurrentData: !!currentData,
//     dataLength: currentData?.length || 0,
//     firstRowData,
//     row6Data,
//     tableDataLength: tableData.length,
//     communicationTeamSize: communicationTeam.length
//   });

//   return (
//     <div className="space-y-6">
//       {/* Header */}
     

//       {/* Loading State */}
//       {isLoading && (
//         <div className="flex justify-center items-center h-64">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
//             <p className="mt-4 text-gray-600">Loading...</p>
//           </div>
//         </div>
//       )}

//       {/* Error State */}
//       {error && (
//         <div className="bg-red-50 border-l-4 border-red-500 p-4">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <AlertCircle className="h-5 w-5 text-red-500" />
//             </div>
//             <div className="ml-3">
//               <p className="text-sm text-red-700">Error: {error.message}</p>
//               <button
//                 onClick={handleManualRefresh}
//                 className="mt-2 text-sm text-red-600 underline hover:text-red-800"
//               >
//                 Try Again
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Loading Data State */}
//       {isDataLoading && (
//         <div className="flex items-center justify-center min-h-[400px]">
//           <div className="text-center">
//             <div className="relative">
//               <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
//               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto absolute top-2 left-2">
//                 <Database className="w-6 h-6 text-green-600" />
//               </div>
//             </div>
//             <p className="mt-4 text-gray-700 font-medium">Loading your KPI dashboard...</p>
//             <p className="text-sm text-gray-500">Fetching latest performance metrics</p>
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       {!isLoading && selectedDesignation && currentData && currentData.length > 0 && (
//         <div className="space-y-6">
    
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* My Role Information Card */}
//             <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-6 transform transition-all hover:scale-[1.02]">
//               <div className="flex items-center gap-3 mb-4">
//                 <User className="w-6 h-6 text-green-600" />
//                 <h2 className="text-lg font-semibold text-gray-800">My Role</h2>
//               </div>
//               <div className="bg-white rounded-lg p-4 border border-green-100">
//                 <h3 className="text-sm font-medium text-green-600 mb-2">Current Role</h3>
//                 <p className="text-gray-800 font-semibold">{selectedDesignation}</p>
//                 <p className="text-gray-600 text-sm mt-1">{firstRowData.col1 || "Role description not available"}</p>
//               </div>
//             </div>

//             {/* My Tasks Card */}
//             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6 transform transition-all hover:scale-[1.02]">
//               <div className="flex items-center gap-3 mb-4">
//                 <CheckSquare className="w-6 h-6 text-blue-600" />
//                 <h2 className="text-lg font-semibold text-gray-800">My Tasks</h2>
//               </div>
//               <div className="bg-white rounded-lg p-6 border border-blue-100 flex items-center justify-center">
//                 <div className="text-center">
//                   <p className="text-4xl font-bold text-blue-600">{firstRowData.col3 || "0"}</p>
//                   <p className="text-sm text-gray-600 mt-1">Assigned Tasks</p>
//                 </div>
//               </div>
//             </div>

//             {/* My Performance Scoring Card */}
//             <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 p-6 transform transition-all hover:scale-[1.02]">
//               <div className="flex items-center gap-3 mb-4">
//                 <TrendingUp className="w-6 h-6 text-purple-600" />
//                 <h2 className="text-lg font-semibold text-gray-800">My Performance</h2>
//               </div>
//               <div className="space-y-4">
//                 {firstRowData.col4 && (
//                   <a
//                     href={firstRowData.col4}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="block bg-white rounded-lg p-4 border border-purple-100 hover:bg-purple-50 transition-colors group"
//                   >
//                     <div className="flex items-center gap-2">
//                       <PlayCircle className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
//                       <span className="text-sm font-medium text-purple-600">How My Scoring Works</span>
//                     </div>
//                   </a>
//                 )}
//                 {firstRowData.col5 && (
//                   <a
//                     href={firstRowData.col5}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="block bg-white rounded-lg p-4 border border-purple-100 hover:bg-purple-50 transition-colors group"
//                   >
//                     <div className="flex items-center gap-2">
//                       <Target className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
//                       <span className="text-sm font-medium text-purple-600">How To Improve My Score</span>
//                     </div>
//                   </a>
//                 )}
//               </div>
//             </div>

//             {/* My Communication Section */}
//             <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* My Team Communication Card */}
//               <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6">
//                 <div className="flex items-center gap-3 mb-4">
//                   <Users className="w-6 h-6 text-amber-600" />
//                   <h2 className="text-lg font-semibold text-gray-800">My Communication Team</h2>
//                 </div>
//                 <div className="bg-white rounded-lg p-4 border border-amber-100">
//                   <h3 className="text-sm font-medium text-amber-600 mb-3">Team Members I Work With</h3>
//                   {communicationTeam.length > 0 ? (
//                     <ul className="space-y-2">
//                       {communicationTeam.map((member, index) => (
//                         <li
//                           key={index}
//                           className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50 transition-colors"
//                         >
//                           <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
//                             <Users className="w-4 h-4 text-amber-600" />
//                           </div>
//                           <span className="text-gray-700 font-medium">{member}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   ) : (
//                     <p className="text-gray-500">No team members assigned</p>
//                   )}
//                 </div>
//               </div>

//               {/* My Communication Process Card */}
//               <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-sm border border-cyan-100 p-6">
//                 <div className="flex items-center gap-3 mb-4">
//                   <MessageSquare className="w-6 h-6 text-cyan-600" />
//                   <h2 className="text-lg font-semibold text-gray-800">My Communication Process</h2>
//                 </div>
//                 <div className="space-y-4">
//                   <div className="bg-white rounded-lg p-4 border border-cyan-100">
//                     <h3 className="text-sm font-medium text-cyan-600 mb-2">How I Should Communicate</h3>
//                     <p className="text-gray-700">{howToCommunicate}</p>
//                   </div>
//                   <div className="bg-white rounded-lg p-4 border border-cyan-100">
//                     <h3 className="text-sm font-medium text-cyan-600 mb-2">My Key Contact Person</h3>
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
//                         <User className="w-5 h-5 text-cyan-600" />
//                       </div>
//                       <p className="text-gray-700 font-medium">{keyPerson}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* My Systems Table */}
//             <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//               <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
//                 <div className="flex items-center gap-3">
//                   <Database className="w-6 h-6 text-green-600" />
//                   <h2 className="text-lg font-semibold text-gray-800">My Systems and Resources</h2>
//                 </div>
//                 <p className="text-sm text-gray-600 mt-1">Systems and tools assigned to me for my role</p>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead>
//                     <tr className="bg-green-50">
//                       <th className="px-6 py-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
//                         System Name
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
//                         My Task
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
//                         Description
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
//                         My Access Links
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {tableData.length > 0 ? (
//                       tableData.map((row, index) => (
//                         <tr key={row._id || index} className="hover:bg-green-50 transition-colors">
//                           <td className="px-6 py-4">
//                             <div className="text-sm font-medium text-gray-900">{row.col0 || "N/A"}</div>
//                           </td>
//                           <td className="px-6 py-4">
//                             <div className="text-sm text-gray-700 font-medium">{row.col1 || "N/A"}</div>
//                           </td>
//                           <td className="px-6 py-4">
//                             <div className="text-sm text-gray-700">{row.col2 || "N/A"}</div>
//                           </td>
//                           <td className="px-6 py-4">
//                             <div className="flex items-center gap-4">
//                               {row.col3 && (
//                                 <a
//                                   href={row.col3}
//                                   target="_blank"
//                                   rel="noopener noreferrer"
//                                   className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors"
//                                 >
//                                   <Link className="w-4 h-4" />
//                                   <span className="text-sm font-medium">Access System</span>
//                                 </a>
//                               )}
//                               {row.col4 && (
//                                 <a
//                                   href={row.col4}
//                                   target="_blank"
//                                   rel="noopener noreferrer"
//                                   className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
//                                 >
//                                   <Database className="w-4 h-4" />
//                                   <span className="text-sm font-medium">My Dashboard</span>
//                                 </a>
//                               )}
//                               {row.col5 && (
//                                 <a
//                                   href={row.col5}
//                                   target="_blank"
//                                   rel="noopener noreferrer"
//                                   className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors"
//                                 >
//                                   <PlayCircle className="w-4 h-4" />
//                                   <span className="text-sm font-medium">My Training</span>
//                                 </a>
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
//                           No systems or resources assigned to you yet
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="bg-gray-50 px-6 py-3 border-t">
//                 <div className="flex justify-between items-center text-sm text-gray-600">
//                   <span>
//                     Your personalized {selectedDesignation} dashboard
//                   </span>
//                   <span>
//                     User: {user?.name || 'Unknown'} | ID: {user?.id || user?.username || 'N/A'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* No Data State */}
//       {!isLoading && selectedDesignation && (!currentData || currentData.length === 0) && !isDataLoading && (
//         <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
//           <div className="flex items-center">
//             <AlertCircle className="w-5 h-5 text-orange-500 mr-3" />
//             <div>
//               <p className="text-orange-700 font-medium">No dashboard data available for {selectedDesignation}</p>
//               <p className="text-orange-600 text-sm mt-1">
//                 Please refresh to load data or contact admin if the issue persists.
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={handleManualRefresh}
//             className="mt-3 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
//           >
//             Refresh Data
//           </button>
//         </div>
//       )}

//       {/* No Designation State */}
//       {!isLoading && !selectedDesignation && (
//         <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <div className="ml-3">
//               <p className="text-blue-700">Please select your designation to view the dashboard.</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Footer Information */}
//       <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
//         <p>
//           🔄 Data auto-refreshes and persists locally | 
//           📊 Connected to Google Sheets | 
//           🔐 User-specific data display
//         </p>
//         <p className="mt-1">
//           Last updated: {currentData && currentData[0]?._fetchTime ? 
//             new Date(currentData[0]._fetchTime).toLocaleString() : 
//             'Never'
//           }
//         </p>
//       </div>
//     </div>
//   );
// };

// export default React.memo(CompleteKpiDashboard);




import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Briefcase, CheckSquare, Target, Users, MessageSquare, Database, Link, AlertCircle, PlayCircle, User, TrendingUp, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const CompleteKpiDashboard = () => {
  console.log("🚀 COMPLETE KPI DASHBOARD STARTED");
  
  const { user } = useAuth();
  console.log("👤 User from Auth:", user);
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [availableDesignations, setAvailableDesignations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  
  // Persistent data storage
  const persistentData = useRef(null);
  const hasFetched = useRef(false);
  const abortControllerRef = useRef(null);

  // Google Sheets configuration
  const SPREADSHEET_ID = "1szwMeIermOLKS5qJV3C6DXOqp3RdlagF46-JkXhMjKo";
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzneoEJQODTF-Ws0WupO7dRj7I7_-b6U-EVh7eMJcgoPFvxND1MQ2vfm3l3-WkftCAtVw/exec";
  
  // Dynamic sheet name based on user and designation
  const getSheetName = (designation, userId) => {
    return [
      `PersonalData_${userId}_${designation}`,
      `User_${designation}`,
      `${designation}`,
      'Dashboard'
    ];
  };

  // Restore data from localStorage on mount with user-specific keys
  useEffect(() => {
    console.log("🔄 Restoring data from localStorage...");
    
    if (!user) return;
    
    const userKey = user.id || user.username || 'default';
    const storageKey = `kpi_selected_designation_${userKey}`;
    const storedDesignation = localStorage.getItem(storageKey);
    
    if (storedDesignation) {
      setSelectedDesignation(storedDesignation);
      console.log('✅ Restored designation:', storedDesignation);
      
      const stored = localStorage.getItem(`kpi_dashboard_data_${storedDesignation}`);
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          setDashboardData(parsedData);
          persistentData.current = parsedData;
          hasFetched.current = true;
          setIsEmpty(parsedData.length === 0);
          console.log('✅ Restored designation-specific data');
        } catch (e) {
          console.error('❌ Failed to restore data:', e);
          localStorage.removeItem(`kpi_dashboard_data_${storedDesignation}`);
        }
      }
    }
  }, [user]);

  // Handle user authentication and designation setup
  useEffect(() => {
    console.log("👤 User effect triggered:", user);
    
    if (user) {
      console.log('👤 User loaded:', {
        name: user.name,
        id: user.id || user.username,
        designations: user.designations
      });
      
      if (user.designations && user.designations.length > 0) {
        setAvailableDesignations(user.designations);
        
        const userKey = user.id || user.username || 'default';
        const storageKey = `kpi_selected_designation_${userKey}`;
        const storedDesignation = localStorage.getItem(storageKey);
        
        if (!storedDesignation) {
          const firstDesignation = user.designations[0];
          setSelectedDesignation(firstDesignation);
          localStorage.setItem(storageKey, firstDesignation);
          console.log('🎯 Auto-selected designation:', firstDesignation);
          fetchDashboardData(firstDesignation);
        } else {
          const hasDataForCurrentDesignation = localStorage.getItem(`kpi_dashboard_data_${storedDesignation}`);
          if (!hasDataForCurrentDesignation) {
            console.log('🔍 No data found for current designation, fetching...');
            fetchDashboardData(storedDesignation);
          }
        }
      } else {
        console.warn('⚠️ No designations found for user:', user.name);
        setAvailableDesignations([]);
        setIsEmpty(true);
      }
      setIsLoading(false);
    } else {
      console.log("❌ No user data available");
    }
  }, [user]);

  // Submit designation change to Google Apps Script
  const submitToGoogleSheet = async (designation) => {
    console.log('📤 Submitting to Google Sheet:', designation);
    
    try {
      const params = {
        action: 'updateDesignation',
        sheetId: SPREADSHEET_ID,
        designation: designation,
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || '',
        userId: user?.id || user?.username || '',
        timestamp: new Date().toISOString()
      };

      const url = new URL(SCRIPT_URL);
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });

      const response = await fetch(url.toString(), {
        method: "GET",
        mode: "cors",
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error submitting to Google Sheet:', error);
      throw error;
    }
  };

  // Fetch dashboard data from Google Sheets
  const fetchDashboardData = useCallback(async (designationToFetch = selectedDesignation) => {
    if (isDataLoading || !designationToFetch) return;

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsDataLoading(true);
      setError(null);
      setIsEmpty(false);
      
      const userId = user?.id || user?.username || 'unknown';
      const possibleSheetNames = getSheetName(designationToFetch, userId);
      
      let successfulFetch = false;
      let fetchedData = null;
      
      for (const sheetName of possibleSheetNames) {
        try {
          const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
          
          const response = await fetch(url, {
            signal: abortControllerRef.current.signal
          });
          
          if (response.ok) {
            const text = await response.text();
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const json = JSON.parse(text.substring(jsonStart, jsonEnd));
            
            if (!json.table?.rows?.length) {
              console.log(`⚠️ Sheet ${sheetName} is empty, trying next...`);
              continue;
            }
            
            fetchedData = json.table.rows.map((row, rowIndex) => {
              const itemObj = { 
                _id: `${designationToFetch}-${rowIndex}-${Date.now()}`,
                _rowIndex: rowIndex + 1,
                _userId: userId,
                _designation: designationToFetch,
                _sheetSource: sheetName,
                _fetchTime: new Date().toISOString()
              };
              
              if (row.c) {
                row.c.forEach((cell, i) => {
                  itemObj[`col${i}`] = cell?.v ?? cell?.f ?? "";
                });
              }
              
              return itemObj;
            });
            
            successfulFetch = true;
            break;
          }
        } catch (sheetError) {
          continue;
        }
      }
      
      if (!successfulFetch) {
        setIsEmpty(true);
        throw new Error(`No data sheet found for designation: ${designationToFetch}`);
      }

      setDashboardData(fetchedData);
      persistentData.current = fetchedData;
      hasFetched.current = true;
      setIsEmpty(fetchedData.length === 0);
      
      const storageKey = `kpi_dashboard_data_${designationToFetch}`;
      localStorage.setItem(storageKey, JSON.stringify(fetchedData));
      
      return fetchedData;
    } catch (error) {
      if (error.name !== 'AbortError') {
        let errorMessage = error.message;
        
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error - please check your internet connection';
        } else if (error.message.includes('No data sheet found')) {
          errorMessage = `No data sheet found for ${designationToFetch}. Please contact admin.`;
        } else if (error.message.includes('403')) {
          errorMessage = 'Access denied. Please check sheet sharing permissions.';
        }
        
        setError(errorMessage);
      }
    } finally {
      setIsDataLoading(false);
      abortControllerRef.current = null;
    }
  }, [isDataLoading, user?.id, user?.username, selectedDesignation]);

  // Handle designation dropdown change
  const handleDropdownChange = async (newDesignation) => {
    if (newDesignation === selectedDesignation) return;

    console.log('🔄 Changing designation from', selectedDesignation, 'to', newDesignation);

    setDashboardData(null);
    persistentData.current = null;
    hasFetched.current = false;
    setIsEmpty(false);

    setSelectedDesignation(newDesignation);
    
    const userKey = user?.id || user?.username || 'default';
    const storageKey = `kpi_selected_designation_${userKey}`;
    localStorage.setItem(storageKey, newDesignation);
    
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const cachedData = localStorage.getItem(`kpi_dashboard_data_${newDesignation}`);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setDashboardData(parsedData);
          persistentData.current = parsedData;
          hasFetched.current = true;
          setIsEmpty(parsedData.length === 0);
        } catch (e) {
          localStorage.removeItem(`kpi_dashboard_data_${newDesignation}`);
        }
      }

      await submitToGoogleSheet(newDesignation);
      await fetchDashboardData(newDesignation);
      
      setSubmitMessage("✅ Designation updated successfully!");
    } catch (error) {
      console.error("❌ Error changing designation:", error);
      setSubmitMessage("❌ Failed to update designation");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitMessage(""), 3000);
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    if (!selectedDesignation) return;
    
    hasFetched.current = false;
    localStorage.removeItem(`kpi_dashboard_data_${selectedDesignation}`);
    setDashboardData(null);
    persistentData.current = null;
    setIsEmpty(false);
    
    fetchDashboardData(selectedDesignation);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Get current data
  const currentData = dashboardData || persistentData.current;

  // Process data for UI components
  const { firstRowData, row6Data, tableData } = useMemo(() => {
    if (!currentData || currentData.length === 0) {
      return {
        firstRowData: {},
        row6Data: {},
        tableData: []
      };
    }

    return {
      firstRowData: currentData[0] || {},
      row6Data: currentData[5] || {},
      tableData: currentData.slice(4) || []
    };
  }, [currentData]);

  // Process communication team data
  const communicationTeam = useMemo(() => (
    row6Data.col1 ? row6Data.col1.split(",").map(item => item.trim()) : []
  ), [row6Data]);

  const howToCommunicate = row6Data.col2 || "No communication process defined";
  const keyPerson = row6Data.col0 || "No key person assigned";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error Loading Data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={handleManualRefresh}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800">No Data Available</h3>
            <p className="text-sm text-yellow-700 mt-1">
              The dashboard for {selectedDesignation} is currently empty.
            </p>
            <button
              onClick={handleManualRefresh}
              className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Designation Selector */}
      {/* <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Your Dashboard</h2>
            <p className="text-sm text-gray-600">Viewing data for: {selectedDesignation}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedDesignation}
              onChange={(e) => handleDropdownChange(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting || isDataLoading}
            >
              {availableDesignations.map((designation) => (
                <option key={designation} value={designation}>
                  {designation}
                </option>
              ))}
            </select>
            <button
              onClick={handleManualRefresh}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Refresh data"
              disabled={isDataLoading}
            >
              <RefreshCw className={`w-5 h-5 ${isDataLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {submitMessage && (
          <div className={`mt-2 text-sm ${submitMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {submitMessage}
          </div>
        )}
      </div> */}

      {/* Loading Data State */}
      {isDataLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto absolute top-2 left-2">
                <Database className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="mt-4 text-gray-700 font-medium">Loading your KPI dashboard...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isDataLoading && selectedDesignation && currentData && currentData.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Role Information Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-800">My Role</h2>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h3 className="text-sm font-medium text-green-600 mb-2">Current Role</h3>
                <p className="text-gray-800 font-semibold">{selectedDesignation}</p>
                <p className="text-gray-600 text-sm mt-1">{firstRowData.col1 || "Role description not available"}</p>
              </div>
            </div>

            {/* My Tasks Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckSquare className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">My Tasks</h2>
              </div>
              <div className="bg-white rounded-lg p-6 border border-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">{firstRowData.col3 || "0"}</p>
                  <p className="text-sm text-gray-600 mt-1">Assigned Tasks</p>
                </div>
              </div>
            </div>

            {/* My Performance Scoring Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">My Performance</h2>
              </div>
              <div className="space-y-4">
                {firstRowData.col4 && (
                  <a
                    href={firstRowData.col4}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-lg p-4 border border-purple-100 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-purple-600">How My Scoring Works</span>
                    </div>
                  </a>
                )}
                {firstRowData.col5 && (
                  <a
                    href={firstRowData.col5}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-lg p-4 border border-purple-100 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-purple-600">How To Improve My Score</span>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* My Communication Section */}
            <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Team Communication Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-amber-600" />
                  <h2 className="text-lg font-semibold text-gray-800">My Communication Team</h2>
                </div>
                <div className="bg-white rounded-lg p-4 border border-amber-100">
                  <h3 className="text-sm font-medium text-amber-600 mb-3">Team Members I Work With</h3>
                  {communicationTeam.length > 0 ? (
                    <ul className="space-y-2">
                      {communicationTeam.map((member, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="text-gray-700 font-medium">{member}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No team members assigned</p>
                  )}
                </div>
              </div>

              {/* My Communication Process Card */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-sm border border-cyan-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-cyan-600" />
                  <h2 className="text-lg font-semibold text-gray-800">My Communication Process</h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-cyan-100">
                    <h3 className="text-sm font-medium text-cyan-600 mb-2">How I Should Communicate</h3>
                    <p className="text-gray-700">{howToCommunicate}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-cyan-100">
                    <h3 className="text-sm font-medium text-cyan-600 mb-2">My Key Contact Person</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-cyan-600" />
                      </div>
                      <p className="text-gray-700 font-medium">{keyPerson}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Systems Table */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-800">My Systems and Resources</h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">Systems and tools assigned to me for my role</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="px-6 py-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                        System Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                        My Task
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                        My Access Links
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tableData.length > 0 ? (
                      tableData.map((row, index) => (
                        <tr key={row._id || index} className="hover:bg-green-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{row.col0 || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700 font-medium">{row.col1 || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">{row.col2 || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {row.col3 && (
                                <a
                                  href={row.col3}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors"
                                >
                                  <Link className="w-4 h-4" />
                                  <span className="text-sm font-medium">Access System</span>
                                </a>
                              )}
                              {row.col4 && (
                                <a
                                  href={row.col4}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <Database className="w-4 h-4" />
                                  <span className="text-sm font-medium">My Dashboard</span>
                                </a>
                              )}
                              {row.col5 && (
                                <a
                                  href={row.col5}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">My Training</span>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No systems or resources assigned to you yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 px-6 py-3 border-t">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    Your personalized {selectedDesignation} dashboard
                  </span>
                  <span>
                    User: {user?.name || 'Unknown'} | ID: {user?.id || user?.username || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

     
    
    </div>
  );
};

export default React.memo(CompleteKpiDashboard);