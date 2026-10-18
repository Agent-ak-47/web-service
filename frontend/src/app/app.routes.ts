import { Routes } from '@angular/router';

import { adminGuard, authGuard } from '../services/auth.guard';
import { unsavedChangesGuard } from '../services/unsaved-changes.guard';


export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('../pages/user/home-page/home-page').then((module) => module.HomePage),
    },
    {
        path: 'packages',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/packages-page/packages-page').then((module) => module.PackagesPage),
    },
    {
        path: 'packages/:id',
        loadComponent: () => import('../pages/user/package-detail-page/package-detail-page').then((module) => module.PackageDetailPage),
    },
    {
        path: 'flights',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/flights-page/flights-page').then((module) => module.FlightsPage),
    },
    {
        path: 'flights/:id',
        loadComponent: () => import('../pages/user/flight-detail-page/flight-detail-page').then((module) => module.FlightDetailPage),
    },
    {
        path: 'excursions',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/excursions-page/excursions-page').then((module) => module.ExcursionsPage),
    },
    {
        path: 'excursions/:id',
        loadComponent: () => import('../pages/user/excursion-detail-page/excursion-detail-page').then((module) => module.ExcursionDetailPage),
    },
    {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('../pages/user/user-layout/user-layout').then((module) => module.UserLayout),
        children: [
            {
                path: '',
                loadComponent: () => import('../pages/user/profile-page/profile-page').then((module) => module.ProfilePage),
            },
            {
                path: 'reservations',
                loadComponent: () => import('../pages/user/reservations-page/reservations-page').then((module) => module.ReservationsPage),
            },
        ],
    },
    {
        path: 'payment',
        canActivate: [authGuard],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/payment-page/payment-page').then((module) => module.PaymentPage),
    },
    {
        path: 'sign-in',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/sign-in-page/sign-in-page').then((module) => module.SignInPage),
    },
    {
        path: 'sign-up',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/sign-up-page/sign-up-page').then((module) => module.SignUpPage),
    },
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('../pages/admin/admin-layout/admin-layout').then((module) => module.AdminLayout),
        children: [
            {
                path: '',
                loadComponent: () => import('../pages/admin/dashboard-page/dashboard-page').then((module) => module.DashboardPage),
            },
            {
                path: 'flights',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('../pages/admin/flights-admin-page/flights-admin-page').then((module) => module.FlightsAdminPage),
                    },
                    {
                        path: 'form',
                        canDeactivate: [unsavedChangesGuard],
                        loadComponent: () => import('../pages/admin/flight-form-page/flight-form-page').then((module) => module.FlightFormPage),
                    },
                    {
                        path: 'form/:id',
                        canDeactivate: [unsavedChangesGuard],
                        loadComponent: () => import('../pages/admin/flight-form-page/flight-form-page').then((module) => module.FlightFormPage),
                    },
                ],
            },
            {
                path: 'packages',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('../pages/admin/packages-admin-page/packages-admin-page').then((module) => module.PackagesAdminPage),
                    },
                    {
                        path: 'form',
                        canDeactivate: [unsavedChangesGuard],
                        loadComponent: () => import('../pages/admin/package-form-page/package-form-page').then((module) => module.PackageFormPage),
                    },
                    {
                        path: 'form/:id',
                        canDeactivate: [unsavedChangesGuard],
                        loadComponent: () => import('../pages/admin/package-form-page/package-form-page').then((module) => module.PackageFormPage),
                    },
                ],
            },
            {
                path: 'excursions',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('../pages/admin/excursions-admin-page/excursions-admin-page').then((module) => module.ExcursionsAdminPage),
                    },
                    {
                        path: 'form',
                        canDeactivate: [unsavedChangesGuard],
                        loadComponent: () => import('../pages/admin/excursion-form-page/excursion-form-page').then((module) => module.ExcursionFormPage),
                    },
                    {
                        path: 'form/:id',
                        canDeactivate: [unsavedChangesGuard],
                        loadComponent: () => import('../pages/admin/excursion-form-page/excursion-form-page').then((module) => module.ExcursionFormPage),
                    },
                ],
            },
            {
                path: 'reservations',
                loadComponent: () => import('../pages/admin/reservations-admin-page/reservations-admin-page').then((module) => module.ReservationsAdminPage),
            },
        ],
    },
    {
        path: '**',
        loadComponent: () => import('../pages/not-found-page/not-found-page').then((module) => module.NotFoundPage),
    },
];
