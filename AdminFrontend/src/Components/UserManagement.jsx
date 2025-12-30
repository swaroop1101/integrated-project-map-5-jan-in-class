import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Search, Filter, Eye, BookOpen, Video, Clock, ChevronDown, ChevronUp, Mic, FileText, Brain } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [activeSection, setActiveSection] = useState({});
    // { [userId]: "learning" | "interviews" }
    const [userDetails, setUserDetails] = useState({});
    const [interviews, setInterviews] = useState({});
    const [loadingDetails, setLoadingDetails] = useState({});
    const [loadingInterviews, setLoadingInterviews] = useState({});
    const [interviewStats, setInterviewStats] = useState(null);


    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFeature, setSelectedFeature] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newUserData, setNewUserData] = useState({
        name: '',
        email: '',
        featureAccess: ''
    });

    /* ===============================
       FETCH USERS FROM BACKEND
    ================================ */
    useEffect(() => {
        fetch('http://localhost:5000/api/users/admin/all-users')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUsers(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch users', err);
                setLoading(false);
            });
    }, []);

    /* ===============================
     FETCH GLOBAL INTERVIEW STATS (ADMIN)
  =============================== */
    useEffect(() => {
        fetch('http://localhost:5000/api/interview-session/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setInterviewStats(data.stats);
                }
            })
            .catch(err => {
                console.error('Failed to fetch interview stats', err);
            });
    }, []);


    /* ===============================
       FETCH USER DETAILS (COURSES + VIDEOS)
    ================================ */
    const fetchUserDetails = async (userId) => {
        if (userDetails[userId]) return;

        setLoadingDetails(prev => ({ ...prev, [userId]: true }));

        try {
            const res = await fetch(`http://localhost:5000/api/users/admin/user/${userId}`);
            const data = await res.json();

            if (data.success) {
                setUserDetails(prev => ({ ...prev, [userId]: data }));
            }
        } catch (err) {
            console.error('Failed to fetch user details', err);
        } finally {
            setLoadingDetails(prev => ({ ...prev, [userId]: false }));
        }
    };

    /* ===============================
       FETCH INTERVIEW DETAILS
    ================================ */
    const fetchInterviewDetails = async (userId) => {
        if (interviews[userId]) return;

        setLoadingInterviews(prev => ({ ...prev, [userId]: true }));

        try {
            const res = await fetch(`http://localhost:5000/api/interview-session/admin/user/${userId}`);
            const data = await res.json();

            if (data.success) {
                setInterviews(prev => ({ ...prev, [userId]: data.interviews }));
            }
        } catch (err) {
            console.error('Failed to fetch interview details', err);
        } finally {
            setLoadingInterviews(prev => ({ ...prev, [userId]: false }));
        }
    };

    const toggleExpand = (userId) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);

            // DEFAULT TAB = LEARNING
            setActiveSection(prev => ({
                ...prev,
                [userId]: "learning",
            }));

            fetchUserDetails(userId);
            fetchInterviewDetails(userId);
        }
    };


    /* ===============================
       GLOBAL INTERVIEW STATS
    ================================ */
    //   const allInterviews = Object.values(interviews).flat();

    //   const totalInterviews = allInterviews.length;
    //   const completedInterviews = allInterviews.filter(
    //     i => i.status === "completed"
    //   ).length;
    //   const inProgressInterviews = totalInterviews - completedInterviews;

    //   const startupInterviews = allInterviews.filter(
    //     i => i.companyType?.toLowerCase() === "startup"
    //   ).length;

    //   const serviceInterviews = allInterviews.filter(
    //     i => i.companyType?.toLowerCase() === "service"
    //   ).length;

    //   const productInterviews = allInterviews.filter(
    //     i => i.companyType?.toLowerCase() === "product"
    //   ).length;

    /* ===============================
       FORMAT TIME HELPERS
    ================================ */
    const formatTime = (seconds) => {
        if (!seconds) return "0m";
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    const getProgressPercentage = (watched, total) => {
        if (!total || total === 0) return 0;
        return Math.min(Math.round((watched / total) * 100), 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-200 via-orange-100 to-gray-300 flex items-center justify-center">
                <div className="text-2xl font-semibold text-gray-800">Loading users...</div>
            </div>
        );
    }

    /* ===============================
       UI LOGIC
    ================================ */
    const openAddUserModal = () => {
        setNewUserData({ name: '', email: '', featureAccess: '' });
        setIsModalOpen(true);
    };

    const handleNewUserDataChange = (e) => {
        const { name, value } = e.target;
        setNewUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveNewUser = (e) => {
        e.preventDefault();

        if (!newUserData.name || !newUserData.email || !newUserData.featureAccess) {
            alert("All fields are required.");
            return;
        }

        const newUser = {
            id: Date.now(),
            ...newUserData,
            status: 'Active'
        };

        setUsers(prev => [newUser, ...prev]);
        setIsModalOpen(false);
    };

    const handleDeleteUser = (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setUsers(prev => prev.filter(user => user.id !== userId));
        }
    };

    const handleFeatureClick = (featureName) => {
        setSelectedFeature(featureName);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSelectedFeature('');
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFeature =
            selectedFeature ? user.featureAccess === selectedFeature : true;

        return matchesSearch && matchesFeature;
    });

    /* ===============================
       RENDER
    ================================ */
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-200 via-orange-100 to-gray-300 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Main Glass Container */}
                <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">

                    {/* Header Section */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            {/* <div className="bg-orange-600 p-2 rounded-xl">
                                <div className="w-6 h-6 bg-orange-400 rounded"></div>
                            </div> */}
                            <h1 className="text-4xl font-bold text-gray-800">All Platform Users</h1>
                        </div>
                        {/* <button
                            onClick={openAddUserModal}
                            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New User</span>
                        </button> */}
                    </header>

                    {/* Interview Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <div className="text-sm text-gray-600 mb-1">Total Interviews</div>
                            <div className="text-3xl font-bold text-gray-800">
                                {interviewStats ? interviewStats.total : "—"}
                            </div>

                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <div className="text-sm text-gray-600 mb-1">Completed </div>
                            <div className="text-3xl font-bold text-gray-800">
                                {interviewStats ? interviewStats.completed : "—"}
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <div className="text-sm text-gray-600 mb-1">In <br/>Progress</div>
                            <div className="text-3xl font-bold text-gray-800">
                                {interviewStats ? interviewStats.inProgress : "—"}
                            </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <div className="text-sm text-gray-600 mb-1">Startup Based</div>
                            <div className="text-3xl font-bold text-gray-800">
                                {interviewStats ? interviewStats.startup : "—"}
                            </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <div className="text-sm text-gray-600 mb-1">Service Based</div>
                            <div className="text-3xl font-bold text-gray-800">
                                {interviewStats ? interviewStats.service : "—"}
                            </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <div className="text-sm text-gray-600 mb-1">Product Based</div>
                            <div className="text-3xl font-bold text-gray-800">
                                {interviewStats ? interviewStats.product : "—"}
                            </div>
                        </div>
                        {/* Messages */}
                        
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <div className="text-sm text-gray-600 mb-1">Total Messages</div>
                            <div className="text-3xl font-bold text-indigo-600">
                                {interviewStats ? interviewStats.totalMessages : "—"}
                            </div>
                        </div>

                        {/* Problems */}
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <div className="text-sm text-gray-600 mb-1">Total Problems</div>
                            <div className="text-3xl font-bold text-emerald-600">
                                {interviewStats ? interviewStats.totalProblems : "—"}
                            </div>
                        </div>

                        {/* Clips */}
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <div className="text-sm text-gray-600 mb-1">Total <br/>Clips</div>
                            <div className="text-3xl font-bold text-pink-600">
                                {interviewStats ? interviewStats.totalClips : "—"}
                            </div>
                        </div>


                    </div>

                    {/* Search & Filter Bar */}
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-10 py-3 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                className="pl-10 pr-8 py-3 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer appearance-none"
                                value={selectedFeature}
                                onChange={(e) => setSelectedFeature(e.target.value)}
                            >
                                <option value="">All Features</option>
                                {Array.from(new Set(users.map(u => u.featureAccess))).map((feature, idx) => (
                                    <option key={idx} value={feature}>{feature}</option>
                                ))}
                            </select>
                        </div>
                        {(searchTerm || selectedFeature) && (
                            <button
                                onClick={clearSearch}
                                className="px-4 py-2 bg-white/60 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white/80 transition-all border border-white/50"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
                            <div className="text-sm text-gray-600 mb-1">Total Users</div>
                            <div className="text-3xl font-bold text-gray-800">{users.length}</div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
                            <div className="text-sm text-gray-600 mb-1">Active Users</div>
                            <div className="text-3xl font-bold text-green-600">
                                {users.filter(u => u.status === 'Active').length}
                            </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
                            <div className="text-sm text-gray-600 mb-1">Filtered Results</div>
                            <div className="text-3xl font-bold text-orange-600">{filteredUsers.length}</div>
                        </div>
                    </div>

                    {/* Main Content Table */}
                    <main className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-white/50">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-white/40">
                                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider p-4">Name</th>
                                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider p-4">Email</th>
                                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider p-4">Feature Access</th>
                                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider p-4">Status</th>
                                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <React.Fragment key={user.id}>
                                                <tr className="hover:bg-white/40 transition-all">
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div className="font-medium text-gray-900">{user.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="text-gray-600">{user.email}</div>
                                                    </td>
                                                    <td
                                                        className="p-4 whitespace-nowrap cursor-pointer"
                                                        onClick={() => handleFeatureClick(user.featureAccess)}
                                                    >
                                                        <div className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-200 transition-all">
                                                            {user.featureAccess}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${user.status === 'Active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => toggleExpand(user.id)}
                                                                className={`p-2 rounded-lg transition-all ${expandedUserId === user.id
                                                                    ? 'bg-purple-500 text-white'
                                                                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                                                    }`}
                                                                title="View Details"
                                                            >
                                                                {expandedUserId === user.id ? (
                                                                    <ChevronUp className="w-4 h-4" />
                                                                ) : (
                                                                    <Eye className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            {/* <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button> */}
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Row */}
                                                {expandedUserId === user.id && (
                                                    <tr>
                                                        <td colSpan="5" className="p-0">
                                                            <div className="bg-gradient-to-r from-orange-50/80 to-purple-50/80 backdrop-blur-sm p-6 border-t border-b border-orange-200">
                                                                <div className="max-w-6xl mx-auto">

                                                                    {/* SECTION TABS */}
                                                                    <div className="flex gap-4 mb-6">
                                                                        <button
                                                                            onClick={() =>
                                                                                setActiveSection(prev => ({ ...prev, [user.id]: "learning" }))
                                                                            }
                                                                            className={`px-4 py-2 rounded-xl font-medium transition-all ${activeSection[user.id] === "learning"
                                                                                ? "bg-orange-500 text-white"
                                                                                : "bg-white/60 text-gray-700 hover:bg-white"
                                                                                }`}
                                                                        >
                                                                            Learning Progress
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                setActiveSection(prev => ({ ...prev, [user.id]: "interviews" }))
                                                                            }
                                                                            className={`px-4 py-2 rounded-xl font-medium transition-all ${activeSection[user.id] === "interviews"
                                                                                ? "bg-purple-500 text-white"
                                                                                : "bg-white/60 text-gray-700 hover:bg-white"
                                                                                }`}
                                                                        >
                                                                            Interview Sessions
                                                                        </button>
                                                                    </div>

                                                                    {activeSection[user.id] === "learning" && (
                                                                        <div className="mb-8">
                                                                            {/* LEARNING PROGRESS SECTION */}
                                                                            <div className="mb-8">
                                                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                                                    <BookOpen className="w-5 h-5 text-orange-600" />
                                                                                    Learning Progress
                                                                                </h3>

                                                                                {loadingDetails[user.id] ? (
                                                                                    <div className="text-center py-8 text-gray-500">Loading courses...</div>
                                                                                ) : userDetails[user.id]?.courses && userDetails[user.id].courses.length > 0 ? (
                                                                                    <div className="space-y-4">
                                                                                        {userDetails[user.id].courses.map((course, idx) => {
                                                                                            const progress = getProgressPercentage(course.watchedSeconds, course.totalSeconds);

                                                                                            return (
                                                                                                <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                                                                                                    <div className="flex justify-between items-start mb-3">
                                                                                                        <div className="flex-1">
                                                                                                            <h4 className="font-semibold text-gray-800 mb-1">{course.courseTitle}</h4>
                                                                                                            <p className="text-sm text-gray-600">{course.channelName}</p>
                                                                                                        </div>
                                                                                                        <div className="text-right">
                                                                                                            <div className="text-sm font-medium text-gray-700">
                                                                                                                {formatTime(course.watchedSeconds)} / {formatTime(course.totalSeconds)}
                                                                                                            </div>
                                                                                                            <div className={`text-xs font-semibold mt-1 ${course.completed ? 'text-green-600' : 'text-orange-600'
                                                                                                                }`}>
                                                                                                                {progress}% Complete
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Progress Bar */}
                                                                                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                                                                                        <div
                                                                                                            className={`h-2 rounded-full transition-all ${course.completed ? 'bg-green-500' : 'bg-orange-500'
                                                                                                                }`}
                                                                                                            style={{ width: `${progress}%` }}
                                                                                                        ></div>
                                                                                                    </div>

                                                                                                    {/* Videos */}
                                                                                                    {course.videos && course.videos.length > 0 && (
                                                                                                        <div className="mt-3">
                                                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                                                <Video className="w-4 h-4 text-gray-600" />
                                                                                                                <span className="text-sm font-medium text-gray-700">
                                                                                                                    Videos ({course.videos.length})
                                                                                                                </span>
                                                                                                            </div>
                                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                                                                {course.videos.map((video, vIdx) => {
                                                                                                                    const videoProgress = getProgressPercentage(video.watchedSeconds, video.durationSeconds);

                                                                                                                    return (
                                                                                                                        <div
                                                                                                                            key={vIdx}
                                                                                                                            className="bg-white/50 rounded-lg p-2 text-xs border border-gray-200"
                                                                                                                        >
                                                                                                                            <div className="flex justify-between items-center mb-1">
                                                                                                                                <span className="font-medium text-gray-700 truncate">
                                                                                                                                    Video {vIdx + 1}
                                                                                                                                </span>
                                                                                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${video.completed
                                                                                                                                    ? 'bg-green-100 text-green-700'
                                                                                                                                    : 'bg-orange-100 text-orange-700'
                                                                                                                                    }`}>
                                                                                                                                    {videoProgress}%
                                                                                                                                </span>
                                                                                                                            </div>
                                                                                                                            <div className="text-gray-600">
                                                                                                                                {formatTime(video.watchedSeconds)} / {formatTime(video.durationSeconds)}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    );
                                                                                                                })}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-center py-8 text-gray-500">
                                                                                        No courses started yet
                                                                                    </div>
                                                                                )}

                                                                                {/* Saved Videos */}
                                                                                {userDetails[user.id]?.savedVideos && userDetails[user.id].savedVideos.length > 0 && (
                                                                                    <div className="mt-6">
                                                                                        <h4 className="text-md font-semibold text-gray-800 mb-3">
                                                                                            Watch Later ({userDetails[user.id].savedVideos.length})
                                                                                        </h4>
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                                            {userDetails[user.id].savedVideos.map((saved, idx) => (
                                                                                                <div key={idx} className="bg-white/70 rounded-lg p-3 border border-white/50 text-sm">
                                                                                                    <div className="font-medium text-gray-800 truncate">{saved.title}</div>
                                                                                                    <div className="text-xs text-gray-600 mt-1">{saved.channelName}</div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {activeSection[user.id] === "interviews" && (
                                                                        <div>
                                                                            {/* INTERVIEW SESSIONS SECTION */}
                                                                            <div>
                                                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                                                    <Mic className="w-5 h-5 text-purple-600" />
                                                                                    Interview Sessions
                                                                                    <span className="ml-2 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-semibold">
                                                                                        {interviews[user.id]?.length || 0}
                                                                                    </span>
                                                                                </h3>

                                                                                {loadingInterviews[user.id] ? (
                                                                                    <div className="text-center py-8 text-gray-500">Loading interviews...</div>
                                                                                ) : interviews[user.id] && interviews[user.id].length > 0 ? (
                                                                                    <div className="space-y-4">
                                                                                        {interviews[user.id].map((session, idx) => (
                                                                                            <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                                                                                                <div className="flex justify-between items-start mb-3">
                                                                                                    <div className="flex-1">
                                                                                                        <h4 className="font-semibold text-gray-800 mb-1">
                                                                                                            {session.role} ({session.companyType})
                                                                                                        </h4>
                                                                                                        <p className="text-xs text-gray-500">
                                                                                                            {new Date(session.startedAt).toLocaleString()}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                                                                        {session.status}
                                                                                                    </span>
                                                                                                </div>

                                                                                                {/* Interview Stats */}
                                                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                                                                                    <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
                                                                                                        <Brain className="w-4 h-4 text-purple-600" />
                                                                                                        <span className="text-gray-700">{session.messages?.length || 0} messages</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
                                                                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                                                                        <span className="text-gray-700">{session.solvedProblems?.length || 0} problems</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
                                                                                                        <Video className="w-4 h-4 text-orange-600" />
                                                                                                        <span className="text-gray-700">{session.highlightClips?.length || 0} clips</span>
                                                                                                    </div>
                                                                                                    {/* {session.reportUrl && (
                                                                                                        <a
                                                                                                            href={session.reportUrl}
                                                                                                            target="_blank"
                                                                                                            rel="noopener noreferrer"
                                                                                                            className="flex items-center gap-2 bg-orange-100 text-orange-600 rounded-lg p-2 hover:bg-orange-200 transition-all"
                                                                                                        >
                                                                                                            <FileText className="w-4 h-4" />
                                                                                                            <span className="font-medium">View Report</span>
                                                                                                        </a>
                                                                                                    )} */}
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-center py-8 text-gray-500">
                                                                                        No interview sessions yet
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center p-12">
                                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Search className="w-8 h-8 text-orange-400" />
                                                </div>
                                                <p className="text-gray-500 text-lg">No users found</p>
                                                <p className="text-gray-400 text-sm mt-2">
                                                    {(searchTerm || selectedFeature) ? 'Try adjusting your filters' : 'Add your first user to get started'}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setIsModalOpen(false)}
                    ></div>
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
                            <div className="flex justify-between items-center border-b border-gray-200 p-6">
                                <h3 className="text-2xl font-bold text-gray-900">Add New User</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newUserData.name}
                                        onChange={handleNewUserDataChange}
                                        className="w-full p-3 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        placeholder="Enter user name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={newUserData.email}
                                        onChange={handleNewUserDataChange}
                                        className="w-full p-3 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        placeholder="user@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Feature Access</label>
                                    <input
                                        type="text"
                                        name="featureAccess"
                                        value={newUserData.featureAccess}
                                        onChange={handleNewUserDataChange}
                                        className="w-full p-3 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        placeholder="e.g., Learn & Perform"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-3 bg-gray-50/80 p-6 border-t border-gray-200 rounded-b-2xl">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 bg-white/60 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white/80 transition-all border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNewUser}
                                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
                                >
                                    Save User
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}