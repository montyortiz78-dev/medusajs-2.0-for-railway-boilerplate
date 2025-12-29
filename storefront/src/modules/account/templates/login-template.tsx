"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import ForgotPassword from "@modules/account/components/forgot-password" // Import the new component

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
  FORGOT_PASSWORD = "forgot-password", // Add this
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full flex justify-start px-8 py-8">
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} />
      ) : currentView === "register" ? (
        <Register setCurrentView={setCurrentView} />
      ) : (
        <ForgotPassword setCurrentView={setCurrentView} /> // Render the new component
      )}
    </div>
  )
}

export default LoginTemplate