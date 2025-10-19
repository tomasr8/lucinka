import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { User, Calendar } from "lucide-react";
import { Moon, Sun } from "lucide-react";

const avatarColors = [
  "from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700",
  "from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700",
  "from-green-400 to-green-600 dark:from-green-500 dark:to-green-700",
  "from-pink-400 to-pink-600 dark:from-pink-500 dark:to-pink-700",
  "from-indigo-400 to-indigo-600 dark:from-indigo-500 dark:to-indigo-700",
  "from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700",
  "from-red-400 to-red-600 dark:from-red-500 dark:to-red-700",
  "from-cyan-400 to-cyan-600 dark:from-cyan-500 dark:to-cyan-700",
];

const UserLoginStats = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const theme = darkMode ? "light" : "dark";
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark");
    setDarkMode(d => !d);
  };

  const [stats, setState] = useState({ loading: true });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Simulate API call
        const [loginDataResponse, usersResponse] = await Promise.all([
          fetch("/api/login-stats"),
          fetch("/api/users"),
        ]);

        if (!loginDataResponse.ok || !usersResponse.ok) {
          navigate("login");
          return;
        }

        const [loginData, users] = await Promise.all([
          loginDataResponse.json(),
          usersResponse.json(),
        ]);

        setState({ loading: false, loginData, users });
      } catch (error) {
        console.error(error);
        navigate("login");
        return;
      }
    }

    fetchStats();
  }, [navigate]);

  // Sample data - replace with your actual data source
  // const { loginData, users } = stats;

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Get avatar color based on index
  const getAvatarColor = index => {
    return avatarColors[index % avatarColors.length];
  };

  const usersById = stats.users.reduce((acc, user, i) => {
    acc[user.id] = {
      username: user.username,
      avatarColor: getAvatarColor(i),
    };
    return acc;
  }, {});

  const loginData = stats.loginData.map(record => ({
    id: record.id,
    username: usersById[record.user_id]?.username || "<unknown>",
    avatarColor:
      usersById[record.user_id]?.avatarColor || "from-gray-400 to-gray-600",
    loginDateTime: record.login_dt,
  }));

  loginData.sort(
    (a, b) => new Date(b.loginDateTime) - new Date(a.loginDateTime)
  );

  // Format date for display
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              User Login Statistics
            </h1>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {loginData.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today's Logins
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {loginData.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Login Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loginData.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div
                            className={`h-10 w-10 rounded-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center`}
                          >
                            <span className="text-white font-medium text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(user.loginDateTime)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.loginDateTime).toLocaleDateString(
                          "en-US",
                          { weekday: "long" }
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{loginData.length}</span>{" "}
                login records
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLoginStats;
