import React, { useState, useContext } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./Signup.css";
import signupImg from "../../assets/img/signup.jpg";
import axios from "axios";
import { UserContext } from "../../context/UserContext";
import { useNotification } from "../../context/NotificationContext";
import { GoogleLogin } from '@react-oauth/google';
import { useWishlistCart } from "../../context/wishlistCartContext";
import FacebookLogin from '../FacebookLogin/FacebookLogin';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Signup({ onClose }) {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [errors, setErrors] = useState({});

  // Forgot Password States
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: email, 1: OTP, 2: new password
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [forgotPasswordErrors, setForgotPasswordErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login, logout } = useContext(UserContext);
  const { addToCart, addToWishlist } = useWishlistCart();
  const { showNotification } = useNotification();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Forgot Password Functions
  const handleForgotPasswordInputChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (forgotPasswordErrors[name]) {
      setForgotPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForgotPasswordEmail = () => {
    const newErrors = {};
    if (!forgotPasswordData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(forgotPasswordData.email)) {
      newErrors.email = "Email is invalid";
    }
    setForgotPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = () => {
    const newErrors = {};
    if (!forgotPasswordData.otp) {
      newErrors.otp = "OTP is required";
    } else if (forgotPasswordData.otp.length !== 6) {
      newErrors.otp = "OTP must be 6 digits";
    }
    setForgotPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewPassword = () => {
    const newErrors = {};
    if (!forgotPasswordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (forgotPasswordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    if (!forgotPasswordData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Please confirm your new password";
    } else if (forgotPasswordData.newPassword !== forgotPasswordData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }
    setForgotPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOTP = async () => {
    if (!validateForgotPasswordEmail()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/send-otp`, {
        email: forgotPasswordData.email
      });

      if (response.data.success) {
        showNotification("OTP sent to your email", "success");
        setForgotPasswordStep(2);
      } else {
        showNotification(response.data.message || "Failed to send OTP", "error");
      }
    } catch (error) {
      showNotification(error.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!validateOTP()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/verify-otp`, {
        email: forgotPasswordData.email,
        otp: forgotPasswordData.otp
      });

      if (response.data.success) {
        showNotification("OTP verified successfully", "success");
        setForgotPasswordStep(3);
      } else {
        showNotification(response.data.message || "Invalid OTP", "error");
      }
    } catch (error) {
      showNotification(error.response?.data?.message || "Invalid OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!validateNewPassword()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/reset-password`, {
        email: forgotPasswordData.email,
        otp: forgotPasswordData.otp,
        newPassword: forgotPasswordData.newPassword
      });

      if (response.data.success) {
        showNotification("Password reset successfully", "success");
        // Reset forgot password state and go back to login
        setForgotPasswordStep(0);
        setForgotPasswordData({
          email: "",
          otp: "",
          newPassword: "",
          confirmNewPassword: ""
        });
        setForgotPasswordErrors({});
        setActiveTab("login");
      } else {
        showNotification(response.data.message || "Failed to reset password", "error");
      }
    } catch (error) {
      showNotification(error.response?.data?.message || "Failed to reset password", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordStep(1); // Start with step 1 (email input)
    setForgotPasswordData({
      email: "",
      otp: "",
      newPassword: "",
      confirmNewPassword: ""
    });
    setForgotPasswordErrors({});
    // Switch to forgot password mode - this will show forgot password form instead of login
    setActiveTab("forgot-password");
  };

  const goBackToLogin = () => {
    setForgotPasswordStep(0);
    setForgotPasswordData({
      email: "",
      otp: "",
      newPassword: "",
      confirmNewPassword: ""
    });
    setForgotPasswordErrors({});
    setActiveTab("login"); // Go back to login tab
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (activeTab === "signup") {
      if (!formData.fullName) {
        newErrors.fullName = "Full name is required";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (activeTab === "signup") {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/users/register`, {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: "user",
        });
        const result = response.data;
        if (result.success) {
          showNotification("Registration successful!", "success");
          setActiveTab("login");
          // Optionally, auto-login and sync cart/wishlist here
        } else {
          showNotification(result.message || "Registration failed.", "error");
        }
      } catch (error) {
        showNotification(error.response?.data?.message || "Server error, please try again.", "error");
      }
    } else if (activeTab === "login") {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
          email: formData.email,
          password: formData.password,
        });
        const result = response.data;
        if (result.success) {
          login(result.data.user, result.data.token);
          await handlePostLoginSync(result.data.token);
          showNotification("Login successful!", "success");
          if (onClose) onClose();
          window.location.reload(); // Refresh the page after successful login
        } else {
          showNotification(result.message || "Login failed.", "error");
        }
      } catch (error) {
        const errorData = error.response?.data;
        if (errorData?.blocked || errorData?.inactive) {
          showNotification(errorData.message, "error");
          // Force logout if user is blocked or inactive
          logout();
        } else {
          showNotification(errorData?.message || "Server error, please try again.", "error");
        }
      }
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/google/login`, {
        credential: credentialResponse.credential,
      });

      const result = response.data;
      if (result.success) {
        login(result.data.user, result.data.token);
        await handlePostLoginSync(result.data.token);
        showNotification("Google login successful!", "success");
        if (onClose) onClose();
        window.location.reload(); // Refresh the page after successful Google login
      } else {
        showNotification(result.message || "Google login failed. Please try again.", "error");
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.blocked || errorData?.inactive) {
        showNotification(errorData.message, "error");
        // Force logout if user is blocked or inactive
        logout();
      } else {
        const errorMessage = errorData?.message || "Google login error";
        showNotification(errorMessage, "error");

        if (error.response?.status === 404) {
          showNotification("No account found. Please sign up first.", "info", 5000);
        }
      }
    }
  };

  // Handle Google Signup
  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/google/signup`, {
        credential: credentialResponse.credential,
      });

      const result = response.data;
      if (result.success) {
        showNotification("Google signup successful! Please login to continue.", "success");
        // Switch to login tab after successful signup
        setActiveTab("login");
        // Pre-fill the email in the login form
        setFormData(prev => ({
          ...prev,
          email: result.data?.user?.email || ""
        }));
      } else {
        showNotification(result.message || "Google signup failed. Please try again.", "error");
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.blocked || errorData?.inactive) {
        showNotification(errorData.message, "error");
        // Force logout if user is blocked or inactive
        logout();
      } else {
        const errorMessage = errorData?.message || "Google signup error";
        showNotification(errorMessage, "error");
      }
    }
  };

  const handleGoogleError = () => {
    showNotification("Google authentication failed. Please try again.", "error");
  };

  // Handle Facebook Login
  const handleFacebookLogin = async (facebookData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/facebook/login`, {
        email: facebookData.email,
        name: facebookData.name,
        picture: facebookData.picture,
        accessToken: facebookData.accessToken,
      });

      const result = response.data;
      if (result.success) {
        login(result.data.user, result.data.token);
        await handlePostLoginSync(result.data.token);
        showNotification("Facebook login successful!", "success");
        if (onClose) onClose();
        window.location.reload(); // Refresh the page after successful Facebook login
      } else {
        showNotification(result.message || "Facebook login failed. Please try again.", "error");
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.blocked || errorData?.inactive) {
        showNotification(errorData.message, "error");
        // Force logout if user is blocked or inactive
        logout();
      } else {
        const errorMessage = errorData?.message || "Facebook login error";
        showNotification(errorMessage, "error");

        if (error.response?.status === 404) {
          showNotification("No account found. Please sign up first.", "info", 5000);
        }
      }
    }
  };

  // Handle Facebook Signup
  const handleFacebookSignup = async (facebookData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/facebook/signup`, {
        email: facebookData.email,
        name: facebookData.name,
        picture: facebookData.picture,
        accessToken: facebookData.accessToken,
      });

      const result = response.data;
      if (result.success) {
        if (result.data.isNewUser) {
          // New user - auto login
          login(result.data.user, result.data.token);
          await handlePostLoginSync(result.data.token);
          showNotification("Facebook signup successful! Welcome to PVJ.", "success");
          if (onClose) onClose();
          window.location.reload();
        } else {
          // Existing user - just show success message
          showNotification("Facebook signup successful! Please login to continue.", "success");
          setActiveTab("login");
          setFormData(prev => ({
            ...prev,
            email: result.data.defaultEmail || ""
          }));
        }
      } else {
        showNotification(result.message || "Facebook signup failed. Please try again.", "error");
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.blocked || errorData?.inactive) {
        showNotification(errorData.message, "error");
        logout();
      } else {
        const errorMessage = errorData?.message || "Facebook signup error";
        showNotification(errorMessage, "error");
      }
    }
  };

  const handleFacebookError = (error) => {
    showNotification(error || "Facebook authentication failed. Please try again.", "error");
  };

  const handlePostLoginSync = async (token) => {
    try {
      const cartRes = await axios.get(`${API_BASE_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } });
      const wishlistRes = await axios.get(`${API_BASE_URL}/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
      // Replace cart/wishlist in context
      if (cartRes.data?.data) {
        cartRes.data.data.forEach(item => addToCart(item));
      }
      if (wishlistRes.data?.data) {
        wishlistRes.data.data.forEach(item => addToWishlist(item));
      }
    } catch (error) {
      // Optionally show notification
    }
  };

  return (
    <div className="signup-popup-outer">
      <div className="signup-container">
        {onClose && (
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
        <div className="signup-section">
          <div
            className="signup-background signup-bg-image"
          >
            <div className="signup-content">
              <div className="signup-text">
                <h1 className="signup-title">
                  ENTER YOUR WORLD OF<br />
                  <span className="signup-subtitle-highlight">
                    PRECIOUS JEWELLERY
                  </span>
                </h1>
                <p className="signup-description">
                  Discover timeless elegance and exquisite craftsmanship
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="form-section">
          <div className="form-wrapper">
            <div className="tabs tabs-space-between">
              <button
                className={`tab-button ${activeTab === "login" || activeTab === "forgot-password" ? "active" : ""}`}
                onClick={() => setActiveTab("login")}
              >
                {activeTab === "forgot-password" ? "Forgot Password" : "Login"}
              </button>
              <button
                className={`tab-button ${activeTab === "signup" ? "active" : ""}`}
                onClick={() => setActiveTab("signup")}
              >
                Sign Up
              </button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Show forgot password form when activeTab is forgot-password */}
              {activeTab === "forgot-password" && forgotPasswordStep > 0 && (
                <div className="forgot-password-form">
                  <div className="forgot-password-header">
                    <h3>
                      {forgotPasswordStep === 1 ? "Reset Password" :
                        forgotPasswordStep === 2 ? "Enter OTP" :
                          "Set New Password"}
                    </h3>
                    <button
                      type="button"
                      className="back-to-login-btn"
                      onClick={goBackToLogin}
                    >
                      ← Back to Login
                    </button>
                  </div>

                  {/* Step 1: Email Input */}
                  {forgotPasswordStep === 1 && (
                    <div className="forgot-password-step">
                      <div className="input-group">
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter your email address"
                          value={forgotPasswordData.email}
                          onChange={handleForgotPasswordInputChange}
                          className={`input-field ${forgotPasswordErrors.email ? "input-error" : ""}`}
                        />
                      </div>
                      {forgotPasswordErrors.email && (
                        <p className="error-message">{forgotPasswordErrors.email}</p>
                      )}
                      <div className="submit-container">
                        <button
                          type="button"
                          className="submit-button"
                          onClick={sendOTP}
                          disabled={isLoading}
                        >
                          {isLoading ? "Sending..." : "Send OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: OTP Input */}
                  {forgotPasswordStep === 2 && (
                    <div className="forgot-password-step">
                      <p className="otp-instruction">
                        We've sent a 6-digit OTP to <strong>{forgotPasswordData.email}</strong>
                      </p>
                      <div className="input-group">
                        <input
                          type="text"
                          name="otp"
                          placeholder="Enter 6-digit OTP"
                          value={forgotPasswordData.otp}
                          onChange={handleForgotPasswordInputChange}
                          className={`input-field ${forgotPasswordErrors.otp ? "input-error" : ""}`}
                          maxLength="6"
                        />
                      </div>
                      {forgotPasswordErrors.otp && (
                        <p className="error-message">{forgotPasswordErrors.otp}</p>
                      )}
                      <div className="submit-container">
                        <button
                          type="button"
                          className="submit-button"
                          onClick={verifyOTP}
                          disabled={isLoading}
                        >
                          {isLoading ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                      <div className="resend-otp-container">
                        <button
                          type="button"
                          className="resend-otp-btn"
                          onClick={sendOTP}
                          disabled={isLoading}
                        >
                          Resend OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: New Password Input */}
                  {forgotPasswordStep === 3 && (
                    <div className="forgot-password-step">
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="newPassword"
                          placeholder="Enter new password"
                          value={forgotPasswordData.newPassword}
                          onChange={handleForgotPasswordInputChange}
                          className={`input-field ${forgotPasswordErrors.newPassword ? "input-error" : ""}`}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {forgotPasswordErrors.newPassword && (
                        <p className="error-message">{forgotPasswordErrors.newPassword}</p>
                      )}

                      <div className="input-group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmNewPassword"
                          placeholder="Confirm new password"
                          value={forgotPasswordData.confirmNewPassword}
                          onChange={handleForgotPasswordInputChange}
                          className={`input-field ${forgotPasswordErrors.confirmNewPassword ? "input-error" : ""}`}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {forgotPasswordErrors.confirmNewPassword && (
                        <p className="error-message">{forgotPasswordErrors.confirmNewPassword}</p>
                      )}

                      <div className="submit-container">
                        <button
                          type="button"
                          className="submit-button"
                          onClick={resetPassword}
                          disabled={isLoading}
                        >
                          {isLoading ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Show regular login/signup form when not in forgot password mode */}
              {activeTab !== "forgot-password" && (
                <>
                  {activeTab === "signup" && (
                    <div className="signup-header-text-container">
                      <div className="signup-header-text">
                        SIGN UP TO START YOUR JEWELLERY JOURNEY! ✨💍
                      </div>
                    </div>
                  )}
                  {activeTab === "signup" && (
                    <div>
                      <div className="input-group">
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`input-field ${errors.fullName ? "input-error" : ""}`}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="error-message">{errors.fullName}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <div className="input-group">
                      <input
                        type="email"
                        name="email"
                        placeholder="Email ID"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`input-field ${errors.email ? "input-error" : ""}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="error-message">{errors.email}</p>
                    )}
                  </div>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`input-field with-toggle ${errors.password ? "input-error" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    {errors.password && (
                      <p className="error-message">{errors.password}</p>
                    )}
                  </div>
                  {activeTab === "signup" && (
                    <div>
                      <div className="input-group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`input-field with-toggle ${errors.confirmPassword ? "input-error" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="password-toggle"
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="error-message">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}
                  {activeTab === "signup" && (
                    <div className="signup-terms-container">
                      <input
                        type="checkbox"
                        id="terms"
                        name="terms"
                        required
                        className="signup-terms-checkbox"
                      />
                      <label htmlFor="terms" className="signup-terms-label">
                        I Agree To The Terms Of Use And Privacy Statement
                      </label>
                    </div>
                  )}
                  <div className="submit-container">
                    <button type="submit" className="submit-button">
                      {activeTab === "login" ? "Log In" : "Sign Up"}
                    </button>
                  </div>
                  {activeTab === "login" && (
                    <div className="forgot-password-container">
                      <button
                        type="button"
                        className="forgot-password-button"
                        onClick={handleForgotPasswordClick}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                  {activeTab === "login" && (
                    <>
                      <div className="divider">
                        <span> OR </span>
                      </div>
                      <div className="google-login-container">
                        <GoogleLogin
                          onSuccess={handleGoogleLogin}
                          onError={handleGoogleError}
                          text="continue_with"
                          shape="rectangular"
                          size="large"
                          theme="outline"
                          width="100%"
                          logo_alignment="left"
                          style={{ width: "100%" }}
                        />
                      </div>
                      {/* Facebook login button - commented for future use
                      <div className="facebook-login-container">
                        <FacebookLogin
                          onSuccess={handleFacebookLogin}
                          onError={handleFacebookError}
                          text="continue_with"
                        />
                      </div>
                      */}
                      <div className="new-user-container">
                        <span className="new-user-text">New User? </span>
                        <span className="spacer-element"></span>
                        <button type="button" onClick={() => setActiveTab('signup')} className="signup-now-button">
                          Signup Now
                        </button>
                      </div>
                    </>
                  )}
                  {activeTab === "signup" && (
                    <>
                      <div className="divider divider-custom-margin">
                        <span>OR</span>
                      </div>
                      <div className="google-login-container">
                        <GoogleLogin
                          onSuccess={handleGoogleSignup}
                          onError={handleGoogleError}
                          useOneTap
                          text="signup_with"
                          shape="rectangular"
                          size="large"
                          width="100%"
                          theme="outline"
                          logo_alignment="center"
                        />
                      </div>
                      {/* Facebook signup button - commented for future use
                      <div className="facebook-login-container">
                        <FacebookLogin
                          onSuccess={handleFacebookSignup}
                          onError={handleFacebookError}
                          text="signup_with"
                        />
                      </div>
                      */}
                      <div className="toggle-form toggle-form-custom-margin">
                        <span>
                          Already Have An Account ?{" "}
                          <button
                            type="button"
                            onClick={() => setActiveTab("login")}
                            className="toggle-link toggle-link-custom"
                          >
                            Login Now
                          </button>
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
