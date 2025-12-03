# AttendIQ Mobile App - Quick Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v20.19.4 or higher)
- Backend API running on `http://localhost:3002`
- Expo CLI: `npm install -g @expo/cli`

### 2. Installation
```bash
cd attendiq-mobile
npm install
```

### 3. Start Development Server
```bash
npm start
```

### 4. Run on Device/Simulator

#### Option A: Expo Go App (Recommended for Testing)
1. Install Expo Go on your phone from App Store/Google Play
2. Scan the QR code displayed in terminal
3. App will load on your device

#### Option B: Simulator/Emulator
```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web Browser
```

## 📱 Testing the App

### 1. Login as Student
- Use student credentials from your backend
- Email: `student@example.com`
- Password: `password123`

### 2. Test Attendance Marking
- **QR Scanner**: Point camera at teacher's QR code
- **Manual Entry**: Enter OTP code manually
- **Location**: Allow location permissions when prompted

### 3. Check Dashboard
- View enrolled classes
- Check attendance history
- Pull down to refresh data

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler errors**: 
   ```bash
   expo start -c  # Clear cache
   ```

2. **Permission denied**:
   - Check device settings for camera/location
   - Restart app after granting permissions

3. **API connection failed**:
   - Ensure backend is running on `localhost:3002`
   - Check network connectivity

4. **QR code not scanning**:
   - Ensure good lighting
   - Hold camera steady
   - Try manual OTP entry as alternative

### Development Tips

- Use `console.log()` for debugging
- Check Expo DevTools for detailed logs
- Test on both iOS and Android devices
- Verify location permissions work correctly

## 📋 Features to Test

- [ ] Student login/logout
- [ ] Dashboard data loading
- [ ] QR code scanning
- [ ] Manual OTP entry
- [ ] Location permission handling
- [ ] Attendance marking success/error
- [ ] Navigation between screens
- [ ] Pull-to-refresh functionality

## 🎯 Next Steps

1. Test all features thoroughly
2. Deploy to app stores if needed
3. Set up production API endpoints
4. Configure push notifications (optional)
5. Add analytics tracking (optional)

---

**Ready to test!** 🎉









