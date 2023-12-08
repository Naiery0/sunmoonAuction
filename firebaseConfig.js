// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import firebase from 'firebase';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_eQjLKtsNouLJ3fvCeOPvgngNb5uT3DE",
  authDomain: "joongochat-8ad73.firebaseapp.com",
  projectId: "joongochat-8ad73",
  storageBucket: "joongochat-8ad73.appspot.com",
  messagingSenderId: "305957132152",
  appId: "1:305957132152:web:2dde2a17f0c394b168da8d"
};

/*
내꺼
const firebaseConfig = {
  apiKey: "AIzaSyBcs6AkwQaoGQMzmNW4Jrl09Ui3MRyJTjA",
  authDomain: "joonggofarm.firebaseapp.com",
  projectId: "joonggofarm",
  storageBucket: "joonggofarm.appspot.com",
  messagingSenderId: "880583654607",
  appId: "1:880583654607:web:28bb94235b588a15d8cbba",
  measurementId: "G-J3WBG3ZB4P"
};

재오꺼
const firebaseConfig = {
  apiKey: "AIzaSyBaiUW426LNiWhOVqMXZJ1SEmmPLFicvwY",
  authDomain: "community-33d06.firebaseapp.com",
  projectId: "community-33d06",
  storageBucket: "community-33d06.appspot.com",
  messagingSenderId: "1000142667061",
  appId: "1:1000142667061:web:aa2e315b9cb12f05dea07c",
  measurementId: "G-YEWSDX5G5Q"
};

준태꺼
const firebaseConfig = {
  apiKey: "AIzaSyD_eQjLKtsNouLJ3fvCeOPvgngNb5uT3DE",
  authDomain: "joongochat-8ad73.firebaseapp.com",
  projectId: "joongochat-8ad73",
  storageBucket: "joongochat-8ad73.appspot.com",
  messagingSenderId: "305957132152",
  appId: "1:305957132152:web:2dde2a17f0c394b168da8d"
};
*/

let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
}
// Initialize Firebase
//const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

export { firebase , db};