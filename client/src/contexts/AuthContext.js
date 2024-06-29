import { createContext, useContext, useState, useEffect } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
} from "firebase/auth";

import auth from "../config/firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    function register(email, password, username, real_name) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then(async function (data) {
                const user = data.user;
                const token = user && (await user.getIdToken());

                const newUserData = {
                    id: user.uid,
                    username: username,
                    real_name: real_name,
                    email: email,
                    createdPracticals: [],
                    inPracticals: []
                }

                const createNewUserOptions = {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newUserData)

                };

                await fetch(`/api/newUser`, createNewUserOptions);

                //Here if you want you can sign in the user
            }).catch(function (error) {
                //Handle error
            });;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function updateUserProfile(user, profile) {
        return updateProfile(user, profile);
    }

    function logout() {
        return signOut(auth);
    }


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        register,
        error,
        setError,
        updateUserProfile,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}