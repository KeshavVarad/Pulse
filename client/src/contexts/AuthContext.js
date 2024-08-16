import { createContext, useContext, useState, useEffect } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
} from "firebase/auth";

import { v4 as uuidv4 } from "uuid"

import auth from "../config/firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    function register(email, password, username, real_name, role_type, school_name, school_id, invite_id) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then(async function (data) {
                const user = data.user;
                const token = user && (await user.getIdToken());

                if (!school_id) {
                    const newSchoolData = {
                        id: uuidv4(),
                        school_name: school_name,
                        practicals: [],
                        students: [],
                        instructors: [],
                        admins: [],
                        invited_students: [],
                        invited_instructors: [],
                        invited_admins: [],
                    }

                    const createNewSchoolOptions = {
                        method: "POST",
                        mode: "cors",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(newSchoolData)
                    };

                    await fetch(`${process.env.REACT_APP_API_HOST}/api/newSchool`, createNewSchoolOptions);

                    school_id = newSchoolData.id
                }

                const getSchoolOptions = {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                };

                const getSchoolRes = await fetch(`${process.env.REACT_APP_API_HOST}/api/school/${school_id}`, getSchoolOptions);

                const schoolData = await getSchoolRes.json()


                const newUserData = {
                    id: user.uid,
                    username: username,
                    real_name: real_name,
                    email: email,
                    createdPracticals: [],
                    inPracticals: [],
                    teachPracticals: [],
                    navigation_tutorial: false,
                    dashboard_tutorial: false,
                    make_navigation_tutorial: false,
                    role: role_type,
                    school_name: schoolData.school_name,
                    school_id: school_id
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



                if (role_type === "admin") {
                    let new_admins = schoolData.admins

                    new_admins.push({
                        real_name: newUserData.real_name,
                        email: newUserData.email
                    })

                    const updateSchoolOptions = {
                        method: "PUT",
                        mode: "cors",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ admins: new_admins })
                    };

                    await fetch(`${process.env.REACT_APP_API_HOST}/api/updateSchool/${school_id}`, updateSchoolOptions);
                }

                if (role_type === "student") {
                    let new_students = schoolData.students

                    new_students.push({
                        real_name: newUserData.real_name,
                        email: newUserData.email
                    })

                    const updateSchoolOptions = {
                        method: "PUT",
                        mode: "cors",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ students: new_students })
                    };

                    await fetch(`${process.env.REACT_APP_API_HOST}/api/updateSchool/${school_id}`, updateSchoolOptions);
                }

                if (role_type === "instructor") {
                    let new_instructors = schoolData.instructors

                    new_instructors.push({
                        real_name: newUserData.real_name,
                        email: newUserData.email
                    })

                    const updateSchoolOptions = {
                        method: "PUT",
                        mode: "cors",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ instructors: new_instructors })
                    };

                    await fetch(`${process.env.REACT_APP_API_HOST}/api/updateSchool/${school_id}`, updateSchoolOptions);
                }

                if (invite_id) {
                    const updateInviteOptions = {
                        method: "PUT",
                        mode: "cors",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ status: "accepted" })
                    }

                    await fetch(`${process.env.REACT_APP_API_HOST}/api/updateInvite/${invite_id}`, updateInviteOptions);
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