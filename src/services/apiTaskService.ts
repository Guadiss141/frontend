// src/services/apiTaskService.ts
// Cliente de la API de tareas (FastAPI): https://api.montenegroariel.com.ar/docs
//   POST /tasks/   GET /tasks/   GET|PUT|DELETE /tasks/{id}
// Traduce lo que devuelve el servidor (id numérico, description puede ser null) al tipo Task de la app.
import { API_URL, REQUEST_TIMEOUT_MS } from '../config/api';
import type { Task } from '../types/task';

type ApiTask = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  archived?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function toTask(api: ApiTask): Task {
  return {
    id: String(api.id),
    title: api.title,
    description: api.description ?? '',
    completed: api.completed,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `Error ${response.status}`;
      try {
        const body = await response.json();
        if (typeof body?.detail === 'string') detail = body.detail;
      } catch {
        // la respuesta de error no traía JSON
      }
      throw new ApiError(detail, response.status);
    }

    if (response.status === 204) return undefined as T; // DELETE no devuelve cuerpo
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder.', 0);
    }
    throw new ApiError('No se pudo conectar con el servidor.', 0);
  } finally {
    clearTimeout(timer);
  }
}

// Las rutas de colección terminan en "/". El servidor devuelve 10 tareas por defecto: se pide un límite mayor.
// simulateFailure mantiene el botón "Simular error API" de la pantalla (no hace ninguna llamada de red).
export async function fetchTasks(simulateFailure = false): Promise<Task[]> {
  if (simulateFailure) {
    throw new ApiError('HTTP 503: servidor temporalmente indisponible (simulado)', 503);
  }
  const records = await request<ApiTask[]>('/tasks/?skip=0&limit=100');
  return records.map(toTask);
}

export async function createTask(title: string, description = ''): Promise<Task> {
  const created = await request<ApiTask>('/tasks/', {
    method: 'POST',
    body: JSON.stringify({ title: title.trim(), description: description || null, completed: false }),
  });
  return toTask(created);
}

// PUT reemplaza la tarea completa, por eso se reenvían título y descripción.
export async function updateTaskCompleted(task: Task, completed: boolean): Promise<Task> {
  const updated = await request<ApiTask>(`/tasks/${task.id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: task.title, description: task.description || null, completed }),
  });
  return toTask(updated);
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}