export const environment = {
  production: true,
  apiBaseUrl: 'https://v11-laa0.onrender.com',
  apiUrl: 'https://v11-laa0.onrender.com/api',
  firebase: {
    apiKey: (window as any)?.__ENV?.FIREBASE_API_KEY || 'AIzaSyLoveE9901WebAppKeyForPhoneAuthAuth01',
    authDomain: 'love-e9901.firebaseapp.com',
    projectId: 'love-e9901',
    storageBucket: 'love-e9901.appspot.com',
    messagingSenderId: '100124477487623046165',
    appId: '1:100124477487623046165:web:love-e9901'
  }
};

