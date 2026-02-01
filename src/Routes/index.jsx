import { useRoutes } from "react-router-dom";
import { Suspense, lazy } from "react";
import TopLoader from "../Preload/TopLoader";
import CsoController from "../Controller/csoController";
import AdminController from "../Controller/adminController";
import BranchPage from "../Users/AdminPages/Branch/Branch";
import CsoPage from "../Users/AdminPages/csoPages/Cso";
import CsoDetailPage from "../Users/AdminPages/csoPages/CsoDetail";
import CsoLoginPage from "../Users/csoPages/csoLogin";
import CustomersPage from "../Users/csoPages/customers/Customers";
import CustomerDetailPage from "../Users/csoPages/customers/CustomerDetail";
import AdminCustomers from "../Users/AdminPages/Customers/Customers";
import AdminCustomerDetail from "../Users/AdminPages/Customers/AdminCustomerDetail";
import AdminCustomerPlans from "../Users/AdminPages/Customers/AdminCustomerPlans";
import AdminLoans from "../Users/AdminPages/Loans/AdminLoans";
import AdminNewLoans from "../Users/AdminPages/Loans/AdminNewLoans";
import WithdrawalRequest from "../Users/AdminPages/Withdrawal/WithdrawalRequest";
import ProductPage from "../Users/csoPages/Products/Product";
import CsoCollectionPage from "../Users/csoPages/csoCollection";
import CsoProfilePage from "../Users/csoPages/csoProfile";
import CsoSettingsPage from "../Users/csoPages/csoSetting";
import AdminSavingsPage from "../Users/AdminPages/Savings";
import AllTransactionsDashboard from "../Users/AdminPages/Transactions/AllTransaction";
import AdminPanelPage from "../Users/AdminPages/AdminPanel";
import BusinessReportPage from "../Users/AdminPages/Report/BusinessReport";
import MonthlyReportPage from "../Users/AdminPages/Report/MonthlyReport";
import AdminDashboard from "../Users/AdminPages/AdminDashboard";



export default function Routess() {
    return (
        <Suspense fallback={<TopLoader />}>
            {useRoutes([
                {
                    path: "/",
                    // element: <GeneralLayout />,
                    children: [{ index: true, element: "Home"}],
                },
                

                {
                    path: "/admin",
                    element: <AdminController />,
                    children: [
                    //    { index: true, element: <div>Admin Dashboard</div> },
                       { path: "/admin/branch", element: <BranchPage /> },
                       { path: "/admin/cso", element: <CsoPage /> },
                       { path: "/admin", element: <AdminDashboard /> },
                       { path: "/admin/withdraw", element: <WithdrawalRequest /> },
                       { path: "/admin/cso", element: <CsoPage /> },
                       { path: "/admin/cso/:csoId", element: <CsoDetailPage /> },
                       { path: "/admin/panel", element: <AdminPanelPage /> },
                       { path: "/admin/report/business", element: <BusinessReportPage /> },
                       { path: "/admin/report/monthly", element: <MonthlyReportPage /> },
                       { path: "/admin/savings", element: <AdminSavingsPage /> },
                       { path: "/admin/disbursements", element: <AdminNewLoans /> },
                       { path: "/admin/loans", element: <AdminLoans /> }, // Mapping as per Sidebar "Savings" link if it was intended to be same, or maybe separate. Sidebar said "Savings" -> cso-loans. "Loans" -> loans. I'll map cso-loans to AdminLoans too for now or maybe cso-loans meant SavingsPlan list? I'll map it to AdminLoans as a safefall or maybe it's the "All Savings" page? The user request focused on Loans. I'll map it to AdminLoans for visibility.
                       { path: "/admin/transactions", element: <AllTransactionsDashboard /> },
                       { path: "/admin/customers", element: <AdminCustomers /> },
                       { path: "/admin/customers/:customerId", element: <AdminCustomerDetail /> },
                       { path: "/admin/customers/:customerId/plans", element: <AdminCustomerPlans /> },
                    ],
                },
                
                {
                    path: "/cso",
                    element: <CsoController />,
                    children: [
                       { index: true, element: "CSO Dashboard" },
                       { path: "customers", element: <CustomersPage /> },

                       { path: "customers/:customerId", element: <CustomerDetailPage /> },
                       { path: "/cso/products", element: <ProductPage /> },
                        { path: "/cso/collection", element: <CsoCollectionPage /> },
                        { path: "/cso/profile", element: <CsoProfilePage /> },
                        { path: "/cso/settings", element: <CsoSettingsPage /> },
                    ],
                },
                {
                    path: "/cso/login",
                    element: <CsoLoginPage />,
                },
              
             
            ])}
            
        </Suspense>


    );
}
