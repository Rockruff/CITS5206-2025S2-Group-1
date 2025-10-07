import * as api from "@/api/common";
import { swr } from "@/api/common";

export interface TrainingRecord {
  id: string;
  timestamp: string;
  user: string; // user_id
  training: string; // training_id
  details: Record<string, any>;
  status: string;
}

export interface TrainingRecordCreateRequest {
  user: string;
  training: string;
  details?: Record<string, any>;
}

export interface TrainingRecordUpdateRequest {
  details?: Record<string, any>;
}

export interface TrainingRecordBatchCreateRequest {
  user_ids: string[];
  training_id: string;
  details?: Record<string, any>;
}

export interface ListTrainingRecordResponse {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  items: TrainingRecord[];
}

// List training records with filtering and pagination
export function listTrainingRecords({
  search,
  training,
  from,
  to,
  order_by,
  page = 1,
  page_size = 10,
}: {
  search?: string;
  training?: string;
  from?: string;
  to?: string;
  order_by?: string;
  page?: number;
  page_size?: number;
}) {
  const params: Record<string, any> = {};

  if (search) {
    const id = parseInt(search);
    const key = Number.isNaN(id) ? "user_name" : "user_id";
    params[key] = search;
  }

  if (training) params.training = training;
  if (order_by) {
    params.order_by = order_by;
    if (order_by === "completed") params.order_by = "timestamp"; // alias
    if (order_by === "-completed") params.order_by = "-timestamp"; // alias
    if (order_by === "id") params.order_by = "user_id"; // alias
    if (order_by === "-id") params.order_by = "-user_id"; // alias
    if (order_by === "name") params.order_by = "user_name"; // alias
    if (order_by === "-name") params.order_by = "-user_name"; // alias
  }
  if (from) params.from = from;
  if (to) params.to = to;

  params.page = page;
  params.page_size = page_size;

  let { data, error, isLoading } = swr<ListTrainingRecordResponse>("/api/training-records", params);

  if (!data || error || isLoading) {
    data = {
      page: page,
      page_size: page_size,
      total_pages: 0,
      total_items: 0,
      items: [],
    } satisfies ListTrainingRecordResponse;
  }

  return { data, error, isLoading };
}

// Get single training record
export function getTrainingRecord(id: string) {
  let { data, error, isLoading } = swr<TrainingRecord>(`/api/training-records/${id}`);
  return { data, error, isLoading };
}

// Create training record
export async function createTrainingRecord(data: TrainingRecordCreateRequest): Promise<TrainingRecord> {
  return api.post<TrainingRecord>("/api/training-records", data);
}

// Update training record
export async function updateTrainingRecord(id: string, data: TrainingRecordUpdateRequest): Promise<TrainingRecord> {
  return api.patch<TrainingRecord>(`/api/training-records/${id}`, data);
}

// Delete training record
export async function deleteTrainingRecord(id: string): Promise<void> {
  return api.del(`/api/training-records/${id}`);
}

// Batch create training records
export async function batchCreateTrainingRecords(data: TrainingRecordBatchCreateRequest): Promise<any> {
  return api.post("/api/training-records/batch", data);
}

// Batch delete training records
export async function batchDeleteTrainingRecords(ids: string[]): Promise<any> {
  return api.del("/api/training-records/batch", { ids });
}
