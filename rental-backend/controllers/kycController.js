const supabase = require('../config/supabase');

const generateAadharOtp = async (req, res, next) => {
  try {
    const { aadharNumber } = req.body;
    if (!aadharNumber || aadharNumber.replace(/\s+/g, '').length !== 12) {
      return res.status(400).json({ message: 'Please provide a valid 12-digit Aadhaar number.' });
    }

    const cleanAadhar = aadharNumber.replace(/\s+/g, '');
    const token = process.env.SUREPASS_API_TOKEN;
    const isProd = process.env.SUREPASS_ENV === 'production';
    const baseUrl = isProd ? 'https://api.surepass.io' : 'https://sandbox.surepass.io';

    // If SUREPASS_API_TOKEN is not configured, fall back to simulated mode
    if (!token) {
      console.warn('SUREPASS_API_TOKEN is not configured. Falling back to simulated Aadhaar OTP.');
      const mockClientId = 'mock_client_' + Math.random().toString(36).substring(2, 11);
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      return res.json({
        success: true,
        isSimulated: true,
        client_id: mockClientId,
        simulatedOtp: mockOtp,
        message: 'Simulated Aadhaar OTP generated successfully.'
      });
    }

    const response = await fetch(`${baseUrl}/api/v1/aadhaar-v2/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id_number: cleanAadhar })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return res.status(response.status || 400).json({
        message: result.message || 'Failed to generate Aadhaar OTP from Surepass API.'
      });
    }

    res.json({
      success: true,
      client_id: result.data.client_id,
      message: result.message || 'OTP sent successfully to registered Aadhaar mobile.'
    });

  } catch (error) {
    next(error);
  }
};

const verifyAadharOtp = async (req, res, next) => {
  try {
    const { client_id, otp, isSimulated, simulatedOtp } = req.body;
    if (!client_id || !otp) {
      return res.status(400).json({ message: 'Client ID and OTP are required.' });
    }

    let aadharName = 'Verified User';
    let maskedAadhar = 'XXXX XXXX XXXX';

    if (isSimulated || !process.env.SUREPASS_API_TOKEN) {
      if (otp !== simulatedOtp) {
        return res.status(400).json({ message: 'Invalid OTP code. Please enter the correct simulated OTP.' });
      }
      maskedAadhar = 'XXXX XXXX 9999';
    } else {
      const token = process.env.SUREPASS_API_TOKEN;
      const isProd = process.env.SUREPASS_ENV === 'production';
      const baseUrl = isProd ? 'https://api.surepass.io' : 'https://sandbox.surepass.io';

      const response = await fetch(`${baseUrl}/api/v1/aadhaar-v2/submit-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ client_id, otp })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return res.status(response.status || 400).json({
          message: result.message || 'Aadhaar verification failed.'
        });
      }

      aadharName = result.data.full_name;
      maskedAadhar = `XXXX XXXX ${result.data.aadhaar_number.slice(-4)}`;
    }

    const updateData = {
      kyc_status: 'verified',
      kyc_verified: true,
      aadhar_number: maskedAadhar,
      name: aadharName
    };

    const { error: dbError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id);

    if (dbError) throw dbError;

    res.json({
      success: true,
      message: 'Aadhaar verified successfully!',
      user: updateData
    });

  } catch (error) {
    next(error);
  }
};

const generateEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = process.env.RESEND_API_KEY;

    if (!token) {
      console.warn('RESEND_API_KEY is not configured. Falling back to simulated Email OTP.');
      return res.json({
        success: true,
        isSimulated: true,
        emailOtp: code,
        message: 'Simulated email verification OTP sent!'
      });
    }

    const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: 'Verify your RentNear Email Address',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4F46E5; text-align: center;">Verify Your Email</h2>
            <p>Hello,</p>
            <p>Thank you for using RentNear. To complete your email verification, please enter the following 6-digit OTP code:</p>
            <div style="background-color: #F3F4F6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; color: #111;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #666; text-align: center;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status || 400).json({
        message: result.message || 'Failed to send email via Resend.'
      });
    }

    res.json({
      success: true,
      emailOtp: code,
      message: 'Verification code sent to your email.'
    });

  } catch (error) {
    next(error);
  }
};

const verifyEmailOtp = async (req, res, next) => {
  try {
    const { otp, generatedOtp } = req.body;
    if (!otp || !generatedOtp) {
      return res.status(400).json({ message: 'OTP and generated OTP are required.' });
    }

    if (otp !== generatedOtp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    const { error: dbError } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', req.user.id);

    if (dbError) throw dbError;

    res.json({
      success: true,
      message: 'Email address verified successfully!'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateAadharOtp,
  verifyAadharOtp,
  generateEmailOtp,
  verifyEmailOtp
};
