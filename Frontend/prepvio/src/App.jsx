import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./HomePages/Home.jsx";
import Layout from "./components/Layout.jsx";
import Footer from "./HomePages/Footer.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import DashboardPage from "./Dashboard/DashBoardPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

import LearnAndPerform from "./ServiceDetails/Learn and perfrom/LearnAndPerfrom.jsx";
import Channels from "./ServiceDetails/Learn and perfrom/Channels.jsx";
import ScrollToTop from "./ScrollToTop.jsx";
import VideoPlayer from "./ServiceDetails/Learn and perfrom/VideoPlayer.jsx";

// Check Your Ability pages
import SelectRolesAndCompany from "./ServiceDetails/Check_Your_Ability/pages/selecting_roles_and_typeofcompany/SelectRolesAndCompany.jsx";
import Rounds from "./ServiceDetails/Check_Your_Ability/pages/selecting_roles_and_typeofcompany/Rounds.jsx";
import InterviewScreen from "./ServiceDetails/Check_Your_Ability/pages/Interview_page/InterviewScreen.jsx";
import AfterInterview from "./ServiceDetails/Check_Your_Ability/pages/Interview_page/AfterInterview.jsx";

import FAQs from "./Dashboard/FAQs.jsx";
import Interview from "./Dashboard/Interview.jsx";
import Learning from "./Dashboard/Learning.jsx";
import Message from "./Dashboard/Message.jsx";
import Notifications from "./Dashboard/Notfication.jsx";
import Payment from "./Dashboard/Payment.jsx";
import SavedCourses from "./Dashboard/SavedCourse.jsx";
import Account from "./Dashboard/setting.jsx";
import InterviewPreview from "./Dashboard/InterviewPreview.jsx";

import LoadingSpinner from "./components/LoadingSpinner.jsx";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authstore.js";
import { useEffect } from "react";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	if (!user.isVerified) {
		return <Navigate to='/verify-email' replace />;
	}

	return children;
};

// redirect authenticated users to the home page
const RedirectAuthenticatedUser = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (isAuthenticated && user.isVerified) {
		return <Navigate to='/' replace />;
	}

	return children;
};

function App() {
	const { isCheckingAuth, checkAuth } = useAuthStore();

	// 🔥 Check Your Ability shared state
	const [companyType, setCompanyType] = useState(null);
	const [role, setRole] = useState(null);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	if (isCheckingAuth) return <LoadingSpinner />;

	return (
		<>
			<ScrollToTop />

			<Routes>
				{/* Home */}
				<Route path='/' element={<Home />} />

				{/* ✅ FIXED: Interview Preview - Move OUTSIDE protected routes */}
				<Route path='/interview-preview' element={<InterviewPreview />} />

				{/* Dashboard (Protected) */}
				<Route
					path='/dashboard'
					element={
						<ProtectedRoute>
							<Layout />
						</ProtectedRoute>
					}
				>
					<Route index element={<DashboardPage />} />
					<Route path="setting" element={<Account />} />
					<Route path="notifications" element={<Notifications />} />
					<Route path="learning" element={<Learning />} />
					<Route path="saved-courses" element={<SavedCourses />} />
					<Route path="interview-analysis" element={<Interview />} />
					<Route path="payroll" element={<Payment />} />
					<Route path="messages/inbox" element={<Message />} />
					<Route path="help/faq" element={<FAQs />} />
				</Route>

				{/* Auth */}
				<Route
					path='/signup'
					element={
						<RedirectAuthenticatedUser>
							<SignUpPage />
						</RedirectAuthenticatedUser>
					}
				/>
				<Route
					path='/login'
					element={
						<RedirectAuthenticatedUser>
							<LoginPage />
						</RedirectAuthenticatedUser>
					}
				/>
				<Route path='/verify-email' element={<EmailVerificationPage />} />
				<Route path='/forgot-password' element={<ForgotPasswordPage />} />
				<Route path='/reset-password/:token' element={<ResetPasswordPage />} />

				{/* Services */}
				<Route path="/services/learn--perform" element={<LearnAndPerform />} />
				<Route path="/services/:serviceSlug/:courseId" element={<Channels />} />
				<Route path="/:channelName/:channelId/:courseId" element={<VideoPlayer />} />

				{/* ========================= */}
				{/* 🔥 CHECK YOUR ABILITY FLOW */}
				{/* ========================= */}
				<Route path="/services/check-your-ability">
					<Route
						index
						element={
							<SelectRolesAndCompany
								companyType={companyType}
								setCompanyType={setCompanyType}
								role={role}
								setRole={setRole}
							/>
						}
					/>
					<Route
						path="rounds"
						element={<Rounds companyType={companyType} role={role} />}
					/>
					<Route
						path="interview"
						element={<InterviewScreen companyType={companyType} role={role} />}
					/>
					<Route path="after-interview" element={<AfterInterview />} />
				</Route>

				{/* Catch-all */}
				<Route path='*' element={<Navigate to='/' replace />} />
			</Routes>

			<Footer />
			<Toaster />
		</>
	);
}

export default App;