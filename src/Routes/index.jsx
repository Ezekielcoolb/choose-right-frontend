import { useRoutes } from "react-router-dom";
import { Suspense, lazy } from "react";
import TopLoader from "../Preload/TopLoader";
import CsoController from "../Controller/csoController";
import AdminController from "../Controller/adminController";
import ManagerController from "../Controller/managerController";
import BranchPage from "../Users/AdminPages/Branch/Branch";
import CsoPage from "../Users/AdminPages/csoPages/Cso";
import CsoDetailPage from "../Users/AdminPages/csoPages/CsoDetail";
import CsoLoginPage from "../Users/csoPages/csoLogin";
import CustomersPage from "../Users/csoPages/customers/Customers";
import CustomerDetailPage from "../Users/csoPages/customers/CustomerDetail";
import AdminCustomers from "../Users/AdminPages/Customers/Customers";
import AdminCustomerDetail from "../Users/AdminPages/Customers/AdminCustomerDetail";
import AdminCustomerPlans from "../Users/AdminPages/Customers/AdminCustomerPlans";
import AdminCustomerPlanDetail from "../Users/AdminPages/Customers/AdminCustomerPlanDetail";
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
import CsoDashboardPage from "../Users/csoPages/csoDashboard";
import ManagerDashboard from "../Users/ManagerPages/ManagerDashboard";
import ManagerCsosPage from "../Users/ManagerPages/ManagerCsos";
import ManagerSavingsPage from "../Users/ManagerPages/ManagerSavings";
import ManagerLoansPage from "../Users/ManagerPages/ManagerLoans";
import ManagerCustomersPage from "../Users/ManagerPages/ManagerCustomers";
import ManagerTransactionsPage from "../Users/ManagerPages/ManagerTransactions";
import ManagerSettingsPage from "../Users/ManagerPages/ManagerSettings";
import ManagerCsoDetailPage from "../Users/ManagerPages/ManagerCsoDetail";
import ManagerCustomerDetailPage from "../Users/ManagerPages/ManagerCustomerDetail";
import ManagerCustomerPlansPage from "../Users/ManagerPages/ManagerCustomerPlans";
import ManagerCustomerPlanDetailPage from "../Users/ManagerPages/ManagerCustomerPlanDetail";
import ManagerLoginPage from "../Users/ManagerPages/ManagerLogin";
import CustomerController from "../Controller/customerController";
import CustomerLoginPage from "../Users/CustomerPages/CustomerLogin";
import CustomerDashboardPage from "../Users/CustomerPages/CustomerDashboard";
import CustomerPlanDetailPage from "../Users/CustomerPages/CustomerPlanDetail";
import Maintenance from "../Users/AdminPages/Maintenance";
import AdminLoginPage from "../Users/AdminPages/AdminLogin";
import AdminSignupPage from "../Users/AdminPages/AdminSignup";
import AdminSettingsPage from "../Users/AdminPages/Setting";
import LandingPage from "../GuestPages/LandingPage";



export default function Routess() {
    return (
        <Suspense fallback={<TopLoader />}>
            {useRoutes([
                {
                    path: "/",
                    element: <LandingPage />,
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
                       { path: "/admin/maintenance", element: <Maintenance /> },
                       { path: "/admin/settings", element: <AdminSettingsPage /> },
                       { path: "/admin/customers/:customerId", element: <AdminCustomerDetail /> },
                       { path: "/admin/customers/:customerId/plans", element: <AdminCustomerPlans /> },
                       { path: "/admin/customers/:customerId/plans/:planId", element: <AdminCustomerPlanDetail /> },
                    ],
                }, 
                {
                    path: "/admin/login",
                    element: <AdminLoginPage />,
                },
                {
                    path: "/admin/signup",
                    element: <AdminSignupPage />,
                },
                
                {
                    path: "/cso",
                    element: <CsoController />,
                    children: [
                    //    { index: true, element: "CSO Dashboard" },
                    //    { path: "/cso", element: "CSO Dashboard"  },
                       { path: "/cso", element: <CustomersPage /> },
                        { path: "/cso/dashboard", element: <CsoDashboardPage /> },
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
                {
                    path: "/manager",
                    element: <ManagerController />,
                    children: [
                        { path: "/manager", element: <ManagerDashboard /> },
                        { path: "/manager/csos", element: <ManagerCsosPage /> },
                        { path: "/manager/csos/:csoId", element: <ManagerCsoDetailPage /> },
                        { path: "/manager/savings", element: <ManagerSavingsPage /> },
                        { path: "/manager/loans", element: <ManagerLoansPage /> },
                        { path: "/manager/customers", element: <ManagerCustomersPage /> },
                        { path: "/manager/customers/:id", element: <ManagerCustomerDetailPage /> },
                        { path: "/manager/customers/:id/plans", element: <ManagerCustomerPlansPage /> },
                        { path: "/manager/customers/:customerId/plans/:planId", element: <ManagerCustomerPlanDetailPage /> },
                        { path: "/manager/transactions", element: <ManagerTransactionsPage /> },
                        { path: "/manager/settings", element: <ManagerSettingsPage /> },
                    ],
                },
                {
                    path: "/manager/login",
                    element: <ManagerLoginPage />,
                },
                {
                    path: "/customer/login",
                    element: <CustomerLoginPage />,
                },
                {
                    path: "/customer",
                    element: <CustomerController />,
                    children: [
                        { path: "/customer", element: <CustomerDashboardPage /> },
                        { path: "/customer/dashboard", element: <CustomerDashboardPage /> },
                        { path: "/customer/plans/:planId", element: <CustomerPlanDetailPage /> },
                    ]
                }
              
             
            ])}
            
        </Suspense>


    );
}
