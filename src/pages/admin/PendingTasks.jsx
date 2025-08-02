"use client";
import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { User } from "lucide-react";
import TodayTasksTable from "../../components/tables/TodayTasktable";

const convertGoogleDriveImageUrl = (url) => {
  if (!url) return null;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
  }

  return url;
};

const AdminTodayTasks = () => {
  const [todayTasks, setTodayTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("col23");
  const [filterValue, setFilterValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  const DISPLAY_COLUMNS = ["col2", "col3", "col4", "col14"];
  const SPREADSHEET_ID = "1szwMeIermOLKS5qJV3C6DXOqp3RdlagF46-JkXhMjKo";

  const fetchTodayData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=data`
      );
      const text = await response.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const data = JSON.parse(text.substring(jsonStart, jsonEnd + 1));

      const fmsItems = data.table.rows.map((row, rowIndex) => {
        const itemObj = {
          _id: `${rowIndex}-${Math.random().toString(36).substr(2, 9)}`,
          _rowIndex: rowIndex + 1,
        };
        if (row.c) {
          row.c.forEach((cell, i) => {
            itemObj[`col${i}`] = cell?.v ?? cell?.f ?? "";
          });
        }

        const rawValue = String(itemObj.col23 || "").replace(/^"|"$/g, "");
        let imageUrl = "";
        let userName = "";

        if (rawValue.includes(",")) {
          const parts = rawValue.split(/,(.+)/);
          imageUrl = parts[0]?.trim() || "";
          userName = parts[1]?.trim() || "";
        } else if (rawValue.startsWith("http")) {
          imageUrl = rawValue.trim();
          userName = "";
        } else {
          imageUrl = "";
          userName = rawValue.trim();
        }

        itemObj._imageUrl = convertGoogleDriveImageUrl(imageUrl);
        itemObj._userName = userName || "User";
        itemObj._combinedValue = userName
          ? `${imageUrl},${userName}`
          : imageUrl || userName;

        return itemObj;
      });

      const filteredItems = fmsItems.filter((item) =>
        DISPLAY_COLUMNS.some((colId) => {
          const value = item[colId];
          return value && String(value).trim() !== "";
        })
      );

      setTodayTasks(filteredItems);
     
    } catch (err) {
      console.error("❌ Error fetching pending data:", err);
      setError(err.message);
      toast.error(`Failed to load: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
  }, []);

  const getPersonNamesWithImages = () => {
    const personMap = new Map();

    todayTasks.forEach((item) => {
      const combinedValue = item._combinedValue;
      if (combinedValue && combinedValue.trim() !== "") {
        if (!personMap.has(combinedValue)) {
          personMap.set(combinedValue, {
            value: combinedValue,
            displayName: item._userName || "User",
            imageUrl: item._imageUrl,
          });
        }
      }
    });

    return Array.from(personMap.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  };

  const getFMSNames = () => {
    const fmsNames = new Set();
    todayTasks.forEach((item) => {
      const fmsName = String(item.col2 || "").trim();
      if (fmsName !== "") {
        fmsNames.add(fmsName);
      }
    });
    return Array.from(fmsNames).sort();
  };

  const filteredTasks = todayTasks.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = DISPLAY_COLUMNS.some((colId) =>
      String(item[colId] || "")
        .toLowerCase()
        .includes(term)
    );
    const matchesFilter = filterValue
      ? item._combinedValue === filterValue
      : true;
    return matchesSearch && matchesFilter;
  });

  const handlePersonSelect = (person) => {
    setFilterType("col23");
    setFilterValue(person.value);
    setShowPersonDropdown(false);
  };

  const selectedPerson = getPersonNamesWithImages().find(
    (p) => p.value === filterValue
  );

  return (
    <div className="space-y-4" style={{ height: "calc(110vh - 90px)", marginTop: "-40px" }}>
    

      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-bold text-gray-800">Pending Tasks</h1>
        <div className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
          {filteredTasks.length} Today Task
          {filteredTasks.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search + Inline Filter */}
      <div className="bg-white p-3 rounded border space-y-3 relative">
        <div className="grid md:grid-cols-3 gap-3">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-2 border rounded-md w-full max-w-xs focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Custom Person Dropdown */}
          <div className="relative">
            <div
              className="border px-3 py-2 rounded w-full focus:ring-green-500 focus:border-green-500 bg-white cursor-pointer flex justify-between items-center"
              onClick={() => setShowPersonDropdown(!showPersonDropdown)}
            >
              {selectedPerson ? (
                <div className="flex items-center">
                  {selectedPerson.imageUrl ? (
                    <img
                      src={selectedPerson.imageUrl}
                      alt={selectedPerson.displayName}
                      className="w-6 h-6 rounded-full mr-2 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "";
                        e.target.className =
                          "w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center";
                        e.target.innerHTML = `<span class="text-xs">${selectedPerson.displayName?.charAt(0) || "?"
                          }</span>`;
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                      <span className="text-xs">
                        {selectedPerson.displayName?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <span>{selectedPerson.displayName}</span>
                </div>
              ) : (
                <span>All Persons</span>
              )}
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${showPersonDropdown ? "rotate-180" : ""
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {showPersonDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <div
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() =>
                    handlePersonSelect({
                      value: "",
                      displayName: "All Persons",
                    })
                  }
                >
                  All Persons
                </div>
                {getPersonNamesWithImages().map((person) => (
                  <div
                    key={person.value}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handlePersonSelect(person)}
                  >
                    {person.imageUrl ? (
                      <img
                        src={person.imageUrl}
                        alt={person.displayName}
                        className="w-6 h-6 rounded-full mr-2 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "";
                          e.target.className =
                            "w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center";
                          e.target.innerHTML = `<span class="text-xs">${person.displayName?.charAt(0) || "?"
                            }</span>`;
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                        <span className="text-sm">
                          {person.displayName?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                    <span>{person.displayName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FMS Name Dropdown */}
          <div>
            <select
              value={filterType === "col2" ? filterValue : ""}
              onChange={(e) => {
                setFilterType("col2");
                setFilterValue(e.target.value);
              }}
              className="border px-3 py-2 rounded w-full focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All FMS Names</option>
              {getFMSNames().map((fmsName) => (
                <option key={fmsName} value={fmsName}>
                  {fmsName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={fetchTodayData}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="bg-white rounded-lg border shadow-sm p-4 relative">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {filterValue
                ? `Showing ${filterType === "col2" ? "FMS Name" : "Person"}: ${selectedPerson?.displayName || filterValue
                }`
                : "All Tasks"}
            </h2>
            <p className="text-sm text-gray-500">
              {filterValue
                ? "Filtered tasks based on your selected criteria."
                : "Showing all available tasks."}
            </p>
          </div>
          <div className="h-[calc(100vh-270px)] overflow-hidden">
            <TodayTasksTable
              isCompact={true}
              filterTasks={filteredTasks}
              type="pending"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
          <p className="text-gray-500">No tasks match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default AdminTodayTasks;