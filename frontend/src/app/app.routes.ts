import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  {
    path: 'orders',
    title: 'Pedidos · Comanda',
    loadComponent: () => import('./features/orders/orders-page').then((m) => m.OrdersPage),
  },
  {
    path: 'orders/new',
    title: 'Novo pedido · Comanda',
    loadComponent: () => import('./features/orders/new-order').then((m) => m.NewOrder),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'orders/:id',
    title: 'Pedido · Comanda',
    loadComponent: () => import('./features/orders/order-detail').then((m) => m.OrderDetail),
  },
  {
    path: 'products',
    title: 'Produtos · Comanda',
    loadComponent: () => import('./features/products/products-page').then((m) => m.ProductsPage),
  },
  {
    path: 'customers',
    title: 'Clientes · Comanda',
    loadComponent: () => import('./features/customers/customers-page').then((m) => m.CustomersPage),
  },
  { path: '**', redirectTo: 'orders' },
];
