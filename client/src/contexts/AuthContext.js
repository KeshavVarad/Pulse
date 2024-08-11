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

    function register(email, password, username, name, isAdmin, roleType, adminPass, adminEmail) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then(async function (data) {
                const user = data.user;
                const token = user && (await user.getIdToken());

                if (!isAdmin) {
                    const newUserData = {
                        id: user.uid,
                        username: username,
                        real_name: name,
                        email: email,
                        createdPracticals: [],
                        inPracticals: [],
                        teachPracticals: [],
                        navigation_tutorial: false,
                        dashboard_tutorial: false,
                        make_navigation_tutorial: false,
                        role: roleType
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

                    await fetch(`${process.env.REACT_APP_API_HOST}/api/newUser`, createNewUserOptions);

                    signOut(auth);
                    signInWithEmailAndPassword(auth, adminEmail, adminPass)
                }
                else {
                    const newAdminData = {
                        id: user.uid,
                        username: username,
                        school_name: name,
                        email: email,
                        createdPracticals: [],
                        students: [],
                        instructors: []
                    }

                    const createNewAdminOptions = {
                        method: "POST",
                        mode: "cors",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(newAdminData)
                    };

                    await fetch(`${process.env.REACT_APP_API_HOST}/api/newAdmin`, createNewAdminOptions);

                }



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