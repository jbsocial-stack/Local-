import { NextResponse } from 'next/server';
import { getDemandCounts } from '@/lib/marketing/get-demand-counts';

// H6: "demand map and counts update from a cached aggregate, 5-min ISR."
export const revalidate = 300;

export async function GET() {
  return NextResponse.json(await getDemandCounts());
}
