import { useState } from "react";
import {
  Box, Container, Card, CardContent, Typography, FormControl,
  TextField, FormHelperText, CardActions, Button, Stack, Snackbar
} from '@mui/material';
import { useNavigate } from "react-router-dom";
import AppLogo from "../Logo/AppLogo.png";
import "./Signup.css";

export default function Login({ setIsAuthenticated, setUserId }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({ userName: false, password: false, token: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const navigate = useNavigate();

  const handleLoginClick = async () => {
    setErrors({ userName: !userName, password: !password, token: false });

    if (!userName || !password) {
      setSnackbar({ open: true, message: "Please fill in all required fields." });
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, password }),
      });

      const data = await res.json();
      if (data.success) {
        setStep(2); // Move to MFA step
      } else {
        setSnackbar({ open: true, message: "Invalid username or password." });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Server error during login." });
    }
  };

  const handleVerifyToken = async () => {
    if (!token) {
      setErrors(prev => ({ ...prev, token: true }));
      setSnackbar({ open: true, message: "Enter your 6-digit code." });
      return;
    }

    try {
      const res = await fetch("/api/verify-mfa-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, token }),
      });

      const result = await res.json();
      if (result.verified && result.token) {
        // ✅ Store JWT token and user info
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", userName);

        setIsAuthenticated?.(true);
        setUserId?.(userName);
        navigate("/dashboard");
      } else {
        setSnackbar({ open: true, message: "Invalid MFA code." });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Error verifying MFA." });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box className="login-container">
      <Container maxWidth="xs">
        <Card className="login-card">
          <CardContent>
            <Stack direction="column" spacing={2} alignItems="center">
              <Box className="logo-container">
                <img src={AppLogo} alt="App Logo" className="logo-image" />
              </Box>
              <Typography variant="h6" gutterBottom>
                {step === 1 ? "Login" : "Enter MFA Code"}
              </Typography>

              {step === 1 ? (
                <>
                  <FormControl fullWidth error={errors.userName}>
                    <TextField label="Username" value={userName}
                      onChange={(e) => setUserName(e.target.value)} />
                    {errors.userName && <FormHelperText>Username is required.</FormHelperText>}
                  </FormControl>

                  <FormControl fullWidth error={errors.password}>
                    <TextField label="Password" type="password" value={password}
                      onChange={(e) => setPassword(e.target.value)} />
                    {errors.password && <FormHelperText>Password is required.</FormHelperText>}
                  </FormControl>
                </>
              ) : (
                <>
                  <FormControl fullWidth error={errors.token}>
                    <TextField label="6-digit code from Google Authenticator" value={token}
                      onChange={(e) => setToken(e.target.value)} />
                    {errors.token && <FormHelperText>Token is required.</FormHelperText>}
                  </FormControl>
                </>
              )}
            </Stack>
          </CardContent>

          <CardActions className="card-actions">
            {step === 1 ? (
              <Button variant="contained" color="primary" onClick={handleLoginClick}>
                Login
              </Button>
            ) : (
              <Button variant="contained" color="secondary" onClick={handleVerifyToken}>
                Verify MFA
              </Button>
            )}
          </CardActions>
        </Card>
      </Container>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
}
