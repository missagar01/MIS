import React, { useEffect, useState } from 'react';
import { getEmployeeById, getTasksByEmployeeId } from '../../data/mockData';
import StatsCard from '../../components/dashboard/StatsCard';
import DoughnutChart from '../../components/charts/DoughnutChart';
import { Award, CheckSquare, ClipboardList, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


// Avatar Component with image processing (same logic as EmployeesTable)
const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = "md", 
  className = "",
  showName = false,
  fallbackElement = null 
}) => {
  const [imgSrc, setImgSrc] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Size variants
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs", 
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-20 h-20 text-xl",
    "3xl": "w-24 h-24 text-2xl"
  };

  const getDriveImageUrls = (originalUrl) => {
    if (!originalUrl || typeof originalUrl !== "string") return [];
    
    // Extract file ID from various Google Drive URL formats
    let fileId = null;
    
    // Check if it's already a thumbnail URL
    const thumbnailMatch = originalUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (thumbnailMatch) {
      fileId = thumbnailMatch[1];
    } else {
      // Check other formats
      const fileIdMatch = originalUrl.match(/\/file\/d\/([^/]+)|id=([^&]+)|\/d\/([^/]+)/);
      fileId = fileIdMatch ? fileIdMatch[1] || fileIdMatch[2] || fileIdMatch[3] : null;
    }
    
    if (!fileId) return [originalUrl];
    
    // Return multiple fallback URLs with better CORS support
    return [
      `https://lh3.googleusercontent.com/d/${fileId}=w400-h400-c`, // Best for CORS
      `https://drive.google.com/uc?export=view&id=${fileId}`, // Direct export
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`, // Original thumbnail
      `https://lh3.googleusercontent.com/d/${fileId}`, // Simple googleusercontent
      `https://drive.google.com/file/d/${fileId}/view`, // View URL as last resort
      originalUrl, // Original URL as final fallback
    ];
  };

  useEffect(() => {
    if (!src || src.trim() === "") {
      setLoadFailed(true);
      return;
    }
    
    const urls = getDriveImageUrls(src);
    
    if (urls.length === 0) {
      setLoadFailed(true);
      return;
    }
    setImgSrc(urls[0]);
    setLoadFailed(false);
    setAttempts(0);
  }, [src]);

  const handleError = () => {
    const urls = getDriveImageUrls(src);
    const nextAttempt = attempts + 1;
    
    if (nextAttempt < urls.length) {
      setImgSrc(urls[nextAttempt]);
      setAttempts(nextAttempt);
    } else {
      setLoadFailed(true);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join("")
      .toUpperCase();
  };

  const avatarClasses = `${sizeClasses[size]} rounded-full object-cover ${className}`;

  if (loadFailed || !src) {
    return (
      <div className="flex items-center gap-2">
        {fallbackElement || (
          <div className={`${avatarClasses} bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold shadow-lg`}>
            {getInitials(name)}
          </div>
        )}
        {showName && (
          <span className="text-sm font-medium text-gray-700">{name}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img
        src={imgSrc}
        alt={alt || name}
        onError={handleError}
        className={`${avatarClasses} shadow-lg ring-2 ring-white`}
        loading="lazy"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      {showName && (
        <span className="text-sm font-medium text-gray-700">{name}</span>
      )}
    </div>
  );
};

const UserDashboard = () => {
  const { user } = useAuth(); // Get user data from login
  const [sheetData, setSheetData] = useState({
    totalTask: 'Loading...',
    completeTask: 'Loading...',
    weeklyPending: 'Loading...',
    allPending: 'Loading...'
  });

  // Use login data if available
  const employeeEmail = user?.email || '';
  const employeeName = user?.name || '';
  const performanceData = user?.performance;
  const hasPerformanceData = user?.hasPerformanceData;

  useEffect(() => {
    // If we have performance data from login, use it directly
    if (hasPerformanceData && performanceData) {
      setSheetData({
        totalTask: performanceData.target || 'N/A',
        completeTask: performanceData.actualWorkDone || 'N/A', 
        weeklyPending: performanceData.weekPending || 'N/A',
        allPending: performanceData.allPendingTillDate || 'N/A'
      });
      return; // Don't fetch from API if we already have data
    }

    // Fallback to mock data if no user email
    if (!employeeEmail) {
      const employee = getEmployeeById('emp-001');
      const userTasks = getTasksByEmployeeId('emp-001');
      
      setSheetData({
        totalTask: employee?.weeklyCommitment || 'N/A',
        completeTask: userTasks.filter(task => task.status === 'completed').length,
        weeklyPending: userTasks.filter(task => task.status === 'pending').length,
        allPending: userTasks.filter(task => ['pending', 'in-progress'].includes(task.status)).length
      });
      return;
    }

    // FALLBACK: Original API fetch if no performance data from login
    const fetchDataFromSheet = async () => {
      try {
        const response = await fetch(
          'https://script.google.com/macros/s/AKfycbzneoEJQODTF-Ws0WupO7dRj7I7_-b6U-EVh7eMJcgoPFvxND1MQ2vfm3l3-WkftCAtVw/exec',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();
        const data = result?.data || result?.values || [];

        if (!data || data.length < 2) {
          setSheetData({
            totalTask: 'N/A',
            completeTask: 'N/A',
            weeklyPending: 'N/A',
            allPending: 'N/A'
          });
          return;
        }

        const headers = data[0];
        const rows = data.slice(1);

        const emailIndex = headers.findIndex(h => h?.toString().trim().toLowerCase() === 'email');
        const emailColumn = emailIndex !== -1 ? emailIndex : 2; // fallback to column C if not found

        const userRow = rows.find(row =>
          row[emailColumn]?.toString().trim().toLowerCase() === employeeEmail.toLowerCase()
        );

        if (!userRow) {
          setSheetData({
            totalTask: 'N/A',
            completeTask: 'N/A',
            weeklyPending: 'N/A',
            allPending: 'N/A'
          });
          return;
        }

        setSheetData({
          totalTask: userRow[3] || 'N/A',        // Column D
          completeTask: userRow[4] || 'N/A',     // Column E
          weeklyPending: userRow[8] || 'N/A',    // Column I
          allPending: userRow[9] || 'N/A'       // Column J
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setSheetData({
          totalTask: 'Error',
          completeTask: 'Error',
          weeklyPending: 'Error',
          allPending: 'Error'
        });
      }
    };

    fetchDataFromSheet();
  }, [employeeEmail, hasPerformanceData, performanceData]);

  // Dynamic Task Completion calculation based on performance data
  const calculateTaskCompletion = () => {
    if (hasPerformanceData && performanceData) {
      const target = parseInt(performanceData.target) || 0;
      const completed = parseInt(performanceData.actualWorkDone) || 0;
      const pending = parseInt(performanceData.weekPending) || 0;
      const notStarted = Math.max(0, target - completed - pending);
      
      return {
        completed: completed,
        pending: pending,
        notStarted: notStarted,
        total: target
      };
    }
    
    // Fallback to sheet data or mock data
    const completed = parseInt(sheetData.completeTask) || 0;
    const pending = parseInt(sheetData.weeklyPending) || 0;
    const total = parseInt(sheetData.totalTask) || 0;
    const notStarted = Math.max(0, total - completed - pending);
    
    return {
      completed: completed,
      pending: pending,
      notStarted: notStarted,
      total: total
    };
  };

  const taskStats = calculateTaskCompletion();
  
  // Dynamic data for charts
  const taskCompletionData = [taskStats.completed, taskStats.pending, taskStats.notStarted];
  const taskCompletionLabels = ['Completed', 'Pending', 'Not Started'];
  const taskCompletionColors = ['#10b981', '#f59e0b', '#3b82f6'];

  // Enhanced commitment data calculation
  const targetValue = parseInt(sheetData.totalTask) || 0;
  const actualValue = parseInt(sheetData.completeTask) || 0;
  const commitmentPercentage = targetValue > 0 ? Math.round((actualValue / targetValue) * 100) : 0;

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading user data...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* User Profile Header with Avatar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <Avatar 
            src={user?.image} 
            name={employeeName} 
            size="xl"
            className="ring-4 ring-indigo-100"
          />
          
          {/* User Information */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{employeeName}</h1>
            <p className="text-gray-600">{user?.department || 'Department'}</p>
          </div>
          
          {/* User Stats Summary */}
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{commitmentPercentage}%</div>
            <div className="text-sm text-gray-500">Target Achievement</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Target Tasks" 
          value={sheetData.totalTask} 
          icon={Award} 
          color="green"
        />

        <StatsCard 
          title="Completed Tasks" 
          value={sheetData.completeTask} 
          icon={CheckSquare} 
          color="blue"
        />

        <StatsCard 
          title="All Pending Tasks" 
          value={sheetData.allPending} 
          icon={Clock} 
          color="orange"
        />

        <StatsCard 
          title="Weekly Pending" 
          value={sheetData.weeklyPending} 
          icon={ClipboardList} 
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Dynamic Task Completion */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Task Completion Overview</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${
              hasPerformanceData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {hasPerformanceData ? 'Live Data' : 'Mock Data'}
            </span>
          </div>
          
          {/* Task Statistics Summary */}
          <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-yellow-600">{taskStats.pending}</div>
              <div className="text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600">{taskStats.total}</div>
              <div className="text-gray-500">Target</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          
          {/* Doughnut Chart */}
          <DoughnutChart 
            data={taskCompletionData} 
            labels={taskCompletionLabels}
            colors={taskCompletionColors}
          />
        </div>

        {/* Enhanced Commitment Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
            {hasPerformanceData ? 'Target vs Achievement' : 'Weekly Commitment Progress'}
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {hasPerformanceData ? 'Target Tasks' : 'Committed Tasks'}
                </span>
                <span className="text-sm font-bold text-gray-800">{targetValue}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {hasPerformanceData ? 'Achieved Tasks' : 'Completed Tasks'}
                </span>
                <span className="text-sm font-bold text-gray-800">{actualValue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    commitmentPercentage >= 100 ? 'bg-green-500' :
                    commitmentPercentage >= 75 ? 'bg-blue-500' :
                    commitmentPercentage >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(commitmentPercentage, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-center">
                <span className={`text-sm font-medium ${
                  commitmentPercentage >= 100 ? 'text-green-600' :
                  commitmentPercentage >= 75 ? 'text-blue-600' :
                  commitmentPercentage >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {commitmentPercentage}% of {hasPerformanceData ? 'target' : 'weekly commitment'} completed
                </span>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;