import QRCode from 'qrcode';

// Generate QR code as data URL
export const generateQRCode = async (url, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    const dataUrl = await QRCode.toDataURL(url, mergedOptions);
    return { dataUrl };
  } catch (error) {
    throw error;
  }
};

// Generate QR code as canvas
export const generateQRCodeCanvas = async (canvasRef, url, options = {}) => {
  try {
    if (!canvasRef.current) {
      throw new Error('Canvas reference is not available');
    }
    
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    await QRCode.toCanvas(canvasRef.current, url, mergedOptions);
    return { success: true };
  } catch (error) {
    throw error;
  }
};

// Download QR code as image
export const downloadQRCode = (dataUrl, fileName = 'qr-code.png') => {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true };
  } catch (error) {
    throw error;
  }
};