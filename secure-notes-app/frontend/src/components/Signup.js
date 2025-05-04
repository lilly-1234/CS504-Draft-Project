import { useState } from "react";
import {
  Box, Container, Card, CardContent, Typography, FormControl,
  TextField, FormHelperText, CardActions, Button, Stack, Snackbar
} from '@mui/material';
import { useNavigate, Link } from "react-router-dom";
import AppLogo from "../Logo/AppLogo.png";
import "./Signup.css";

export default function Signup() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [errors, setErrors] = useState({ userName: false, password: false, confirmPassword: false });

  const navigate = useNavigate();

  // 🔐 Signup & Request QR Code
  const handleSignupClick = async () => {
    const hasError = !userName || !password || password !== confirmPassword;
    setErrors({
      userName: !userName,
      password: !password,
      confirmPassword: !confirmPassword || password !== confirmPassword
    });

    if (hasError) {
      setSnackbar({ open: true, message: "Please fill in all fields correctly." });
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, password })
      });
      const data = await res.json();

      if (res.ok && data.qrCode) {
        setQrCode(data.qrCode);
        setSnackbar({ open: true, message: "Scan the QR code with Google Authenticator." });
      } else {
        setSnackbar({ open: true, message: data.message || "Signup failed." });
      }
    } catch {
      setSnackbar({ open: true, message: "Server error during signup." });
    }
  };

  // ✅ Verify MFA Token
  const handleVerifyCode = async () => {
    if (!token) {
      setSnackbar({ open: true, message: "Enter the code from Google Authenticator." });
      return;
    }

    try {
      const res = await fetch('/api/verify-mfa-setup', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, token })
      });
      const result = await res.json();

      if (result.verified) {
        setSnackbar({ open: true, message: "MFA Verified. Redirecting to login..." });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setSnackbar({ open: true, message: "Invalid code. Please try again." });
      }
    } catch {
      setSnackbar({ open: true, message: "Verification failed." });
    }
  };

  return (
    <Box className="login-container">
      <Container maxWidth="xs">
        <Card className="login-card">
          <CardContent>
            <Stack spacing={2} alignItems="center">
              <Box className="logo-container">
                <img src={AppLogo} alt="App Logo" className="logo-image" />
              </Box>

              <Typography variant="h6">Sign Up with MFA</Typography>

              {!qrCode ? (
                <>
                  <FormControl fullWidth error={errors.userName}>
                    <TextField
                      label="Username"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                    />
                    {errors.userName && <FormHelperText>Username is required.</FormHelperText>}
                  </FormControl>

                  <FormControl fullWidth error={errors.password}>
                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    {errors.password && <FormHelperText>Password is required.</FormHelperText>}
                  </FormControl>

                  <FormControl fullWidth error={errors.confirmPassword}>
                    <TextField
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    {errors.confirmPassword && <FormHelperText>Passwords must match.</FormHelperText>}
                  </FormControl>
                </>
              ) : (
                <>
                  <Typography>Scan this QR code using Google Authenticator:</Typography>
                  <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
                  <TextField
                    label="Enter 6-digit code"
                    fullWidth
                    value={token}
                    onChange={e => setToken(e.target.value)}
                  />
                </>
              )}
            </Stack>
          </CardContent>

          <CardActions className="card-actions">
            {!qrCode ? (
              <Button variant="contained" fullWidth onClick={handleSignupClick}>Sign Up</Button>
            ) : (
              <Button variant="contained" color="secondary" fullWidth onClick={handleVerifyCode}>
                Verify Code
              </Button>
            )}
          </CardActions>

          <Box textAlign="center" width="100%" mt={1} mb={2}>
            <Typography variant="body2">
              Already have an account? <Link to="/login">Login here</Link>
            </Typography>
          </Box>
        </Card>
      </Container>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
