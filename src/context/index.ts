import { createContext } from "react";

export const PlaceholderContext = createContext<null>(null);

export { WishlistProvider, useWishlist } from './WishlistContext';
export { UserProvider, useUser } from './UserContext';
export { OrderProvider, useOrders } from './OrderContext';
export { HotelManagementProvider, useHotelManagement } from './HotelManagementContext';
export { JourneyManagementProvider, useJourneyManagement } from './JourneyManagementContext';
export { ExperienceManagementProvider, useExperienceManagement } from './ExperienceManagementContext';
export { ArticleManagementProvider, useArticleManagement } from './ArticleManagementContext';

