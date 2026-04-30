import { Response } from 'express';

const clients = new Map<string, Set<Response>>();

export function addClient(userId: string, res: Response): void {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(res);
}

export function removeClient(userId: string, res: Response): void {
  clients.get(userId)?.delete(res);
}

export function pushToUser(userId: string, data: object): void {
  const userClients = clients.get(userId);
  if (!userClients) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of userClients) {
    res.write(payload);
  }
}

export function pushToAll(data: object): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const userClients of clients.values()) {
    for (const res of userClients) {
      res.write(payload);
    }
  }
}
