// High-Aesthetic Mobile Messaging Service (SMS & WhatsApp Link Generator)

export const generateMobileMessagingLinks = (phone, otpCode) => {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  const textMsg = `🚩 [हॉटेल आराध्या डायनिंग] तुमचा ४-अंकी OTP पिन: ${otpCode} आहे. (Hotel Aaradhya Verification OTP: ${otpCode})`;
  
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMsg)}`;
  const smsUrl = `sms:${formattedPhone}?body=${encodeURIComponent(textMsg)}`;

  return {
    whatsappUrl,
    smsUrl,
    otpCode
  };
};
