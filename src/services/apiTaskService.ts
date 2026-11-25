// src/services/apiTaskService.ts
// Cliente de la API de tareas (FastAPI). Rutas confirmadas en https://api.montenegroariel.com.ar/docs:
//   POST   /tasks/            crear
//   GET    /tasks/            listar
//   GET    /tasks/{id}        leer una
//   PUT    /tasks/{id}        actualizar (el cuerpo lleva title, description y completed)
//   DELETE /tasks/{id}        eliminar (responde 204, sin cuerpo)
import { API_URL, REQUEST_TIMEOUT_MS } from '../config/api';

export type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  archived?: boolean; // el servidor local lo devuelve; hay que confirmar si el publicado también
};

export type TaskInput = {
  title: string;
  description?: string | null;
  completed?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
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
      throw new ApiError('El servidor tardó demasiado en responder. Probá otra vez.', 0);
    }
    throw new ApiError('No se pudo conectar con el servidor.', 0);
  } finally {
    clearTimeout(timer);
  }
}

// OJO: las rutas de colección terminan en "/" (/tasks/). Sin la barra, FastAPI responde con una redirección.
// El servidor devuelve 10 tareas por defecto; se pide un límite mayor.
export function fetchTasks(limit = 100): Promise<Task[]> {
  return request<Task[]>(`/tasks/?skip=0&limit=${limit}`);
}

export function createTask(input: TaskInput): Promise<Task> {
  return request<Task>('/tasks/', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title.trim(),
      description: input.description ?? null,
      completed: input.completed ?? false,
    }),
  });
}

// PUT reemplaza la tarea completa, así que se reenvían los campos que no cambian.
export function updateTask(task: Task, changes: Partial<TaskInput>): Promise<Task> {
  return request<Task>(`/tasks/${task.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: (changes.title ?? task.title).trim(),
      description: changes.description !== undefined ? changes.description : task.description,
      completed: changes.completed ?? task.completed,
    }),
  });
}

export function toggleTask(task: Task): Promise<Task> {
  return updateTask(task, { completed: !task.completed });
}

export function deleteTask(id: number): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}