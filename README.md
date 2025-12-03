# AttendIQ Mobile App

A React Native mobile application for students to mark attendance using QR codes and location verification.

## Features

- **Student Authentication**: Secure login for students only
- **QR Code Scanning**: Scan QR codes displayed by teachers to mark attendance
- **Manual OTP Entry**: Alternative method to enter OTP codes manually
- **Location Verification**: Automatic location verification to ensure students are in the classroom
- **Dashboard**: View enrolled classes and attendance history
- **Real-time Updates**: Live attendance tracking and status updates

## Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe development
- **React Navigation**: Navigation between screens
- **Expo Location**: Location services for attendance verification
- **Expo Camera/BarCodeScanner**: QR code scanning functionality
- **AsyncStorage**: Local data persistence
- **Axios**: HTTP client for API communication

## Prerequisites

- Node.js (v20.19.4 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Backend API running on `http://localhost:3002`

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd attendiq-mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## Project Structure

```
src/
├── config/
│   └── api.ts              # API configuration and axios setup
├── contexts/
│   └── AuthContext.tsx     # Authentication context and state management
├── navigation/
│   └── AppNavigator.tsx    # Navigation configuration
├── screens/
│   ├── LoginScreen.tsx     # Student login screen
│   ├── DashboardScreen.tsx # Main dashboard with classes and attendance
│   ├── AttendanceScreen.tsx # Manual OTP entry screen
│   └── QRScannerScreen.tsx # QR code scanner screen
└── App.tsx                 # Main app component
```

## Key Features

### 1. Authentication
- Secure student login with email/password
- JWT token-based authentication
- Automatic token refresh and logout on expiration

### 2. Attendance Marking
- **QR Code Scanning**: Point camera at teacher's QR code
- **Manual OTP Entry**: Type OTP code manually
- **Location Verification**: Automatic GPS location check
- **Real-time Validation**: Immediate feedback on attendance status

### 3. Dashboard
- View enrolled classes
- Check attendance history
- Quick stats and overview
- Pull-to-refresh functionality

### 4. Security Features
- Location-based verification (50m radius)
- Device fingerprinting
- Session timeout (15 minutes)
- Secure token storage

## API Integration

The app connects to the backend API at `http://localhost:3002` with the following endpoints:

- `POST /auth/login` - Student authentication
- `GET /auth/profile` - Get user profile
- `GET /enrollments` - Get student's enrolled classes
- `GET /attendance` - Get attendance records
- `POST /attendance/mark` - Mark attendance with OTP and location

## Permissions Required

### iOS
- **Camera**: To scan QR codes
- **Location**: To verify classroom presence

### Android
- **CAMERA**: To scan QR codes
- **ACCESS_FINE_LOCATION**: To verify classroom presence
- **ACCESS_COARSE_LOCATION**: Fallback location access

## Development

### Running the App

1. **Start Expo development server**:
   ```bash
   npm start
   ```

2. **Run on specific platform**:
   ```bash
   npm run ios      # iOS Simulator
   npm run android  # Android Emulator
   npm run web      # Web browser
   ```

### Building for Production

1. **Build for iOS**:
   ```bash
   expo build:ios
   ```

2. **Build for Android**:
   ```bash
   expo build:android
   ```

### Environment Configuration

Update the API base URL in `src/config/api.ts`:
```typescript
const API_BASE_URL = 'http://your-backend-url:3002';
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **Permission denied**: Check device settings for camera/location permissions
3. **API connection failed**: Ensure backend is running on correct port
4. **QR code not scanning**: Ensure good lighting and stable camera positioning

### Debug Mode

Enable debug mode by adding `console.log` statements or using React Native Debugger.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**AttendIQ**  
Smart Attendance Management System - Mobile App


