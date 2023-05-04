
// FirebaseUI config.
var uiConfig = {
    signInSuccessUrl: './create_event.html',
    signInFlow: "popup",
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,

        //These are other available options that we aren't currently using
        //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        //firebase.auth.GithubAuthProvider.PROVIDER_ID,
        //firebase.auth.EmailAuthProvider.PROVIDER_ID,
        //firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        //firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
    ]
};

const firebaseConfig = {
    apiKey: "AIzaSyAr7SQASmasb7pk7E3OHhuewJoY76CcJ30",
    authDomain: "mregan-capstone.firebaseapp.com",
    databaseURL: "https://mregan-capstone-default-rtdb.firebaseio.com",
    projectId: "mregan-capstone",
    storageBucket: "mregan-capstone.appspot.com",
    messagingSenderId: "736102415357",
    appId: "1:736102415357:web:06211517f034486cc37794"
};