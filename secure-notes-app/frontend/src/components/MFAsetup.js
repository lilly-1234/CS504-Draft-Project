// src/pages/MFAsetup.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

// Component for MFA set up
const MFAsetup = () => {
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username; // Get the username from route state

  // Fetch the QR code when the component mounts
  useEffect(() => {
    // If username is not provided, set an error
    if (!username) {
      setError("No username provided");
      return;
    }

    // Function to fetch QR code from backend
    const fetchQRCode = async () => {
      try {
        const res = await fetch(`/api/resend-qr/${username}`);
        const data = await res.json();
        // If successful, set the QR code image
        if (res.ok && data.qrCode) {
          setQrCode(data.qrCode);
        } else {
          setError(data.message || "Failed to load QR code");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch QR code");
      }
    };

    fetchQRCode();
  }, [username]);

  return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="h5">Scan your MFA QR Code</Typography>

      {error && <Typography color="error">{error}</Typography>}
      
       {/* Display QR code if available */}
      {qrCode && (
        <Box sx={{ mt: 3 }}>
          <img src={qrCode} alt="MFA QR Code" />
        </Box>
      )}
      
      {/* Go Back button to return to previous page */}
      <Button variant="contained" sx={{ mt: 4 }} onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </Box>
  );
};

export default MFAsetup;
