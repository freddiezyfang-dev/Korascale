import { createContext } from "react";

export const PlaceholderContext = createContext<null>(null);

export { WishlistProvider, useWishlist } from './WishlistContext';
export { UserProvider, useUser } from './UserContext';
export { OrderProvider, useOrders } from './OrderContext';

