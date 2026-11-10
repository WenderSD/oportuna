declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        papel: string;
      };
    }
  }
}

export {};