# QR Scanner Testing Guide

## Overview
The QR Scanner has been successfully implemented with the following features:

### ✅ **Implemented Features**
1. **Real Camera QR Code Scanning** - Uses device camera to scan QR codes
2. **OTP Validation** - Validates 6-digit OTP codes from QR codes
3. **Location Verification** - Requires location permission for attendance marking
4. **Manual OTP Entry** - Fallback option to manually enter OTP codes
5. **Camera Controls** - Flip between front/back camera
6. **Test Functions** - Generate test QR codes and demo OTPs

### 🎯 **How to Test**

#### **Method 1: Using Test Functions**
1. Open the QR Scanner screen
2. Tap "Generate Test QR" button
3. This will generate a random 6-digit OTP
4. Tap "Use This OTP" to test attendance marking
5. Or tap "Test with Demo OTP" for a fixed test (123456)

#### **Method 2: Manual OTP Entry**
1. Tap "📝 Manual Entry" button
2. Enter any 6-digit OTP code
3. The app will attempt to mark attendance

#### **Method 3: Real QR Code Scanning**
1. Ensure camera permission is granted
2. Point camera at a QR code containing an OTP
3. QR code format should be: `OTP:123456` or just `123456`
4. The scanner will automatically detect and process the code

### 🔧 **Technical Details**

#### **QR Code Format**
- Expected format: `OTP:123456` or just `123456`
- Must be exactly 6 digits
- Case insensitive

#### **Permissions Required**
- **Camera**: For QR code scanning
- **Location**: For classroom verification

#### **API Integration**
- Sends POST request to `/attendance/mark`
- Includes OTP, latitude, longitude, user agent, and screen resolution
- Handles success/error responses with appropriate alerts

### 🚀 **Testing Steps**

1. **Start Backend Server**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Mobile App**
   ```bash
   cd attendiq-mobile
   npm start
   ```

3. **Test QR Scanner**
   - Navigate to QR Scanner screen
   - Grant camera and location permissions
   - Use test functions to verify functionality

### 📱 **UI Features**
- **Camera View**: Full-screen camera with scanning overlay
- **Scanner Frame**: Visual guide for QR code positioning
- **Status Indicators**: Shows location and camera status
- **Control Buttons**: Flip camera, manual entry, test functions
- **Loading States**: Shows processing status during API calls

### ⚠️ **Important Notes**
- QR codes must contain valid 6-digit OTP codes
- Location permission is required for attendance marking
- Camera permission is required for QR scanning
- The app validates OTP format before sending to backend
- Error handling includes user-friendly messages

### 🎉 **Success Indicators**
- Camera view displays correctly
- QR codes are detected and parsed
- OTP validation works (6-digit format)
- API calls succeed with proper error handling
- Location verification functions properly
- Manual entry fallback works
- Test functions generate valid OTPs
