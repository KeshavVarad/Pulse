import React from 'react'
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const WithPublicRoute = ({ children }) => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return children;
    }

    return <Navigate to="/dashboard" />;
};

export default WithPublicRoute;