import { mapRankedUser } from "@/lib/mappers/api";
import type { RankedUser } from "@/types/domain";
import { browserRequest } from "../browser";
import { validateUsersResponse } from "../validation";

export interface UsersPage {
  users: RankedUser[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const getUsers = async (query: string, page: number): Promise<UsersPage> => {
  const params = new URLSearchParams({ q: query, page: String(page) });
  const response = await browserRequest(`/api/users?${params}`, {
    validate: validateUsersResponse,
  });
  return {
    users: response.users.map(mapRankedUser),
    page: response.page,
    totalPages: response.total_pages,
    totalItems: response.total_items,
    hasNext: response.has_next,
    hasPrevious: response.has_prev,
  };
};
