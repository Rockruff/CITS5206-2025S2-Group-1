import * as api from "@/api/common";
import { swr } from "@/api/common";
import { kwMatch } from "@/lib/utils";

export interface Training {
  id: string;
  timestamp: string;
  name: string;
  description: string;
  expiry: number; // completion auto-expires after this many days (0 = no expiry)
  type: "LMS" | "TRYBOOKING" | "EXTERNAL";
  config: Record<string, any>;
  groups: string[];
}

export interface TrainingCreateRequest {
  name: string;
  description: string;
  expiry: number;
  type: "LMS" | "TRYBOOKING" | "EXTERNAL";
  config: Record<string, any>;
}

export interface TrainingUpdateRequest {
  name: string;
  description: string;
  expiry: number;
  config: Record<string, any>;
  groups: string[];
}

export interface ListTrainingResponse {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  items: Training[];
}

export function listTrainings({
  search,
  type,
  order_by = "name",
}: {
  search?: string;
  type?: string;
  order_by?: string;
  page?: number;
  page_size?: number;
}) {
  let { data, error, isLoading } = swr<Training[]>("/api/trainings");

  if (!data || error || isLoading) {
    data = [];
    return { data, error, isLoading };
  }

  if (search) {
    data = data.filter(
      (t) =>
        kwMatch(t.name, search) || // search by name
        kwMatch(t.description, search), // search by description
    );
  }

  if (type) {
    data = data.filter((t) => t.type === type);
  }

  if (order_by) {
    const desc = order_by.startsWith("-");
    if (desc) order_by = order_by.slice(1);
    if (["created", "name", "type", "expiry", "description"].includes(order_by)) {
      if (order_by === "created") order_by = "timestamp"; // alias
      data = data.sort((a, b) => {
        let order = a[order_by as keyof Training] < b[order_by as keyof Training];
        let orderValue = order ? -1 : 1;
        if (desc) orderValue = -orderValue;
        return orderValue;
      });
    }
  }

  return { data, error, isLoading };
}

export function getTraining(id: string) {
  let { data, error, isLoading } = swr<Training>(id ? `/api/trainings/${id}` : null);
  return { data, error, isLoading };
}

export async function createTraining(data: TrainingCreateRequest): Promise<Training> {
  return api.post<Training>("/api/trainings", data);
}

export async function updateTraining(id: string, data: TrainingUpdateRequest): Promise<Training> {
  return api.patch<Training>(`/api/trainings/${id}`, data);
}

export async function deleteTraining(id: string): Promise<void> {
  return api.del(`/api/trainings/${id}`);
}
