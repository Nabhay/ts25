import React, { useState } from "react";
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [mode, setMode] = useState("signup");
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    avatar: "",
    bgFrom: "#ff7e5f",
    bgTo: "#feb47b",
  });

  const navigate = useNavigate();

  const stepsSignup = [
    "Basic Info",
    "Password",
    "Profile Picture",
    "Gradient Colors",
    "Confirm",
  ];

  const stepsSignin = ["Username", "Password"];

  const handleNext = async () => {
  if (mode === "signup" && activeStep === stepsSignup.length - 1) {
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Signup success:", data);
        localStorage.setItem("currentUser", JSON.stringify({ username: form.username }));
        navigate("/home");
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Something went wrong");
    }
  } else if (mode === "signin" && activeStep === stepsSignin.length - 1) {
    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Signin success:", data);
        localStorage.setItem("currentUser", JSON.stringify({ username: form.username }));
        navigate("/home");
      } else {
        alert(data.error || "Signin failed");
      }
    } catch (err) {
      console.error("Signin error:", err);
      alert("Something went wrong");
    }
  } else {
    setActiveStep((prev) => prev + 1);
  }
};


  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const renderSignupStep = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Full Name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              type="password"
              label="Password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
            <TextField
              type="password"
              label="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Upload Your Profile Picture
            </Typography>

            {form.avatar ? (
              <img
                src={form.avatar}
                alt="Profile Preview"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: "10px",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  color: "gray",
                }}
              >
                No Image
              </Box>
            )}

            <Button variant="contained" component="label">
              Upload
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleChange("avatar", reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </Button>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              type="color"
              label="Gradient From"
              value={form.bgFrom}
              onChange={(e) => handleChange("bgFrom", e.target.value)}
            />
            <TextField
              type="color"
              label="Gradient To"
              value={form.bgTo}
              onChange={(e) => handleChange("bgTo", e.target.value)}
            />
          </Box>
        );
      case 4:
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Confirm Your Profile
            </Typography>
            <div
              style={{
                background: `linear-gradient(to bottom right, ${form.bgFrom}, ${form.bgTo})`,
                padding: "20px",
                borderRadius: "12px",
                textAlign: "center",
                width: "200px",
                color: "white",
                fontFamily: "sans-serif",
                margin: "0 auto",
              }}
            >
              {form.avatar && (
                <img
                  src={form.avatar}
                  alt={form.name}
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "10px",
                  }}
                />
              )}
              <h2 style={{ margin: "5px 0" }}>{form.name}</h2>
              <p style={{ margin: "5px 0", fontSize: "0.9em", opacity: 0.8 }}>
                @{form.username}
              </p>
            </div>
          </Box>
        );
      default:
        return null;
    }
  };

  const renderSigninStep = (step) => {
    switch (step) {
      case 0:
        return (
          <TextField
            label="Username"
            value={form.username}
            onChange={(e) => handleChange("username", e.target.value)}
          />
        );
      case 1:
        return (
          <TextField
            type="password"
            label="Password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          zIndex: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          px: 3,
          background: "#0f0f0f",
          borderBottom: "1px solid #333",
        }}
      >
        <img src="/logo.svg" alt="Hexion logo" style={{ width: 28, height: 28 }} />
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: 0.5 }}>Hexion</Typography>
      </Box>
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 10, p: 3, border: "1px solid #ccc", borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3, gap: 2 }}>
        <Button
          variant={mode === "signup" ? "contained" : "outlined"}
          onClick={() => { setMode("signup"); setActiveStep(0); }}
        >
          Sign Up
        </Button>
        <Button
          variant={mode === "signin" ? "contained" : "outlined"}
          onClick={() => { setMode("signin"); setActiveStep(0); }}
        >
          Sign In
        </Button>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel>
        {(mode === "signup" ? stepsSignup : stepsSignin).map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>
        {mode === "signup"
          ? renderSignupStep(activeStep)
          : renderSigninStep(activeStep)}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          {mode === "signup"
            ? activeStep === stepsSignup.length - 1
              ? "Finish"
              : "Next"
            : activeStep === stepsSignin.length - 1
              ? "Login"
              : "Next"}
        </Button>
      </Box>
      </Box>
    </>
  );
}
