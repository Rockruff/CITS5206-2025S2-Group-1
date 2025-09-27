import * as api from "@/api/common";
import { swr } from "@/api/common";

export interface Training {
  id: string;
  timestamp: string;
  name: string;
  description: string;
  expiry: number; // completion auto-expires after this many days (0 = no expiry)
  type: "LMS" | "TRYBOOKING" | "EXTERNAL";
  config: Record<string, any>;
}

export interface TrainingCreateRequest {
  name: string;
  description: string;
  expiry: number;
  type: "LMS" | "TRYBOOKING" | "EXTERNAL";
  config: Record<string, any>;
}

export interface TrainingUpdateRequest {
  name?: string;
  description?: string;
  expiry?: number;
  config?: Record<string, any>;
}

export interface ListTrainingResponse {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  items: Training[];
}

// API functions
export function listTrainings() {
  let { data, error, isLoading } = swr<Training[]>("/api/trainings");
  if (!data || error || isLoading) {
    data = [];
  }
  return { data, error, isLoading };
}

export async function listTrainingsWithParams(params?: {
  search?: string;
  type?: string;
  page?: number;
  page_size?: number;
}): Promise<Training[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.page_size) searchParams.set("page_size", String(params.page_size));

  const query = searchParams.toString();
  return api.get<Training[]>(`/api/trainings${query ? `?${query}` : ""}`);
}

export function getTraining(id: string) {
  let { data, error, isLoading } = swr<Training>(`/api/trainings/${id}`);
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
