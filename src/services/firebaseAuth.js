// Firebase Phone Authentication Service (Stubbed for Standalone POS Operation)

export const sendFirebasePhoneOtp = async (phoneNumber, recaptchaContainerId) => {
  console.log(`[Firebase OTP] Mock OTP dispatch to ${phoneNumber}`);
  return {
    success: true,
    verificationId: `verif-${Date.now()}`
  };
};

export const verifyFirebaseOtp = async (verificationId, otpCode) => {
  console.log(`[Firebase OTP] Verifying OTP ${otpCode}`);
  return {
    success: true,
    user: { phoneNumber: verificationId }
  };
};
