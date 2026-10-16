import { Routes } from '@angular/router';

import { adminGuard, authGuard } from '../services/auth.guard';
import { unsavedChangesGuard } from '../services/unsaved-changes.guard';


export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('../pages/user/home-page/home-page').then((module) => module.HomePage),
    },
    {
        path: 'forfaits',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/packages-page/packages-page').then((module) => module.PackagesPage),
    },
    {
        path: 'vols',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/flights-page/flights-page').then((module) => module.FlightsPage),
    },
    {
        path: 'excursions',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/excursions-page/excursions-page').then((module) => module.ExcursionsPage),
    },
    {
        path: 'mes-reservations',
        canActivate: [authGuard],
        loadComponent: () => import('../pages/user/reservations-page/reservations-page').then((module) => module.ReservationsPage),
    },
    {
        path: 'paiement',
        canActivate: [authGuard],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/payment-page/payment-page').then((module) => module.PaymentPage),
    },
    {
        path: 'connexion',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('../pages/user/sign-in-page/sign-in-page').then((module) => module.SignInPage),
    },
    {
        path: 'inscription',
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
                path: 'vols',
                canDeactivate: [unsavedChangesGuard],
                loadComponent: () => import('../pages/admin/flights-admin-page/flights-admin-page').then((module) => module.FlightsAdminPage),
            },
            {
                path: 'forfaits',
                canDeactivate: [unsavedChangesGuard],
                loadComponent: () => import('../pages/admin/packages-admin-page/packages-admin-page').then((module) => module.PackagesAdminPage),
            },
            {
                path: 'excursions',
                canDeactivate: [unsavedChangesGuard],
                loadComponent: () => import('../pages/admin/excursions-admin-page/excursions-admin-page').then((module) => module.ExcursionsAdminPage),
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
