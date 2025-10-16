import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextRequest) {
  return NextResponse.json({ message: 'Hello from Node.js Function!' }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Test': 'nodejs-function-working'
    },
  });
}