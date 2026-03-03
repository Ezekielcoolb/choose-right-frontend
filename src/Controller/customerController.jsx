import { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerProfile } from "../redux/slices/customerAuthSlice";

export default function CustomerController() {
  const dispatch = useDispatch();
  const { token, customer, profileStatus } = useSelector((state) => state.customerAuth);

  useEffect(() => {
    if (token && !customer && profileStatus === "idle") {
      dispatch(fetchCustomerProfile());
    }
  }, [token, customer, profileStatus, dispatch]);

  if (!token) {
    return <Navigate to="/customer/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  );
}
