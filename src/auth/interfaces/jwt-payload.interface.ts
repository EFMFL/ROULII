export interface JwtPayload {
  sub: string;
  role: 'USER' | 'ADMIN';
}
