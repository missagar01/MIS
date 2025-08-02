// import React, { useEffect, useState } from "react";
// import KpikraTable from "../../components/tables/KpikraTable";

// const designations = ["CRM", "PURCHASER", "HR", "EA", "ACCOUNTANT"];

// const KpiKra = () => {
//   const [selectedDesignation, setSelectedDesignation] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitMessage, setSubmitMessage] = useState("");
//   const [initialLoadError, setInitialLoadError] = useState(false);
//   const [refreshTrigger, setRefreshTrigger] = useState(0);
//   const [isLoadingData, setIsLoadingData] = useState(false);

//   useEffect(() => {
//     const fetchInitialDesignation = async () => {
//       try {
//         const localDesignation = localStorage.getItem("selectedDesignation");
//         if (localDesignation && designations.includes(localDesignation)) {
//           setSelectedDesignation(localDesignation);
//           return;
//         }

//         const timestamp = Date.now();
//         const response = await fetch(
//           `https://script.google.com/macros/s/AKfycbzcGGAZCqsDQRRiRkzIWev2jgYjcuVDoHYac1C7ZGpt5VsfREYRcaOEwAcCLh59O2KV/exec?action=getCell&sheetName=Dashboard&row=2&column=1&t=${timestamp}`,
//           {
//             redirect: "follow",
//             headers: {
//               "Content-Type": "text/plain;charset=utf-8",
//             },
//           }
//         );

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const result = await response.json();
//         if (result.success && result.value && designations.includes(result.value)) {
//           setSelectedDesignation(result.value);
//           localStorage.setItem("selectedDesignation", result.value);
//           setInitialLoadError(false);
//         } else {
//           throw new Error(result.error || "Invalid response format");
//         }
//       } catch (error) {
//         console.error("Failed to fetch initial designation:", error);
//         setInitialLoadError(true);
//       }
//     };

//     fetchInitialDesignation();
//   }, []);

//   const handleDropdownChange = async (newDesignation) => {
//     if (newDesignation === selectedDesignation) return;

//     const previousDesignation = selectedDesignation;

//     setSelectedDesignation(newDesignation);
//     localStorage.setItem("selectedDesignation", newDesignation); // Save to localStorage
//     setIsSubmitting(true);
//     setIsLoadingData(true);
//     setSubmitMessage("");

//     try {
//       const formData = new FormData();
//       formData.append("action", "updateCell");
//       formData.append("sheetName", "Dashboard");
//       formData.append("row", "2");
//       formData.append("column", "1");
//       formData.append("value", newDesignation);

//       const response = await fetch(
//         "https://script.google.com/macros/s/AKfycbzcGGAZCqsDQRRiRkzIWev2jgYjcuVDoHYac1C7ZGpt5VsfREYRcaOEwAcCLh59O2KV/exec",
//         {
//           method: "POST",
//           body: formData,
//           redirect: "follow",
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const result = await response.json();

//       if (result.success) {
//         setRefreshTrigger((prev) => prev + 1);
//         setSubmitMessage("✅ Selection saved successfully!");
//       } else {
//         throw new Error(result.error || "Failed to save selection");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setRefreshTrigger((prev) => prev + 1);
//     } finally {
//       setIsSubmitting(false);
//       setIsLoadingData(false);
//       setTimeout(() => setSubmitMessage(""), 3000);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header & Dropdown */}
//       <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-sm">
//         <div>
//           <h1 className="text-2xl font-bold text-white">KPI & KRA Dashboard</h1>
//           <p className="text-blue-100 mt-1">Performance metrics and role information</p>
//         </div>
//         <div className="relative">
//           <select
//             value={selectedDesignation}
//             onChange={(e) => handleDropdownChange(e.target.value)}
//             disabled={isSubmitting}
//             className="appearance-none px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 focus:border-transparent disabled:opacity-50 pr-12 text-lg font-semibold min-w-[150px] cursor-pointer"
//             style={{
//               colorScheme: 'dark',
//               WebkitAppearance: 'none',
//               MozAppearance: 'none'
//             }}
//           >
//             <option value="" disabled style={{
//               backgroundColor: '#ffffff',
//               color: '#6b7280',
//               padding: '12px 16px',
//               fontSize: '16px',
//               fontWeight: '500',
//               display: 'none'
//             }}>
//               Select
//             </option>
//             {designations.map((designation) => (
//               <option
//                 key={designation}
//                 value={designation}
//                 style={{
//                   backgroundColor: '#ffffff',
//                   color: '#1f2937',
//                   padding: '12px 16px',
//                   fontSize: '16px',
//                   fontWeight: '500'
//                 }}
//               >
//                 {designation}
//               </option>
//             ))}
//           </select>
//           <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
//             <svg
//               className="w-5 h-5 text-white"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M19 9l-7 7-7-7"
//               />
//             </svg>
//           </div>
//         </div>
//       </div>

//       {/* Message / Status */}
//       {(isSubmitting || submitMessage) && (
//         <div className="text-sm">
//           {isSubmitting ? (
//             <span className="flex items-center gap-2">
//               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//               Saving...
//             </span>
//           ) : (
//             <span
//               className={
//                 submitMessage.includes("✅")
//                   ? "text-green-200"
//                   : "text-red-200"
//               }
//             >
//               {submitMessage}
//             </span>
//           )}
//         </div>
//       )}

//       {/* Loading Spinner or Table */}
//       {isLoadingData ? (
//         <div className="flex justify-center items-center h-32 text-blue-500 font-semibold text-lg">
//           <svg
//             className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//             ></circle>
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8v8z"
//             ></path>
//           </svg>
//           Loading data...
//         </div>
//       ) : (
//         <KpikraTable
//           designation={selectedDesignation}
//           key={`${selectedDesignation}-${refreshTrigger}`}
//         />
//       )}
//     </div>
//   );
// };

// export default KpiKra;



import React, { useEffect, useState } from "react";
import KpikraTable from "../../components/tables/KpikraTable";
import { useAuth } from "../../contexts/AuthContext";

const KpiKra = () => {
  const { user } = useAuth();
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [initialLoadError, setInitialLoadError] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [availableDesignations, setAvailableDesignations] = useState([]);

  // Initialize available designations based on user role
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        // Admin can see all designations
        setAvailableDesignations(["CRM", "PURCHASER", "HR", "EA", "ACCOUNTANT"]);
        // Don't auto-select anything for admin - let them choose
      } else if (user.designations && user.designations.length > 0) {
        // Regular users can only see their assigned designations
        setAvailableDesignations(user.designations);
        // Don't auto-select for users - show placeholder first
      } else {
        setAvailableDesignations([]);
      }
    }
  }, [user]);

  const handleDropdownChange = async (newDesignation) => {
    if (newDesignation === selectedDesignation) return;

    setSelectedDesignation(newDesignation);
    setIsSubmitting(true);
    setIsLoadingData(true);
    setSubmitMessage("");

    try {
      if (user.role === "admin") {
        // Only admins update the global designation
        const formData = new FormData();
        formData.append("action", "updateCell");
        formData.append("sheetName", "Dashboard");
        formData.append("row", "2");
        formData.append("column", "1");
        formData.append("value", newDesignation);

        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbxf0N7THEB3Sj_7O0Gf9Gpa-2RAxoEymLNcFPnX6O6OcH8RWvDZiwZIWrODEk-wwDMtBA/exec",
          {
            method: "POST",
            body: formData,
            redirect: "follow",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to save selection");
        }
      }

      setRefreshTrigger((prev) => prev + 1);
      setSubmitMessage("✅ Selection saved successfully!");
    } catch (error) {
      console.error("Error:", error);
      // setSubmitMessage("❌ Failed to save selection");
    } finally {
      setIsSubmitting(false);
      setIsLoadingData(false);
      setTimeout(() => setSubmitMessage(""), 3000);
    }
  };

  // Fixed: Get the correct designation based on user role
  const getEffectiveDesignation = () => {
    return selectedDesignation;
  };

  const effectiveDesignation = getEffectiveDesignation();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
    
      {/* KPI & KRA Header & Dropdown */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white">KPI & KRA Dashboard</h1>
          <p className="text-blue-100 mt-1">
            {user?.role === "admin" ? "Admin View" : "Your Performance Metrics"}
          </p>
        </div>
        
        {availableDesignations.length > 0 && (
          <div className="relative">
            <select
              value={selectedDesignation}
              onChange={(e) => handleDropdownChange(e.target.value)}
              disabled={isSubmitting}
              className="appearance-none px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/50 focus:border-transparent disabled:opacity-50 pr-12 text-lg font-semibold min-w-[150px] cursor-pointer"
              style={{
                colorScheme: 'dark',
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
            >
              <option value="" disabled style={{
                backgroundColor: '#ffffff',
                color: '#6b7280',
                padding: '12px 16px',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Select Designation
              </option>
              {availableDesignations.map((designation) => (
                <option
                  key={designation}
                  value={designation}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  {designation}
                </option>
              ))}
            </select>
            {availableDesignations.length > 1 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message / Status */}
      {(isSubmitting || submitMessage) && (
        <div className="text-sm">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </span>
          ) : (
            <span
              className={
                submitMessage.includes("✅")
                  ? "text-green-200"
                  : "text-red-200"
              }
            >
              {submitMessage}
            </span>
          )}
        </div>
      )}

      {/* Loading Spinner or Table */}
      {isLoadingData ? (
        <div className="flex justify-center items-center h-32 text-blue-500 font-semibold text-lg">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          Loading data...
        </div>
      ) : (
        <KpikraTable
          designation={effectiveDesignation}
          key={`${effectiveDesignation}-${refreshTrigger}-${user?.role}`}
          isAdmin={user?.role === "admin"}
          isEmpty={!effectiveDesignation}
        />
      )}
    </div>
  );
};

export default KpiKra;